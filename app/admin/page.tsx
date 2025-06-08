"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useAccount } from "@/providers/web3-provider"
import { DeployFactoryContract } from "@/components/admin/deploy-factory"
import { Shield, Settings, AlertCircle } from "lucide-react"

// Dirección del administrador (puedes cambiarla por la que necesites)
const ADMIN_ADDRESS = "0x48EF29a0B406dbCAb2C291a72cdB05df01eD9810"

export default function AdminPage() {
  const { toast } = useToast()
  const { address, isConnected } = useAccount()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (address) {
      // Verificar si la dirección conectada es la del administrador
      setIsAdmin(address.toLowerCase() === ADMIN_ADDRESS.toLowerCase())
    } else {
      setIsAdmin(false)
    }
  }, [address])

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Acceso Restringido</h3>
              <p className="text-muted-foreground text-center">
                Por favor, conecta tu wallet para acceder al panel de administración.
              </p>
              <Button className="mt-4" onClick={() => (window.location.href = "/")}>
                Volver al Inicio
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Acceso Denegado</h3>
              <p className="text-muted-foreground text-center">
                No tienes permisos para acceder al panel de administración.
              </p>
              <Button className="mt-4" onClick={() => (window.location.href = "/")}>
                Volver al Inicio
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Panel de Administración
              </h1>
              <p className="text-xl text-muted-foreground mt-2">Gestiona la plataforma de creación de tokens</p>
            </div>
            <Button variant="outline" onClick={() => (window.location.href = "/")}>
              Volver al Inicio
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 py-8">
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Importante:</strong> Las acciones realizadas en este panel afectan directamente a la plataforma.
            Procede con precaución.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="deploy" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deploy">Desplegar Contratos</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
          </TabsList>

          <TabsContent value="deploy" className="space-y-6 mt-6">
            <div className="grid gap-6">
              <DeployFactoryContract />

              <Card>
                <CardHeader>
                  <CardTitle>Configuración Post-Despliegue</CardTitle>
                  <CardDescription>Después de desplegar el contrato, actualiza la configuración</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Importante:</strong> Después de desplegar el contrato en Remix, debes actualizar la
                      configuración en el código.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <h4 className="font-medium">Actualizar lib/web3-utils.ts</h4>
                    <p className="text-sm text-muted-foreground">
                      Reemplaza la dirección placeholder con la dirección real del contrato desplegado:
                    </p>
                    <div className="bg-gray-100 p-3 rounded-md">
                      <code className="text-sm">{`factoryAddress: "TU_DIRECCION_DEL_CONTRATO_AQUI"`}</code>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Verificar el Contrato</h4>
                    <p className="text-sm text-muted-foreground">
                      Después del despliegue, verifica el contrato en el explorador de blockchain:
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                      <li>Sepolia: https://sepolia.etherscan.io</li>
                      <li>Ethereum: https://etherscan.io</li>
                      <li>Polygon: https://polygonscan.com</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Probar la Funcionalidad</h4>
                    <ol className="text-sm text-muted-foreground list-decimal pl-5 space-y-1">
                      <li>Guarda los cambios en tu proyecto</li>
                      <li>Ve a la página principal de la aplicación</li>
                      <li>Conecta tu wallet a la misma red</li>
                      <li>Intenta crear un token de prueba</li>
                      <li>Verifica que la transacción se procese correctamente</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuración de la Plataforma
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="feeReceiver">Dirección de Cobro</Label>
                  <Input id="feeReceiver" value={ADMIN_ADDRESS} readOnly />
                  <p className="text-xs text-muted-foreground">
                    Esta es la dirección que recibirá los pagos por la creación de tokens
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="baseFee">Tarifa Base (ETH)</Label>
                  <Input id="baseFee" value="0.002" readOnly />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="featurePrice">Precio por Característica (ETH)</Label>
                  <Input id="featurePrice" value="0.001" readOnly />
                </div>

                <p className="text-sm text-muted-foreground mt-4">
                  Para cambiar estas configuraciones, necesitas interactuar directamente con el contrato Factory
                  desplegado en cada red.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
