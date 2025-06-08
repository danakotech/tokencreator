"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Coins, Shield, Rocket } from "lucide-react"
import type { CreatedToken } from "@/types/token"

interface TokenCreationStatusProps {
  token: CreatedToken
  onCreateAnother: () => void
}

export function TokenCreationStatus({ token, onCreateAnother }: TokenCreationStatusProps) {
  const blockchainConfig = {
    sepolia: {
      name: "Sepolia Testnet",
      explorerUrl: "https://sepolia.etherscan.io",
      color: "bg-blue-500",
      factoryAddress: "", // Placeholder, should be actual address if available
    },
    ethereum: {
      name: "Ethereum Mainnet",
      explorerUrl: "https://etherscan.io",
      color: "bg-gray-800",
      factoryAddress: "", // Placeholder
    },
    polygon: {
      name: "Polygon",
      explorerUrl: "https://polygonscan.com",
      color: "bg-purple-600",
      factoryAddress: "", // Placeholder
    },
  }

  const network = token.blockchain as keyof typeof blockchainConfig

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-white/20 rounded-full">
                <Rocket className="h-8 w-8" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">¡Token Creado Exitosamente!</CardTitle>
            <CardDescription className="text-green-100 text-lg">
              Tu token ha sido desplegado en {blockchainConfig[network].name}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid gap-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Coins className="h-5 w-5" />
                    Detalles del Token
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nombre:</span>
                      <span className="font-medium">{token.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Símbolo:</span>
                      <span className="font-medium">{token.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Suministro Total:</span>
                      <span className="font-medium">{token.totalSupply}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tus Tokens:</span>
                      <span className="font-medium text-green-600">{token.userTokens}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Información Blockchain
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Red:</span>
                      <Badge className={blockchainConfig[network].color}>{blockchainConfig[network].name}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dirección:</span>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {token.address === blockchainConfig[network].factoryAddress
                          ? "Creado correctamente (dirección exacta no disponible)"
                          : `${token.address.slice(0, 10)}...${token.address.slice(-8)}`}
                      </code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">TX Hash:</span>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {token.transactionHash.slice(0, 10)}...{token.transactionHash.slice(-8)}
                      </code>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() =>
                    window.open(`${blockchainConfig[network].explorerUrl}/token/${token.address}`, "_blank")
                  }
                  variant="outline"
                >
                  Ver en Explorer
                </Button>
                <Button onClick={onCreateAnother}>Crear Otro Token</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
