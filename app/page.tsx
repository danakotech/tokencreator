"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Coins, Zap, Shield, Flame, TrendingDown, Lock, Users, Info, Rocket, Wallet } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ConnectButton } from "@/components/connect-button"
import { useAccount, useNetwork } from "@/providers/web3-provider"
import { useTokenCreator } from "@/hooks/use-token-creator"
import { calculatePrice } from "@/lib/price-calculator"
import type { TokenConfig } from "@/types/token"
import { NetworkSelector } from "@/components/network-selector"
import { PriceDisplay } from "@/components/price-display"
import { TokenCreationStatus } from "@/components/token-creation-status"

export default function TokenCreatorPlatform() {
  const { toast } = useToast()
  const { address, isConnected } = useAccount()
  const { chain } = useNetwork()
  const { createToken, isCreating, createdToken, error, resetCreation } = useTokenCreator()

  const [tokenConfig, setTokenConfig] = useState<TokenConfig>({
    name: "",
    symbol: "",
    totalSupply: "",
    decimals: 18,
    description: "",
    blockchain: "sepolia",
    features: {
      burnable: false,
      mintable: false,
      pausable: false,
      deflationary: false,
      taxable: false,
      antiWhale: false,
      liquidityLock: false,
      ownership: true,
    },
    taxSettings: {
      buyTax: 0,
      sellTax: 0,
      liquidityTax: 0,
      marketingTax: 0,
    },
    antiWhaleSettings: {
      maxTransactionAmount: "",
      maxWalletAmount: "",
    },
  })

  const handleFeatureToggle = (feature: keyof TokenConfig["features"]) => {
    setTokenConfig((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: !prev.features[feature],
      },
    }))
  }

  const handleCreateToken = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet no conectada",
        description: "Por favor, conecta tu wallet para continuar",
        variant: "destructive",
      })
      return
    }

    if (!tokenConfig.name || !tokenConfig.symbol || !tokenConfig.totalSupply) {
      toast({
        title: "Datos incompletos",
        description: "Por favor, completa todos los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    // Validar que el suministro sea al menos 1
    if (Number(tokenConfig.totalSupply) < 1) {
      toast({
        title: "Suministro inválido",
        description: "El suministro total debe ser al menos 1",
        variant: "destructive",
      })
      return
    }

    // Validar que la red seleccionada coincida con la red conectada
    const networkChainIds = {
      sepolia: 11155111,
      ethereum: 1,
      polygon: 137,
    }

    const expectedChainId = networkChainIds[tokenConfig.blockchain as keyof typeof networkChainIds]
    const currentChainId = chain?.id

    console.log("Debug - Expected Chain ID:", expectedChainId)
    console.log("Debug - Current Chain ID:", currentChainId)
    console.log("Debug - Selected Blockchain:", tokenConfig.blockchain)

    // Solo validar red si tenemos información de la cadena actual
    if (currentChainId && currentChainId !== expectedChainId) {
      const networkNames = {
        sepolia: "Sepolia Testnet",
        ethereum: "Ethereum Mainnet",
        polygon: "Polygon",
      }

      toast({
        title: "Red incorrecta",
        description: `Por favor, cambia tu wallet a ${networkNames[tokenConfig.blockchain as keyof typeof networkNames]}`,
        variant: "destructive",
      })
      return
    }

    try {
      await createToken(tokenConfig)
    } catch (err) {
      console.error("Error al crear token:", err)
      toast({
        title: "Error al crear token",
        description: err instanceof Error ? err.message : "Ocurrió un error desconocido",
        variant: "destructive",
      })
    }
  }

  // Calcular precio basado en características seleccionadas
  const price = calculatePrice(tokenConfig)

  // Obtener información de la red actual para mostrar en la UI
  const getCurrentNetworkInfo = () => {
    const networkNames = {
      11155111: "Sepolia Testnet",
      1: "Ethereum Mainnet",
      137: "Polygon",
    }

    if (chain?.id) {
      return networkNames[chain.id as keyof typeof networkNames] || `Red ${chain.id}`
    }
    return "No detectada"
  }

  if (createdToken) {
    return <TokenCreationStatus token={createdToken} onCreateAnother={resetCreation} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Creador de Tokens
            </h1>
            <p className="text-xl text-muted-foreground mt-2">Crea tu propio token sin conocimientos técnicos</p>
          </div>
          <div className="flex items-center gap-4">
            {isConnected && (
              <div className="text-sm text-muted-foreground">
                Red actual: <span className="font-medium">{getCurrentNetworkInfo()}</span>
              </div>
            )}
            <ConnectButton />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Formulario Principal */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-6 w-6" />
                  Configuración del Token
                </CardTitle>
                <CardDescription>Completa la información básica de tu token</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic">Básico</TabsTrigger>
                    <TabsTrigger value="features">Características</TabsTrigger>
                    <TabsTrigger value="advanced">Avanzado</TabsTrigger>
                    <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-6 mt-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nombre del Token *</Label>
                        <Input
                          id="name"
                          placeholder="ej. Mi Token Increíble"
                          value={tokenConfig.name}
                          onChange={(e) => setTokenConfig((prev) => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="symbol">Símbolo *</Label>
                        <Input
                          id="symbol"
                          placeholder="ej. MTI"
                          value={tokenConfig.symbol}
                          onChange={(e) =>
                            setTokenConfig((prev) => ({ ...prev, symbol: e.target.value.toUpperCase() }))
                          }
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="totalSupply">Suministro Total *</Label>
                        <Input
                          id="totalSupply"
                          type="number"
                          placeholder="ej. 1000000"
                          value={tokenConfig.totalSupply}
                          onChange={(e) => setTokenConfig((prev) => ({ ...prev, totalSupply: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="decimals">Decimales</Label>
                        <Select
                          value={tokenConfig.decimals.toString()}
                          onValueChange={(value) =>
                            setTokenConfig((prev) => ({ ...prev, decimals: Number.parseInt(value) }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="18">18 (Estándar)</SelectItem>
                            <SelectItem value="8">8</SelectItem>
                            <SelectItem value="6">6</SelectItem>
                            <SelectItem value="0">0</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descripción</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe tu token y su propósito..."
                        value={tokenConfig.description}
                        onChange={(e) => setTokenConfig((prev) => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="features" className="space-y-6 mt-6">
                    <div className="grid gap-6">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Flame className="h-5 w-5 text-red-500" />
                          <div>
                            <Label className="text-base font-medium">Quemable (Burnable)</Label>
                            <p className="text-sm text-muted-foreground">
                              Permite quemar tokens para reducir el suministro
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            +0.001 ETH
                          </Badge>
                          <Switch
                            checked={tokenConfig.features.burnable}
                            onCheckedChange={() => handleFeatureToggle("burnable")}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Zap className="h-5 w-5 text-green-500" />
                          <div>
                            <Label className="text-base font-medium">Minteable</Label>
                            <p className="text-sm text-muted-foreground">
                              Permite crear nuevos tokens después del despliegue
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            +0.001 ETH
                          </Badge>
                          <Switch
                            checked={tokenConfig.features.mintable}
                            onCheckedChange={() => handleFeatureToggle("mintable")}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Lock className="h-5 w-5 text-yellow-500" />
                          <div>
                            <Label className="text-base font-medium">Pausable</Label>
                            <p className="text-sm text-muted-foreground">Permite pausar todas las transferencias</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            +0.001 ETH
                          </Badge>
                          <Switch
                            checked={tokenConfig.features.pausable}
                            onCheckedChange={() => handleFeatureToggle("pausable")}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <TrendingDown className="h-5 w-5 text-purple-500" />
                          <div>
                            <Label className="text-base font-medium">Deflacionario</Label>
                            <p className="text-sm text-muted-foreground">
                              Quema automáticamente tokens en cada transacción
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            +0.001 ETH
                          </Badge>
                          <Switch
                            checked={tokenConfig.features.deflationary}
                            onCheckedChange={() => handleFeatureToggle("deflationary")}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-blue-500" />
                          <div>
                            <Label className="text-base font-medium">Anti-Ballena</Label>
                            <p className="text-sm text-muted-foreground">
                              Limita la cantidad máxima por transacción y wallet
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            +0.001 ETH
                          </Badge>
                          <Switch
                            checked={tokenConfig.features.antiWhale}
                            onCheckedChange={() => handleFeatureToggle("antiWhale")}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-6 mt-6">
                    {tokenConfig.features.antiWhale && (
                      <div className="space-y-4 p-4 border rounded-lg">
                        <h4 className="font-medium flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Configuración Anti-Ballena
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Máximo por Transacción</Label>
                            <Input
                              placeholder="ej. 10000"
                              value={tokenConfig.antiWhaleSettings.maxTransactionAmount}
                              onChange={(e) =>
                                setTokenConfig((prev) => ({
                                  ...prev,
                                  antiWhaleSettings: {
                                    ...prev.antiWhaleSettings,
                                    maxTransactionAmount: e.target.value,
                                  },
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Máximo por Wallet</Label>
                            <Input
                              placeholder="ej. 50000"
                              value={tokenConfig.antiWhaleSettings.maxWalletAmount}
                              onChange={(e) =>
                                setTokenConfig((prev) => ({
                                  ...prev,
                                  antiWhaleSettings: {
                                    ...prev.antiWhaleSettings,
                                    maxWalletAmount: e.target.value,
                                  },
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-green-600" />
                        <div>
                          <Label className="text-base font-medium">Propiedad Renunciable</Label>
                          <p className="text-sm text-muted-foreground">Permite renunciar a la propiedad del contrato</p>
                        </div>
                      </div>
                      <Switch
                        checked={tokenConfig.features.ownership}
                        onCheckedChange={() => handleFeatureToggle("ownership")}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="blockchain" className="space-y-6 mt-6">
                    <div className="space-y-4">
                      <Label className="text-base font-medium">Selecciona la Blockchain</Label>
                      <NetworkSelector
                        selectedNetwork={tokenConfig.blockchain}
                        onNetworkChange={(network) => setTokenConfig((prev) => ({ ...prev, blockchain: network }))}
                      />
                    </div>

                    {isConnected && (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Red actual de tu wallet:</strong> {getCurrentNetworkInfo()}
                          <br />
                          <strong>Red seleccionada para el token:</strong>{" "}
                          {tokenConfig.blockchain === "sepolia"
                            ? "Sepolia Testnet"
                            : tokenConfig.blockchain === "ethereum"
                              ? "Ethereum Mainnet"
                              : "Polygon"}
                        </AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Panel de Vista Previa */}
          <div className="space-y-6">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Vista Previa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Coins className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">{tokenConfig.name || "Nombre del Token"}</h3>
                  <p className="text-muted-foreground">{tokenConfig.symbol || "SÍMBOLO"}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Suministro Total:</span>
                    <span className="text-sm font-medium">{tokenConfig.totalSupply || "0"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Decimales:</span>
                    <span className="text-sm font-medium">{tokenConfig.decimals}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Blockchain:</span>
                    <NetworkBadge network={tokenConfig.blockchain} />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Características Activas:</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(tokenConfig.features).map(([key, value]) => {
                      if (!value) return null
                      const labels = {
                        burnable: "Quemable",
                        mintable: "Minteable",
                        pausable: "Pausable",
                        deflationary: "Deflacionario",
                        taxable: "Con Impuestos",
                        antiWhale: "Anti-Ballena",
                        liquidityLock: "Liquidez Bloqueada",
                        ownership: "Propiedad",
                      }
                      return (
                        <Badge key={key} variant="secondary" className="text-xs">
                          {labels[key as keyof typeof labels]}
                        </Badge>
                      )
                    })}
                  </div>
                </div>

                <Separator />

                <PriceDisplay price={price} />
              </CardContent>
            </Card>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Tarifas de Plataforma:</strong> Precio base de 0.002 ETH + 0.001 ETH por cada característica
                adicional activada.
              </AlertDescription>
            </Alert>

            <Button
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={handleCreateToken}
              disabled={
                !tokenConfig.name || !tokenConfig.symbol || !tokenConfig.totalSupply || isCreating || !isConnected
              }
            >
              {!isConnected ? (
                <>
                  <Wallet className="h-5 w-5 mr-2" />
                  Conecta tu Wallet
                </>
              ) : isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Creando Token...
                </>
              ) : (
                <>
                  <Rocket className="h-5 w-5 mr-2" />
                  Crear Token ({price} ETH)
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function NetworkBadge({ network }: { network: string }) {
  const colors = {
    sepolia: "bg-blue-500",
    ethereum: "bg-gray-800",
    polygon: "bg-purple-600",
  }

  const names = {
    sepolia: "Sepolia Testnet",
    ethereum: "Ethereum Mainnet",
    polygon: "Polygon",
  }

  return <Badge className={colors[network as keyof typeof colors]}>{names[network as keyof typeof names]}</Badge>
}
