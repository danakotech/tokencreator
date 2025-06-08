"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ConnectButton } from "@/components/connect-button"
import { Coins, Home, List, Settings, BarChart3, Search, DollarSign } from "lucide-react"

export function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { href: "/", label: "Inicio", icon: Home },
    { href: "/tokens", label: "Mis Tokens", icon: List },
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/admin", label: "Admin", icon: Settings },
    { href: "/admin/diagnostics", label: "Diagnósticos", icon: Search },
    { href: "/admin/payment-debug", label: "Debug Pagos", icon: DollarSign },
    { href: "/admin/payment-trace", label: "Rastreo Pagos", icon: DollarSign },
  ]

  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <Coins className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TokenCreator
              </span>
            </Link>

            <div className="hidden md:flex space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={pathname === item.href ? "default" : "ghost"}
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>

          <ConnectButton />
        </div>
      </div>
    </nav>
  )
}
