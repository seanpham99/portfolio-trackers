-- Migration: Create pending_assets table for asset request queue
-- Story 4.1: Cross-Provider Asset Discovery
-- Create pending_assets table
CREATE TABLE pending_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(20) NOT NULL,
    asset_class VARCHAR(20) NOT NULL,
    requested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    -- Prevent duplicate requests from same user for same symbol/asset_class
    UNIQUE(symbol, asset_class, requested_by)
);
-- Create index for common queries
CREATE INDEX idx_pending_assets_status ON pending_assets(status);
CREATE INDEX idx_pending_assets_requested_by ON pending_assets(requested_by);
CREATE INDEX idx_pending_assets_symbol ON pending_assets(symbol);
-- Enable Row Level Security
ALTER TABLE pending_assets ENABLE ROW LEVEL SECURITY;
-- RLS Policy: Users can view their own requests
CREATE POLICY "Users can view own requests" ON pending_assets FOR
SELECT USING (auth.uid() = requested_by);
-- RLS Policy: Users can insert their own requests
CREATE POLICY "Users can insert own requests" ON pending_assets FOR
INSERT WITH CHECK (auth.uid() = requested_by);
-- Add comment for documentation
COMMENT ON TABLE pending_assets IS 'Queue for user-requested assets not yet in the registry';
COMMENT ON COLUMN pending_assets.status IS 'Status: pending (awaiting review), approved (added to assets), rejected (declined)';