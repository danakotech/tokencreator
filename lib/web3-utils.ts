// Utilidades para interactuar con las blockchains
import { ethers } from "ethers"
import TokenFactoryABI from "@/contracts/abis/TokenFactory.json"
import CustomTokenABI from "@/contracts/abis/CustomToken.json"

export const PLATFORM_FEE_ADDRESS = "0x48EF29a0B406dbCAb2C291a72cdB05df01eD9810"
export const ETHERSCAN_API_KEY = "7T4R36EWEXTV35YM1MYUSANQ5FX696V51Q"
export const POLYGONSCAN_API_KEY = "2H2XVRFJDJA5MYDKDT716TWJMD6U6UI2DU"

export interface NetworkConfig {
  name: string
  chainId: number
  rpcUrl: string
  explorerUrl: string
  apiKey: string
  currency: string
  factoryAddress?: string
}

export const networks: Record<string, NetworkConfig> = {
  sepolia: {
    name: "Sepolia Testnet",
    chainId: 11155111,
    rpcUrl: `https://sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_PROJECT_ID}`,
    explorerUrl: "https://sepolia.etherscan.io",
    apiKey: ETHERSCAN_API_KEY,
    currency: "ETH",
    factoryAddress: "0x24C115C1c542B51D17F86d19CCfE8B1d3787865C", // Actualizada a la dirección correcta
  },
  ethereum: {
    name: "Ethereum Mainnet",
    chainId: 1,
    rpcUrl: `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_PROJECT_ID}`,
    explorerUrl: "https://etherscan.io",
    apiKey: ETHERSCAN_API_KEY,
    currency: "ETH",
    factoryAddress: "0x0000000000000000000000000000000000000000",
  },
  polygon: {
    name: "Polygon",
    chainId: 137,
    rpcUrl: `https://polygon-mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_PROJECT_ID}`,
    explorerUrl: "https://polygonscan.com",
    apiKey: POLYGONSCAN_API_KEY,
    currency: "MATIC",
    factoryAddress: "0x0000000000000000000000000000000000000000",
  },
}

export function getNetworkConfig(networkId: string): NetworkConfig {
  return networks[networkId] || networks.sepolia
}

// Función para verificar el balance de la wallet destinataria
export async function checkFeeReceiverBalance(networkId = "sepolia") {
  try {
    const network = getNetworkConfig(networkId)
    const provider = new ethers.JsonRpcProvider(network.rpcUrl)

    const balance = await provider.getBalance(PLATFORM_FEE_ADDRESS)
    const balanceInEth = ethers.formatEther(balance)

    console.log(`Balance de ${PLATFORM_FEE_ADDRESS} en ${network.name}:`, balanceInEth, "ETH")

    return {
      address: PLATFORM_FEE_ADDRESS,
      balance: balanceInEth,
      balanceWei: balance.toString(),
      network: network.name,
    }
  } catch (error) {
    console.error("Error checking fee receiver balance:", error)
    return null
  }
}

// Función para verificar transacciones hacia la wallet destinataria - CORREGIDA
export async function checkPaymentTransactions(networkId = "sepolia", limit = 10) {
  try {
    const network = getNetworkConfig(networkId)

    // Usar proxy para evitar problemas de CORS
    const proxyUrl = "/api/etherscan-proxy"

    const params = new URLSearchParams({
      module: "account",
      action: "txlist",
      address: PLATFORM_FEE_ADDRESS,
      startblock: "0",
      endblock: "99999999",
      page: "1",
      offset: limit.toString(),
      sort: "desc",
      apikey: network.apiKey,
      network: networkId,
    })

    const response = await fetch(`${proxyUrl}?${params}`)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.status === "1" && data.result) {
      const transactions = data.result.map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: ethers.formatEther(tx.value),
        timestamp: new Date(Number.parseInt(tx.timeStamp) * 1000).toISOString(),
        blockNumber: tx.blockNumber,
        isError: tx.isError === "1",
        gasUsed: tx.gasUsed,
        gasPrice: tx.gasPrice,
      }))

      console.log(`Últimas ${limit} transacciones hacia ${PLATFORM_FEE_ADDRESS}:`, transactions)
      return transactions
    }

    return []
  } catch (error) {
    console.error("Error checking payment transactions:", error)
    // Retornar array vacío en lugar de fallar
    return []
  }
}

// Función mejorada para crear un token con mejor manejo de errores y logging
export async function createToken(
  provider: ethers.BrowserProvider,
  networkId: string,
  name: string,
  symbol: string,
  totalSupply: string,
  decimals: number,
  features: boolean[],
  price: string,
) {
  try {
    const network = getNetworkConfig(networkId)
    const factoryAddress = network.factoryAddress

    if (!factoryAddress || factoryAddress === "0x0000000000000000000000000000000000000000") {
      throw new Error(`Factory contract not deployed on ${network.name}. Please deploy the contract first.`)
    }

    const signer = await provider.getSigner()
    const userAddress = await signer.getAddress()

    console.log("=== TOKEN CREATION DEBUG INFO ===")
    console.log("User address:", userAddress)
    console.log("Factory address:", factoryAddress)
    console.log("Network:", network.name)
    console.log("Fee receiver:", PLATFORM_FEE_ADDRESS)
    console.log("Price to pay:", price, "ETH")

    // Verificar balance del usuario
    const userBalance = await provider.getBalance(userAddress)
    const userBalanceEth = ethers.formatEther(userBalance)
    console.log("User balance:", userBalanceEth, "ETH")

    if (userBalance < ethers.parseEther(price)) {
      throw new Error(`Insufficient balance. You have ${userBalanceEth} ETH but need ${price} ETH`)
    }

    // Verificar que el contrato factory existe
    const factoryCode = await provider.getCode(factoryAddress)
    if (factoryCode === "0x") {
      throw new Error(`No contract found at factory address ${factoryAddress}`)
    }

    const factory = new ethers.Contract(factoryAddress, TokenFactoryABI, signer)

    // Verificar que el fee receiver está configurado correctamente
    try {
      const configuredFeeReceiver = await factory.feeReceiver()
      console.log("Configured fee receiver:", configuredFeeReceiver)

      if (configuredFeeReceiver.toLowerCase() !== PLATFORM_FEE_ADDRESS.toLowerCase()) {
        console.warn("WARNING: Fee receiver mismatch!")
        console.warn("Expected:", PLATFORM_FEE_ADDRESS)
        console.warn("Configured:", configuredFeeReceiver)
      }
    } catch (error) {
      console.error("Could not verify fee receiver:", error)
    }

    // Convertir totalSupply a un número entero
    const totalSupplyValue = ethers.parseUnits(totalSupply, 0)
    const priceInWei = ethers.parseEther(price)

    console.log("Token parameters:", {
      name,
      symbol,
      totalSupply: totalSupplyValue.toString(),
      decimals,
      features,
      priceInWei: priceInWei.toString(),
    })

    // Verificar balance antes del pago
    const balanceBefore = await checkFeeReceiverBalance(networkId)
    console.log("Fee receiver balance before:", balanceBefore)

    // Estimar gas para la transacción
    let gasEstimate
    try {
      gasEstimate = await factory.createToken.estimateGas(name, symbol, totalSupplyValue, decimals, features, {
        value: priceInWei,
      })
      console.log("Gas estimate:", gasEstimate.toString())
    } catch (error) {
      console.error("Gas estimation failed:", error)
      // Usar un gas limit alto como fallback
      gasEstimate = BigInt(3000000)
    }

    // Preparar la transacción con gas limit aumentado
    const tx = await factory.createToken(name, symbol, totalSupplyValue, decimals, features, {
      value: priceInWei,
      gasLimit: gasEstimate + BigInt(100000), // Agregar buffer de gas
    })

    console.log("Transaction sent:", tx.hash)
    console.log("Waiting for confirmation...")

    // Esperar a que se mine la transacción
    const receipt = await tx.wait()
    console.log("Transaction mined in block:", receipt.blockNumber)
    console.log("Gas used:", receipt.gasUsed.toString())

    // Verificar balance después del pago
    setTimeout(async () => {
      const balanceAfter = await checkFeeReceiverBalance(networkId)
      console.log("Fee receiver balance after:", balanceAfter)

      if (balanceBefore && balanceAfter) {
        const difference = Number.parseFloat(balanceAfter.balance) - Number.parseFloat(balanceBefore.balance)
        console.log("Balance difference:", difference.toFixed(6), "ETH")

        if (Math.abs(difference - Number.parseFloat(price)) > 0.001) {
          console.warn("WARNING: Payment amount mismatch!")
          console.warn("Expected:", price, "ETH")
          console.warn("Actual difference:", difference.toFixed(6), "ETH")
        }
      }
    }, 5000) // Verificar después de 5 segundos

    // Buscar el evento TokenCreated
    let tokenAddress
    let paymentReceived = false

    try {
      // Buscar eventos en los logs
      for (const log of receipt.logs) {
        try {
          const parsedLog = factory.interface.parseLog(log)

          if (parsedLog?.name === "TokenCreated") {
            tokenAddress = parsedLog.args[0]
            console.log("TokenCreated event found - Token address:", tokenAddress)
          }

          if (parsedLog?.name === "PaymentReceived") {
            paymentReceived = true
            console.log("PaymentReceived event found:", {
              from: parsedLog.args[0],
              to: parsedLog.args[1],
              amount: ethers.formatEther(parsedLog.args[2]),
            })
          }
        } catch (e) {
          // Ignorar logs que no podemos parsear
        }
      }
    } catch (error) {
      console.warn("Error parsing events:", error)
    }

    if (!paymentReceived) {
      console.warn("WARNING: PaymentReceived event not found!")
    }

    // Si no se encontró el token address, usar método alternativo
    if (!tokenAddress) {
      console.warn("TokenCreated event not found, using fallback method")

      // Intentar obtener los tokens del usuario
      try {
        const userTokens = await factory.getUserTokens(userAddress)
        if (userTokens.length > 0) {
          tokenAddress = userTokens[userTokens.length - 1] // El último token creado
          console.log("Token address from getUserTokens:", tokenAddress)
        }
      } catch (error) {
        console.error("Could not get user tokens:", error)
      }
    }

    if (!tokenAddress) {
      console.warn("Could not determine token address, using factory address as fallback")
      tokenAddress = factoryAddress
    }

    return {
      address: tokenAddress,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      creator: userAddress,
      gasUsed: receipt.gasUsed.toString(),
      paymentReceived,
    }
  } catch (error: any) {
    console.error("=== TOKEN CREATION ERROR ===")
    console.error("Error details:", error)

    if (error.message.includes("insufficient funds")) {
      throw new Error("Fondos insuficientes para pagar la tarifa y el gas")
    } else if (error.message.includes("user rejected")) {
      throw new Error("Transacción rechazada por el usuario")
    } else if (error.message.includes("execution reverted")) {
      throw new Error("La transacción fue revertida. Verifica que el contrato esté desplegado correctamente.")
    } else {
      throw new Error(error.message || "Error desconocido al crear el token")
    }
  }
}

// Resto de funciones existentes...
export async function testAPIConnections() {
  const results = {
    infura: { sepolia: false, ethereum: false, polygon: false },
    etherscan: false,
    polygonscan: false,
  }

  // Test Infura connections
  try {
    const sepoliaProvider = new ethers.JsonRpcProvider(networks.sepolia.rpcUrl)
    await sepoliaProvider.getBlockNumber()
    results.infura.sepolia = true
  } catch (error) {
    console.error("Sepolia Infura connection failed:", error)
  }

  try {
    const ethereumProvider = new ethers.JsonRpcProvider(networks.ethereum.rpcUrl)
    await ethereumProvider.getBlockNumber()
    results.infura.ethereum = true
  } catch (error) {
    console.error("Ethereum Infura connection failed:", error)
  }

  try {
    const polygonProvider = new ethers.JsonRpcProvider(networks.polygon.rpcUrl)
    await polygonProvider.getBlockNumber()
    results.infura.polygon = true
  } catch (error) {
    console.error("Polygon Infura connection failed:", error)
  }

  // Test Etherscan API
  try {
    const response = await fetch(
      `https://api.etherscan.io/api?module=stats&action=ethsupply&apikey=${ETHERSCAN_API_KEY}`,
    )
    const data = await response.json()
    results.etherscan = data.status === "1"
  } catch (error) {
    console.error("Etherscan API test failed:", error)
  }

  // Test Polygonscan API
  try {
    const response = await fetch(
      `https://api.polygonscan.com/api?module=stats&action=maticprice&apikey=${POLYGONSCAN_API_KEY}`,
    )
    const data = await response.json()
    results.polygonscan = data.status === "1"
  } catch (error) {
    console.error("Polygonscan API test failed:", error)
  }

  return results
}

export async function getUserTokensFromBlockchain(
  provider: ethers.BrowserProvider,
  networkId: string,
  userAddress: string,
) {
  try {
    const network = getNetworkConfig(networkId)
    const factoryAddress = network.factoryAddress

    if (!factoryAddress || factoryAddress === "0x0000000000000000000000000000000000000000") {
      return []
    }

    const factory = new ethers.Contract(factoryAddress, TokenFactoryABI, provider)
    const tokenAddresses = await factory.getUserTokens(userAddress)

    return tokenAddresses
  } catch (error) {
    console.error("Error getting user tokens from blockchain:", error)
    return []
  }
}

export async function getTokenInfo(provider: ethers.BrowserProvider, tokenAddress: string) {
  try {
    if (!ethers.isAddress(tokenAddress)) {
      throw new Error("Dirección de contrato inválida")
    }

    const code = await provider.getCode(tokenAddress)
    if (code === "0x") {
      throw new Error("No hay contrato desplegado en esta dirección")
    }

    const token = new ethers.Contract(tokenAddress, CustomTokenABI, provider)

    const tokenInfo: any = {}

    try {
      tokenInfo.name = await token.name()
    } catch (error) {
      console.warn("No se pudo obtener el nombre del token:", error)
      tokenInfo.name = "Token Desconocido"
    }

    try {
      tokenInfo.symbol = await token.symbol()
    } catch (error) {
      console.warn("No se pudo obtener el símbolo del token:", error)
      tokenInfo.symbol = "UNKNOWN"
    }

    try {
      tokenInfo.totalSupply = (await token.totalSupply()).toString()
    } catch (error) {
      console.warn("No se pudo obtener el suministro total:", error)
      tokenInfo.totalSupply = "0"
    }

    try {
      tokenInfo.decimals = await token.decimals()
    } catch (error) {
      console.warn("No se pudo obtener los decimales:", error)
      tokenInfo.decimals = 18
    }

    return tokenInfo
  } catch (error) {
    console.error("Error getting token info:", error)
    throw error
  }
}

export async function getTokenBalance(provider: ethers.BrowserProvider, tokenAddress: string, userAddress: string) {
  try {
    if (!ethers.isAddress(tokenAddress)) {
      return {
        balance: "0",
        balanceRaw: "0",
        decimals: 18,
      }
    }

    const code = await provider.getCode(tokenAddress)
    if (code === "0x") {
      return {
        balance: "0",
        balanceRaw: "0",
        decimals: 18,
      }
    }

    const token = new ethers.Contract(tokenAddress, CustomTokenABI, provider)

    let balance = "0"
    let decimals = 18

    try {
      const balanceResult = await token.balanceOf(userAddress)
      balance = balanceResult.toString()
    } catch (error) {
      console.warn("No se pudo obtener el balance:", error)
    }

    try {
      decimals = await token.decimals()
    } catch (error) {
      console.warn("No se pudo obtener los decimales:", error)
    }

    return {
      balance: ethers.formatUnits(balance, decimals),
      balanceRaw: balance,
      decimals,
    }
  } catch (error) {
    console.error("Error getting token balance:", error)
    return {
      balance: "0",
      balanceRaw: "0",
      decimals: 18,
    }
  }
}

export async function isTokenOwner(provider: ethers.BrowserProvider, tokenAddress: string, userAddress: string) {
  try {
    if (!ethers.isAddress(tokenAddress)) {
      return false
    }

    const code = await provider.getCode(tokenAddress)
    if (code === "0x") {
      return false
    }

    const token = new ethers.Contract(tokenAddress, CustomTokenABI, provider)

    try {
      const owner = await token.owner()
      return owner.toLowerCase() === userAddress.toLowerCase()
    } catch (error) {
      console.warn("No se pudo verificar el propietario:", error)
      return false
    }
  } catch (error) {
    console.error("Error checking token ownership:", error)
    return false
  }
}

export async function getTokenFeatures(provider: ethers.BrowserProvider, tokenAddress: string) {
  try {
    if (!ethers.isAddress(tokenAddress)) {
      return {
        burnable: false,
        mintable: false,
        pausable: false,
        deflationary: false,
        antiWhale: false,
        ownership: false,
      }
    }

    const code = await provider.getCode(tokenAddress)
    if (code === "0x") {
      return {
        burnable: false,
        mintable: false,
        pausable: false,
        deflationary: false,
        antiWhale: false,
        ownership: false,
      }
    }

    const token = new ethers.Contract(tokenAddress, CustomTokenABI, provider)

    const features: any = {}

    try {
      features.burnable = await token.isBurnable()
    } catch (error) {
      features.burnable = false
    }

    try {
      features.mintable = await token.isMintable()
    } catch (error) {
      features.mintable = false
    }

    try {
      features.pausable = await token.isPausable()
    } catch (error) {
      features.pausable = false
    }

    try {
      features.deflationary = await token.isDeflationary()
    } catch (error) {
      features.deflationary = false
    }

    try {
      features.antiWhale = await token.isAntiWhale()
    } catch (error) {
      features.antiWhale = false
    }

    try {
      await token.owner()
      features.ownership = true
    } catch (error) {
      features.ownership = false
    }

    return features
  } catch (error) {
    console.error("Error getting token features:", error)
    return {
      burnable: false,
      mintable: false,
      pausable: false,
      deflationary: false,
      antiWhale: false,
      ownership: false,
    }
  }
}

export async function verifyTokenOwnership(
  provider: ethers.BrowserProvider,
  tokenAddress: string,
  expectedOwner: string,
) {
  try {
    if (!ethers.isAddress(tokenAddress)) {
      return { isValid: false, error: "Invalid token address" }
    }

    const code = await provider.getCode(tokenAddress)
    if (code === "0x") {
      return { isValid: false, error: "No contract at address" }
    }

    const token = new ethers.Contract(tokenAddress, CustomTokenABI, provider)

    try {
      const actualOwner = await token.owner()
      const isOwner = actualOwner.toLowerCase() === expectedOwner.toLowerCase()

      return {
        isValid: true,
        isOwner,
        actualOwner,
        expectedOwner,
      }
    } catch (error) {
      return { isValid: false, error: "Could not verify ownership" }
    }
  } catch (error) {
    return { isValid: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function deployTokenFactory(provider: ethers.BrowserProvider) {
  throw new Error("El despliegue automático no está disponible. Por favor, usa Remix IDE para desplegar manualmente.")
}
