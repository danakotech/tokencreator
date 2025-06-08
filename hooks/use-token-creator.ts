"use client"

import { useState } from "react"
import { useAccount } from "@/providers/web3-provider"
import type { TokenConfig, CreatedToken } from "@/types/token"
import { saveTokenToDatabase } from "@/lib/database"
import { createToken, verifyTokenOwnership } from "@/lib/web3-utils"
import { ethers } from "ethers"
import { calculatePrice } from "@/lib/price-calculator"

export function useTokenCreator() {
  const { address } = useAccount()
  const [isCreating, setIsCreating] = useState(false)
  const [createdToken, setCreatedToken] = useState<CreatedToken | null>(null)
  const [error, setError] = useState<Error | null>(null)

  // Crear token
  const createTokenWithWeb3 = async (config: TokenConfig) => {
    try {
      setIsCreating(true)
      setError(null)

      if (!address) {
        throw new Error("Wallet no conectada")
      }

      if (!window.ethereum) {
        throw new Error("MetaMask no está instalado")
      }

      console.log("Creating token for user:", address)

      // Crear provider de ethers.js
      const provider = new ethers.BrowserProvider(window.ethereum)

      // Verificar que la dirección del signer coincide con la dirección conectada
      const signer = await provider.getSigner()
      const signerAddress = await signer.getAddress()

      if (signerAddress.toLowerCase() !== address.toLowerCase()) {
        throw new Error("La dirección del wallet no coincide con la dirección conectada")
      }

      console.log("Verified signer address:", signerAddress)

      // Convertir las características a un array de booleanos para el contrato
      const features = [
        config.features.burnable,
        config.features.mintable,
        config.features.pausable,
        config.features.deflationary,
        config.features.antiWhale,
      ]

      // Calcular el precio
      const price = calculatePrice(config)

      console.log("Token configuration:", {
        name: config.name,
        symbol: config.symbol,
        totalSupply: config.totalSupply,
        decimals: config.decimals,
        features,
        price,
        creator: address,
      })

      // Crear el token usando el contrato factory
      const result = await createToken(
        provider,
        config.blockchain,
        config.name,
        config.symbol,
        config.totalSupply,
        config.decimals,
        features,
        price,
      )

      console.log("Token creation result:", result)

      // Verificar la propiedad del token creado
      const ownershipVerification = await verifyTokenOwnership(provider, result.address, address)

      console.log("Ownership verification:", ownershipVerification)

      if (ownershipVerification.isValid && !ownershipVerification.isOwner) {
        console.warn("Warning: User is not the owner of the created token!")
      }

      // Crear objeto de token creado
      const newToken: CreatedToken = {
        address: result.address,
        transactionHash: result.transactionHash,
        blockchain: config.blockchain,
        name: config.name,
        symbol: config.symbol,
        totalSupply: config.totalSupply,
        decimals: config.decimals,
        features: { ...config.features },
        userTokens: config.totalSupply, // El usuario recibe el 100% de los tokens
        platformFee: "0", // No hay comisión en tokens
        createdAt: new Date().toISOString(),
        createdBy: address, // IMPORTANTE: Registrar correctamente el creador
      }

      console.log("Saving token to database:", newToken)

      // Guardar en la base de datos
      await saveTokenToDatabase(newToken)

      setCreatedToken(newToken)
      return newToken
    } catch (err: any) {
      console.error("Error creating token:", err)

      // Proporcionar mensajes de error más descriptivos
      let errorMessage = "Error desconocido al crear el token"

      if (err.message) {
        if (err.message.includes("user rejected transaction")) {
          errorMessage = "Transacción rechazada por el usuario"
        } else if (err.message.includes("insufficient funds")) {
          errorMessage = "Fondos insuficientes para pagar la tarifa y el gas"
        } else if (err.message.includes("Token creation event not found")) {
          errorMessage = "El token fue creado pero no se pudo obtener su dirección exacta"
        } else if (err.message.includes("Factory contract not deployed")) {
          errorMessage = "El contrato factory no está desplegado en esta red"
        } else {
          errorMessage = err.message
        }
      }

      setError(new Error(errorMessage))
      throw new Error(errorMessage)
    } finally {
      setIsCreating(false)
    }
  }

  const resetCreation = () => {
    setCreatedToken(null)
    setError(null)
  }

  return {
    createToken: createTokenWithWeb3,
    isCreating,
    createdToken,
    error,
    resetCreation,
  }
}
