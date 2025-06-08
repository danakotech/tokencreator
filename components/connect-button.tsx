"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Wallet, ChevronDown } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useState } from "react"
import { useAccount } from "@/providers/web3-provider"

declare global {
  interface Window {
    ethereum?: any
  }
}

export function ConnectButton() {
  const { toast } = useToast()
  const { address, isConnected } = useAccount()
  const [isConnecting, setIsConnecting] = useState(false)

  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      toast({
        title: "MetaMask no detectado",
        description: "Por favor, instala MetaMask para continuar",
        variant: "destructive",
      })
      return
    }

    if (isConnecting) return

    try {
      setIsConnecting(true)

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
      if (accounts.length > 0) {
        toast({
          title: "Wallet conectada",
          description: "Tu wallet ha sido conectada exitosamente",
        })
      }
    } catch (error: any) {
      if (error.code === 4001) {
        toast({
          title: "Conexión cancelada",
          description: "Has cancelado la conexión de la wallet",
          variant: "destructive",
        })
      } else if (error.code === -32002) {
        toast({
          title: "Solicitud pendiente",
          description: "Ya hay una solicitud de conexión pendiente. Revisa MetaMask.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error al conectar",
          description: error.message || "Ocurrió un error al conectar la wallet",
          variant: "destructive",
        })
      }
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    // Solo actualizar el estado local, no desconectar realmente de MetaMask
    toast({
      title: "Desconectado",
      description: "Tu wallet ha sido desconectada de la aplicación",
    })
  }

  if (isConnected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            {`${address.slice(0, 6)}...${address.slice(-4)}`}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              navigator.clipboard.writeText(address)
              toast({
                title: "Dirección copiada",
                description: "La dirección ha sido copiada al portapapeles",
              })
            }}
          >
            Copiar dirección
          </DropdownMenuItem>
          <DropdownMenuItem onClick={disconnectWallet}>Desconectar</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <Button onClick={connectWallet} disabled={isConnecting} className="flex items-center gap-2">
      {isConnecting ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
      ) : (
        <Wallet className="h-4 w-4" />
      )}
      Conectar Wallet
    </Button>
  )
}
