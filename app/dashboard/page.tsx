"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useAccount } from "@/providers/web3-provider"
import { ConnectButton } from "@/components/connect-button"
import { Coins, Wallet, ExternalLink, Settings, TrendingUp, Users, Plus, RefreshCw } from "lucide-react"
import { getUserTokens } from "@/lib/database"
import { getUserTokensFromBlockchain } from "@/lib/web3-utils"
import type { CreatedToken } from "@/types/token"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { ethers } from "ethers"

export default function DashboardPage() {
  const { toast } = useToast()
  const { address, isConnected } = useAccount()
  const [userTokens, setUserTokens] = useState<CreatedToken[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [totalValue, setTotalValue] = useState("0")

  useEffect(() => {
    if (isConnected && address) {
      loadUserTokens()
    } else {
      setUserTokens([])
      setLoading(false)
    }
  }, [isConnected, address])

  const loadUserTokens = async () => {
    if (!address) return

    try {
      setLoading(true)

      // Cargar tokens desde la base de datos
      const dbTokens = await getUserTokens(address)

      // Si hay conexión web3, también cargar desde blockchain
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum)
          const blockchainTokens = await getUserTokensFromBlockchain(provider, "sepolia", address)

          // Combinar datos de DB y blockchain (priorizar DB para metadatos)
          const combinedTokens = dbTokens.map((dbToken) => {
            const blockchainToken = blockchainTokens.find((bt) => bt.toLowerCase() === dbToken.address.toLowerCase())
            return {
              ...dbToken,
              isOnChain: !!blockchainToken,
            }
          })

          setUserTokens(combinedTokens)
        } catch (error) {
          console.error("Error loading blockchain tokens:", error)
          setUserTokens(dbTokens)
        }
      } else {
        setUserTokens(dbTokens)
      }

      // Calcular valor total estimado (simplificado)
      const total = dbTokens.length * 0.002 // Precio base por token
      setTotalValue(total.toFixed(3))
    } catch (error) {
      console.error("Error loading user tokens:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar tus tokens",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshTokens = async () => {
    setRefreshing(true)
    await loadUserTokens()
    setRefreshing(false)
    toast({
      title: "Actualizado",
      description: "Lista de tokens actualizada",
    })
  }

  const getActiveFeatures = (features: CreatedToken["features"]) => {
    return Object.entries(features)
      .filter(([_, value]) => value)
      .map(([key]) => {
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
        return labels[key as keyof typeof labels]
      })
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Conecta tu Wallet</h3>
              <p className="text-muted-foreground text-center mb-6">
                Para ver tu dashboard de tokens, necesitas conectar tu wallet
              </p>
              <ConnectButton />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Mi Dashboard
              </h1>
              <p className="text-xl text-muted-foreground mt-2">Gestiona todos tus tokens creados</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={refreshTokens} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
              <Button onClick={() => (window.location.href = "/")}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Token
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Tokens</p>
                  <p className="text-2xl font-bold">{userTokens.length}</p>
                </div>
                <Coins className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valor Invertido</p>
                  <p className="text-2xl font-bold">{totalValue} ETH</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Redes Activas</p>
                  <p className="text-2xl font-bold">{new Set(userTokens.map((t) => t.blockchain)).size}</p>
                </div>
                <Settings className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Wallet</p>
                  <p className="text-sm font-mono">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tokens List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Mis Tokens ({userTokens.length})
            </CardTitle>
            <CardDescription>Todos los tokens que has creado con esta wallet</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : userTokens.length === 0 ? (
              <div className="text-center py-12">
                <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tienes tokens aún</h3>
                <p className="text-muted-foreground mb-6">Crea tu primer token para comenzar</p>
                <Button onClick={() => (window.location.href = "/")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Mi Primer Token
                </Button>
              </div>
            ) : (
              <div className="grid gap-6">
                {userTokens.map((token) => (
                  <TokenCard key={token.address} token={token} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function TokenCard({ token }: { token: CreatedToken }) {
  const activeFeatures = getActiveFeatures(token.features)

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

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Coins className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{token.name}</h3>
              <p className="text-muted-foreground font-mono">{token.symbol}</p>
            </div>
          </div>
          <Badge className={networkConfig[network].color}>{networkConfig[network].name}</Badge>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Suministro Total</p>
            <p className="font-semibold">{Number(token.totalSupply).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Decimales</p>
            <p className="font-semibold">{token.decimals}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Creado</p>
            <p className="font-semibold">
              {token.createdAt
                ? formatDistanceToNow(new Date(token.createdAt), { addSuffix: true, locale: es })
                : "Fecha desconocida"}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">Dirección del Contrato</p>
          <code className="text-xs bg-gray-100 p-2 rounded block break-all">{token.address}</code>
        </div>

        {activeFeatures.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">Características Activas</p>
            <div className="flex flex-wrap gap-2">
              {activeFeatures.map((feature) => (
                <Badge key={feature} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={() => (window.location.href = `/interact/${token.address}`)}>
            <Settings className="h-4 w-4 mr-1" />
            Interactuar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`${networkConfig[network].explorerUrl}/token/${token.address}`, "_blank")}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function getActiveFeatures(features: CreatedToken["features"]) {
  return Object.entries(features)
    .filter(([_, value]) => value)
    .map(([key]) => {
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
      return labels[key as keyof typeof labels]
    })
}
