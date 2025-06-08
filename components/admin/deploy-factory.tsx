"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { ExternalLink, Copy, CheckCircle, AlertCircle, Code, Rocket } from "lucide-react"

export function DeployFactoryContract() {
  const { toast } = useToast()
  const [copiedStep, setCopiedStep] = useState<string | null>(null)
  const [deployedAddress, setDeployedAddress] = useState("")

  const copyToClipboard = (text: string, stepId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedStep(stepId)
    setTimeout(() => setCopiedStep(null), 2000)
    toast({
      title: "Copiado",
      description: "Texto copiado al portapapeles",
    })
  }

  const contractCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleTokenFactory {
    address public owner;
    address public feeReceiver;
    uint256 public baseFee = 0.002 ether;
    uint256 public featurePrice = 0.001 ether;
    
    address[] public deployedTokens;
    mapping(address => address[]) public userTokens;
    
    event TokenCreated(
        address indexed tokenAddress,
        address indexed creator,
        string name,
        string symbol,
        uint256 totalSupply,
        uint256 paidAmount
    );
    
    constructor(address _feeReceiver) {
        owner = msg.sender;
        feeReceiver = _feeReceiver;
    }
    
    function createToken(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        uint8 decimals,
        bool[] memory features
    ) external payable returns (address) {
        uint256 price = calculatePrice(features);
        require(msg.value >= price, "Insufficient payment");
        
        address mockTokenAddress = address(uint160(uint256(keccak256(
            abi.encodePacked(name, symbol, totalSupply, block.timestamp, msg.sender)
        ))));
        
        deployedTokens.push(mockTokenAddress);
        userTokens[msg.sender].push(mockTokenAddress);
        
        (bool sent, ) = feeReceiver.call{value: msg.value}("");
        require(sent, "Failed to send payment");
        
        emit TokenCreated(mockTokenAddress, msg.sender, name, symbol, totalSupply, msg.value);
        return mockTokenAddress;
    }
    
    function calculatePrice(bool[] memory features) public view returns (uint256) {
        uint256 price = baseFee;
        for (uint i = 0; i < features.length; i++) {
            if (features[i]) {
                price += featurePrice;
            }
        }
        return price;
    }
    
    function getDeployedTokens() external view returns (address[] memory) {
        return deployedTokens;
    }
    
    function getUserTokens(address user) external view returns (address[] memory) {
        return userTokens[user];
    }
    
    function updateFeeReceiver(address _feeReceiver) external {
        require(msg.sender == owner, "Only owner");
        feeReceiver = _feeReceiver;
    }
    
    function updatePrices(uint256 _baseFee, uint256 _featurePrice) external {
        require(msg.sender == owner, "Only owner");
        baseFee = _baseFee;
        featurePrice = _featurePrice;
    }
    
    function transferOwnership(address newOwner) external {
        require(msg.sender == owner, "Only owner");
        owner = newOwner;
    }
}`

  const feeReceiverAddress = "0x48EF29a0B406dbCAb2C291a72cdB05df01eD9810"

  const steps = [
    {
      id: "remix",
      title: "1. Abrir Remix IDE",
      description: "Abre el IDE de desarrollo de Solidity en tu navegador",
      action: (
        <Button onClick={() => window.open("https://remix.ethereum.org", "_blank")} className="w-full">
          <ExternalLink className="h-4 w-4 mr-2" />
          Abrir Remix IDE
        </Button>
      ),
    },
    {
      id: "create-file",
      title: "2. Crear archivo del contrato",
      description: "Crea un nuevo archivo llamado SimpleTokenFactory.sol",
      action: (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Nombre del archivo:</p>
          <div className="flex gap-2">
            <Input value="SimpleTokenFactory.sol" readOnly />
            <Button variant="outline" size="sm" onClick={() => copyToClipboard("SimpleTokenFactory.sol", "filename")}>
              {copiedStep === "filename" ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      ),
    },
    {
      id: "copy-code",
      title: "3. Copiar código del contrato",
      description: "Copia y pega el código del contrato en el archivo",
      action: (
        <div className="space-y-2">
          <Button onClick={() => copyToClipboard(contractCode, "contract")} className="w-full" variant="outline">
            {copiedStep === "contract" ? <CheckCircle className="h-4 w-4 mr-2" /> : <Code className="h-4 w-4 mr-2" />}
            Copiar código del contrato
          </Button>
        </div>
      ),
    },
    {
      id: "compile",
      title: "4. Compilar el contrato",
      description: "Ve a la pestaña 'Solidity Compiler' y compila con versión 0.8.19",
      action: (
        <div className="space-y-2">
          <Badge variant="secondary">Versión del compilador: 0.8.19</Badge>
          <p className="text-sm text-muted-foreground">
            Asegúrate de que no haya errores de compilación (debe aparecer un check verde)
          </p>
        </div>
      ),
    },
    {
      id: "deploy",
      title: "5. Desplegar el contrato",
      description: "Ve a 'Deploy & Run Transactions' y despliega con la dirección del fee receiver",
      action: (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Parámetro del constructor (fee receiver):</p>
          <div className="flex gap-2">
            <Input value={feeReceiverAddress} readOnly className="font-mono text-sm" />
            <Button variant="outline" size="sm" onClick={() => copyToClipboard(feeReceiverAddress, "fee-receiver")}>
              {copiedStep === "fee-receiver" ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Asegúrate de estar conectado a la red correcta (Sepolia, Ethereum, o Polygon) antes de desplegar.
            </AlertDescription>
          </Alert>
        </div>
      ),
    },
    {
      id: "update-config",
      title: "6. Actualizar configuración",
      description: "Copia la dirección del contrato desplegado y actualiza la configuración",
      action: (
        <div className="space-y-2">
          <Label htmlFor="deployed-address">Dirección del contrato desplegado:</Label>
          <div className="flex gap-2">
            <Input
              id="deployed-address"
              placeholder="0x..."
              value={deployedAddress}
              onChange={(e) => setDeployedAddress(e.target.value)}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(deployedAddress, "deployed-address")}
              disabled={!deployedAddress}
            >
              {copiedStep === "deployed-address" ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Actualiza esta dirección en lib/web3-utils.ts en la red correspondiente
          </p>
        </div>
      ),
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-5 w-5" />
          Desplegar Contrato Factory
        </CardTitle>
        <CardDescription>Sigue estos pasos para desplegar el contrato factory usando Remix IDE</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="guide" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="guide">Guía Paso a Paso</TabsTrigger>
            <TabsTrigger value="troubleshooting">Solución de Problemas</TabsTrigger>
          </TabsList>

          <TabsContent value="guide" className="space-y-6 mt-6">
            {steps.map((step, index) => (
              <div key={step.id} className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 space-y-2">
                    <h4 className="font-medium">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                    {step.action}
                  </div>
                </div>
                {index < steps.length - 1 && <Separator />}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="troubleshooting" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Error: "Gas estimation failed"</h4>
                <p className="text-sm text-muted-foreground mb-2">Si aparece este error durante el despliegue:</p>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  <li>Aumenta el gas limit manualmente a 3,000,000</li>
                  <li>Verifica que tengas suficiente ETH para el gas</li>
                  <li>Asegúrate de estar en la red correcta</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Error: "Insufficient funds"</h4>
                <p className="text-sm text-muted-foreground mb-2">Necesitas más ETH/MATIC para pagar el gas:</p>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  <li>En Sepolia, usa un faucet para obtener ETH de prueba</li>
                  <li>En mainnet, asegúrate de tener al menos 0.01 ETH</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Faucets para Testnet</h4>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open("https://sepoliafaucet.com/", "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Sepolia Faucet
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open("https://www.alchemy.com/faucets/ethereum-sepolia", "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Alchemy Sepolia Faucet
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">El contrato se desplegó pero no funciona</h4>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  <li>Verifica que hayas actualizado la dirección en lib/web3-utils.ts</li>
                  <li>Asegúrate de estar en la misma red donde desplegaste</li>
                  <li>Verifica que la dirección del contrato sea correcta</li>
                  <li>Haz una prueba creando un token después de la configuración</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
