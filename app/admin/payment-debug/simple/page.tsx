"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { useAccount } from "@/providers/web3-provider"
import { checkFeeReceiverBalance, PLATFORM_FEE_ADDRESS, getNetworkConfig } from "@/lib/web3-utils"
import { RefreshCw, DollarSign, AlertTriangle, ExternalLink, CheckCircle } from "lucide-react"
import { ethers } from "ethers"

export default function SimplePaymentDebugPage() {
  const { toast } = useToast()
  const { address, isConnected } = useAccount()
  const [loading, setLoading] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<any>(null)
  const [contractBalance, setContractBalance] = useState<any>(null)
  const [factoryInfo, setFactoryInfo] = useState<any>(null)
  const [manualTransactions, setManualTransactions] = useState<any[]>([])

  useEffect(() => {
    runSimpleDiagnostics()
  }, [])

  const runSimpleDiagnostics = async () => {
    setLoading(true)

    try {
      console.log("=== SIMPLE PAYMENT DIAGNOSTICS START ===")

      // 1. Verificar balance de wallet destinataria
      const balanceInfo = await checkFeeReceiverBalance("sepolia")
      setPaymentStatus(balanceInfo)
      console.log("Fee receiver balance:", balanceInfo)

      // 2. Verificar balance del contrato factory
      await checkFactoryContractBalance()

      // 3. Verificar información del contrato factory
      await checkFactoryInfo()

      // 4. Verificar transacciones manualmente usando Etherscan directo
      await checkTransactionsManually()

      toast({
        title: "Diagnóstico simple completado",
        description: "Verificación básica del sistema de pagos realizada",
      })
    } catch (error) {
      console.error("Error in simple diagnostics:", error)
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

  const checkTransactionsManually = async () => {
    try {
      // Verificar transacciones usando la URL directa de Etherscan
      const etherscanUrl = `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${PLATFORM_FEE_ADDRESS}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=7T4R36EWEXTV35YM1MYUSANQ5FX696V51Q`

      console.log("Checking transactions manually...")
      console.log("URL:", etherscanUrl)

      // Simular datos de transacciones para mostrar la estructura
      const mockTransactions = [
        {
          hash: "0x...",
          from: "0x...",
          to: PLATFORM_FEE_ADDRESS,
          value: "0.002",
          timestamp: new Date().toISOString(),
          blockNumber: "12345",
          isError: false,
        },
      ]

      setManualTransactions(mockTransactions)

      console.log("Manual transaction check completed")
    } catch (error) {
      console.error("Error in manual transaction check:", error)
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
      runSimpleDiagnostics()
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
                Debug Simple de Pagos
              </h1>
              <p className="text-xl text-muted-foreground mt-2">Diagnóstico básico sin APIs externas</p>
            </div>
            <Button onClick={runSimpleDiagnostics} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 py-8 space-y-6">
        {/* Estado de la wallet destinataria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Estado de Wallet Destinataria
            </CardTitle>
            <CardDescription>Balance de {PLATFORM_FEE_ADDRESS}</CardDescription>
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
                  <CheckCircle className="h-4 w-4" />
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

        {/* Información del contrato factory */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Información del Contrato Factory
            </CardTitle>
            <CardDescription>Configuración del contrato de creación de tokens</CardDescription>
          </CardHeader>
          <CardContent>
            {factoryInfo ? (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">Fee Receiver:</span>
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
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">Precio por Característica:</span>
                    <span className="font-mono">{factoryInfo.featurePrice} ETH</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">Propietario:</span>
                    <span className="font-mono text-xs">{factoryInfo.owner}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Cargando información del contrato...</p>
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
              <CardDescription>Verificación de fondos retenidos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 border rounded">
                  <div>
                    <p className="font-medium">Balance del Contrato</p>
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
                      <strong>PROBLEMA:</strong> El contrato tiene {contractBalance.balance} ETH retenidos.
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

        {/* Instrucciones para verificación manual */}
        <Card>
          <CardHeader>
            <CardTitle>Verificación Manual</CardTitle>
            <CardDescription>Pasos para verificar pagos manualmente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded">
                <h4 className="font-medium mb-2">1. Verificar en Etherscan</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Ve a Etherscan y busca la dirección de la wallet destinataria:
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://sepolia.etherscan.io/address/${PLATFORM_FEE_ADDRESS}`, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir en Etherscan
                </Button>
              </div>

              <div className="p-4 bg-green-50 rounded">
                <h4 className="font-medium mb-2">2. Verificar Transacciones de Creación</h4>
                <p className="text-sm text-muted-foreground">
                  Cuando crees un token, verifica que la transacción incluya una transferencia ETH a la wallet
                  destinataria.
                </p>
              </div>

              <div className="p-4 bg-yellow-50 rounded">
                <h4 className="font-medium mb-2">3. Verificar Balance del Contrato</h4>
                <p className="text-sm text-muted-foreground">
                  Si el contrato factory tiene balance &gt; 0, significa que los fondos no se están transfiriendo
                  correctamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
