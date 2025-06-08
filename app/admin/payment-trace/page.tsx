"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { useAccount } from "@/providers/web3-provider"
import { PLATFORM_FEE_ADDRESS, getNetworkConfig } from "@/lib/web3-utils"
import { AlertTriangle, RefreshCw, DollarSign, Search, Eye, ExternalLink, CheckCircle, XCircle } from "lucide-react"
import { ethers } from "ethers"

export default function PaymentTracePage() {
  const { toast } = useToast()
  const { address, isConnected } = useAccount()
  const [loading, setLoading] = useState(false)
  const [contractInfo, setContractInfo] = useState<any>(null)
  const [paymentTest, setPaymentTest] = useState<any>(null)
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])

  useEffect(() => {
    if (isConnected) {
      runCompletePaymentTrace()
    }
  }, [isConnected])

  const runCompletePaymentTrace = async () => {
    setLoading(true)
    console.log("=== COMPLETE PAYMENT TRACE START ===")

    try {
      // 1. Verificar configuración del contrato
      await verifyContractConfiguration()

      // 2. Verificar balance actual de la wallet destinataria
      await checkCurrentBalance()

      // 3. Obtener transacciones recientes del contrato factory
      await getFactoryTransactions()

      // 4. Probar transferencia de prueba (si es owner)
      await testPaymentTransfer()

      toast({
        title: "Rastreo de pagos completado",
        description: "Se ha verificado todo el sistema de pagos",
      })
    } catch (error) {
      console.error("Error in payment trace:", error)
      toast({
        title: "Error en rastreo",
        description: "Ocurrió un error al rastrear los pagos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const verifyContractConfiguration = async () => {
    try {
      if (!window.ethereum) return

      const provider = new ethers.BrowserProvider(window.ethereum)
      const network = getNetworkConfig("sepolia")
      const factoryAddress = network.factoryAddress

      if (!factoryAddress || factoryAddress === "0x0000000000000000000000000000000000000000") {
        console.error("❌ Factory address not configured")
        return
      }

      console.log("🔍 Verificando configuración del contrato...")
      console.log("Factory Address:", factoryAddress)

      // ABI completo para debugging
      const factoryABI = [
        "function feeReceiver() view returns (address)",
        "function baseFee() view returns (uint256)",
        "function featurePrice() view returns (uint256)",
        "function owner() view returns (address)",
        "function getContractBalance() view returns (uint256)",
        "function getDeployedTokens() view returns (address[])",
        "function calculatePrice(bool[] memory features) view returns (uint256)",
        "event PaymentReceived(address indexed from, address indexed to, uint256 amount)",
        "event PaymentTransferred(address indexed to, uint256 amount, bool success)",
        "event TokenCreated(address indexed tokenAddress, address indexed creator, string name, string symbol, uint256 totalSupply, uint256 paidAmount)",
      ]

      const factory = new ethers.Contract(factoryAddress, factoryABI, provider)

      const info: any = {
        factoryAddress,
        network: network.name,
      }

      // Verificar cada configuración crítica
      try {
        info.feeReceiver = await factory.feeReceiver()
        info.feeReceiverCorrect = info.feeReceiver.toLowerCase() === PLATFORM_FEE_ADDRESS.toLowerCase()
        console.log("Fee Receiver:", info.feeReceiver)
        console.log("Expected:", PLATFORM_FEE_ADDRESS)
        console.log("Match:", info.feeReceiverCorrect ? "✅" : "❌")
      } catch (error) {
        console.error("❌ Could not get fee receiver:", error)
        info.feeReceiverError = error
      }

      try {
        const baseFee = await factory.baseFee()
        info.baseFee = ethers.formatEther(baseFee)
        console.log("Base Fee:", info.baseFee, "ETH")
      } catch (error) {
        console.error("❌ Could not get base fee:", error)
      }

      try {
        const featurePrice = await factory.featurePrice()
        info.featurePrice = ethers.formatEther(featurePrice)
        console.log("Feature Price:", info.featurePrice, "ETH")
      } catch (error) {
        console.error("❌ Could not get feature price:", error)
      }

      try {
        info.owner = await factory.owner()
        console.log("Contract Owner:", info.owner)
      } catch (error) {
        console.error("❌ Could not get owner:", error)
      }

      try {
        const contractBalance = await factory.getContractBalance()
        info.contractBalance = ethers.formatEther(contractBalance)
        console.log("Contract Balance:", info.contractBalance, "ETH")

        if (Number.parseFloat(info.contractBalance) > 0) {
          console.warn("⚠️ WARNING: Contract has retained funds!")
        }
      } catch (error) {
        console.error("❌ Could not get contract balance:", error)
      }

      try {
        const deployedTokens = await factory.getDeployedTokens()
        info.totalTokens = deployedTokens.length
        console.log("Total Tokens Deployed:", info.totalTokens)
      } catch (error) {
        console.error("❌ Could not get deployed tokens:", error)
      }

      // Verificar balance directo del contrato
      try {
        const directBalance = await provider.getBalance(factoryAddress)
        info.directBalance = ethers.formatEther(directBalance)
        console.log("Direct Contract Balance:", info.directBalance, "ETH")
      } catch (error) {
        console.error("❌ Could not get direct balance:", error)
      }

      setContractInfo(info)
    } catch (error) {
      console.error("Error verifying contract configuration:", error)
    }
  }

  const checkCurrentBalance = async () => {
    try {
      if (!window.ethereum) return

      const provider = new ethers.BrowserProvider(window.ethereum)

      console.log("💰 Verificando balance de wallet destinataria...")
      const balance = await provider.getBalance(PLATFORM_FEE_ADDRESS)
      const balanceEth = ethers.formatEther(balance)

      console.log(`Balance actual: ${balanceEth} ETH`)
      console.log(`Dirección: ${PLATFORM_FEE_ADDRESS}`)

      return {
        address: PLATFORM_FEE_ADDRESS,
        balance: balanceEth,
        balanceWei: balance.toString(),
      }
    } catch (error) {
      console.error("Error checking current balance:", error)
      return null
    }
  }

  const getFactoryTransactions = async () => {
    try {
      if (!window.ethereum) return

      const provider = new ethers.BrowserProvider(window.ethereum)
      const network = getNetworkConfig("sepolia")
      const factoryAddress = network.factoryAddress

      if (!factoryAddress) return

      console.log("📋 Obteniendo transacciones del contrato factory...")

      // Obtener eventos recientes del contrato
      const factoryABI = [
        "event PaymentReceived(address indexed from, address indexed to, uint256 amount)",
        "event PaymentTransferred(address indexed to, uint256 amount, bool success)",
        "event TokenCreated(address indexed tokenAddress, address indexed creator, string name, string symbol, uint256 totalSupply, uint256 paidAmount)",
      ]

      const factory = new ethers.Contract(factoryAddress, factoryABI, provider)

      // Obtener eventos de los últimos 1000 bloques
      const currentBlock = await provider.getBlockNumber()
      const fromBlock = Math.max(0, currentBlock - 1000)

      console.log(`Buscando eventos desde bloque ${fromBlock} hasta ${currentBlock}`)

      const transactions: any[] = []

      try {
        // Eventos PaymentReceived
        const paymentReceivedEvents = await factory.queryFilter("PaymentReceived", fromBlock, currentBlock)
        console.log(`Found ${paymentReceivedEvents.length} PaymentReceived events`)

        for (const event of paymentReceivedEvents) {
          transactions.push({
            type: "PaymentReceived",
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            from: event.args?.[0],
            to: event.args?.[1],
            amount: ethers.formatEther(event.args?.[2] || 0),
            timestamp: await getBlockTimestamp(provider, event.blockNumber),
          })
        }
      } catch (error) {
        console.warn("Could not get PaymentReceived events:", error)
      }

      try {
        // Eventos PaymentTransferred
        const paymentTransferredEvents = await factory.queryFilter("PaymentTransferred", fromBlock, currentBlock)
        console.log(`Found ${paymentTransferredEvents.length} PaymentTransferred events`)

        for (const event of paymentTransferredEvents) {
          transactions.push({
            type: "PaymentTransferred",
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            to: event.args?.[0],
            amount: ethers.formatEther(event.args?.[1] || 0),
            success: event.args?.[2],
            timestamp: await getBlockTimestamp(provider, event.blockNumber),
          })
        }
      } catch (error) {
        console.warn("Could not get PaymentTransferred events:", error)
      }

      try {
        // Eventos TokenCreated
        const tokenCreatedEvents = await factory.queryFilter("TokenCreated", fromBlock, currentBlock)
        console.log(`Found ${tokenCreatedEvents.length} TokenCreated events`)

        for (const event of tokenCreatedEvents) {
          transactions.push({
            type: "TokenCreated",
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            tokenAddress: event.args?.[0],
            creator: event.args?.[1],
            name: event.args?.[2],
            symbol: event.args?.[3],
            totalSupply: event.args?.[4]?.toString(),
            paidAmount: ethers.formatEther(event.args?.[5] || 0),
            timestamp: await getBlockTimestamp(provider, event.blockNumber),
          })
        }
      } catch (error) {
        console.warn("Could not get TokenCreated events:", error)
      }

      // Ordenar por bloque (más recientes primero)
      transactions.sort((a, b) => b.blockNumber - a.blockNumber)

      console.log("Transacciones encontradas:", transactions)
      setRecentTransactions(transactions)

      return transactions
    } catch (error) {
      console.error("Error getting factory transactions:", error)
      return []
    }
  }

  const getBlockTimestamp = async (provider: ethers.BrowserProvider, blockNumber: number) => {
    try {
      const block = await provider.getBlock(blockNumber)
      return block ? new Date(block.timestamp * 1000).toISOString() : "Unknown"
    } catch (error) {
      return "Unknown"
    }
  }

  const testPaymentTransfer = async () => {
    try {
      if (!window.ethereum || !isConnected) return

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const userAddress = await signer.getAddress()
      const network = getNetworkConfig("sepolia")
      const factoryAddress = network.factoryAddress

      if (!factoryAddress) return

      console.log("🧪 Probando transferencia de pago...")

      const factoryABI = [
        "function owner() view returns (address)",
        "function feeReceiver() view returns (address)",
        "function testPaymentTransfer(address recipient) external payable",
      ]

      const factory = new ethers.Contract(factoryAddress, factoryABI, provider)

      // Verificar si el usuario es el owner
      try {
        const owner = await factory.owner()
        const isOwner = owner.toLowerCase() === userAddress.toLowerCase()

        const testResult = {
          userAddress,
          isOwner,
          owner,
          canTest: isOwner,
        }

        if (isOwner) {
          console.log("✅ Usuario es owner, puede ejecutar test de pago")

          // Verificar fee receiver
          const feeReceiver = await factory.feeReceiver()
          testResult.feeReceiver = feeReceiver
          testResult.feeReceiverCorrect = feeReceiver.toLowerCase() === PLATFORM_FEE_ADDRESS.toLowerCase()

          console.log("Fee receiver configurado:", feeReceiver)
          console.log("Fee receiver esperado:", PLATFORM_FEE_ADDRESS)
          console.log("Configuración correcta:", testResult.feeReceiverCorrect ? "✅" : "❌")
        } else {
          console.log("❌ Usuario no es owner, no puede ejecutar test de pago")
        }

        setPaymentTest(testResult)
      } catch (error) {
        console.error("Error in payment test:", error)
        setPaymentTest({ error: error.message })
      }
    } catch (error) {
      console.error("Error testing payment transfer:", error)
    }
  }

  const executePaymentTest = async () => {
    try {
      if (!window.ethereum || !isConnected) {
        toast({
          title: "Error",
          description: "Conecta tu wallet primero",
          variant: "destructive",
        })
        return
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const network = getNetworkConfig("sepolia")
      const factoryAddress = network.factoryAddress

      if (!factoryAddress) {
        toast({
          title: "Error",
          description: "Dirección del contrato no configurada",
          variant: "destructive",
        })
        return
      }

      const factoryABI = ["function testPaymentTransfer(address recipient) external payable"]

      const factory = new ethers.Contract(factoryAddress, factoryABI, signer)

      console.log("🧪 Ejecutando test de transferencia de pago...")

      // Enviar 0.001 ETH de prueba
      const testAmount = ethers.parseEther("0.001")

      const tx = await factory.testPaymentTransfer(PLATFORM_FEE_ADDRESS, {
        value: testAmount,
      })

      console.log("Test transaction sent:", tx.hash)

      toast({
        title: "Test de pago enviado",
        description: `Hash: ${tx.hash}`,
      })

      const receipt = await tx.wait()
      console.log("Test transaction mined:", receipt.hash)

      toast({
        title: "Test completado",
        description: "Verifica si el pago llegó a la wallet destinataria",
      })

      // Actualizar diagnósticos
      setTimeout(() => {
        runCompletePaymentTrace()
      }, 3000)
    } catch (error: any) {
      console.error("Error executing payment test:", error)
      toast({
        title: "Error en test",
        description: error.message || "Error al ejecutar test de pago",
        variant: "destructive",
      })
    }
  }

  const emergencyWithdraw = async () => {
    try {
      if (!window.ethereum || !isConnected) {
        toast({
          title: "Error",
          description: "Conecta tu wallet primero",
          variant: "destructive",
        })
        return
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const network = getNetworkConfig("sepolia")
      const factoryAddress = network.factoryAddress

      if (!factoryAddress) {
        toast({
          title: "Error",
          description: "Dirección del contrato no configurada",
          variant: "destructive",
        })
        return
      }

      const factoryABI = ["function emergencyWithdraw() external"]

      const factory = new ethers.Contract(factoryAddress, factoryABI, signer)

      console.log("🚨 Ejecutando retiro de emergencia...")

      const tx = await factory.emergencyWithdraw()
      console.log("Emergency withdraw transaction:", tx.hash)

      toast({
        title: "Retiro de emergencia enviado",
        description: `Hash: ${tx.hash}`,
      })

      await tx.wait()

      toast({
        title: "Fondos retirados",
        description: "Los fondos han sido transferidos a la wallet destinataria",
      })

      // Actualizar diagnósticos
      setTimeout(() => {
        runCompletePaymentTrace()
      }, 3000)
    } catch (error: any) {
      console.error("Error in emergency withdraw:", error)
      toast({
        title: "Error",
        description: error.message || "Error al retirar fondos",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Rastreo Completo de Pagos
              </h1>
              <p className="text-xl text-muted-foreground mt-2">
                Verificación exhaustiva del sistema de pagos a {PLATFORM_FEE_ADDRESS}
              </p>
            </div>
            <Button onClick={runCompletePaymentTrace} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Actualizar Rastreo
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 py-8 space-y-6">
        {/* Configuración del Contrato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Configuración del Contrato Factory
            </CardTitle>
            <CardDescription>Verificación de la configuración crítica del contrato</CardDescription>
          </CardHeader>
          <CardContent>
            {contractInfo ? (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Dirección del Contrato:</span>
                      <span className="font-mono text-xs">{contractInfo.factoryAddress}</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Fee Receiver:</span>
                      <div className="text-right">
                        <div className="font-mono text-xs">{contractInfo.feeReceiver}</div>
                        {contractInfo.feeReceiverCorrect ? (
                          <Badge className="bg-green-500 mt-1">✅ Correcto</Badge>
                        ) : (
                          <Badge variant="destructive" className="mt-1">
                            ❌ INCORRECTO
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Tarifa Base:</span>
                      <span className="font-mono">{contractInfo.baseFee} ETH</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Precio por Característica:</span>
                      <span className="font-mono">{contractInfo.featurePrice} ETH</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Propietario:</span>
                      <span className="font-mono text-xs">{contractInfo.owner}</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Tokens Desplegados:</span>
                      <span className="font-mono">{contractInfo.totalTokens}</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Balance del Contrato:</span>
                      <div className="text-right">
                        <span className="font-mono">{contractInfo.contractBalance} ETH</span>
                        {Number.parseFloat(contractInfo.contractBalance || "0") > 0 ? (
                          <Badge variant="destructive" className="ml-2">
                            ⚠️ Fondos Retenidos
                          </Badge>
                        ) : (
                          <Badge className="bg-green-500 ml-2">✅ Sin Fondos</Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Balance Directo:</span>
                      <span className="font-mono">{contractInfo.directBalance} ETH</span>
                    </div>
                  </div>
                </div>

                {/* Alertas críticas */}
                {!contractInfo.feeReceiverCorrect && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>PROBLEMA CRÍTICO:</strong> El fee receiver configurado en el contrato (
                      {contractInfo.feeReceiver}) no coincide con la wallet destinataria esperada (
                      {PLATFORM_FEE_ADDRESS}). Los pagos van a una dirección incorrecta.
                    </AlertDescription>
                  </Alert>
                )}

                {Number.parseFloat(contractInfo.contractBalance || "0") > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>FONDOS RETENIDOS:</strong> El contrato tiene {contractInfo.contractBalance} ETH retenidos
                      que deberían haberse transferido automáticamente.
                      <div className="mt-2">
                        <Button variant="destructive" size="sm" onClick={emergencyWithdraw} disabled={!isConnected}>
                          Retirar Fondos de Emergencia
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Cargando configuración del contrato...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test de Pagos */}
        {paymentTest && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Test de Sistema de Pagos
              </CardTitle>
              <CardDescription>Prueba la funcionalidad de transferencia de pagos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Usuario Actual:</span>
                      <span className="font-mono text-xs">{paymentTest.userAddress}</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Es Propietario:</span>
                      {paymentTest.isOwner ? (
                        <Badge className="bg-green-500">✅ Sí</Badge>
                      ) : (
                        <Badge variant="secondary">❌ No</Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Puede Ejecutar Test:</span>
                      {paymentTest.canTest ? (
                        <Badge className="bg-green-500">✅ Sí</Badge>
                      ) : (
                        <Badge variant="secondary">❌ No</Badge>
                      )}
                    </div>

                    {paymentTest.feeReceiver && (
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="font-medium">Fee Receiver Test:</span>
                        {paymentTest.feeReceiverCorrect ? (
                          <Badge className="bg-green-500">✅ Correcto</Badge>
                        ) : (
                          <Badge variant="destructive">❌ Incorrecto</Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {paymentTest.canTest && (
                  <div className="pt-4 border-t">
                    <Button onClick={executePaymentTest} disabled={!isConnected} className="w-full">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Ejecutar Test de Pago (0.001 ETH)
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                      Esto enviará 0.001 ETH de prueba para verificar que la transferencia funciona correctamente
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transacciones Recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Eventos Recientes del Contrato
            </CardTitle>
            <CardDescription>Eventos de pagos y creación de tokens de los últimos 1000 bloques</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((tx, index) => (
                  <div key={index} className="p-4 border rounded">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              tx.type === "PaymentTransferred" ? (tx.success ? "default" : "destructive") : "secondary"
                            }
                          >
                            {tx.type === "PaymentReceived" && <DollarSign className="h-3 w-3 mr-1" />}
                            {tx.type === "PaymentTransferred" && (
                              <>
                                {tx.success ? (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                ) : (
                                  <XCircle className="h-3 w-3 mr-1" />
                                )}
                              </>
                            )}
                            {tx.type === "TokenCreated" && <Eye className="h-3 w-3 mr-1" />}
                            {tx.type}
                          </Badge>
                          <span className="text-sm text-muted-foreground">Bloque #{tx.blockNumber}</span>
                        </div>

                        {tx.type === "PaymentReceived" && (
                          <div className="mt-2">
                            <p className="text-sm">
                              <strong>De:</strong> {tx.from}
                            </p>
                            <p className="text-sm">
                              <strong>Para:</strong> {tx.to}
                            </p>
                            <p className="text-sm">
                              <strong>Cantidad:</strong> {tx.amount} ETH
                            </p>
                          </div>
                        )}

                        {tx.type === "PaymentTransferred" && (
                          <div className="mt-2">
                            <p className="text-sm">
                              <strong>Para:</strong> {tx.to}
                            </p>
                            <p className="text-sm">
                              <strong>Cantidad:</strong> {tx.amount} ETH
                            </p>
                            <p className="text-sm">
                              <strong>Éxito:</strong> {tx.success ? "✅ Sí" : "❌ No"}
                            </p>
                          </div>
                        )}

                        {tx.type === "TokenCreated" && (
                          <div className="mt-2">
                            <p className="text-sm">
                              <strong>Token:</strong> {tx.name} ({tx.symbol})
                            </p>
                            <p className="text-sm">
                              <strong>Creador:</strong> {tx.creator}
                            </p>
                            <p className="text-sm">
                              <strong>Pago:</strong> {tx.paidAmount} ETH
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{tx.timestamp}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`https://sepolia.etherscan.io/tx/${tx.transactionHash}`, "_blank")}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Ver TX
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Eye className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No se encontraron eventos recientes</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enlaces útiles */}
        <Card>
          <CardHeader>
            <CardTitle>Enlaces de Verificación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => window.open(`https://sepolia.etherscan.io/address/${PLATFORM_FEE_ADDRESS}`, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver Wallet Destinataria en Etherscan
              </Button>

              {contractInfo?.factoryAddress && (
                <Button
                  variant="outline"
                  onClick={() =>
                    window.open(`https://sepolia.etherscan.io/address/${contractInfo.factoryAddress}`, "_blank")
                  }
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver Contrato Factory en Etherscan
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
