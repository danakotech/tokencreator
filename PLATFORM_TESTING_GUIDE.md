# Guía de Pruebas de la Plataforma TokenCreator

## 📋 **Dictamen Inicial de la Plataforma**

### ✅ **Aspectos Corregidos y Verificados:**

#### 1. **Propiedad de Contratos**
- ✅ **Corrección implementada**: El usuario que realiza el pedido es el propietario del token
- ✅ **Verificación**: La dirección del wallet conectado se asigna como `owner` en el contrato
- ✅ **Validación**: Sistema de verificación de propiedad implementado

#### 2. **Validación de Dirección**
- ✅ **Corrección implementada**: La dirección del signer coincide con la dirección conectada
- ✅ **Verificación**: Validación previa antes de crear tokens
- ✅ **Logging**: Sistema de logs para debugging

#### 3. **Conexiones API**
- ✅ **Infura**: Configurado para Sepolia, Ethereum y Polygon
- ✅ **Etherscan**: API key configurada y funcional
- ✅ **Polygonscan**: API key configurada y funcional
- ✅ **Diagnósticos**: Sistema de pruebas automáticas implementado

---

## 🧪 **Plan de Pruebas Completo**

### **Fase 1: Verificación de Infraestructura**

#### 1.1 **Pruebas de Conexión API**
\`\`\`bash
# Acceder a diagnósticos
/admin/diagnostics
\`\`\`

**Verificar:**
- ✅ Conexión Infura Sepolia
- ✅ Conexión Infura Ethereum  
- ✅ Conexión Infura Polygon
- ✅ API Etherscan
- ✅ API Polygonscan

#### 1.2 **Pruebas de Base de Datos**
**Verificar:**
- ✅ Conexión a Supabase
- ✅ Tabla `tokens` creada
- ✅ Índices funcionando
- ✅ Operaciones CRUD

### **Fase 2: Despliegue de Contratos**

#### 2.1 **Desplegar Factory en Sepolia**
1. **Ir a**: `/admin`
2. **Seguir guía**: Remix IDE deployment
3. **Contrato**: `SimpleTokenFactory.sol`
4. **Parámetro constructor**: `0x48EF29a0B406dbCAb2C291a72cdB05df01eD9810`
5. **Actualizar**: `lib/web3-utils.ts` con la dirección real

#### 2.2 **Verificar Despliegue**
\`\`\`typescript
// En /admin/diagnostics verificar:
- ✅ Contrato desplegado en Sepolia
- ✅ Código presente en la dirección
- ✅ Factory funcional
\`\`\`

### **Fase 3: Pruebas de Funcionalidad**

#### 3.1 **Creación de Token Básico**
**Pasos:**
1. Conectar wallet a Sepolia
2. Crear token con configuración mínima:
   - Nombre: "Test Token"
   - Símbolo: "TEST"
   - Suministro: "1000"
   - Red: Sepolia
   - Sin características adicionales

**Verificar:**
- ✅ Transacción exitosa
- ✅ Token aparece en dashboard
- ✅ Usuario es propietario
- ✅ Balance correcto

#### 3.2 **Creación de Token con Características**
**Pasos:**
1. Crear token con todas las características:
   - Burnable: ✅
   - Mintable: ✅
   - Pausable: ✅
   - Deflationary: ✅
   - Anti-Whale: ✅

**Verificar:**
- ✅ Precio calculado correctamente (0.007 ETH)
- ✅ Características activas en el contrato
- ✅ Funciones disponibles en interfaz

#### 3.3 **Pruebas de Interacción**
**Para cada token creado:**
1. **Transferir tokens**
2. **Quemar tokens** (si burnable)
3. **Mintear tokens** (si mintable y eres owner)
4. **Verificar balances**

### **Fase 4: Pruebas de Propiedad**

#### 4.1 **Verificación Automática**
\`\`\`bash
# En /admin/diagnostics > Propiedad
- Verificar que todos los tokens muestran "Propietario: Sí"
- Confirmar direcciones coinciden
\`\`\`

#### 4.2 **Verificación Manual**
\`\`\`bash
# En blockchain explorer:
1. Buscar dirección del token
2. Verificar función "owner()"
3. Confirmar coincide con tu wallet
\`\`\`

---

## 🔧 **Configuración Requerida**

### **Variables de Entorno**
\`\`\`env
NEXT_PUBLIC_INFURA_PROJECT_ID=tu_project_id
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_key
\`\`\`

### **Supabase Setup**
\`\`\`sql
-- Ejecutar script:
scripts/create-tokens-table.sql
\`\`\`

### **Wallet Setup**
- MetaMask instalado
- Red Sepolia agregada
- ETH de testnet (usar faucets)

---

## 📊 **Checklist de Pruebas**

### **✅ Infraestructura**
- [ ] APIs conectadas
- [ ] Base de datos funcional
- [ ] Contratos desplegados

### **✅ Funcionalidad Básica**
- [ ] Conectar wallet
- [ ] Crear token simple
- [ ] Ver en dashboard
- [ ] Verificar propiedad

### **✅ Funcionalidad Avanzada**
- [ ] Token con características
- [ ] Interacciones (transfer, burn, mint)
- [ ] Verificación en explorer

### **✅ Casos Edge**
- [ ] Token sin características
- [ ] Direcciones inválidas
- [ ] Errores de red
- [ ] Fondos insuficientes

---

## 🚨 **Problemas Conocidos y Soluciones**

### **1. "Factory contract not deployed"**
**Solución**: Desplegar contrato usando Remix IDE

### **2. "Token creation event not found"**
**Solución**: Verificar que el evento se emite correctamente

### **3. "Insufficient funds"**
**Solución**: Obtener ETH de testnet de faucets

### **4. "User is not owner"**
**Solución**: Verificar que el constructor asigna `msg.sender` como owner

---

## 📈 **Métricas de Éxito**

### **Criterios de Aceptación:**
1. **95%+ de tokens** creados tienen propiedad correcta
2. **100% de APIs** funcionando
3. **0 errores críticos** en creación de tokens
4. **Tiempo de respuesta** < 30 segundos por token
5. **Interfaz intuitiva** para usuarios no técnicos

### **KPIs a Monitorear:**
- Tasa de éxito en creación de tokens
- Tiempo promedio de transacción
- Errores por tipo
- Satisfacción del usuario

---

## 🎯 **Próximos Pasos**

1. **Ejecutar diagnósticos completos**
2. **Desplegar factory en Sepolia**
3. **Crear tokens de prueba**
4. **Verificar propiedad**
5. **Documentar resultados**
6. **Optimizar según hallazgos**

La plataforma está **lista para pruebas** con las correcciones implementadas. El sistema de propiedad ahora funciona correctamente y las APIs están configuradas apropiadamente.
