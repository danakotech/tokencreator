# Guía de Despliegue con Remix IDE

## Paso a Paso para Desplegar el Contrato Factory

### 1. Abrir Remix IDE
- Ve a [https://remix.ethereum.org](https://remix.ethereum.org)
- Espera a que cargue completamente

### 2. Crear el Archivo del Contrato
1. En el explorador de archivos (izquierda), haz clic en el ícono "+"
2. Nombra el archivo: `SimpleTokenFactory.sol`
3. Copia y pega el código del contrato SimpleTokenFactory

### 3. Compilar el Contrato
1. Ve a la pestaña "Solidity Compiler" (ícono de Solidity)
2. Selecciona la versión del compilador: `0.8.19`
3. Haz clic en "Compile SimpleTokenFactory.sol"
4. Verifica que no haya errores (debe aparecer un check verde)

### 4. Conectar MetaMask
1. Ve a la pestaña "Deploy & Run Transactions"
2. En "Environment", selecciona "Injected Provider - MetaMask"
3. Conecta tu wallet cuando aparezca el popup
4. Verifica que estés en la red correcta (Sepolia, Ethereum, o Polygon)

### 5. Configurar el Despliegue
1. En "Contract", asegúrate de que esté seleccionado "SimpleTokenFactory"
2. En el campo junto al botón "Deploy", ingresa:
   \`\`\`
   0x48EF29a0B406dbCAb2C291a72cdB05df01eD9810
   \`\`\`
   (Esta es la dirección que recibirá los pagos)

### 6. Desplegar el Contrato
1. Haz clic en el botón "Deploy" (naranja)
2. Confirma la transacción en MetaMask
3. Espera a que se mine la transacción

### 7. Verificar el Despliegue
1. Una vez desplegado, verás el contrato en "Deployed Contracts"
2. Copia la dirección del contrato (aparece junto al nombre)
3. Guarda esta dirección - la necesitarás para la configuración

### 8. Verificar en el Explorer
1. Ve al explorador de blockchain correspondiente:
   - Sepolia: https://sepolia.etherscan.io
   - Ethereum: https://etherscan.io
   - Polygon: https://polygonscan.com
2. Busca tu dirección de contrato
3. Verifica que la transacción fue exitosa

### 9. Actualizar la Configuración
1. En tu proyecto, abre `lib/web3-utils.ts`
2. Encuentra la sección de networks
3. Actualiza la `factoryAddress` para la red correspondiente:

\`\`\`typescript
export const networks: Record<string, NetworkConfig> = {
  sepolia: {
    // ... otras configuraciones
    factoryAddress: "TU_DIRECCION_DEL_CONTRATO_AQUI",
  },
  ethereum: {
    // ... otras configuraciones  
    factoryAddress: "TU_DIRECCION_DEL_CONTRATO_AQUI",
  },
  polygon: {
    // ... otras configuraciones
    factoryAddress: "TU_DIRECCION_DEL_CONTRATO_AQUI", 
  },
}
\`\`\`

### 10. Probar la Funcionalidad
1. Guarda los cambios en tu proyecto
2. Ve a la página principal de la aplicación
3. Intenta crear un token de prueba
4. Verifica que la transacción se procese correctamente

## Solución de Problemas

### Error: "Gas estimation failed"
- Aumenta el gas limit manualmente a 3,000,000
- Verifica que tengas suficiente ETH para el gas

### Error: "Execution reverted"
- Verifica que la dirección del fee receiver sea válida
- Asegúrate de que el código del contrato esté completo

### Error: "Insufficient funds"
- Necesitas más ETH/MATIC para pagar el gas
- En Sepolia, usa un faucet para obtener ETH de prueba

### El contrato se desplegó pero no funciona
- Verifica que hayas actualizado la dirección en `lib/web3-utils.ts`
- Asegúrate de estar en la misma red donde desplegaste el contrato
- Verifica que la dirección del contrato sea correcta

## Direcciones de Faucets para Testnet

### Sepolia ETH Faucets:
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia
- https://faucet.quicknode.com/ethereum/sepolia

### Polygon Mumbai Faucets (si usas Mumbai):
- https://faucet.polygon.technology/

## Notas Importantes

1. **Siempre prueba primero en Sepolia** antes de desplegar en mainnet
2. **Guarda la dirección del contrato** en un lugar seguro
3. **Verifica el contrato** en el explorador después del despliegue
4. **Haz una prueba** creando un token después de la configuración
5. **Ten paciencia** - las transacciones pueden tardar varios minutos en minarse
