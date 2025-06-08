# 🚀 Token Creator Platform

Una plataforma web completa para la creación de tokens ERC-20 personalizados sin necesidad de conocimientos técnicos de programación. Permite a los usuarios crear, desplegar y gestionar sus propios tokens en múltiples blockchains con una interfaz intuitiva y moderna.

## 📋 Tabla de Contenidos

- [Características Principales](#características-principales)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Funcionalidades](#funcionalidades)
- [Instalación y Configuración](#instalación-y-configuración)
- [Uso de la Plataforma](#uso-de-la-plataforma)
- [Contratos Inteligentes](#contratos-inteligentes)
- [Panel de Administración](#panel-de-administración)
- [Seguridad](#seguridad)
- [Contribución](#contribución)
- [Licencia](#licencia)

## ✨ Características Principales

### 🎯 **Creación de Tokens Sin Código**
- Interfaz gráfica intuitiva para configurar tokens
- Múltiples características avanzadas disponibles
- Vista previa en tiempo real de la configuración
- Validación automática de parámetros

### 🌐 **Soporte Multi-Blockchain**
- **Ethereum Mainnet**: Red principal de Ethereum
- **Sepolia Testnet**: Red de pruebas para desarrollo
- **Polygon**: Red de alta velocidad y bajo costo
- Fácil expansión a nuevas redes

### 💎 **Características Avanzadas de Tokens**
- **Burnable**: Capacidad de quemar tokens para reducir el suministro
- **Mintable**: Crear nuevos tokens después del despliegue
- **Pausable**: Pausar todas las transferencias en caso de emergencia
- **Deflationary**: Quema automática en cada transacción
- **Anti-Whale**: Límites de transacción y wallet
- **Ownership**: Control de propiedad del contrato

### 📊 **Dashboard Completo**
- Gestión de todos los tokens creados
- Estadísticas detalladas por usuario
- Historial de transacciones
- Interacción directa con contratos

## 🛠 Tecnologías Utilizadas

### **Frontend**
- **Next.js 14**: Framework React con App Router
- **TypeScript**: Tipado estático para mayor seguridad
- **Tailwind CSS**: Framework de estilos utilitarios
- **shadcn/ui**: Componentes de UI modernos y accesibles
- **Lucide React**: Iconografía consistente

### **Blockchain & Web3**
- **Ethers.js**: Biblioteca para interacción con Ethereum
- **Solidity**: Lenguaje para contratos inteligentes
- **Infura**: Proveedor de nodos RPC
- **MetaMask**: Integración con wallets

### **Backend & Base de Datos**
- **Supabase**: Base de datos PostgreSQL en la nube
- **API Routes**: Endpoints serverless de Next.js
- **Vercel**: Plataforma de despliegue

### **Herramientas de Desarrollo**
- **Remix IDE**: Desarrollo y despliegue de contratos
- **Etherscan API**: Verificación de transacciones
- **TypeScript**: Desarrollo type-safe

## 🏗 Arquitectura del Sistema

### **Arquitectura de 3 Capas**

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │   Token Creator │ │    Dashboard    │ │  Admin Panel    ││
│  │      Page       │ │      Page       │ │      Page       ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   BLOCKCHAIN LAYER                         │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │ Token Factory   │ │  Custom Token   │ │   Web3 Utils    ││
│  │   Contract      │ │   Contract      │ │   Functions     ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  DATABASE LAYER                            │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │   User Tokens   │ │  Transactions   │ │   Metadata      ││
│  │     Table       │ │     History     │ │    Storage      ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────────────────────────────────────────────┘
\`\`\`

### **Flujo de Creación de Tokens**

1. **Usuario configura token** → Frontend valida parámetros
2. **Conecta wallet** → Web3 Provider verifica red
3. **Calcula precio** → Basado en características seleccionadas
4. **Envía transacción** → Factory Contract despliega nuevo token
5. **Procesa pago** → ETH transferido a wallet de la plataforma
6. **Guarda metadata** → Información almacenada en base de datos
7. **Confirma creación** → Usuario recibe confirmación y detalles

## 🎮 Funcionalidades

### **Para Usuarios**

#### **Creación de Tokens**
- **Configuración Básica**: Nombre, símbolo, suministro, decimales
- **Características Avanzadas**: Selección de funcionalidades especiales
- **Vista Previa**: Visualización en tiempo real de la configuración
- **Cálculo de Precios**: Precio dinámico basado en características

#### **Dashboard Personal**
- **Mis Tokens**: Lista de todos los tokens creados
- **Estadísticas**: Valor invertido, redes utilizadas, tokens activos
- **Interacción**: Funciones de mint, burn, transfer según características
- **Historial**: Registro completo de actividades

#### **Explorador de Tokens**
- **Búsqueda Avanzada**: Por nombre, símbolo, dirección
- **Filtros**: Por red, características, fecha de creación
- **Detalles Completos**: Información técnica y funcional
- **Enlaces Directos**: Acceso a exploradores de blockchain

### **Para Administradores**

#### **Panel de Control**
- **Gestión de Contratos**: Despliegue y configuración
- **Monitoreo de Pagos**: Verificación de transacciones
- **Diagnósticos**: Herramientas de debugging y análisis
- **Configuración**: Ajuste de tarifas y parámetros

#### **Herramientas de Debug**
- **Verificación de APIs**: Estado de conexiones externas
- **Balance Monitoring**: Seguimiento de wallets de la plataforma
- **Event Tracking**: Monitoreo de eventos de contratos
- **Emergency Functions**: Funciones de emergencia y recuperación

## 🚀 Instalación y Configuración

### **Prerrequisitos**
- Node.js 18+ 
- npm o yarn
- Cuenta de Infura
- Cuenta de Supabase
- Wallet con ETH para despliegue

### **Variables de Entorno**
\`\`\`env
# Blockchain
NEXT_PUBLIC_INFURA_PROJECT_ID=tu_project_id
PRIVATE_KEY=tu_private_key

# Base de Datos
SUPABASE_URL=tu_supabase_url
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# APIs
ETHERSCAN_API_KEY=tu_etherscan_key
POLYGONSCAN_API_KEY=tu_polygonscan_key
\`\`\`

### **Instalación**
\`\`\`bash
# Clonar repositorio
git clone [repository-url]
cd token-creator-platform

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores

# Ejecutar migraciones de base de datos
npm run db:migrate

# Iniciar servidor de desarrollo
npm run dev
\`\`\`

### **Despliegue de Contratos**
\`\`\`bash
# Usar Remix IDE para desplegar 
# Configurar la dirección del contrato en lib/web3-utils.ts
# Verificar el contrato en Etherscan
\`\`\`

## 📖 Uso de la Plataforma

### **Creación de Tu Primer Token**

1. **Conectar Wallet**
   - Hacer clic en "Conectar Wallet"
   - Seleccionar MetaMask u otro proveedor
   - Cambiar a la red deseada

2. **Configurar Token**
   - **Básico**: Nombre, símbolo, suministro
   - **Características**: Seleccionar funcionalidades deseadas
   - **Red**: Elegir blockchain de despliegue

3. **Revisar y Crear**
   - Verificar configuración en vista previa
   - Confirmar precio total
   - Enviar transacción

4. **Gestionar Token**
   - Acceder al dashboard personal
   - Interactuar con funciones del token
   - Monitorear actividad

### **Características Disponibles**

#### **🔥 Burnable (Quemable)**
- Permite quemar tokens para reducir el suministro
- Función `burn()` disponible para holders
- Útil para crear escasez o corregir errores

#### **⚡ Mintable (Minteable)**
- Solo el owner puede crear nuevos tokens
- Función `mint()` para aumentar suministro
- Control total sobre la emisión

#### **⏸️ Pausable**
- Pausar todas las transferencias
- Útil en caso de emergencia o mantenimiento
- Solo el owner puede pausar/despausar

#### **📉 Deflationary (Deflacionario)**
- Quema automática en cada transacción
- Reduce el suministro gradualmente
- Crea presión alcista en el precio

#### **🐋 Anti-Whale**
- Límites máximos por transacción
- Límites máximos por wallet
- Previene manipulación por grandes holders

#### **👑 Ownership (Propiedad)**
- Control administrativo del contrato
- Capacidad de renunciar a la propiedad
- Transferencia de ownership disponible

## 🔐 Contratos Inteligentes


Contrato principal que gestiona la creación de tokens.

**Funciones Principales:**
- `createToken()`: Crea un nuevo token personalizado
- `calculatePrice()`: Calcula el precio basado en características
- `getUserTokens()`: Obtiene tokens de un usuario específico
- `emergencyWithdraw()`: Función de emergencia para fondos

**Eventos:**
- `TokenCreated`: Emitido cuando se crea un token
- `PaymentReceived`: Registra pagos recibidos
- `PaymentTransferred`: Confirma transferencias exitosas


Contrato de token ERC-20 con características personalizables.

**Funciones Estándar:**
- `transfer()`: Transferir tokens
- `approve()`: Aprobar gastos
- `transferFrom()`: Transferir desde cuenta aprobada

**Funciones Especiales:**
- `burn()`: Quemar tokens (si está habilitado)
- `mint()`: Crear tokens (solo owner, si está habilitado)
- `pause()/unpause()`: Pausar transferencias (si está habilitado)

### **Seguridad del Contrato**
- **Reentrancy Protection**: Protección contra ataques de reentrada
- **Access Control**: Control de acceso basado en roles
- **Input Validation**: Validación exhaustiva de entradas
- **Emergency Functions**: Funciones de emergencia para casos críticos

## 🛡 Seguridad

### **Medidas de Seguridad Implementadas**

#### **Smart Contracts**
- **Auditoría de Código**: Revisión exhaustiva de contratos
- **Test Coverage**: Cobertura completa de pruebas
- **Gas Optimization**: Optimización para reducir costos
- **Upgrade Patterns**: Patrones de actualización seguros

#### **Frontend**
- **Input Sanitization**: Sanitización de todas las entradas
- **XSS Protection**: Protección contra cross-site scripting
- **CSRF Protection**: Protección contra falsificación de solicitudes
- **Secure Headers**: Headers de seguridad implementados

#### **API & Database**
- **Rate Limiting**: Límites de velocidad en APIs
- **SQL Injection Protection**: Protección contra inyección SQL
- **Data Encryption**: Encriptación de datos sensibles
- **Access Control**: Control de acceso granular

### **Mejores Prácticas**
- **Wallet Security**: Nunca compartir claves privadas
- **Network Verification**: Verificar red antes de transacciones
- **Transaction Review**: Revisar detalles antes de confirmar
- **Regular Updates**: Mantener dependencias actualizadas

## 🔧 Panel de Administración

### **Funcionalidades de Admin**

#### **Gestión de Contratos**
- **Deploy Factory**: Despliegue de contratos factory
- **Update Configuration**: Actualización de configuraciones
- **Monitor Events**: Monitoreo de eventos en tiempo real
- **Emergency Controls**: Controles de emergencia

#### **Monitoreo de Pagos**
- **Balance Tracking**: Seguimiento de balances
- **Transaction History**: Historial de transacciones
- **Payment Verification**: Verificación de pagos
- **Revenue Analytics**: Análisis de ingresos

#### **Diagnósticos del Sistema**
- **API Health Checks**: Verificación de salud de APIs
- **Database Status**: Estado de la base de datos
- **Network Connectivity**: Conectividad de red
- **Performance Metrics**: Métricas de rendimiento

#### **Herramientas de Debug**
- **Event Logs**: Logs detallados de eventos
- **Error Tracking**: Seguimiento de errores
- **Performance Profiling**: Perfilado de rendimiento
- **User Activity**: Actividad de usuarios

## 📊 Métricas y Analytics

### **Métricas de Usuario**
- **Tokens Creados**: Número total de tokens por usuario
- **Valor Invertido**: Cantidad total gastada en la plataforma
- **Redes Utilizadas**: Blockchains donde ha desplegado tokens
- **Características Populares**: Funcionalidades más utilizadas

### **Métricas de Plataforma**
- **Tokens Totales**: Número total de tokens creados
- **Usuarios Activos**: Usuarios que han creado tokens
- **Ingresos Generados**: Ingresos totales de la plataforma
- **Distribución por Red**: Uso por blockchain

### **Analytics Avanzados**
- **Tendencias de Uso**: Patrones de uso a lo largo del tiempo
- **Características Populares**: Funcionalidades más demandadas
- **Análisis de Precios**: Impacto de características en precios
- **Retención de Usuarios**: Análisis de retención y engagement

## 🤝 Contribución

### **Cómo Contribuir**
1. **Fork** el repositorio

### **Guías de Contribución**
- **Code Style**: Seguir las convenciones de TypeScript y Solidity
- **Testing**: Incluir pruebas para nuevas funcionalidades
- **Documentation**: Documentar cambios y nuevas features
- **Security**: Considerar implicaciones de seguridad

### **Reportar Bugs**
- **Usar** el sistema de issues de GitHub
- **Incluir** pasos para reproducir el bug
- **Proporcionar** información del entorno
- **Adjuntar** logs relevantes si es posible

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🙏 Agradecimientos

- **OpenZeppelin**: Por los estándares de contratos seguros
- **Ethereum Foundation**: Por la infraestructura blockchain
- **Next.js Team**: Por el excelente framework
- **Vercel**: Por la plataforma de despliegue
- **Supabase**: Por la infraestructura de base de datos

## 📞 Soporte

criptocurrencia.com * legionbitcoin.com - Democratizando la creación de tokens para todos 🚀
