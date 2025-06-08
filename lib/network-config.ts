export interface NetworkConfig {
  name: string
  chainId: number
  rpcUrl: string
  explorerUrl: string
  apiKey: string
  currency: string
  color: string
}

export const networks: Record<string, NetworkConfig> = {
  sepolia: {
    name: "Sepolia Testnet",
    chainId: 11155111,
    rpcUrl: `https://sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_PROJECT_ID}`,
    explorerUrl: "https://sepolia.etherscan.io",
    apiKey: "7T4R36EWEXTV35YM1MYUSANQ5FX696V51Q",
    currency: "ETH",
    color: "bg-blue-500",
  },
  ethereum: {
    name: "Ethereum Mainnet",
    chainId: 1,
    rpcUrl: `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_PROJECT_ID}`,
    explorerUrl: "https://etherscan.io",
    apiKey: "7T4R36EWEXTV35YM1MYUSANQ5FX696V51Q",
    currency: "ETH",
    color: "bg-gray-800",
  },
  polygon: {
    name: "Polygon",
    chainId: 137,
    rpcUrl: `https://polygon-mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_PROJECT_ID}`,
    explorerUrl: "https://polygonscan.com",
    apiKey: "2H2XVRFJDJA5MYDKDT716TWJMD6U6UI2DU",
    currency: "MATIC",
    color: "bg-purple-600",
  },
}

export function getNetworkConfig(networkId: string): NetworkConfig {
  return networks[networkId] || networks.sepolia
}
