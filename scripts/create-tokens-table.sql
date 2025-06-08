-- Crear tabla para almacenar información de tokens creados
CREATE TABLE IF NOT EXISTS tokens (
  id SERIAL PRIMARY KEY,
  address VARCHAR(42) UNIQUE NOT NULL,
  transaction_hash VARCHAR(66) NOT NULL,
  blockchain VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  total_supply VARCHAR(50) NOT NULL,
  decimals INTEGER NOT NULL DEFAULT 18,
  features JSONB NOT NULL DEFAULT '{}',
  user_tokens VARCHAR(50) NOT NULL,
  platform_fee VARCHAR(50) NOT NULL,
  created_by VARCHAR(42) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_tokens_blockchain ON tokens(blockchain);
CREATE INDEX IF NOT EXISTS idx_tokens_created_by ON tokens(created_by);
CREATE INDEX IF NOT EXISTS idx_tokens_created_at ON tokens(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tokens_address ON tokens(address);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_tokens_updated_at ON tokens;
CREATE TRIGGER update_tokens_updated_at
    BEFORE UPDATE ON tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
