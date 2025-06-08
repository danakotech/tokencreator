"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { useAccount } from "@/providers/web3-provider"
import {
  checkFeeReceiverBalance,
  checkPaymentTransactions,
  PLATFORM_FEE_ADDRESS,
  getNetworkConfig,
} from "@/lib/web3-utils"
import { getAllTokens } from "@/lib/database"
import { AlertTriangle, RefreshCw, DollarSign, Search, Eye, ExternalLink } from "lucide-react"
import { ethers } from "ethers"

export default function PaymentDebugPage() {
  const { toast } = useToast()
  const { address, isConnected } = useAccount()
  const [loading, setLoading] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<any>(null)
  const [contractBalance, setContractBalance] = useState<any>(null)
  const [recentTokens, setRecentTokens] = useState<any[]>([])
  const [factoryInfo, setFactoryInfo] = useState<any>(null)

  useEffect(() => {
    runPaymentDiagnostics()
  }, [])

  // Actualizar la función runPaymentDiagnostics para manejar mejor los errores
  const runPaymentDiagnostics = async () => {
    setLoading(true)

    try {
      console.log("=== PAYMENT DIAGNOSTICS START ===")

      // 1. Verificar balance de wallet destinataria
      const balanceInfo = await checkFeeReceiverBalance("sepolia")
      setPaymentStatus(balanceInfo)
      console.log("Fee receiver balance:", balanceInfo)

      // 2. Verificar transacciones recientes (con manejo de errores mejorado)
      try {
        const transactions = await checkPaymentTransactions("sepolia", 20)
        console.log("Recent transactions:", transactions)

        if (transactions.length === 0) {
          console.warn("No transactions found for fee receiver address")
        }
      } catch (error) {
        console.warn("Could not fetch recent transactions:", error)
        // Continuar con el resto del diagnóstico
      }

      // 3. Verificar balance del contrato factory
      await checkFactoryContractBalance()

      // 4. Verificar información del contrato factory
      await checkFactoryInfo()

      // 5. Obtener tokens recientes de la base de datos
      try {
        const tokens = await getAllTokens()
        const recent = tokens.slice(-10).reverse() // Últimos 10 tokens
        setRecentTokens(recent)
        console.log("Recent tokens from DB:", recent)
      } catch (error) {
        console.warn("Could not fetch tokens from database:", error)
        setRecentTokens([])
      }

      // 6. Verificar cada token reciente en blockchain
      if (isConnected && window.ethereum) {
        try {
          await verifyRecentTokensOnChain(recentTokens)
        } catch (error) {
          console.warn("Could not verify tokens on chain:", error)
        }
      }

      toast({
        title: "Diagnóstico de pagos completado",
        description: "Se han verificado todos los aspectos del sistema de pagos",
      })
    } catch (error) {
      console.error("Error in payment diagnostics:", error)
      toast({
        title: "Error en diagnóstico",
        description: "Ocurrió un error al verificar el sistema de pagos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const checkFactoryContractBalance = async () => {
    try {
      if (!window.ethereum) return

      const provider = new ethers.BrowserProvider(window.ethereum)
      const network = getNetworkConfig("sepolia")
      const factoryAddress = network.factoryAddress

      if (!factoryAddress || factoryAddress === "0x0000000000000000000000000000000000000000") {
        console.warn("Factory address not configured")
        return
      }

      // Verificar balance del contrato factory
      const balance = await provider.getBalance(factoryAddress)
      const balanceEth = ethers.formatEther(balance)

      console.log(`Factory contract balance: ${balanceEth} ETH`)

      setContractBalance({
        address: factoryAddress,
        balance: balanceEth,
        balanceWei: balance.toString(),
      })

      // Si hay balance en el contrato, es un problema
      if (Number.parseFloat(balanceEth) > 0) {
        console.warn("⚠️ WARNING: Factory contract has retained funds!")
        console.warn(`Retained amount: ${balanceEth} ETH`)
      }
    } catch (error) {
      console.error("Error checking factory contract balance:", error)
    }
  }

  const checkFactoryInfo = async () => {
    try {
      if (!window.ethereum) return

      const provider = new ethers.BrowserProvider(window.ethereum)
      const network = getNetworkConfig("sepolia")
      const factoryAddress = network.factoryAddress

      if (!factoryAddress || factoryAddress === "0x0000000000000000000000000000000000000000") {
        return
      }

      // ABI mínimo para las funciones que necesitamos
      const factoryABI = [
        "function feeReceiver() view returns (address)",
        "function baseFee() view returns (uint256)",
        "function featurePrice() view returns (uint256)",
        "function owner() view returns (address)",
        "function getContractBalance() view returns (uint256)",
        "function getDeployedTokens() view returns (address[])",
      ]

      const factory = new ethers.Contract(factoryAddress, factoryABI, provider)

      const info: any = {}

      try {
        info.feeReceiver = await factory.feeReceiver()
        console.log("Configured fee receiver:", info.feeReceiver)
      } catch (error) {
        console.error("Could not get fee receiver:", error)
      }

      try {
        info.baseFee = ethers.formatEther(await factory.baseFee())
        console.log("Base fee:", info.baseFee, "ETH")
      } catch (error) {
        console.error("Could not get base fee:", error)
      }

      try {
        info.featurePrice = ethers.formatEther(await factory.featurePrice())
        console.log("Feature price:", info.featurePrice, "ETH")
      } catch (error) {
        console.error("Could not get feature price:", error)
      }

      try {
        info.owner = await factory.owner()
        console.log("Factory owner:", info.owner)
      } catch (error) {
        console.error("Could not get owner:", error)
      }

      try {
        const contractBalance = await factory.getContractBalance()
        info.contractBalance = ethers.formatEther(contractBalance)
        console.log("Contract balance (from contract):", info.contractBalance, "ETH")
      } catch (error) {
        console.error("Could not get contract balance:", error)
      }

      try {
        const deployedTokens = await factory.getDeployedTokens()
        info.totalTokensDeployed = deployedTokens.length
        console.log("Total tokens deployed:", info.totalTokensDeployed)
      } catch (error) {
        console.error("Could not get deployed tokens:", error)
      }

      setFactoryInfo(info)

      // Verificar si el fee receiver está configurado correctamente
      if (info.feeReceiver && info.feeReceiver.toLowerCase() !== PLATFORM_FEE_ADDRESS.toLowerCase()) {
        console.error("❌ CRITICAL ERROR: Fee receiver mismatch!")
        console.error("Expected:", PLATFORM_FEE_ADDRESS)
        console.error("Configured:", info.feeReceiver)
      } else {
        console.log("✅ Fee receiver correctly configured")
      }
    } catch (error) {
      console.error("Error checking factory info:", error)
    }
  }

  const verifyRecentTokensOnChain = async (tokens: any[]) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const network = getNetworkConfig("sepolia")

      for (const token of tokens.slice(0, 5)) {
        // Verificar últimos 5 tokens
        try {
          console.log(`\n=== Verifying token: ${token.name} ===`)
          console.log("Token address:", token.address)
          console.log("Created by:", token.createdBy)
          console.log("Transaction hash:", token.transactionHash)

          // Verificar la transacción
          if (token.transactionHash) {
            const tx = await provider.getTransaction(token.transactionHash)
            if (tx) {
              console.log("Transaction value:", ethers.formatEther(tx.value), "ETH")
              console.log("Transaction to:", tx.to)
              console.log("Transaction from:", tx.from)

              // Obtener el receipt para ver los eventos
              const receipt = await provider.getTransactionReceipt(token.transactionHash)
              if (receipt) {
                console.log("Transaction status:", receipt.status === 1 ? "Success" : "Failed")
                console.log("Gas used:", receipt.gasUsed.toString())
                console.log("Logs count:", receipt.logs.length)

                // Buscar eventos de pago
                let paymentFound = false
                for (const log of receipt.logs) {
                  try {
                    // Verificar si es una transferencia ETH al fee receiver
                    if (log.topics.length === 0 && log.data === "0x") {
                      // Posible transferencia ETH
                      if (log.address.toLowerCase() === PLATFORM_FEE_ADDRESS.toLowerCase()) {
                        paymentFound = true
                        console.log("✅ Payment transfer found in logs")
                      }
                    }
                  } catch (e) {
                    // Ignorar logs que no podemos parsear
                  }
                }

                if (!paymentFound) {
                  console.warn("⚠️ No payment transfer found in transaction logs")
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error verifying token ${token.name}:`, error)
        }
      }
    } catch (error) {
      console.error("Error verifying tokens on chain:", error)
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

      const factoryABI = ["function emergencyWithdraw() external", "function owner() view returns (address)"]

      const factory = new ethers.Contract(factoryAddress, factoryABI, signer)

      // Verificar que el usuario es el owner
      const owner = await factory.owner()
      const userAddress = await signer.getAddress()

      if (owner.toLowerCase() !== userAddress.toLowerCase()) {
        toast({
          title: "Error",
          description: "Solo el propietario del contrato puede ejecutar esta función",
          variant: "destructive",
        })
        return
      }

      // Ejecutar emergency withdraw
      const tx = await factory.emergencyWithdraw()
      console.log("Emergency withdraw transaction:", tx.hash)

      toast({
        title: "Transacción enviada",
        description: `Hash: ${tx.hash}`,
      })

      await tx.wait()

      toast({
        title: "Fondos retirados",
        description: "Los fondos atascados han sido retirados exitosamente",
      })

      // Actualizar diagnósticos
      runPaymentDiagnostics()
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
                Debug de Sistema de Pagos
              </h1>
              <p className="text-xl text-muted-foreground mt-2">
                Diagnóstico detallado de transferencias a {PLATFORM_FEE_ADDRESS}
              </p>
            </div>
            <Button onClick={runPaymentDiagnostics} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Actualizar Diagnóstico
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 py-8 space-y-6">
        {/* Información crítica del contrato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Información del Contrato Factory
            </CardTitle>
            <CardDescription>Configuración y estado del contrato de creación de tokens</CardDescription>
          </CardHeader>
          <CardContent>
            {factoryInfo ? (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">Fee Receiver Configurado:</span>
                    <div className="text-right">
                      <div className="font-mono text-xs">{factoryInfo.feeReceiver}</div>
                      {factoryInfo.feeReceiver?.toLowerCase() === PLATFORM_FEE_ADDRESS.toLowerCase() ? (
                        <Badge className="bg-green-500 mt-1">✅ Correcto</Badge>
                      ) : (
                        <Badge variant="destructive" className="mt-1">
                          ❌ Incorrecto
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">Tarifa Base:</span>
                    <span className="font-mono">{factoryInfo.baseFee} ETH</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">Precio por Característica:</span>
                    <span className="font-mono">{factoryInfo.featurePrice} ETH</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">Propietario del Contrato:</span>
                    <span className="font-mono text-xs">{factoryInfo.owner}</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">Tokens Desplegados:</span>
                    <span className="font-mono">{factoryInfo.totalTokensDeployed}</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">Balance del Contrato:</span>
                    <div className="text-right">
                      <span className="font-mono">{factoryInfo.contractBalance} ETH</span>
                      {Number.parseFloat(factoryInfo.contractBalance || "0") > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          ⚠️ Fondos Retenidos
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Cargando información del contrato...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estado de la wallet destinataria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Estado de Wallet Destinataria
            </CardTitle>
            <CardDescription>Balance y transacciones de {PLATFORM_FEE_ADDRESS}</CardDescription>
          </CardHeader>
          <CardContent>
            {paymentStatus ? (
              <div className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded">
                    <p className="text-2xl font-bold text-blue-600">{paymentStatus.balance}</p>
                    <p className="text-sm text-muted-foreground">ETH Balance</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded">
                    <p className="text-2xl font-bold text-green-600">{paymentStatus.network}</p>
                    <p className="text-sm text-muted-foreground">Red</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(`https://sepolia.etherscan.io/address/${PLATFORM_FEE_ADDRESS}`, "_blank")
                      }
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver en Etherscan
                    </Button>
                  </div>
                </div>

                <Alert>
                  <Eye className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Dirección Monitoreada:</strong> {PLATFORM_FEE_ADDRESS}
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Cargando estado de pagos...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Balance del contrato factory */}
        {contractBalance && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Balance del Contrato Factory
              </CardTitle>
              <CardDescription>Verificación de fondos retenidos en el contrato</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 border rounded">
                  <div>
                    <p className="font-medium">Balance Actual del Contrato</p>
                    <p className="text-sm text-muted-foreground">{contractBalance.address}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{contractBalance.balance} ETH</p>
                    {Number.parseFloat(contractBalance.balance) > 0 ? (
                      <Badge variant="destructive">⚠️ Fondos Retenidos</Badge>
                    ) : (
                      <Badge className="bg-green-500">✅ Sin Fondos Retenidos</Badge>
                    )}
                  </div>
                </div>

                {Number.parseFloat(contractBalance.balance) > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>PROBLEMA DETECTADO:</strong> El contrato factory tiene {contractBalance.balance} ETH
                      retenidos. Estos fondos deberían haberse transferido automáticamente a la wallet destinataria.
                      <div className="mt-2">
                        <Button variant="destructive" size="sm" onClick={emergencyWithdraw} disabled={!isConnected}>
                          Retirar Fondos de Emergencia
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tokens recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Tokens Creados Recientemente
            </CardTitle>
            <CardDescription>Últimos tokens creados y sus transacciones de pago</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTokens.length > 0 ? (
              <div className="space-y-3">
                {recentTokens.map((token, index) => (
                  <div key={index} className="p-4 border rounded">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {token.name} ({token.symbol})
                        </p>
                        <p className="text-sm text-muted-foreground">Creado por: {token.createdBy}</p>
                        <p className="text-sm text-muted-foreground">Red: {token.network}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm">{token.paidAmount} ETH</p>
                        <p className="text-xs text-muted-foreground">{new Date(token.createdAt).toLocaleString()}</p>
                      </div>
                    </div>

                    {token.transactionHash && (
                      <div className="mt-2 pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Hash de transacción:</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              window.open(`https://sepolia.etherscan.io/tx/${token.transactionHash}`, "_blank")
                            }
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            {token.transactionHash.slice(0, 10)}...
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Eye className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No hay tokens recientes para mostrar</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
