export interface TokenConfig {
  name: string
  symbol: string
  totalSupply: string
  decimals: number
  description: string
  blockchain: string
  features: {
    burnable: boolean
    mintable: boolean
    pausable: boolean
    deflationary: boolean
    taxable: boolean
    antiWhale: boolean
    liquidityLock: boolean
    ownership: boolean
  }
  taxSettings: {
    buyTax: number
    sellTax: number
    liquidityTax: number
    marketingTax: number
  }
  antiWhaleSettings: {
    maxTransactionAmount: string
    maxWalletAmount: string
  }
}

export interface CreatedToken {
  address: string
  transactionHash: string
  blockchain: string
  name: string
  symbol: string
  totalSupply: string
  decimals: number
  features: {
    burnable: boolean
    mintable: boolean
    pausable: boolean
    deflationary: boolean
    taxable: boolean
    antiWhale: boolean
    liquidityLock: boolean
    ownership: boolean
  }
  userTokens: string
  platformFee: string
  createdAt?: string
  createdBy: string
}
