-- ========================================================
-- POE Idle Online: Supabase Database Schema
-- Run this script in your Supabase SQL Editor (Dashboard -> SQL Editor)
-- ========================================================

-- 1. Create Characters Table
CREATE TABLE IF NOT EXISTS public.characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    character_class TEXT NOT NULL DEFAULT 'Duelist',
    level INTEGER NOT NULL DEFAULT 1,
    exp BIGINT NOT NULL DEFAULT 0,
    hp INTEGER NOT NULL DEFAULT 250,
    max_hp INTEGER NOT NULL DEFAULT 250,
    dps INTEGER NOT NULL DEFAULT 35,
    chaos_orbs INTEGER NOT NULL DEFAULT 0,
    divine_orbs INTEGER NOT NULL DEFAULT 0,
    wisdom_scrolls INTEGER NOT NULL DEFAULT 5,
    kills INTEGER NOT NULL DEFAULT 0,
    stash_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Index for Leaderboard (Fast query for top level & kills)
CREATE INDEX IF NOT EXISTS idx_characters_leaderboard 
ON public.characters (level DESC, kills DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

-- 4. Policies:
-- Allow anyone to read characters (for Leaderboard and inspecting players in town)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.characters FOR SELECT 
USING (true);

-- Allow users to insert their own character
CREATE POLICY "Users can create their own characters" 
ON public.characters FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow users to update their own character
CREATE POLICY "Users can update their own characters" 
ON public.characters FOR UPDATE 
USING (auth.uid() = user_id OR user_id IS NULL);
