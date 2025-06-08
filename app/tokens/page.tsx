"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExternalLink, Search, Filter, Coins, Calendar } from "lucide-react"
import { getAllTokens } from "@/lib/database"
import type { CreatedToken } from "@/types/token"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

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

export default function TokensPage() {
  const [tokens, setTokens] = useState<CreatedToken[]>([])
  const [filteredTokens, setFilteredTokens] = useState<CreatedToken[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedNetwork, setSelectedNetwork] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")

  useEffect(() => {
    loadTokens()
  }, [])

  useEffect(() => {
    filterAndSortTokens()
  }, [tokens, searchTerm, selectedNetwork, sortBy])

  const loadTokens = async () => {
    try {
      const allTokens = await getAllTokens()
      setTokens(allTokens)
    } catch (error) {
      console.error("Error loading tokens:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortTokens = () => {
    let filtered = tokens

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (token) =>
          token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
          token.address.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filtrar por red
    if (selectedNetwork !== "all") {
      filtered = filtered.filter((token) => token.blockchain === selectedNetwork)
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        case "oldest":
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        case "name":
          return a.name.localeCompare(b.name)
        case "supply":
          return Number(b.totalSupply) - Number(a.totalSupply)
        default:
          return 0
      }
    })

    setFilteredTokens(filtered)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
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
                Tokens Creados
              </h1>
              <p className="text-xl text-muted-foreground mt-2">Explora todos los tokens creados en la plataforma</p>
            </div>
            <Button onClick={() => (window.location.href = "/")}>Crear Token</Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 py-8">
        {/* Filtros y búsqueda */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros y Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, símbolo o dirección..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las redes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las redes</SelectItem>
                  <SelectItem value="sepolia">Sepolia Testnet</SelectItem>
                  <SelectItem value="ethereum">Ethereum Mainnet</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Más recientes</SelectItem>
                  <SelectItem value="oldest">Más antiguos</SelectItem>
                  <SelectItem value="name">Nombre A-Z</SelectItem>
                  <SelectItem value="supply">Mayor suministro</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Total:</span>
                <Badge variant="secondary">{filteredTokens.length} tokens</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs por red */}
        <Tabs value={selectedNetwork} onValueChange={setSelectedNetwork} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Todos ({tokens.length})</TabsTrigger>
            <TabsTrigger value="sepolia">
              Sepolia ({tokens.filter((t) => t.blockchain === "sepolia").length})
            </TabsTrigger>
            <TabsTrigger value="ethereum">
              Ethereum ({tokens.filter((t) => t.blockchain === "ethereum").length})
            </TabsTrigger>
            <TabsTrigger value="polygon">
              Polygon ({tokens.filter((t) => t.blockchain === "polygon").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedNetwork} className="mt-6">
            {filteredTokens.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Coins className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No se encontraron tokens</h3>
                  <p className="text-muted-foreground text-center">
                    {searchTerm || selectedNetwork !== "all"
                      ? "Intenta ajustar los filtros de búsqueda"
                      : "Aún no se han creado tokens en la plataforma"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTokens.map((token) => (
                  <TokenCard key={token.address} token={token} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function TokenCard({ token }: { token: CreatedToken }) {
  const network = token.blockchain as keyof typeof networkConfig
  const activeFeatures = getActiveFeatures(token.features)

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Coins className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">{token.name}</CardTitle>
              <CardDescription className="font-mono">{token.symbol}</CardDescription>
            </div>
          </div>
          <Badge className={networkConfig[network].color}>{networkConfig[network].name}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Suministro:</span>
            <p className="font-medium">{Number(token.totalSupply).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Decimales:</span>
            <p className="font-medium">{token.decimals}</p>
          </div>
        </div>

        <div>
          <span className="text-muted-foreground text-sm">Dirección:</span>
          <p className="font-mono text-sm bg-gray-100 p-2 rounded mt-1">
            {token.address.slice(0, 20)}...{token.address.slice(-10)}
          </p>
        </div>

        {activeFeatures.length > 0 && (
          <div>
            <span className="text-muted-foreground text-sm">Características:</span>
            <div className="flex flex-wrap gap-1 mt-2">
              {activeFeatures.slice(0, 3).map((feature) => (
                <Badge key={feature} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
              {activeFeatures.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{activeFeatures.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {token.createdAt
            ? formatDistanceToNow(new Date(token.createdAt), { addSuffix: true, locale: es })
            : "Fecha desconocida"}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => window.open(`${networkConfig[network].explorerUrl}/token/${token.address}`, "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Explorer
          </Button>
          <Button size="sm" className="flex-1" onClick={() => (window.location.href = `/interact/${token.address}`)}>
            Interactuar
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
