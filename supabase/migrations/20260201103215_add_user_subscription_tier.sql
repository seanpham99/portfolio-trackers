ALTER TABLE users
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'free' NOT NULL CHECK (subscription_tier IN ('free', 'pro'));