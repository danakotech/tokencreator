# Instrucciones de Despliegue - TokenFactory

## Opción 1: Despliegue Manual con Remix

### Paso 1: Preparar los contratos
1. Ve a [Remix IDE](https://remix.ethereum.org)
2. Crea un nuevo archivo `TokenFactory.sol`
3. Copia el código del contrato TokenFactory desde `contracts/TokenFactory.sol`
4. Crea otro archivo `CustomToken.sol` con el código de `contracts/CustomToken.sol`

### Paso 2: Compilar
1. En Remix, ve a la pestaña "Solidity Compiler"
2. Selecciona la versión 0.8.19
3. Compila ambos contratos

### Paso 3: Desplegar TokenFactory
1. Ve a la pestaña "Deploy & Run Transactions"
2. Conecta tu MetaMask
3. Selecciona la red deseada (Sepolia, Ethereum, Polygon)
4. En el campo constructor, ingresa: `0x48EF29a0B406dbCAb2C291a72cdB05df01eD9810`
5. Haz clic en "Deploy"
6. Confirma la transacción en MetaMask

### Paso 4: Verificar el contrato
1. Copia la dirección del contrato desplegado
2. Ve al explorador de la red correspondiente:
   - Sepolia: https://sepolia.etherscan.io
   - Ethereum: https://etherscan.io
   - Polygon: https://polygonscan.com
3. Busca tu contrato y verifica el código fuente

### Paso 5: Actualizar la configuración
1. En tu proyecto, abre `lib/web3-utils.ts`
2. Actualiza la dirección del factory en la red correspondiente:

\`\`\`typescript
export const networks: Record<string, NetworkConfig> = {
  sepolia: {
    // ... otras configuraciones
    factoryAddress: "TU_DIRECCION_DEL_CONTRATO_AQUI",
  },
  // ... otras redes
}
\`\`\`

## Opción 2: Usando Hardhat (Recomendado para producción)

### Paso 1: Instalar Hardhat
\`\`\`bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
\`\`\`

### Paso 2: Configurar hardhat.config.js
\`\`\`javascript
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.19",
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [process.env.PRIVATE_KEY]
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [process.env.PRIVATE_KEY]
    },
    polygon: {
      url: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
\`\`\`

### Paso 3: Crear script de despliegue
\`\`\`javascript
// scripts/deploy.js
async function main() {
  const TokenFactory = await ethers.getContractFactory("TokenFactory");
  const factory = await TokenFactory.deploy("0x48EF29a0B406dbCAb2C291a72cdB05df01eD9810");
  
  await factory.deployed();
  
  console.log("TokenFactory deployed to:", factory.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
\`\`\`

### Paso 4: Desplegar
\`\`\`bash
# Sepolia
npx hardhat run scripts/deploy.js --network sepolia

# Ethereum Mainnet
npx hardhat run scripts/deploy.js --network mainnet

# Polygon
npx hardhat run scripts/deploy.js --network polygon
\`\`\`

## Direcciones de Factory Desplegadas

Una vez desplegados, actualiza estas direcciones en `lib/web3-utils.ts`:

\`\`\`typescript
sepolia: {
  factoryAddress: "0x...", // Tu dirección de Sepolia
},
ethereum: {
  factoryAddress: "0x...", // Tu dirección de Ethereum
},
polygon: {
  factoryAddress: "0x...", // Tu dirección de Polygon
}
\`\`\`

## Verificación de Contratos

Para verificar los contratos en los exploradores:

### Etherscan/Polygonscan
1. Ve al explorador correspondiente
2. Busca tu contrato
3. Ve a la pestaña "Contract"
4. Haz clic en "Verify and Publish"
5. Selecciona "Solidity (Single file)"
6. Pega el código del contrato
7. Configura la versión del compilador (0.8.19)
8. Envía para verificación

## Notas Importantes

1. **Gas Fees**: Asegúrate de tener suficiente ETH/MATIC para el gas
2. **Testnet First**: Siempre prueba primero en Sepolia
3. **Backup**: Guarda las direcciones de los contratos desplegados
4. **Security**: Nunca compartas tu clave privada
5. **Verification**: Siempre verifica los contratos después del despliegue

## Solución de Problemas

### Error "missing revert data"
- Verifica que tengas suficiente gas
- Asegúrate de estar en la red correcta
- Verifica que el bytecode sea válido

### Error "insufficient funds"
- Necesitas más ETH/MATIC para el gas
- En Sepolia, usa un faucet para obtener ETH de prueba

### Error de red
- Verifica tu conexión a internet
- Asegúrate de que Infura esté funcionando
- Verifica tu Project ID de Infura
\`\`\`

\`\`\`typescriptreact file="app/admin/page.tsx"
[v0-no-op-code-block-prefix]"use client"

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
import { Shield, Settings, AlertCircle } from 'lucide-react'

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
            <div className="grid md:grid-cols-2 gap-6">
              <DeployFactoryContract />

              <Card>
                <CardHeader>
                  <CardTitle>Instrucciones de Despliegue</CardTitle>
                  <CardDescription>Pasos para configurar correctamente los contratos en la plataforma</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Importante:</strong> Si el despliegue automático falla, usa Remix IDE para desplegar manualmente.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Opción 1: Despliegue Automático</h4>
                    <ol className="list-decimal pl-5 space-y-2 text-sm">
                      <li>Asegúrate de tener suficiente ETH para gas (mínimo 0.01 ETH)</li>
                      <li>Conecta tu wallet a la red deseada</li>
                      <li>Haz clic en "Desplegar Contrato Factory"</li>
                      <li>Confirma la transacción en MetaMask</li>
                      <li>Copia la dirección del contrato desplegado</li>
                    </ol>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Opción 2: Despliegue Manual con Remix</h4>
                    <ol className="list-decimal pl-5 space-y-2 text-sm">
                      <li>Ve a <a href="https://remix.ethereum.org" target="_blank" className="text-blue-600 underline">Remix IDE</a></li>
                      <li>Crea un archivo TokenFactory.sol con el código del contrato</li>
                      <li>Compila con Solidity 0.8.19</li>
                      <li>Despliega con el parámetro: <code className="bg-gray-100 px-1 rounded">0x48EF29a0B406dbCAb2C291a72cdB05df01eD9810</code></li>
                      <li>Copia la dirección del contrato desplegado</li>
                    </ol>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Paso Final</h4>
                    <p className="text-sm">
                      Actualiza la configuración en <code className="bg-gray-100 px-1 rounded">lib/web3-utils.ts</code> con las direcciones de los contratos desplegados.
                    </p>
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
