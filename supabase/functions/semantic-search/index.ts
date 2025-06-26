import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// CORS headers for browser compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RequestBody {
  query: string;
  limit?: number;
}

interface Member {
  id: number;
  name: string;
  email: string;
  role: string;
  description?: string;
  skills?: string[];
  profile_picture?: string;
  team?: { name: string };
}

interface SearchResult extends Member {
  similarity_score: number;
  highlighted_text?: string;
}

/**
 * Generate embeddings using Supabase AI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Use Supabase's built-in AI for embeddings
    const model = new Supabase.ai.Session('gte-small');
    const output = await model.run(text, { mean_pool: true, normalize: true });
    return Array.from(output);
  } catch (error) {
    console.error('Embedding generation failed:', error);
    throw new Error('Failed to generate embedding');
  }
}

/**
 * Perform semantic search using vector similarity
 */
async function performSemanticSearch(
  supabase: any, 
  query: string, 
  limit: number = 10
): Promise<SearchResult[]> {
  try {
    console.log(`Performing semantic search for: "${query}"`);
    
    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query);
    
    // Use the match_members RPC function for vector similarity search
    const { data: matches, error } = await supabase.rpc('match_members', {
      query_embedding: queryEmbedding,
      match_count: limit,
      similarity_threshold: 0.1  // Lower threshold to get more results
    });
    
    if (error) {
      console.error('Vector search error:', error);
      throw error;
    }
    
    if (!matches || matches.length === 0) {
      console.log('No matches found');
      return [];
    }
    
    // Transform results to include similarity score
    const results: SearchResult[] = matches.map((match: any) => ({
      id: match.id,
      name: match.name,
      email: match.email,
      role: match.role,
      description: match.description,
      skills: match.skills || [],
      profile_picture: match.profile_picture,
      team: match.team ? { name: match.team } : undefined,
      similarity_score: match.match_score || 0
    }));
    
    console.log(`Found ${results.length} matches`);
    return results;
    
  } catch (error) {
    console.error('Semantic search failed:', error);
    throw error;
  }
}

/**
 * Fallback text-based search when vector search fails
 */
async function performTextSearch(
  supabase: any, 
  query: string, 
  limit: number = 10
): Promise<SearchResult[]> {
  try {
    console.log(`Performing fallback text search for: "${query}"`);
    
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
    
    let queryBuilder = supabase
      .from('members')
      .select(`
        id,
        name,
        email,
        role,
        description,
        skills,
        profile_picture,
        team:teams(name)
      `);
    
    // Build OR conditions for text search
    const orConditions = searchTerms.flatMap(term => [
      `name.ilike.%${term}%`,
      `role.ilike.%${term}%`,
      `description.ilike.%${term}%`,
      `skills.cs.{${term}}`
    ]);
    
    if (orConditions.length > 0) {
      queryBuilder = queryBuilder.or(orConditions.join(','));
    }
    
    const { data: members, error } = await queryBuilder
      .limit(limit)
      .order('name');
    
    if (error) throw error;
    
    // Calculate simple text similarity score
    const results: SearchResult[] = (members || []).map((member: any) => {
      let score = 0;
      const memberText = [
        member.name,
        member.role,
        member.description,
        ...(member.skills || [])
      ].join(' ').toLowerCase();
      
      // Simple scoring based on term matches
      searchTerms.forEach(term => {
        if (memberText.includes(term)) {
          score += 0.2;
        }
      });
      
      return {
        ...member,
        similarity_score: Math.min(score, 1.0)
      };
    });
    
    // Sort by similarity score
    results.sort((a, b) => b.similarity_score - a.similarity_score);
    
    console.log(`Found ${results.length} text matches`);
    return results;
    
  } catch (error) {
    console.error('Text search failed:', error);
    throw error;
  }
}

/**
 * Main Edge Function handler
 */
Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    let requestBody: RequestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate required fields
    if (!requestBody.query || typeof requestBody.query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid "query" field in request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const query = requestBody.query.trim();
    const limit = Math.min(requestBody.limit || 10, 50); // Cap at 50 results

    if (query.length < 3) {
      return new Response(
        JSON.stringify({ error: 'Query must be at least 3 characters long' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Processing search request for: "${query}" with limit: ${limit}`);

    let results: SearchResult[] = [];

    try {
      // Try semantic search first
      results = await performSemanticSearch(supabase, query, limit);
    } catch (semanticError) {
      console.warn('Semantic search failed, falling back to text search:', semanticError);
      
      try {
        // Fallback to text search
        results = await performTextSearch(supabase, query, limit);
      } catch (textError) {
        console.error('Both search methods failed:', textError);
        throw new Error('Search functionality is currently unavailable');
      }
    }

    // Return successful response
    return new Response(
      JSON.stringify({
        success: true,
        query,
        results,
        count: results.length,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    
    // Return error response
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});