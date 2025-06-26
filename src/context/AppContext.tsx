import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Team, Member, Standup, Leave, Task } from '../types';
import { useAuth } from './AuthContext';

interface AppContextType {
  teams: Team[];
  members: Member[];
  standups: Standup[];
  leaves: Leave[];
  loading: boolean;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  createStandup: (content: string[]) => Promise<{ success: boolean; error?: string }>;
  createLeaveRequest: (leaveData: Omit<Leave, 'id' | 'member_id' | 'team_id' | 'approved'>) => Promise<{ success: boolean; error?: string }>;
  approveLeave: (leaveId: number) => Promise<{ success: boolean; error?: string }>;
  rejectLeave: (leaveId: number) => Promise<{ success: boolean; error?: string }>;
  cancelLeave: (leaveId: number) => Promise<{ success: boolean; error?: string }>;
  assignMentor: (mentorId: number) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (profileData: { description?: string; skills?: string[]; profile_picture?: string }) => Promise<{ success: boolean; error?: string }>;
  uploadProfilePicture: (imageUrl: string) => Promise<{ success: boolean; error?: string; publicUrl?: string }>;
  refreshData: () => Promise<void>;
  getTeamById: (id: number) => Team | undefined;
  getMembersByTeamId: (teamId: number) => Member[];
  getStandupsByTeamAndDate: (teamId: number, date: Date) => Standup[];
  getStandupsByMemberId: (memberId: number) => Standup[];
  getTodaysStandupByMember: (memberId: number) => Standup | undefined;
  getPendingLeavesByTeam: (teamId: number) => Leave[];
  currentUser: any;
  toggleTaskCompletion: (standupId: number, taskIndex: number) => Promise<{ success: boolean; error?: string }>;
  addStandup: (standup: any) => void;
  updateStandup: (standupId: number, updates: any) => void;
  getMemberById: (memberId: string) => Member | undefined;
  isUserOnLeave: (memberId: number, date?: Date) => boolean;
  shouldSkipStandup: (memberId: number, date?: Date) => boolean;
  getUserLeaveStatus: (memberId: number, date?: Date) => { onLeave: boolean; leaveType?: string; reason?: string };
  getMentorById: (mentorId: number) => Member | undefined;
  getMentors: () => Member[];
  fetchMentors: () => Promise<Member[]>;
  refreshCurrentUser: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

// Helper function to get local date string (YYYY-MM-DD) without timezone conversion
const getLocalDateString = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to transform standup data for compatibility with StandupCard
const transformStandupData = (standup: any): Standup => {
  // Parse content array to extract tasks and blockers
  const content = standup.content || [];
  const contentStat = standup.content_stat || [];
  const tasks: Task[] = [];
  let blockers = '';

  // Parse content array - each item could be a task or blocker
  content.forEach((item: string, index: number) => {
    if (item.toLowerCase().includes('blocker') || item.toLowerCase().includes('challenge')) {
      // Extract blocker text (remove "Blockers:" prefix if present)
      blockers = item.replace(/^blockers?:\s*/i, '').trim();
    } else {
      // Treat as a task
      tasks.push({
        id: `task-${standup.id}-${index}`,
        text: item.trim(),
        completed: contentStat[index] || false
      });
    }
  });

  return {
    ...standup,
    tasks,
    blockers,
    memberId: standup.member_id?.toString() || '',
    memberName: standup.member?.name || 'Unknown Member',
    memberAvatar: standup.member?.profile_picture || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face`,
    timestamp: standup.created_at || new Date().toISOString()
  };
};

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const { user, setUser, refreshCurrentUser: authRefreshCurrentUser } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [standups, setStandups] = useState<Standup[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');
      
      if (!error && data) {
        setTeams(data);
        console.log('Teams fetched successfully:', data);
      } else {
        console.error('Error fetching teams:', error);
      }
    } catch (error) {
      console.error('Error in fetchTeams:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      // First fetch members with team information and all fields including description and skills
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select(`
          *,
          team:teams(*)
        `)
        .order('name');
      
      if (membersError) {
        console.error('Error fetching members:', membersError);
        return;
      }

      // Then fetch mentor information separately for each member that has a mentor_id
      const membersWithMentors = await Promise.all(
        (membersData || []).map(async (member) => {
          if (member.mentor_id) {
            const { data: mentorData } = await supabase
              .from('members')
              .select('id, name, email, role')
              .eq('id', member.mentor_id)
              .single();
            
            return {
              ...member,
              mentor: mentorData
            };
          }
          return member;
        })
      );

      setMembers(membersWithMentors);
      console.log('Members fetched successfully:', membersWithMentors);
    } catch (error) {
      console.error('Error in fetchMembers:', error);
    }
  };

  const fetchMentors = async (): Promise<Member[]> => {
    try {
      console.log('Fetching mentors from database...');
      const { data, error } = await supabase
        .from('members')
        .select(`
          id,
          name,
          email,
          role,
          team_id,
          team:teams(name)
        `)
        .eq('role', 'mentor')
        .order('name');
      
      if (!error && data) {
        console.log('Mentors fetched successfully:', data);
        return data;
      } else {
        console.error('Error fetching mentors:', error);
        return [];
      }
    } catch (error) {
      console.error('Error in fetchMentors:', error);
      return [];
    }
  };

  const fetchStandups = async () => {
    try {
      console.log('Fetching standups...');
      const { data, error } = await supabase
        .from('standups')
        .select(`
          *,
          member:members(*),
          team:teams(*)
        `)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        console.log('Raw standups data from database:', data);
        // Transform the data to match StandupCard expectations
        const transformedStandups = data.map(transformStandupData);
        setStandups(transformedStandups);
        console.log('Standups fetched and transformed successfully:', transformedStandups);
      } else {
        console.error('Error fetching standups:', error);
        setStandups([]); // Set empty array on error
      }
    } catch (error) {
      console.error('Error in fetchStandups:', error);
      setStandups([]); // Set empty array on error
    }
  };

  const fetchLeaves = async () => {
    try {
      const { data, error } = await supabase
        .from('leaves')
        .select(`
          *,
          member:members(*),
          team:teams(*)
        `)
        .order('date', { ascending: false });
      
      if (!error && data) {
        setLeaves(data);
        console.log('Leaves fetched successfully:', data);
      } else {
        console.error('Error fetching leaves:', error);
      }
    } catch (error) {
      console.error('Error in fetchLeaves:', error);
    }
  };

  const refreshCurrentUser = async () => {
    if (!user) return;
    
    try {
      
      console.log('Refreshing current user data and members...');


      


      // Refresh the user data in AuthContext (this updates localStorage too)


      await authRefreshCurrentUser();


      


      // Also refresh members data to ensure all components show updated profile pictures


      await fetchMembers();


      


      console.log('Current user and members data refreshed successfully');
    } catch (error) {
      console.error('Error in refreshCurrentUser:', error);
    }
  };

  const refreshData = async () => {
    console.log('Refreshing all data...');
    setLoading(true);
    try {
      await Promise.all([
        fetchTeams(),
        fetchMembers(),
        fetchStandups(),
        fetchLeaves(),
      ]);
      console.log('Data refresh completed');
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      console.log('User authenticated, fetching data for user:', user);
      refreshData();
    } else {
      console.log('No user authenticated, skipping data fetch');
      setLoading(false);
    }
  }, [user]);

  // Check if user is on approved leave for a specific date
  const isUserOnLeave = (memberId: number, date: Date = new Date()): boolean => {
    const dateString = getLocalDateString(date);
    const userLeave = leaves.find(leave => 
      leave.member_id === memberId && 
      leave.date === dateString && 
      leave.approved === true
    );
    return !!userLeave;
  };

  // Check if user should skip standup (on approved leave)
  const shouldSkipStandup = (memberId: number, date: Date = new Date()): boolean => {
    return isUserOnLeave(memberId, date);
  };

  // Get detailed leave status for a user on a specific date
  const getUserLeaveStatus = (memberId: number, date: Date = new Date()) => {
    const dateString = getLocalDateString(date);
    const userLeave = leaves.find(leave => 
      leave.member_id === memberId && 
      leave.date === dateString && 
      leave.approved === true
    );
    
    if (userLeave) {
      return {
        onLeave: true,
        leaveType: userLeave.type,
        reason: userLeave.reason
      };
    }
    
    return { onLeave: false };
  };

  const createStandup = async (content: string[]): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const today = getLocalDateString(); // Use local date string
      
      // Check if user is on approved leave today
      if (shouldSkipStandup(user.id)) {
        return { success: false, error: 'You are on approved leave today. Standup creation is not required.' };
      }
      
      console.log('Creating standup with content:', content, 'for user:', user.id, 'team:', user.team_id, 'date:', today);
      
      // Initialize content_stat array with false values for all tasks
      const contentStat = content.map(() => false);
      
      // Check if user already has a standup today
      const { data: existingStandup } = await supabase
        .from('standups')
        .select('id')
        .eq('member_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (existingStandup) {
        // Update existing standup
        const { error } = await supabase
          .from('standups')
          .update({
            content,
            content_stat: contentStat,
            created_at: new Date().toISOString(),
          })
          .eq('id', existingStandup.id);

        if (error) {
          console.error('Error updating standup:', error);
          return { success: false, error: 'Failed to update standup' };
        }
        console.log('Standup updated successfully');
      } else {
        // Create new standup
        const { error } = await supabase
          .from('standups')
          .insert({
            member_id: user.id,
            team_id: user.team_id,
            date: today,
            content,
            content_stat: contentStat,
            created_at: new Date().toISOString(),
          });

        if (error) {
          console.error('Error creating standup:', error);
          return { success: false, error: 'Failed to create standup' };
        }
        console.log('Standup created successfully');
      }

      // Refresh standups data
      await fetchStandups();
      return { success: true };
    } catch (error) {
      console.error('Standup creation error:', error);
      return { success: false, error: 'An error occurred' };
    }
  };

  const createLeaveRequest = async (leaveData: Omit<Leave, 'id' | 'member_id' | 'team_id' | 'approved'>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      // Check if user already has a leave request for this date
      const { data: existingLeave } = await supabase
        .from('leaves')
        .select('id')
        .eq('member_id', user.id)
        .eq('date', leaveData.date)
        .maybeSingle();

      if (existingLeave) {
        return { success: false, error: 'You already have a leave request for this date' };
      }

      const { error } = await supabase
        .from('leaves')
        .insert({
          member_id: user.id,
          team_id: user.team_id,
          date: leaveData.date,
          reason: leaveData.reason,
          type: leaveData.type,
          approved: false,
        });

      if (error) {
        return { success: false, error: 'Failed to create leave request' };
      }

      await fetchLeaves();
      return { success: true };
    } catch (error) {
      console.error('Leave request creation error:', error);
      return { success: false, error: 'An error occurred' };
    }
  };

  const approveLeave = async (leaveId: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('leaves')
        .update({ approved: true })
        .eq('id', leaveId);

      if (error) {
        return { success: false, error: 'Failed to approve leave' };
      }

      await fetchLeaves();
      return { success: true };
    } catch (error) {
      console.error('Leave approval error:', error);
      return { success: false, error: 'An error occurred' };
    }
  };

  const rejectLeave = async (leaveId: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('leaves')
        .delete()
        .eq('id', leaveId);

      if (error) {
        return { success: false, error: 'Failed to reject leave' };
      }

      await fetchLeaves();
      return { success: true };
    } catch (error) {
      console.error('Leave rejection error:', error);
      return { success: false, error: 'An error occurred' };
    }
  };

  const cancelLeave = async (leaveId: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('leaves')
        .delete()
        .eq('id', leaveId);

      if (error) {
        return { success: false, error: 'Failed to cancel leave request' };
      }

      await fetchLeaves();
      return { success: true };
    } catch (error) {
      console.error('Leave cancellation error:', error);
      return { success: false, error: 'An error occurred' };
    }
  };

  const assignMentor = async (mentorId: number): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      console.log('Assigning mentor:', mentorId, 'to user:', user.id);
      
      const { error } = await supabase
        .from('members')
        .update({ mentor_id: mentorId })
        .eq('id', user.id);

      if (error) {
        console.error('Error assigning mentor:', error);
        return { success: false, error: 'Failed to assign mentor' };
      }

      console.log('Mentor assigned successfully');
      
      // Refresh members data and current user
      await Promise.all([
        fetchMembers(),
        refreshCurrentUser()
      ]);
      
      return { success: true };
    } catch (error) {
      console.error('Mentor assignment error:', error);
      return { success: false, error: 'An error occurred' };
    }
  };

  const updateProfile = async (profileData: { description?: string; skills?: string[]; profile_picture?: string }): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      console.log('Updating profile for user:', user.id, 'with data:', profileData);
      
      const { error } = await supabase
        .from('members')
        .update(profileData)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        return { success: false, error: 'Failed to update profile' };
      }

      console.log('Profile updated successfully');
      
      // Refresh members data and current user
      await Promise.all([
        fetchMembers(),
        refreshCurrentUser()
      ]);
      
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: 'An error occurred' };
    }
  };
    const uploadProfilePicture = async (imageUrl: string): Promise<{ success: boolean; error?: string; publicUrl?: string }> => {


    if (!user) return { success: false, error: 'Not authenticated' };





    try {


      console.log('Uploading profile picture for user:', user.id);


      


      // Convert data URL to blob


      const response = await fetch(imageUrl);


      const blob = await response.blob();


      


      // Generate unique filename with proper extension


      const fileExtension = blob.type.includes('png') ? 'png' : 'jpg';


      const fileName = `${user.id}-${Date.now()}.${fileExtension}`;


      const filePath = `profiles/${fileName}`;


      


      console.log('Attempting to upload file:', filePath, 'Size:', blob.size, 'Type:', blob.type);


      


      // Try to upload to Supabase storage first


      const { data: uploadData, error: uploadError } = await supabase.storage


        .from('profile-pictures')


        .upload(filePath, blob, {


          cacheControl: '3600',


          upsert: true,


          contentType: blob.type


        });





      if (uploadError) {


        console.error('Error uploading to storage:', uploadError);


        


        // If bucket doesn't exist, try to create it


        if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('404')) {


          console.log('Bucket not found, trying to create it...');


          


          const { error: bucketError } = await supabase.storage.createBucket('profile-pictures', {


            public: true,


            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],


            fileSizeLimit: 5242880 // 5MB


          });


          


          if (bucketError) {


            console.error('Failed to create bucket, using base64 fallback:', bucketError);


          } else {


            console.log('Bucket created successfully, retrying upload...');


            


            // Retry upload after creating bucket


            const { error: retryError } = await supabase.storage


              .from('profile-pictures')


              .upload(filePath, blob, {


                cacheControl: '3600',


                upsert: true,


                contentType: blob.type


              });


              


            if (!retryError) {


              // Success on retry


              const { data: urlData } = supabase.storage


                .from('profile-pictures')


                .getPublicUrl(filePath);





              const publicUrl = urlData?.publicUrl;


              if (publicUrl) {


                const updateResult = await updateProfile({ profile_picture: publicUrl });


                if (updateResult.success) {


                  console.log('Profile picture uploaded successfully after bucket creation:', publicUrl);


                  // Refresh all user data and members to update profile pictures everywhere


                  await refreshCurrentUser();


                  return { success: true, publicUrl };


                }


              }


            }


            console.log('Retry upload failed, falling back to base64');


          }


        }


        


        // Fallback: Store as base64 data URL directly in database


        console.log('Falling back to base64 storage in database...');


        


        const updateResult = await updateProfile({ profile_picture: imageUrl });


        


        if (!updateResult.success) {


          return { success: false, error: updateResult.error };


        }





        console.log('Profile picture saved as base64 in database');


        


        // Refresh all user data and members to update profile pictures everywhere


        await refreshCurrentUser();


        


        return { success: true, publicUrl: imageUrl };


      }





      console.log('Upload successful:', uploadData);





      // Get public URL if storage upload succeeded


      const { data: urlData } = supabase.storage


        .from('profile-pictures')


        .getPublicUrl(filePath);





      const publicUrl = urlData?.publicUrl;





      if (!publicUrl) {


        console.error('Failed to get public URL');


        // Fallback to base64 if public URL fails


        const updateResult = await updateProfile({ profile_picture: imageUrl });


        return updateResult.success 


          ? { success: true, publicUrl: imageUrl }


          : { success: false, error: updateResult.error };


      }





      console.log('Public URL obtained:', publicUrl);





      // Update user profile with new image URL


      const updateResult = await updateProfile({ profile_picture: publicUrl });


      


      if (!updateResult.success) {


        return { success: false, error: updateResult.error };


      }





      console.log('Profile picture uploaded successfully:', publicUrl);


      


      // Refresh all user data and members to update profile pictures everywhere


      await refreshCurrentUser();


      


      return { success: true, publicUrl };


    } catch (error) {


      console.error('Profile picture upload error:', error);


      


      // Final fallback to base64


      try {


        console.log('Attempting final fallback to base64...');


        const updateResult = await updateProfile({ profile_picture: imageUrl });


        if (updateResult.success) {


          // Refresh all user data and members to update profile pictures everywhere


          await refreshCurrentUser();


        }


        return updateResult.success 


          ? { success: true, publicUrl: imageUrl }


          : { success: false, error: 'Failed to save profile picture' };


      } catch (fallbackError) {


        console.error('Fallback also failed:', fallbackError);


        return { success: false, error: 'An error occurred while uploading the image' };


      }


    }


  };

  const getTeamById = (id: number): Team | undefined => {
    const team = teams.find(team => team.id === id);
    console.log('Looking for team with id:', id, 'Found:', team, 'Available teams:', teams);
    return team;
  };

  const getMembersByTeamId = (teamId: number): Member[] => {
    const teamMembers = members.filter(member => member.team_id === teamId);
    console.log('Getting members for team:', teamId, 'Found:', teamMembers);
    return teamMembers;
  };

  const getStandupsByTeamAndDate = (teamId: number, date: Date): Standup[] => {
    const dateString = getLocalDateString(date); // Use local date string
    const teamStandups = standups.filter(standup => 
      standup.team_id === teamId && standup.date === dateString
    );
    console.log('Getting standups for team:', teamId, 'date:', dateString, 'Found:', teamStandups);
    return teamStandups;
  };

  const getStandupsByMemberId = (memberId: number): Standup[] => {
    const memberStandups = standups.filter(standup => standup.member_id === memberId);
    console.log('Getting standups for member:', memberId, 'Found:', memberStandups, 'All standups:', standups);
    return memberStandups;
  };

  const getTodaysStandupByMember = (memberId: number): Standup | undefined => {
    const today = getLocalDateString(); // Use local date string
    const todayStandup = standups.find(standup => 
      standup.member_id === memberId && standup.date === today
    );
    console.log('Getting today\'s standup for member:', memberId, 'date:', today, 'Found:', todayStandup);
    return todayStandup;
  };

  const getPendingLeavesByTeam = (teamId: number): Leave[] => {
    return leaves.filter(leave => 
      leave.team_id === teamId && leave.approved === false
    );
  };

  const getMemberById = (memberId: string): Member | undefined => {
    const member = members.find(member => member.id === parseInt(memberId));
    console.log('Getting member by id:', memberId, 'Found:', member);
    return member;
  };

  const getMentorById = (mentorId: number): Member | undefined => {
    const mentor = members.find(member => member.id === mentorId && member.role === 'mentor');
    console.log('Getting mentor by id:', mentorId, 'Found:', mentor);
    return mentor;
  };

  const getMentors = (): Member[] => {
    return members.filter(member => member.role === 'mentor');
  };

  // Toggle task completion status
  const toggleTaskCompletion = async (standupId: number, taskIndex: number): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Toggling task completion for standup:', standupId, 'task index:', taskIndex);
      
      // Find the standup
      const standup = standups.find(s => s.id === standupId);
      if (!standup) {
        return { success: false, error: 'Standup not found' };
      }

      // Check if user owns this standup
      if (user && standup.member_id !== user.id) {
        return { success: false, error: 'You can only modify your own standups' };
      }

      // Get current content_stat array
      const currentContentStat = standup.content_stat || [];
      
      // Ensure the array is long enough
      while (currentContentStat.length <= taskIndex) {
        currentContentStat.push(false);
      }
      
      // Toggle the specific task
      const newContentStat = [...currentContentStat];
      newContentStat[taskIndex] = !newContentStat[taskIndex];

      // Update in database
      const { error } = await supabase
        .from('standups')
        .update({ content_stat: newContentStat })
        .eq('id', standupId);

      if (error) {
        console.error('Error updating task completion:', error);
        return { success: false, error: 'Failed to update task completion' };
      }

      // Update local state
      setStandups(prev => prev.map(s => {
        if (s.id === standupId) {
          const updatedStandup = { ...s, content_stat: newContentStat };
          // Update tasks array as well
          updatedStandup.tasks = updatedStandup.tasks.map((task, index) => ({
            ...task,
            completed: newContentStat[index] || false
          }));
          return updatedStandup;
        }
        return s;
      }));

      console.log('Task completion toggled successfully');
      return { success: true };
    } catch (error) {
      console.error('Error toggling task completion:', error);
      return { success: false, error: 'An error occurred' };
    }
  };

  const addStandup = (standup: any) => {
    console.log('Add standup:', standup);
    // This would add a standup to the local state
    setStandups(prev => [standup, ...prev]);
  };

  const updateStandup = (standupId: number, updates: any) => {
    console.log('Update standup:', standupId, updates);
    // This would update a standup in the local state
    setStandups(prev => prev.map(standup => 
      standup.id === standupId ? { ...standup, ...updates } : standup
    ));
  };

  return (
    <AppContext.Provider value={{
      teams,
      members,
      standups,
      leaves,
      loading,
      selectedDate,
      setSelectedDate,
      createStandup,
      createLeaveRequest,
      approveLeave,
      rejectLeave,
      cancelLeave,
      assignMentor,
      updateProfile,
      uploadProfilePicture,
      refreshData,
      getTeamById,
      getMembersByTeamId,
      getStandupsByTeamAndDate,
      getStandupsByMemberId,
      getTodaysStandupByMember,
      getPendingLeavesByTeam,
      currentUser: user,
      toggleTaskCompletion,
      addStandup,
      updateStandup,
      getMemberById,
      isUserOnLeave,
      shouldSkipStandup,
      getUserLeaveStatus,
      getMentorById,
      getMentors,
      fetchMentors,
      refreshCurrentUser,
    }}>
      {children}
    </AppContext.Provider>
  );
};