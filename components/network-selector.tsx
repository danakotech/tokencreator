"use client"
import { Badge } from "@/components/ui/badge"

interface NetworkConfig {
  id: string
  name: string
  color: string
  currency: string
  isTestnet?: boolean
}

const networks: NetworkConfig[] = [
  {
    id: "sepolia",
    name: "Sepolia Testnet",
    color: "bg-blue-500",
    currency: "ETH",
    isTestnet: true,
  },
  {
    id: "ethereum",
    name: "Ethereum Mainnet",
    color: "bg-gray-800",
    currency: "ETH",
  },
  {
    id: "polygon",
    name: "Polygon",
    color: "bg-purple-600",
    currency: "MATIC",
  },
]

interface NetworkSelectorProps {
  selectedNetwork: string
  onNetworkChange: (network: string) => void
}

export function NetworkSelector({ selectedNetwork, onNetworkChange }: NetworkSelectorProps) {
  return (
    <div className="grid gap-4">
      {networks.map((network) => (
        <div
          key={network.id}
          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
            selectedNetwork === network.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
          }`}
          onClick={() => onNetworkChange(network.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${network.color}`} />
              <div>
                <h4 className="font-medium">{network.name}</h4>
                <p className="text-sm text-muted-foreground">Moneda: {network.currency}</p>
              </div>
            </div>
            {network.isTestnet && <Badge variant="secondary">Recomendado para pruebas</Badge>}
          </div>
        </div>
      ))}
    </div>
  )
}
