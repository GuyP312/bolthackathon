import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit, 
  Save, 
  X, 
  Plus, 
  Trash2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import StandupCard from '../components/Standup/StandupCard';
import { Standup, Task } from '../types';

interface Member {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  role: string;
  team_id: string;
  internship_start?: string;
  internship_end?: string;
  description?: string;
  skills?: string[];
  avatar_url?: string;
}

interface MemberDetailPageProps {
  memberId: string;
  onBack: () => void;
  onProfileClick: () => void;
}

const MemberDetailPage: React.FC<MemberDetailPageProps> = ({ 
  memberId, 
  onBack, 
  onProfileClick 
}) => {
  const { user } = useAuth();
  
  const [member, setMember] = useState<Member | null>(null);
  const [recentStandups, setRecentStandups] = useState<Standup[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'recent' | 'calendar'>('recent');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarStandups, setCalendarStandups] = useState<Standup[]>([]);
  const [memberLeaves, setMemberLeaves] = useState<any[]>([]);
  
  // Edit states
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  const canEdit = user?.id === parseInt(memberId);

  useEffect(() => {
    if (memberId) {
      fetchMember();
      fetchRecentStandups();
    }
  }, [memberId]);

  useEffect(() => {
    if (viewMode === 'calendar' && memberId) {
      fetchCalendarStandups();
      fetchMemberLeaves();
    }
  }, [viewMode, currentDate, memberId]);

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
      memberName: member?.name || 'Unknown Member',
      memberAvatar: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face`,
      timestamp: standup.created_at || new Date().toISOString()
    };
  };

  const fetchMember = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', memberId)
        .single();

      if (error) throw error;
      setMember(data);
      setEditDescription(data.description || '');
      setEditSkills(data.skills || []);
    } catch (error) {
      console.error('Error fetching member:', error);
    }
  };

  const fetchRecentStandups = async () => {
    try {
      const { data, error } = await supabase
        .from('standups')
        .select(`
          *,
          member:members(*),
          team:teams(*)
        `)
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      // Transform the data to match StandupCard expectations
      const transformedStandups = (data || []).map(transformStandupData);
      setRecentStandups(transformedStandups);
    } catch (error) {
      console.error('Error fetching standups:', error);
    }
  };

  const fetchCalendarStandups = async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const { data, error } = await supabase
        .from('standups')
        .select(`
          *,
          member:members(*),
          team:teams(*)
        `)
        .eq('member_id', memberId)
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match StandupCard expectations
      const transformedStandups = (data || []).map(transformStandupData);
      setCalendarStandups(transformedStandups);
    } catch (error) {
      console.error('Error fetching calendar standups:', error);
    }
  };

  const fetchMemberLeaves = async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const { data, error } = await supabase
        .from('leaves')
        .select('*')
        .eq('member_id', memberId)
        .eq('approved', true)
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0]);

      if (error) throw error;
      setMemberLeaves(data || []);
    } catch (error) {
      console.error('Error fetching member leaves:', error);
    }
  };

  const handleSaveDescription = async () => {
    if (!member) return;
    
    setLoading('save-description');
    try {
      const { error } = await supabase
        .from('members')
        .update({ description: editDescription })
        .eq('id', member.id);

      if (error) throw error;
      
      setMember({ ...member, description: editDescription });
      setIsEditingDescription(false);
    } catch (error) {
      console.error('Error updating description:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleCancelDescription = () => {
    setEditDescription(member?.description || '');
    setIsEditingDescription(false);
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !editSkills.includes(newSkill.trim())) {
      setEditSkills([...editSkills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setEditSkills(editSkills.filter(skill => skill !== skillToRemove));
  };

  const handleSaveSkills = async () => {
    if (!member) return;
    
    setLoading('save-skills');
    try {
      const { error } = await supabase
        .from('members')
        .update({ skills: editSkills })
        .eq('id', member.id);

      if (error) throw error;
      
      setMember({ ...member, skills: editSkills });
      setIsEditingSkills(false);
    } catch (error) {
      console.error('Error updating skills:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleCancelSkills = () => {
    setEditSkills(member?.skills || []);
    setIsEditingSkills(false);
    setNewSkill('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getStandupForDate = (date: number) => {
    const dateString = new Date(currentDate.getFullYear(), currentDate.getMonth(), date)
      .toISOString().split('T')[0];
    return calendarStandups.find(standup => standup.date === dateString);
  };

  const getLeaveForDate = (date: number) => {
    const dateString = new Date(currentDate.getFullYear(), currentDate.getMonth(), date)
      .toISOString().split('T')[0];
    return memberLeaves.find(leave => leave.date === dateString);
  };

  const isWeekday = (date: number) => {
    const dayOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), date).getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
  };

  const isToday = (date: number) => {
    const today = new Date();
    const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), date);
    return today.toDateString() === cellDate.toDateString();
  };

  const isPastWeekday = (date: number) => {
    const today = new Date();
    const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), date);
    today.setHours(0, 0, 0, 0);
    cellDate.setHours(0, 0, 0, 0);
    return isWeekday(date) && cellDate < today;
  };

  const getDayClasses = (date: number) => {
    const baseClasses = 'h-20 border-2 border-black flex items-center justify-center text-lg font-semibold transition-all duration-200';
    
    if (isToday(date)) {
      return `${baseClasses} bg-blue-400 text-blue-900 border-blue-600`;
    }
    
    if (getLeaveForDate(date)) {
      return `${baseClasses} bg-yellow-300 text-yellow-900`;
    }
    
    if (getStandupForDate(date)) {
      return `${baseClasses} bg-green-300 text-green-900`;
    }
    
    if (isPastWeekday(date)) {
      return `${baseClasses} bg-red-300 text-red-900`;
    }
    
    // Weekend or future days
    return `${baseClasses} bg-gray-300 text-gray-700`;
  };

  const renderCalendarView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-20"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(
        <div key={day} className={getDayClasses(day)}>
          {day}
        </div>
      );
    }

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors duration-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors duration-200"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Legend */}
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-300 border-2 border-black rounded"></div>
                <span className="text-sm font-medium text-gray-700">Standup completed</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-yellow-300 border-2 border-black rounded"></div>
                <span className="text-sm font-medium text-gray-700">Leave day</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-red-300 border-2 border-black rounded"></div>
                <span className="text-sm font-medium text-gray-700">Missing standup</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gray-300 border-2 border-black rounded"></div>
                <span className="text-sm font-medium text-gray-700">Weekend/Future</span>
              </div>
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 bg-white">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-4 text-center text-sm font-bold text-gray-700 border-r-2 border-black last:border-r-0 bg-gray-100">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {days}
          </div>
        </div>
      </div>
    );
  };

  if (!member) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading member details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </button>
            
            <button
              onClick={onProfileClick}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Member Profile Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {member.name.split(' ').map(n => n[0]).join('')}
              </div>
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{member.name}</h1>
              <p className="text-xl text-blue-600 font-medium mb-4">{member.role}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center text-gray-600">
                  <Mail className="h-4 w-4 mr-3 text-blue-500" />
                  {member.email}
                </div>
                {member.phone && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-3 text-green-500" />
                    {member.phone}
                  </div>
                )}
                {member.location && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-3 text-red-500" />
                    {member.location}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Internship Info */}
          {member.internship_start && member.internship_end && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                <div className="flex items-center mb-4">
                  <Calendar className="h-6 w-6 text-orange-600 mr-3" />
                  <h3 className="text-xl font-semibold text-orange-800">Internship Period</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <span className="text-orange-700 font-medium block mb-1">Start Date</span>
                    <span className="text-orange-900 font-semibold">{formatDate(member.internship_start)}</span>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <span className="text-orange-700 font-medium block mb-1">End Date</span>
                    <span className="text-orange-900 font-semibold">{formatDate(member.internship_end)}</span>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <span className="text-orange-700 font-medium block mb-1">Duration</span>
                    <span className="text-orange-900 font-semibold">
                      {Math.ceil((new Date(member.internship_end).getTime() - new Date(member.internship_start).getTime()) / (1000 * 60 * 60 * 24 * 30))} months
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Description Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">About</h3>
              {canEdit && !isEditingDescription && (
                <button
                  onClick={() => setIsEditingDescription(true)}
                  className="inline-flex items-center px-3 py-2 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 transition-colors duration-200"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </button>
              )}
            </div>

            {isEditingDescription ? (
              <div className="space-y-4">
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Tell us about this member..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                  rows={4}
                />
                <div className="flex space-x-3">
                  <button
                    onClick={handleSaveDescription}
                    disabled={loading === 'save-description'}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                  >
                    {loading === 'save-description' ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save
                  </button>
                  <button
                    onClick={handleCancelDescription}
                    className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors duration-200"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6">
                {member.description ? (
                  <p className="text-gray-700 leading-relaxed">{member.description}</p>
                ) : (
                  <p className="text-gray-500 italic">
                    {canEdit ? 'No description added yet. Click edit to add one.' : 'No description available.'}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Skills Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Skills</h3>
              {canEdit && !isEditingSkills && (
                <button
                  onClick={() => setIsEditingSkills(true)}
                  className="inline-flex items-center px-3 py-2 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 transition-colors duration-200"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </button>
              )}
            </div>

            {isEditingSkills ? (
              <div className="space-y-4">
                {/* Add new skill */}
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                  />
                  <button
                    onClick={handleAddSkill}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Skills list */}
                <div className="space-y-2">
                  {editSkills.map((skill, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <span className="text-gray-700">{skill}</span>
                      <button
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-red-500 hover:text-red-700 transition-colors duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleSaveSkills}
                    disabled={loading === 'save-skills'}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                  >
                    {loading === 'save-skills' ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save
                  </button>
                  <button
                    onClick={handleCancelSkills}
                    className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors duration-200"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6">
                {member.skills && member.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {member.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">
                    {canEdit ? 'No skills added yet. Click edit to add some.' : 'No skills listed.'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="mb-8">
          <div className="flex items-center space-x-1 bg-white rounded-lg shadow-md border border-gray-200 p-1">
            <button
              onClick={() => setViewMode('recent')}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                viewMode === 'recent'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              Recent Standups
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                viewMode === 'calendar'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              Calendar View
            </button>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'recent' ? (
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">
              Recent Standups ({recentStandups.length})
            </h3>
            
            {recentStandups.length > 0 ? (
              <div className="space-y-6">
                {recentStandups.map(standup => (
                  <StandupCard key={standup.id} standup={standup} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                <div className="text-gray-400 mb-6">
                  <AlertCircle className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  No standups yet
                </h3>
                <p className="text-gray-500 text-lg">
                  This member hasn't submitted any standups yet.
                </p>
              </div>
            )}
          </div>
        ) : (
          renderCalendarView()
        )}
      </main>
    </div>
  );
};

export default MemberDetailPage;