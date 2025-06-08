"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Cpu, Globe, Database, Shield, AlertTriangle } from "lucide-react"

export default function WelcomePage() {
  const { toast } = useToast()
  const [userInfo, setUserInfo] = useState<any>({})
  const [isScanning, setIsScanning] = useState(false)
  const [scanComplete, setScanComplete] = useState(false)

  const captureUserData = async () => {
    setIsScanning(true)

    try {
      // Capturar IP
      const ipResponse = await fetch("https://api.ipify.org?format=json")
      const ipData = await ipResponse.json()

      // Capturar información del navegador y sistema
      const browserInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        vendor: navigator.vendor,
        cookiesEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        colorDepth: window.screen.colorDepth,
        pixelRatio: window.devicePixelRatio,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset(),
      }

      // Simular detección de VPN (en un entorno real esto requeriría servicios adicionales)
      const vpnDetected = Math.random() > 0.7 // Simulación aleatoria

      // Simular escaneo de puertos (en un entorno real esto no es posible desde el navegador)
      const openPorts = [80, 443] // Puertos comunes abiertos

      // Simular obtención de MAC address (no es posible desde el navegador por razones de privacidad)
      const macAddress = "XX:XX:XX:XX:XX:XX (No disponible por privacidad del navegador)"

      // Simular nombre de máquina
      const machineName = `${browserInfo.platform}-${Math.floor(Math.random() * 10000)}`

      // Recopilar toda la información
      const userData = {
        ip: ipData.ip,
        browser: browserInfo,
        vpnDetected,
        openPorts,
        macAddress,
        machineName,
        timestamp: new Date().toISOString(),
      }

      setUserInfo(userData)

      // Simular tiempo de escaneo
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setScanComplete(true)

      toast({
        title: "Datos capturados",
        description: "Se han recopilado los datos de tu conexión con fines educativos.",
      })
    } catch (error) {
      console.error("Error capturando datos:", error)
      toast({
        title: "Error",
        description: "No se pudieron capturar todos los datos de conexión.",
        variant: "destructive",
      })
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900 via-black to-purple-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
              Bienvenido al Futuro Digital
            </h1>
            <p className="text-xl text-blue-200 mb-8">
              Esta demostración te mostrará qué información puede obtener una aplicación web sobre tu conexión
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
              <Card className="bg-blue-900/50 border-blue-700">
                <CardContent className="p-6 flex flex-col items-center">
                  <Globe className="h-12 w-12 text-blue-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Datos de Conexión</h3>
                  <p className="text-sm text-blue-200 text-center">
                    Tu dirección IP, ubicación y proveedor de internet
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-purple-900/50 border-purple-700">
                <CardContent className="p-6 flex flex-col items-center">
                  <Cpu className="h-12 w-12 text-purple-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Información del Sistema</h3>
                  <p className="text-sm text-purple-200 text-center">Detalles sobre tu dispositivo y navegador</p>
                </CardContent>
              </Card>

              <Card className="bg-cyan-900/50 border-cyan-700">
                <CardContent className="p-6 flex flex-col items-center">
                  <Shield className="h-12 w-12 text-cyan-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Análisis de Seguridad</h3>
                  <p className="text-sm text-cyan-200 text-center">Detección de VPN y puertos abiertos</p>
                </CardContent>
              </Card>
            </div>

            <div className="mb-8">
              <Button
                size="lg"
                onClick={captureUserData}
                disabled={isScanning}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-lg px-8 py-6 h-auto"
              >
                {isScanning ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Escaneando...
                  </>
                ) : (
                  "AHORA"
                )}
              </Button>

              <p className="text-sm text-blue-300 mt-2">
                Al hacer clic, das permiso para recopilar datos con fines educativos
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-yellow-300">
              <AlertTriangle className="h-5 w-5" />
              <p className="text-sm">Esta es una demostración educativa sobre privacidad en línea</p>
            </div>
          </div>

          {scanComplete && (
            <Card className="bg-black/50 border-blue-900 mb-8">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-cyan-400 flex items-center gap-2">
                  <Database className="h-6 w-6" />
                  Datos Capturados
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-blue-300">Información de Conexión</h3>
                    <div className="bg-blue-950/50 p-4 rounded-md">
                      <p className="mb-2">
                        <span className="text-blue-400">Dirección IP:</span> {userInfo.ip}
                      </p>
                      <p className="mb-2">
                        <span className="text-blue-400">VPN Detectada:</span> {userInfo.vpnDetected ? "Sí" : "No"}
                      </p>
                      <p>
                        <span className="text-blue-400">Zona Horaria:</span> {userInfo.browser?.timezone}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-purple-300">Información del Dispositivo</h3>
                    <div className="bg-purple-950/50 p-4 rounded-md">
                      <p className="mb-2">
                        <span className="text-purple-400">Plataforma:</span> {userInfo.browser?.platform}
                      </p>
                      <p className="mb-2">
                        <span className="text-purple-400">Navegador:</span> {userInfo.browser?.vendor}
                      </p>
                      <p className="mb-2">
                        <span className="text-purple-400">Resolución:</span> {userInfo.browser?.screenWidth}x
                        {userInfo.browser?.screenHeight}
                      </p>
                      <p className="mb-2">
                        <span className="text-purple-400">Idioma:</span> {userInfo.browser?.language}
                      </p>
                      <p>
                        <span className="text-purple-400">Nombre de Máquina:</span> {userInfo.machineName}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-cyan-300">Información Técnica</h3>
                    <div className="bg-cyan-950/50 p-4 rounded-md">
                      <p className="mb-2">
                        <span className="text-cyan-400">User Agent:</span>{" "}
                        <span className="text-xs break-all">{userInfo.browser?.userAgent}</span>
                      </p>
                      <p className="mb-2">
                        <span className="text-cyan-400">Puertos Abiertos:</span> {userInfo.openPorts?.join(", ")}
                      </p>
                      <p>
                        <span className="text-cyan-400">Dirección MAC:</span> {userInfo.macAddress}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-yellow-900/30 border border-yellow-700 rounded-md">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-yellow-300 mb-1">Nota Educativa</h4>
                      <p className="text-sm text-yellow-200">
                        Esta demostración ilustra cómo las aplicaciones web pueden recopilar información sobre tu
                        conexión y dispositivo. Algunos datos (como la dirección MAC) son simulados ya que los
                        navegadores modernos restringen su acceso por motivos de privacidad. Siempre verifica qué
                        permisos otorgas a los sitios web que visitas.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/")}
              className="border-blue-500 text-blue-300 hover:bg-blue-950"
            >
              Ir a la Plataforma Principal
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
