CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  reward_name TEXT DEFAULT 'Recompensa',
  reward_threshold INT DEFAULT 10 CHECK (reward_threshold > 0),
  theme_color TEXT DEFAULT '#f97316',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  stamps INT NOT NULL DEFAULT 0 CHECK (stamps >= 0),
  rewards_pending INT NOT NULL DEFAULT 0 CHECK (rewards_pending >= 0),
  last_scan_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (business_id, client_id)
);

CREATE TABLE IF NOT EXISTS scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  delta INT NOT NULL DEFAULT 1,
  granted_reward BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_slug ON businesses (slug);
CREATE INDEX IF NOT EXISTS idx_memberships_business ON memberships (business_id);
CREATE INDEX IF NOT EXISTS idx_memberships_client ON memberships (client_id);