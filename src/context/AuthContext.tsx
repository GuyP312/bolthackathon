import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { AuthUser, Team } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setUser: (user: AuthUser | null) => void;
  refreshCurrentUser: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  phone?: string;
  username: string;
  password: string;
  team_id: number;
  role: 'trainee' | 'mentor';
  internship_start?: string;
  internship_end?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('auth_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      // Query the members table for authentication with all fields including description and skills
      const { data: member, error } = await supabase
        .from('members')
        .select(`
          *,
          team:teams(*)
        `)
        .eq('username', username)
        .eq('password', password)
        .single();

      if (error || !member) {
        return { success: false, error: 'Invalid username or password' };
      }

      // Fetch mentor information separately if mentor_id exists
      let mentorData = null;
      if (member.mentor_id) {
        const { data: mentor } = await supabase
          .from('members')
          .select('id, name, email, role')
          .eq('id', member.mentor_id)
          .single();
        mentorData = mentor;
      }

      const authUser: AuthUser = {
        id: member.id,
        name: member.name || '',
        email: member.email || '',
        username: member.username || '',
        role: member.role || 'trainee',
        admin: member.admin || false,
        team_id: member.team_id || 0,
        mentor_id: member.mentor_id || undefined,
        team: member.team || undefined,
        description: member.description || '',
        skills: member.skills || [],
        profile_picture: member.profile_picture || undefined,
      };

      setUser(authUser);
      localStorage.setItem('auth_user', JSON.stringify(authUser));
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An error occurred during login' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);

      // Check if username already exists
      const { data: existingUser } = await supabase
        .from('members')
        .select('username')
        .eq('username', userData.username)
        .single();

      if (existingUser) {
        return { success: false, error: 'Username already exists' };
      }

      // Insert new member with default description and skills
      const { data: newMember, error } = await supabase
        .from('members')
        .insert({
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          username: userData.username,
          password: userData.password,
          team_id: userData.team_id,
          role: userData.role,
          admin: false,
          mentor_id: null,
          internship_start: userData.internship_start,
          internship_end: userData.internship_end,
          description: '',
          skills: [],
        })
        .select(`
          *,
          team:teams(*)
        `)
        .single();

      if (error || !newMember) {
        return { success: false, error: 'Failed to create account' };
      }

      const authUser: AuthUser = {
        id: newMember.id,
        name: newMember.name || '',
        email: newMember.email || '',
        username: newMember.username || '',
        role: newMember.role || 'trainee',
        admin: newMember.admin || false,
        team_id: newMember.team_id || 0,
        mentor_id: newMember.mentor_id || undefined,
        team: newMember.team || undefined,
        description: newMember.description || '',
        skills: newMember.skills || [],
        profile_picture: newMember.profile_picture || undefined,
      };

      setUser(authUser);
      localStorage.setItem('auth_user', JSON.stringify(authUser));
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'An error occurred during registration' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  const refreshCurrentUser = async () => {


    if (!user) return;





    try {


      console.log('Refreshing current user data for:', user.id);


      


      const { data: member, error } = await supabase


        .from('members')


        .select(`


          *,


          team:teams(*)


        `)


        .eq('id', user.id)


        .single();





      if (error || !member) {


        console.error('Error refreshing user data:', error);


        return;


      }





      const updatedUser: AuthUser = {


        id: member.id,


        name: member.name || '',


        email: member.email || '',


        username: member.username || '',


        role: member.role || 'trainee',


        admin: member.admin || false,


        team_id: member.team_id || 0,


        mentor_id: member.mentor_id || undefined,


        team: member.team || undefined,


        description: member.description || '',


        skills: member.skills || [],


        profile_picture: member.profile_picture || undefined,


      };





      setUser(updatedUser);


      localStorage.setItem('auth_user', JSON.stringify(updatedUser));


      console.log('User data refreshed successfully:', updatedUser);


    } catch (error) {


      console.error('Error refreshing current user:', error);


    }


  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      setUser,
      refreshCurrentUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};