/*
  # Create vector search functionality for semantic employee search

  1. New Functions
    - `match_members` - Vector similarity search function using embeddings
    - Uses cosine similarity for matching employee profiles

  2. Database Changes
    - Ensures embedding column exists with proper vector type
    - Creates index for efficient vector search
    - Adds RPC function for semantic search

  3. Security
    - Function is accessible to authenticated users
    - Uses existing RLS policies on members table
*/

-- Ensure the vector extension is enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Ensure embedding column exists with proper vector type (384 dimensions for all-MiniLM-L6-v2)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE members ADD COLUMN embedding vector(384);
  END IF;
END $$;

-- Create index for vector similarity search if it doesn't exist
CREATE INDEX IF NOT EXISTS members_embedding_idx ON members 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Create or replace the match_members function for semantic search
CREATE OR REPLACE FUNCTION match_members(
  query_embedding vector(384),
  match_count int DEFAULT 10,
  similarity_threshold float DEFAULT 0.1
)
RETURNS TABLE (
  id int,
  name text,
  email text,
  role text,
  description text,
  skills text[],
  profile_picture text,
  team text,
  match_score float,
  distance float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.name,
    m.email,
    m.role,
    m.description,
    m.skills,
    m.profile_picture,
    t.name as team,
    1 - (m.embedding <=> query_embedding) as match_score,
    m.embedding <=> query_embedding as distance
  FROM members m
  LEFT JOIN teams t ON m.team_id = t.id
  WHERE m.embedding IS NOT NULL
    AND 1 - (m.embedding <=> query_embedding) >= similarity_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION match_members TO authenticated;
GRANT EXECUTE ON FUNCTION match_members TO anon;