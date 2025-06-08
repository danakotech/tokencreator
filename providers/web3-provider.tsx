"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface Web3ContextType {
  address: string | null
  isConnected: boolean
  chainId: number | null
  connect: () => Promise<void>
  disconnect: () => void
}

const Web3Context = createContext<Web3ContextType>({
  address: null,
  isConnected: false,
  chainId: null,
  connect: async () => {},
  disconnect: () => {},
})

export function useAccount() {
  const context = useContext(Web3Context)
  return {
    address: context.address,
    isConnected: context.isConnected,
  }
}

export function useNetwork() {
  const context = useContext(Web3Context)
  return {
    chain: context.chainId ? { id: context.chainId } : null,
  }
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [chainId, setChainId] = useState<number | null>(null)

  useEffect(() => {
    // Solo configurar listeners, no verificar conexión automáticamente
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)

      // Verificar si ya hay una conexión activa al cargar
      checkExistingConnection()
    }

    return () => {
      if (typeof window !== "undefined" && window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        window.ethereum.removeListener("chainChanged", handleChainChanged)
      }
    }
  }, [])

  const checkExistingConnection = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        // Solo verificar cuentas existentes, no solicitar nuevas
        const accounts = await window.ethereum.request({ method: "eth_accounts" })
        if (accounts.length > 0) {
          setAddress(accounts[0])
          setIsConnected(true)

          // Obtener chainId actual
          const chainId = await window.ethereum.request({ method: "eth_chainId" })
          setChainId(Number.parseInt(chainId, 16))
        }
      } catch (error) {
        console.error("Error checking existing connection:", error)
      }
    }
  }

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length > 0) {
      setAddress(accounts[0])
      setIsConnected(true)
    } else {
      setAddress(null)
      setIsConnected(false)
    }
  }

  const handleChainChanged = (chainId: string) => {
    const newChainId = Number.parseInt(chainId, 16)
    console.log("Chain changed to:", newChainId)
    setChainId(newChainId)
  }

  const connect = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
        const chainId = await window.ethereum.request({ method: "eth_chainId" })

        if (accounts.length > 0) {
          setAddress(accounts[0])
          setIsConnected(true)
          setChainId(Number.parseInt(chainId, 16))
        }
      } catch (error: any) {
        if (error.code === 4001) {
          throw new Error("Usuario rechazó la conexión")
        } else if (error.code === -32002) {
          throw new Error("Ya hay una solicitud de conexión pendiente. Por favor, revisa MetaMask.")
        }
        throw error
      }
    } else {
      throw new Error("MetaMask no está instalado")
    }
  }

  const disconnect = () => {
    setAddress(null)
    setIsConnected(false)
    setChainId(null)
  }

  const value = {
    address,
    isConnected,
    chainId,
    connect,
    disconnect,
  }

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>
}
