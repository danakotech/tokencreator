import type { TokenConfig } from "@/types/token"

// Precio base para crear un token: 0.002 ETH
const BASE_PRICE = 0.002

// Precio por característica adicional: 0.001 ETH
const FEATURE_PRICE = 0.001

export function calculatePrice(config: TokenConfig): string {
  // Contar características activas (excepto ownership que viene por defecto)
  const activeFeatures = Object.entries(config.features).filter(([key, value]) => value && key !== "ownership").length

  // Calcular precio total
  const totalPrice = BASE_PRICE + activeFeatures * FEATURE_PRICE

  // Devolver como string con 3 decimales
  return totalPrice.toFixed(3)
}
