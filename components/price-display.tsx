"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface PriceDisplayProps {
  price: string
}

export function PriceDisplay({ price }: PriceDisplayProps) {
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Precio base:</span>
            <span className="text-sm">0.002 ETH</span>
          </div>

          {Number.parseFloat(price) > 0.002 && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Características adicionales:</span>
              <span className="text-sm">{(Number.parseFloat(price) - 0.002).toFixed(3)} ETH</span>
            </div>
          )}

          <Separator />

          <div className="flex justify-between items-center">
            <span className="font-semibold">Precio total:</span>
            <span className="font-bold text-lg text-blue-600">{price} ETH</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
