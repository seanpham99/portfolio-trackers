-- Migration: Create user_connections table for exchange API key storage
-- Story: 2.7 Connection Settings
-- Security: API secrets encrypted at application level (AES-256-GCM)

-- Exchange enum
CREATE TYPE exchange_id AS ENUM ('binance', 'okx');

-- Connection status enum
CREATE TYPE connection_status AS ENUM ('active', 'invalid', 'disconnected');

-- User connections table
CREATE TABLE user_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exchange_id exchange_id NOT NULL,
  api_key TEXT NOT NULL,                    -- Stored as plaintext (not a secret)
  api_secret_encrypted TEXT NOT NULL,       -- Encrypted with AES-256-GCM (format: iv:authTag:ciphertext)
  status connection_status DEFAULT 'active',
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- One connection per exchange per user
  UNIQUE(user_id, exchange_id)
);

-- Enable Row Level Security
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own connections
CREATE POLICY "Users can view own connections" ON user_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connections" ON user_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections" ON user_connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own connections" ON user_connections
  FOR DELETE USING (auth.uid() = user_id);

-- Index for faster lookups by user
CREATE INDEX idx_user_connections_user_id ON user_connections(user_id);

-- Trigger to update updated_at on modification
CREATE OR REPLACE FUNCTION update_user_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_connections_updated_at
  BEFORE UPDATE ON user_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_user_connections_updated_at();

-- Comment for documentation
COMMENT ON TABLE user_connections IS 'Stores user API connections to crypto exchanges (Binance, OKX). API secrets are encrypted at application level.';
COMMENT ON COLUMN user_connections.api_secret_encrypted IS 'Encrypted with AES-256-GCM. Format: base64(iv):base64(authTag):base64(ciphertext)';
