"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useAccount } from "@/providers/web3-provider"
import { 
  testAPIConnections, 
  networks, 
  verifyTokenOwnership, 
  checkFeeReceiverBalance,
  checkPaymentTransactions,
  PLATFORM_FEE_ADDRESS 
} from "@/lib/web3-utils"
import { getAllTokens } from "@/lib/database"
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Database, Globe, Coins, Shield, Activity, Wallet, DollarSign } from 'lucide-react'
import { ethers } from "ethers"

export default function DiagnosticsPage() {
  const { toast } = useToast()
  const { address, isConnected } = useAccount()
  const [loading, setLoading] = useState(false)
  const [apiStatus, setApiStatus] = useState<any>(null)
  const [dbStatus, setDbStatus] = useState<any>(null)
  const [contractStatus, setContractStatus] = useState<any>(null)
  const [ownershipStatus, setOwnershipStatus] = useState<any>(null)
  const [paymentStatus, setPaymentStatus] = useState<any>(null)

  useEffect(() => {
    runDiagnostics()
  }, [])

  const runDiagnostics = async () => {
    setLoading(true)

    try {
      // Test API connections
      console.log("Testing API connections...")
      const apiResults = await testAPIConnections()
      setApiStatus(apiResults)

      // Test database connection
      console.log("Testing database connection...")
      const dbResults = await testDatabaseConnection()
      setDbStatus(dbResults)

      // Test contract deployments
      console.log("Testing contract deployments...")
      const contractResults = await testContractDeployments()
      setContractStatus(contractResults)

      // Test payment system
      console.log("Testing payment system...")
      const paymentResults = await testPaymentSystem()
      setPaymentStatus(paymentResults)

      // Test token ownership
      if (isConnected && address) {
        console.log("Testing token ownership...")
        const ownershipResults = await testTokenOwnership()
        setOwnershipStatus(ownershipResults)
      }

      toast({
        title: "Diagnósticos completados",
        description: "Se han ejecutado todas las pruebas del sistema",
      })
    } catch (error) {
      console.error("Error running diagnostics:", error)
      toast({
        title: "Error en diagnósticos",
        description: "Ocurrió un error al ejecutar las pruebas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const testDatabaseConnection = async () => {
    try {
      const tokens = await getAllTokens()
      return {
        connected: true,
        tokenCount: tokens.length,
        error: null,
      }
    } catch (error) {
      return {
        connected: false,
        tokenCount: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  const testContractDeployments = async () => {
    const results: any = {}

    for (const [networkId, network] of Object.entries(networks)) {
      try {
        if (!network.factoryAddress || network.factoryAddress === "0x0000000000000000000000000000000000000000") {
          results[networkId] = {
            deployed: false,
            error: "Factory address not configured",
          }
          continue
        }

        const provider = new ethers.JsonRpcProvider(network.rpcUrl)
        const code = await provider.getCode(network.factoryAddress)

        results[networkId] = {
          deployed: code !== "0x",
          address: network.factoryAddress,
          hasCode: code !== "0x",
          error: code === "0x" ? "No contract code at address" : null,
        }
      } catch (error) {
        results[networkId] = {
          deployed: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }
      }
    }

    return results
  }

  const testPaymentSystem = async () => {
    try {
      const results: any = {}

      // Verificar balance de la wallet destinataria en cada red
      for (const [networkId, network] of Object.entries(networks)) {
        try {
          const balanceInfo = await checkFeeReceiverBalance(networkId)
          const transactions = await checkPaymentTransactions(networkId, 5)

          results[networkId] = {
            balance: balanceInfo,
            recentTransactions: transactions,
            hasReceivedPayments: transactions.length > 0,
          }
        } catch (error) {
          results[networkId] = {
            error: error instanceof Error ? error.message : "Unknown error",
          }
        }
      }

      return results
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  const testTokenOwnership = async () => {
    try {
      if (!window.ethereum || !address) {
        return { error: "Wallet not connected" }
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const tokens = await getAllTokens()
      const userTokens = tokens.filter((token) => token.createdBy.toLowerCase() === address.toLowerCase())

      const ownershipResults = []

      for (const token of userTokens.slice(0, 5)) {
        try {
          const verification = await verifyTokenOwnership(provider, token.address, address)

          ownershipResults.push({
            tokenAddress: token.address,
            tokenName: token.name,
            ...verification,
          })
        } catch (error) {
          ownershipResults.push({
            tokenAddress: token.address,
            tokenName: token.name,
            isValid: false,
            error: error instanceof Error ? error.message : "Unknown error",
          })
        }
      }

      return {
        totalUserTokens: userTokens.length,
        testedTokens: ownershipResults.length,
        results: ownershipResults,
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  const StatusIcon = ({ status }: { status: boolean | null }) => {
    if (status === null) return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    return status ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  const StatusBadge = ({ status }: { status: boolean | null }) => {
    if (status === null) return <Badge variant="secondary">Pendiente</Badge>
    return status ? <Badge className="bg-green-500">Conectado</Badge> : <Badge variant="destructive">Error</Badge>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Diagnósticos del Sistema
              </h1>
              <p className="text-xl text-muted-foreground mt-2">
                Estado de conexiones y funcionalidad de la plataforma
              </p>
            </div>
            <Button onClick={runDiagnostics} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Ejecutar Diagnósticos
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 py-8">
        <Tabs defaultValue="payments" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="payments">Pagos</TabsTrigger>
            <TabsTrigger value="api">APIs</TabsTrigger>
            <TabsTrigger value="database">Base de Datos</TabsTrigger>
            <TabsTrigger value="contracts">Contratos</TabsTrigger>
            <TabsTrigger value="ownership">Propiedad</TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Sistema de Pagos
                </CardTitle>
                <CardDescription>
                  Verificación de la wallet destinataria: {PLATFORM_FEE_ADDRESS}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentStatus ? (
                  <>
                    <Alert>
                      <Wallet className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Wallet Destinataria:</strong> {PLATFORM_FEE_ADDRESS}
                      </AlertDescription>
                    </Alert>

                    {Object.entries(paymentStatus).map(([networkId, status]: [string, any]) => (
                      <div key={networkId} className="p-4 border rounded">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">{networks[networkId].name}</h4>
                          <StatusBadge status={!status.error} />
                        </div>

                        {status.balance && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Balance actual:</span>
                              <span className="font-mono">{status.balance.balance} ETH</span>
                            </div>
                            
                            <div className="flex justify-between text-sm">
                              <span>Pagos recibidos:</span>
                              <Badge variant={status.hasReceivedPayments ? "default" : "secondary"}>
                                {status.hasReceivedPayments ? "Sí" : "No"}
                              </Badge>
                            </div>

                            {status.recentTransactions && status.recentTransactions.length > 0 && (
                              <div className="mt-3">
                                <p className="text-sm font-medium mb-2">Últimas transacciones:</p>
                                <div className="space-y-1">
                                  {status.recentTransactions.slice(0, 3).map((tx: any, index: number) => (
                                    <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                                      <div className="flex justify-between">
                                        <span>Valor: {tx.value} ETH</span>
                                        <span>{new Date(tx.timestamp).toLocaleDateString()}</span>
                                      </div>
                                      <div className="text-gray-500 truncate">
                                        Hash: {tx.hash}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {status.error && (
                          <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{status.error}</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Ejecuta los diagnósticos para verificar el sistema de pagos</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Estado de APIs Externas
                </CardTitle>
                <CardDescription>Conexiones a servicios de blockchain y exploradores</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {apiStatus ? (
                  <>
                    <div>
                      <h4 className="font-medium mb-3">Infura RPC Connections</h4>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-2">
                            <StatusIcon status={apiStatus.infura.sepolia} />
                            <span>Sepolia</span>
                          </div>
                          <StatusBadge status={apiStatus.infura.sepolia} />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-2">
                            <StatusIcon status={apiStatus.infura.ethereum} />
                            <span>Ethereum</span>
                          </div>
                          <StatusBadge status={apiStatus.infura.ethereum} />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-2">
                            <StatusIcon status={apiStatus.infura.polygon} />
                            <span>Polygon</span>
                          </div>
                          <StatusBadge status={apiStatus.infura.polygon} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Explorer APIs</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-2">
                            <StatusIcon status={apiStatus.etherscan} />
                            <span>Etherscan</span>
                          </div>
                          <StatusBadge status={apiStatus.etherscan} />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-2">
                            <StatusIcon status={apiStatus.polygonscan} />
                            <span>Polygonscan</span>
                          </div>
                          <StatusBadge status={apiStatus.polygonscan} />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Ejecuta los diagnósticos para ver el estado de las APIs</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Estado de la Base de Datos
                </CardTitle>
                <CardDescription>Conexión y datos almacenados en Supabase</CardDescription>
              </CardHeader>
              <CardContent>
                {dbStatus ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded">
                      <div className="flex items-center gap-2">
                        <StatusIcon status={dbStatus.connected} />
                        <span>Conexión a Supabase</span>
                      </div>
                      <StatusBadge status={dbStatus.connected} />
                    </div>

                    {dbStatus.connected && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded">
                        <p className="text-sm">
                          <strong>Tokens almacenados:</strong> {dbStatus.tokenCount}
                        </p>
                      </div>
                    )}

                    {dbStatus.error && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{dbStatus.error}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Database className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Ejecuta los diagnósticos para verificar la base de datos</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contracts" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Estado de Contratos Factory
                </CardTitle>
                <CardDescription>Contratos desplegados en cada red blockchain</CardDescription>
              </CardHeader>
              <CardContent>
                {contractStatus ? (
                  <div className="space-y-4">
                    {Object.entries(contractStatus).map(([networkId, status]: [string, any]) => (
                      <div key={networkId} className="p-4 border rounded">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <StatusIcon status={status.deployed} />
                            <span className="font-medium">{networks[networkId].name}</span>
                          </div>
                          <StatusBadge status={status.deployed} />
                        </div>

                        {status.address && (
                          <p className="text-xs text-muted-foreground mb-1">
                            <strong>Dirección:</strong> {status.address}
                          </p>
                        )}

                        {status.error && (
                          <p className="text-xs text-red-600">
                            <strong>Error:</strong> {status.error}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Coins className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Ejecuta los diagnósticos para verificar los contratos</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ownership" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Verificación de Propiedad
                </CardTitle>
                <CardDescription>Verificar que los usuarios son propietarios de sus tokens</CardDescription>
              </CardHeader>
              <CardContent>
                {!isConnected ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>Conecta tu wallet para verificar la propiedad de tokens</AlertDescription>
                  </Alert>
                ) : ownershipStatus ? (
                  <div className="space-y-4">
                    {ownershipStatus.error ? (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>{ownershipStatus.error}</AlertDescription>
                      </Alert>
                    ) : (
                      <>
                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                          <div className="text-center p-3 bg-blue-50 rounded">
                            <p className="text-2xl font-bold text-blue-600">{ownershipStatus.totalUserTokens}</p>
                            <p className="text-sm text-muted-foreground">Tokens Totales</p>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded">
                            <p className="text-2xl font-bold text-green-600">{ownershipStatus.testedTokens}</p>
                            <p className="text-sm text-muted-foreground">Tokens Verificados</p>
                          </div>
                          <div className="text-center p-3 bg-purple-50 rounded">
                            <p className="text-2xl font-bold text-purple-600">
                              {ownershipStatus.results?.filter((r: any) => r.isOwner).length || 0}
                            </p>
                            <p className="text-sm text-muted-foreground">Propiedad Confirmada</p>
                          </div>
                        </div>

                        {ownershipStatus.results && ownershipStatus.results.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-medium">Resultados de Verificación:</h4>
                            {ownershipStatus.results.map((result: any, index: number) => (
                              <div key={index} className="p-3 border rounded">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">{result.tokenName}</p>
                                    <p className="text-xs text-muted-foreground">{result.tokenAddress}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <StatusIcon status={result.isValid && result.isOwner} />
                                    {result.isValid ? (
                                      result.isOwner ? (
                                        <Badge className="bg-green-500">Propietario</Badge>
                                      ) : (
                                        <Badge variant="destructive">No Propietario</Badge>
                                      )
                                    ) : (
                                      <Badge variant="secondary">Error</Badge>
                                    )}
                                  </div>
                                </div>
                                {result.error && <p className="text-xs text-red-600 mt-1">{result.error}</p>}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Ejecuta los diagnósticos para verificar la propiedad</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
