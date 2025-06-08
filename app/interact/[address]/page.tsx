"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { useAccount } from "@/providers/web3-provider"
import {
  Coins,
  Send,
  Flame,
  ArrowLeftRight,
  Info,
  ExternalLink,
  Wallet,
  Shield,
  Zap,
  Lock,
  TrendingDown,
  Users,
} from "lucide-react"
import { ethers } from "ethers"
import { getTokenByAddress } from "@/lib/database"
import { getTokenInfo, getTokenBalance, isTokenOwner, getTokenFeatures } from "@/lib/web3-utils"
import CustomTokenABI from "@/contracts/abis/CustomToken.json"
import type { CreatedToken } from "@/types/token"

export default function InteractTokenPage() {
  const params = useParams()
  const tokenAddress = params.address as string
  const { address: userAddress, isConnected } = useAccount()
  const { toast } = useToast()

  const [token, setToken] = useState<CreatedToken | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [tokenBalance, setTokenBalance] = useState("0")
  const [actualFeatures, setActualFeatures] = useState<any>({})

  // Estados para las diferentes acciones
  const [transferTo, setTransferTo] = useState("")
  const [transferAmount, setTransferAmount] = useState("")
  const [burnAmount, setBurnAmount] = useState("")
  const [mintTo, setMintTo] = useState("")
  const [mintAmount, setMintAmount] = useState("")
  const [airdropAddresses, setAirdropAddresses] = useState("")
  const [airdropAmount, setAirdropAmount] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    loadTokenData()
  }, [tokenAddress])

  useEffect(() => {
    if (isConnected && userAddress && window.ethereum) {
      loadBlockchainData()
    }
  }, [token, userAddress, isConnected])

  const loadTokenData = async () => {
    try {
      // Cargar datos de la base de datos
      const tokenData = await getTokenByAddress(tokenAddress)

      if (!tokenData) {
        console.warn("Token no encontrado en la base de datos")
      }

      setToken(tokenData)

      // Si hay conexión web3, cargar datos adicionales de la blockchain
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum)
        try {
          // Verificar si la dirección es válida y tiene código
          if (!ethers.isAddress(tokenAddress)) {
            throw new Error("Dirección de contrato inválida")
          }

          const code = await provider.getCode(tokenAddress)
          if (code === "0x") {
            console.warn("No hay contrato desplegado en esta dirección")
            // Si no hay datos en DB y no hay contrato, mostrar error
            if (!tokenData) {
              setToken(null)
              return
            }
          } else {
            // Solo intentar obtener datos on-chain si hay un contrato
            const onchainData = await getTokenInfo(provider, tokenAddress)

            // Actualizar con datos de la blockchain si están disponibles
            if (tokenData && onchainData) {
              setToken({
                ...tokenData,
                name: onchainData.name || tokenData.name,
                symbol: onchainData.symbol || tokenData.symbol,
                totalSupply: onchainData.totalSupply || tokenData.totalSupply,
                decimals: onchainData.decimals || tokenData.decimals,
              })
            } else if (onchainData && !tokenData) {
              // Si no hay datos en DB pero sí en blockchain, crear objeto básico
              setToken({
                address: tokenAddress,
                transactionHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
                blockchain: "sepolia", // Asumir Sepolia por defecto
                name: onchainData.name,
                symbol: onchainData.symbol,
                totalSupply: onchainData.totalSupply,
                decimals: onchainData.decimals,
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
                userTokens: "0",
                platformFee: "0",
                createdAt: new Date().toISOString(),
                createdBy: "0x0000000000000000000000000000000000000000",
              })
            }
          }
        } catch (error) {
          console.error("Error loading on-chain token data:", error)
          // Si hay error pero tenemos datos de DB, continuar con esos datos
          if (!tokenData) {
            setToken(null)
          }
        }
      }
    } catch (error) {
      console.error("Error loading token data:", error)
      setToken(null)
    } finally {
      setLoading(false)
    }
  }

  const loadBlockchainData = async () => {
    if (!window.ethereum || !userAddress || !tokenAddress) return

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)

      // Verificar si hay un contrato en la dirección
      const code = await provider.getCode(tokenAddress)
      if (code === "0x") {
        console.warn("No hay contrato en esta dirección para cargar datos blockchain")
        return
      }

      // Cargar balance del usuario
      const balanceData = await getTokenBalance(provider, tokenAddress, userAddress)
      setTokenBalance(balanceData.balance)

      // Verificar si es propietario
      const ownerStatus = await isTokenOwner(provider, tokenAddress, userAddress)
      setIsOwner(ownerStatus)

      // Obtener características reales del contrato
      const features = await getTokenFeatures(provider, tokenAddress)
      setActualFeatures(features)
    } catch (error) {
      console.error("Error loading blockchain data:", error)
      // En caso de error, mantener valores por defecto
      setTokenBalance("0")
      setIsOwner(false)
      setActualFeatures({})
    }
  }

  const handleTransfer = async () => {
    if (!transferTo || !transferAmount) {
      toast({
        title: "Datos incompletos",
        description: "Por favor, completa todos los campos",
        variant: "destructive",
      })
      return
    }

    if (!window.ethereum || !isConnected) {
      toast({
        title: "Wallet no conectada",
        description: "Por favor, conecta tu wallet para continuar",
        variant: "destructive",
      })
      return
    }

    try {
      setIsProcessing(true)

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const tokenContract = new ethers.Contract(tokenAddress, CustomTokenABI, signer)

      // Convertir el monto a la unidad correcta según los decimales del token
      const decimals = await tokenContract.decimals()
      const amount = ethers.parseUnits(transferAmount, decimals)

      // Ejecutar la transferencia
      const tx = await tokenContract.transfer(transferTo, amount)

      toast({
        title: "Transferencia iniciada",
        description: "La transacción ha sido enviada",
      })

      // Esperar a que se mine la transacción
      await tx.wait()

      toast({
        title: "Transferencia completada",
        description: `Has transferido ${transferAmount} ${token?.symbol} a ${transferTo}`,
      })

      // Actualizar el balance
      loadBlockchainData()

      // Limpiar campos
      setTransferTo("")
      setTransferAmount("")
    } catch (error: any) {
      console.error("Error en la transferencia:", error)
      toast({
        title: "Error en la transferencia",
        description: error.message || "Ocurrió un error al transferir los tokens",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBurn = async () => {
    if (!burnAmount) {
      toast({
        title: "Cantidad requerida",
        description: "Por favor, especifica la cantidad a quemar",
        variant: "destructive",
      })
      return
    }

    if (!window.ethereum || !isConnected) {
      toast({
        title: "Wallet no conectada",
        description: "Por favor, conecta tu wallet para continuar",
        variant: "destructive",
      })
      return
    }

    try {
      setIsProcessing(true)

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const tokenContract = new ethers.Contract(tokenAddress, CustomTokenABI, signer)

      // Verificar si el token es quemable
      const isBurnable = await tokenContract.isBurnable()
      if (!isBurnable) {
        throw new Error("Este token no tiene la función de quemado habilitada")
      }

      // Convertir el monto a la unidad correcta según los decimales del token
      const decimals = await tokenContract.decimals()
      const amount = ethers.parseUnits(burnAmount, decimals)

      // Ejecutar la quema
      const tx = await tokenContract.burn(amount)

      toast({
        title: "Quema iniciada",
        description: "La transacción ha sido enviada",
      })

      // Esperar a que se mine la transacción
      await tx.wait()

      toast({
        title: "Tokens quemados",
        description: `Has quemado ${burnAmount} ${token?.symbol}`,
      })

      // Actualizar el balance
      loadBlockchainData()

      // Limpiar campos
      setBurnAmount("")
    } catch (error: any) {
      console.error("Error en la quema:", error)
      toast({
        title: "Error al quemar tokens",
        description: error.message || "Ocurrió un error al quemar los tokens",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMint = async () => {
    if (!mintTo || !mintAmount) {
      toast({
        title: "Datos incompletos",
        description: "Por favor, completa todos los campos",
        variant: "destructive",
      })
      return
    }

    if (!window.ethereum || !isConnected || !isOwner) {
      toast({
        title: "Acceso denegado",
        description: "Solo el propietario puede crear nuevos tokens",
        variant: "destructive",
      })
      return
    }

    try {
      setIsProcessing(true)

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const tokenContract = new ethers.Contract(tokenAddress, CustomTokenABI, signer)

      // Verificar si el token es minteable
      const isMintable = await tokenContract.isMintable()
      if (!isMintable) {
        throw new Error("Este token no tiene la función de minteo habilitada")
      }

      // Convertir el monto a la unidad correcta según los decimales del token
      const decimals = await tokenContract.decimals()
      const amount = ethers.parseUnits(mintAmount, decimals)

      // Ejecutar el minteo
      const tx = await tokenContract.mint(mintTo, amount)

      toast({
        title: "Minteo iniciado",
        description: "La transacción ha sido enviada",
      })

      // Esperar a que se mine la transacción
      await tx.wait()

      toast({
        title: "Tokens creados",
        description: `Has creado ${mintAmount} ${token?.symbol} para ${mintTo}`,
      })

      // Actualizar el balance si los tokens fueron minteados para el usuario actual
      if (mintTo.toLowerCase() === userAddress?.toLowerCase()) {
        loadBlockchainData()
      }

      // Limpiar campos
      setMintTo("")
      setMintAmount("")
    } catch (error: any) {
      console.error("Error en el minteo:", error)
      toast({
        title: "Error al crear tokens",
        description: error.message || "Ocurrió un error al crear los tokens",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Coins className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Token no encontrado</h3>
              <p className="text-muted-foreground text-center mb-4">
                No se pudo encontrar información sobre este token.
              </p>
              <div className="text-sm text-muted-foreground mb-6 space-y-2">
                <p>
                  <strong>Dirección consultada:</strong>
                </p>
                <code className="bg-gray-100 p-2 rounded block break-all">{tokenAddress}</code>
                <p className="mt-2">Posibles causas:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>El contrato no existe en esta dirección</li>
                  <li>El token no fue creado en nuestra plataforma</li>
                  <li>La dirección es incorrecta</li>
                  <li>El contrato no implementa las funciones estándar ERC20</li>
                </ul>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => (window.location.href = "/tokens")}>Ver todos los tokens</Button>
                <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>
                  Mi Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const networkConfig = {
    sepolia: {
      name: "Sepolia Testnet",
      explorerUrl: "https://sepolia.etherscan.io",
      color: "bg-blue-500",
    },
    ethereum: {
      name: "Ethereum Mainnet",
      explorerUrl: "https://etherscan.io",
      color: "bg-gray-800",
    },
    polygon: {
      name: "Polygon",
      explorerUrl: "https://polygonscan.com",
      color: "bg-purple-600",
    },
  }

  const network = token.blockchain as keyof typeof networkConfig

  // Usar características reales del contrato si están disponibles, sino usar las de la DB
  const features = Object.keys(actualFeatures).length > 0 ? actualFeatures : token.features

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto p-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Información del Token */}
          <div className="lg:col-span-1">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Información del Token
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Coins className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">{token.name}</h3>
                  <p className="text-muted-foreground">{token.symbol}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Dirección:</span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {tokenAddress.slice(0, 10)}...{tokenAddress.slice(-8)}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Suministro Total:</span>
                    <span className="text-sm font-medium">{token.totalSupply}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Tu Balance:</span>
                    <span className="text-sm font-medium">{tokenBalance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Eres propietario:</span>
                    <Badge variant={isOwner ? "default" : "secondary"}>{isOwner ? "Sí" : "No"}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Red:</span>
                    <Badge className={networkConfig[network].color}>{networkConfig[network].name}</Badge>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-2">Características Activas:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {features.burnable && (
                      <div className="flex items-center gap-2 p-2 bg-red-50 rounded">
                        <Flame className="h-4 w-4 text-red-500" />
                        <span className="text-xs">Quemable</span>
                      </div>
                    )}
                    {features.mintable && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                        <Zap className="h-4 w-4 text-green-500" />
                        <span className="text-xs">Minteable</span>
                      </div>
                    )}
                    {features.pausable && (
                      <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                        <Lock className="h-4 w-4 text-yellow-500" />
                        <span className="text-xs">Pausable</span>
                      </div>
                    )}
                    {features.deflationary && (
                      <div className="flex items-center gap-2 p-2 bg-purple-50 rounded">
                        <TrendingDown className="h-4 w-4 text-purple-500" />
                        <span className="text-xs">Deflacionario</span>
                      </div>
                    )}
                    {features.antiWhale && (
                      <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span className="text-xs">Anti-Ballena</span>
                      </div>
                    )}
                    {features.ownership && (
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <Shield className="h-4 w-4 text-gray-500" />
                        <span className="text-xs">Propiedad</span>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    window.open(`${networkConfig[network].explorerUrl}/token/${tokenAddress}`, "_blank")
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver en Explorer
                </Button>
              </CardContent>
            </Card>

            {!isConnected && (
              <Alert>
                <Wallet className="h-4 w-4" />
                <AlertDescription>Conecta tu wallet para interactuar con este token.</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Acciones del Token */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowLeftRight className="h-5 w-5" />
                  Acciones del Token
                </CardTitle>
                <CardDescription>
                  {isOwner
                    ? "Como propietario, tienes acceso a todas las funciones administrativas"
                    : "Funciones básicas disponibles para todos los usuarios"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="transfer" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="transfer">Transferir</TabsTrigger>
                    <TabsTrigger value="burn" disabled={!features.burnable}>
                      Quemar
                    </TabsTrigger>
                    <TabsTrigger value="mint" disabled={!features.mintable || !isOwner}>
                      Mintear
                    </TabsTrigger>
                    <TabsTrigger value="info">Información</TabsTrigger>
                  </TabsList>

                  <TabsContent value="transfer" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="transferTo">Dirección de destino</Label>
                        <Input
                          id="transferTo"
                          placeholder="0x..."
                          value={transferTo}
                          onChange={(e) => setTransferTo(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="transferAmount">Cantidad</Label>
                        <Input
                          id="transferAmount"
                          type="number"
                          placeholder="0.0"
                          value={transferAmount}
                          onChange={(e) => setTransferAmount(e.target.value)}
                        />
                      </div>
                      <Button onClick={handleTransfer} disabled={!isConnected || isProcessing} className="w-full">
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Procesando...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Transferir Tokens
                          </>
                        )}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="burn" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      <Alert>
                        <Flame className="h-4 w-4" />
                        <AlertDescription>
                          Quemar tokens los eliminará permanentemente del suministro total.
                        </AlertDescription>
                      </Alert>
                      <div>
                        <Label htmlFor="burnAmount">Cantidad a quemar</Label>
                        <Input
                          id="burnAmount"
                          type="number"
                          placeholder="0.0"
                          value={burnAmount}
                          onChange={(e) => setBurnAmount(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={handleBurn}
                        disabled={!isConnected || !features.burnable || isProcessing}
                        variant="destructive"
                        className="w-full"
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Procesando...
                          </>
                        ) : (
                          <>
                            <Flame className="h-4 w-4 mr-2" />
                            Quemar Tokens
                          </>
                        )}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="mint" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>Solo el propietario del contrato puede crear nuevos tokens.</AlertDescription>
                      </Alert>
                      <div>
                        <Label htmlFor="mintTo">Dirección de destino</Label>
                        <Input
                          id="mintTo"
                          placeholder="0x..."
                          value={mintTo}
                          onChange={(e) => setMintTo(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="mintAmount">Cantidad a crear</Label>
                        <Input
                          id="mintAmount"
                          type="number"
                          placeholder="0.0"
                          value={mintAmount}
                          onChange={(e) => setMintAmount(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={handleMint}
                        disabled={!isConnected || !features.mintable || !isOwner || isProcessing}
                        className="w-full"
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Procesando...
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            Crear Tokens
                          </>
                        )}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="info" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Hash de Transacción</Label>
                          <code className="text-xs bg-gray-100 p-2 rounded block break-all">
                            {token.transactionHash}
                          </code>
                        </div>
                        <div className="space-y-2">
                          <Label>Creado por</Label>
                          <code className="text-xs bg-gray-100 p-2 rounded block break-all">{token.createdBy}</code>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Fecha de Creación</Label>
                        <p className="text-sm">
                          {token.createdAt ? new Date(token.createdAt).toLocaleString("es-ES") : "Fecha desconocida"}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Características del Contrato</Label>
                        <div className="text-sm space-y-1">
                          <p>• Burnable: {features.burnable ? "✅ Activo" : "❌ Inactivo"}</p>
                          <p>• Mintable: {features.mintable ? "✅ Activo" : "❌ Inactivo"}</p>
                          <p>• Pausable: {features.pausable ? "✅ Activo" : "❌ Inactivo"}</p>
                          <p>• Deflationary: {features.deflationary ? "✅ Activo" : "❌ Inactivo"}</p>
                          <p>• Anti-Whale: {features.antiWhale ? "✅ Activo" : "❌ Inactivo"}</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
