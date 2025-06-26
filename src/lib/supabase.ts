import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      teams: {
        Row: {
          id: number;
          name: string | null;
          description: string | null;
        };
        Insert: {
          id?: number;
          name?: string | null;
          description?: string | null;
        };
        Update: {
          id?: number;
          name?: string | null;
          description?: string | null;
        };
      };
      members: {
        Row: {
          id: number;
          name: string | null;
          email: string | null;
          phone: string | null;
          internship_start: string | null;
          internship_end: string | null;
          team_id: number | null;
          role: 'trainee' | 'mentor' | null;
          username: string | null;
          password: string | null;
          admin: boolean | null;
          mentor_id: number | null;
          description: string | null;
          skills: string[] | null;
          profile_picture: string | null;
        };
        Insert: {
          id?: number;
          name?: string | null;
          email?: string | null;
          phone?: string | null;
          internship_start?: string | null;
          internship_end?: string | null;
          team_id?: number | null;
          role?: 'trainee' | 'mentor' | null;
          username?: string | null;
          password?: string | null;
          admin?: boolean | null;
          mentor_id?: number | null;
          description?: string | null;
          skills?: string[] | null;
          profile_picture?: string | null;
        };
        Update: {
          id?: number;
          name?: string | null;
          email?: string | null;
          phone?: string | null;
          internship_start?: string | null;
          internship_end?: string | null;
          team_id?: number | null;
          role?: 'trainee' | 'mentor' | null;
          username?: string | null;
          password?: string | null;
          admin?: boolean | null;
          mentor_id?: number | null;
          description?: string | null;
          profile_picture?: string | null;
        };
      };
      standups: {
        Row: {
          id: number;
          member_id: number | null;
          team_id: number | null;
          date: string | null;
          content: string[] | null;
          content_stat: boolean[] | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          member_id?: number | null;
          team_id?: number | null;
          date?: string | null;
          content?: string[] | null;
          content_stat?: boolean[] | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          member_id?: number | null;
          team_id?: number | null;
          date?: string | null;
          content?: string[] | null;
          content_stat?: boolean[] | null;
          created_at?: string | null;
        };
      };
      leaves: {
        Row: {
          id: number;
          member_id: number | null;
          team_id: number | null;
          date: string | null;
          reason: string | null;
          type: 'sick' | 'personal' | 'other' | null;
          approved: boolean | null;
        };
        Insert: {
          id?: number;
          member_id?: number | null;
          team_id?: number | null;
          date?: string | null;
          reason?: string | null;
          type?: 'sick' | 'personal' | 'other' | null;
          approved?: boolean | null;
        };
        Update: {
          id?: number;
          member_id?: number | null;
          team_id?: number | null;
          date?: string | null;
          reason?: string | null;
          type?: 'sick' | 'personal' | 'other' | null;
          approved?: boolean | null;
        };
      };
    };
  };
};