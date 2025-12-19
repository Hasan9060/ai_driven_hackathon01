-- Migration: Create users and related tables
-- Description: Creates tables for user authentication and profiles
-- Version: 001
-- Date: 2025-12-18

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (compatible with Better-Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    name VARCHAR(255),
    image VARCHAR(255),
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    metadata TEXT, -- JSON string for additional metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NOT NULL;

-- Profiles table for user technical information
CREATE TABLE IF NOT EXISTS profiles (
    user_id UUID PRIMARY KEY,
    software_years INTEGER NOT NULL DEFAULT 0,
    software_languages TEXT[] NOT NULL DEFAULT '{}',
    software_frameworks TEXT[] NOT NULL DEFAULT '{}',
    hardware_robotics BOOLEAN NOT NULL DEFAULT FALSE,
    hardware_embedded BOOLEAN NOT NULL DEFAULT FALSE,
    hardware_iot BOOLEAN NOT NULL DEFAULT FALSE,
    experience_level VARCHAR(20) NOT NULL DEFAULT 'beginner',
    interests TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_profiles_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Create indexes for profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_experience_level ON profiles(experience_level);
CREATE INDEX IF NOT EXISTS idx_profiles_hardware_robotics ON profiles(hardware_robotics);

-- Auth events table for audit trail
CREATE TABLE IF NOT EXISTS auth_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- 'login', 'logout', 'signup', 'password_reset', etc.
    ip_address INET,
    user_agent TEXT,
    metadata TEXT, -- JSON string for additional event data
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_auth_events_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Create indexes for auth_events table
CREATE INDEX IF NOT EXISTS idx_auth_events_user_id ON auth_events(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_events_event_type ON auth_events(event_type);
CREATE INDEX IF NOT EXISTS idx_auth_events_created_at ON auth_events(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a view for active users (non-deleted)
CREATE OR REPLACE VIEW active_users AS
SELECT
    id,
    email,
    email_verified,
    name,
    image,
    created_at,
    updated_at
FROM users
WHERE deleted_at IS NULL;

-- Create a view for users with profiles
CREATE OR REPLACE VIEW users_with_profiles AS
SELECT
    u.id,
    u.email,
    u.email_verified,
    u.name,
    u.image,
    u.created_at,
    u.updated_at,
    p.software_years,
    p.software_languages,
    p.software_frameworks,
    p.hardware_robotics,
    p.hardware_embedded,
    p.hardware_iot,
    p.experience_level,
    p.interests
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE u.deleted_at IS NULL;

-- Insert sample data for testing (optional)
-- This can be removed or commented out in production
DO $$
BEGIN
    -- Check if test user exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'test@example.com') THEN
        -- Insert test user
        INSERT INTO users (email, password_hash, email_verified, name) VALUES
        ('test@example.com', '$2b$12$example_hash', TRUE, 'Test User');

        -- Get the user ID
        DECLARE test_user_id UUID;
        SELECT id INTO test_user_id FROM users WHERE email = 'test@example.com';

        -- Insert test profile
        INSERT INTO profiles (
            user_id,
            software_years,
            software_languages,
            software_frameworks,
            hardware_robotics,
            hardware_embedded,
            hardware_iot,
            experience_level,
            interests
        ) VALUES (
            test_user_id,
            5,
            ARRAY['Python', 'JavaScript', 'TypeScript'],
            ARRAY['React', 'Node.js', 'FastAPI'],
            TRUE,
            FALSE,
            TRUE,
            'advanced',
            ARRAY['Robotics', 'AI/ML', 'IoT']
        );
    END IF;
END $$;