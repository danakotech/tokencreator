import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Obtener parámetros de la query
    const module = searchParams.get("module")
    const action = searchParams.get("action")
    const address = searchParams.get("address")
    const startblock = searchParams.get("startblock")
    const endblock = searchParams.get("endblock")
    const page = searchParams.get("page")
    const offset = searchParams.get("offset")
    const sort = searchParams.get("sort")
    const apikey = searchParams.get("apikey")
    const network = searchParams.get("network") || "sepolia"

    // Validar parámetros requeridos
    if (!module || !action || !address || !apikey) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Determinar la URL base según la red
    let baseUrl = "https://api.etherscan.io/api"
    if (network === "sepolia") {
      baseUrl = "https://api-sepolia.etherscan.io/api"
    } else if (network === "polygon") {
      baseUrl = "https://api.polygonscan.com/api"
    }

    // Construir la URL de la API
    const apiUrl = new URL(baseUrl)
    apiUrl.searchParams.set("module", module)
    apiUrl.searchParams.set("action", action)
    apiUrl.searchParams.set("address", address)
    apiUrl.searchParams.set("startblock", startblock || "0")
    apiUrl.searchParams.set("endblock", endblock || "99999999")
    apiUrl.searchParams.set("page", page || "1")
    apiUrl.searchParams.set("offset", offset || "10")
    apiUrl.searchParams.set("sort", sort || "desc")
    apiUrl.searchParams.set("apikey", apikey)

    console.log("Fetching from:", apiUrl.toString())

    // Hacer la petición a la API de Etherscan
    const response = await fetch(apiUrl.toString(), {
      method: "GET",
      headers: {
        "User-Agent": "TokenCreator/1.0",
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      console.error("Etherscan API error:", response.status, response.statusText)
      return NextResponse.json({ error: `Etherscan API error: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()

    // Log para debugging
    console.log("Etherscan API response status:", data.status)
    console.log("Etherscan API response message:", data.message)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Proxy error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
