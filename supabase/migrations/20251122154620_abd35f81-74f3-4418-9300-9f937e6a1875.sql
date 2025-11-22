-- Add new belt levels to the belt_level enum
ALTER TYPE belt_level ADD VALUE IF NOT EXISTS 'yellow_stripe';
ALTER TYPE belt_level ADD VALUE IF NOT EXISTS 'green_stripe';
ALTER TYPE belt_level ADD VALUE IF NOT EXISTS 'blue_stripe';
ALTER TYPE belt_level ADD VALUE IF NOT EXISTS 'red_stripe';
ALTER TYPE belt_level ADD VALUE IF NOT EXISTS 'red_black';