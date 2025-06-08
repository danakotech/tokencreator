import { createClient } from "@supabase/supabase-js"
import type { CreatedToken } from "@/types/token"

// Inicializar cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Crear cliente singleton para el lado del cliente
let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!supabaseClient && typeof window !== "undefined") {
    supabaseClient = createClient(supabaseUrl, supabaseKey)
  }
  return supabaseClient
}

export async function saveTokenToDatabase(token: CreatedToken) {
  const supabase = getSupabaseClient()

  if (!supabase) {
    console.error("Supabase client not initialized")
    return null
  }

  try {
    const { data, error } = await supabase
      .from("tokens")
      .insert([
        {
          address: token.address,
          transaction_hash: token.transactionHash,
          blockchain: token.blockchain,
          name: token.name,
          symbol: token.symbol,
          total_supply: token.totalSupply,
          decimals: token.decimals,
          features: token.features,
          user_tokens: token.userTokens,
          platform_fee: token.platformFee,
          created_by: token.createdBy,
        },
      ])
      .select()

    if (error) {
      console.error("Error saving token to database:", error)
      return null
    }

    return data?.[0] || null
  } catch (err) {
    console.error("Exception saving token to database:", err)
    return null
  }
}

export async function getUserTokens(userAddress: string) {
  const supabase = getSupabaseClient()

  if (!supabase) {
    console.error("Supabase client not initialized")
    return []
  }

  try {
    const { data, error } = await supabase
      .from("tokens")
      .select("*")
      .eq("created_by", userAddress)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching user tokens:", error)
      return []
    }

    return data || []
  } catch (err) {
    console.error("Exception fetching user tokens:", err)
    return []
  }
}

export async function getAllTokens(): Promise<CreatedToken[]> {
  const supabase = getSupabaseClient()

  if (!supabase) {
    console.error("Supabase client not initialized")
    return []
  }

  try {
    const { data, error } = await supabase.from("tokens").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching all tokens:", error)
      return []
    }

    return (
      data?.map((token) => ({
        address: token.address,
        transactionHash: token.transaction_hash,
        blockchain: token.blockchain,
        name: token.name,
        symbol: token.symbol,
        totalSupply: token.total_supply,
        decimals: token.decimals,
        features: token.features,
        userTokens: token.user_tokens,
        platformFee: token.platform_fee,
        createdAt: token.created_at,
        createdBy: token.created_by,
      })) || []
    )
  } catch (err) {
    console.error("Exception fetching all tokens:", err)
    return []
  }
}

export async function getTokenByAddress(address: string): Promise<CreatedToken | null> {
  const supabase = getSupabaseClient()

  if (!supabase) {
    console.error("Supabase client not initialized")
    return null
  }

  try {
    const { data, error } = await supabase.from("tokens").select("*").eq("address", address).single()

    if (error) {
      console.error("Error fetching token by address:", error)
      return null
    }

    if (!data) return null

    return {
      address: data.address,
      transactionHash: data.transaction_hash,
      blockchain: data.blockchain,
      name: data.name,
      symbol: data.symbol,
      totalSupply: data.total_supply,
      decimals: data.decimals,
      features: data.features,
      userTokens: data.user_tokens,
      platformFee: data.platform_fee,
      createdAt: data.created_at,
      createdBy: data.created_by,
    }
  } catch (err) {
    console.error("Exception fetching token by address:", err)
    return null
  }
}
