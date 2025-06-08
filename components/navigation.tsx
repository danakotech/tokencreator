"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ConnectButton } from "./connect-button"
import { Coins, Home, List, Settings, BarChart3, Shield, DollarSign } from "lucide-react"

const navigation = [
  { name: "Inicio", href: "/", icon: Home },
  { name: "Crear Token", href: "/welcome", icon: Coins },
  { name: "Mis Tokens", href: "/tokens", icon: List },
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Admin", href: "/admin", icon: Settings },
  { name: "Debug Pagos", href: "/admin/payment-debug", icon: DollarSign },
  { name: "Diagnósticos", href: "/admin/diagnostics", icon: Shield },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link
                href="/"
                className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              >
                TokenCreator
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors",
                      pathname === item.href
                        ? "border-blue-500 text-gray-900"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                    )}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center">
            <ConnectButton />
          </div>
        </div>
      </div>
    </nav>
  )
}
