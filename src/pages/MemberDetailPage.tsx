import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import StandupCard from '../components/Standup/StandupCard';

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

interface Standup {
  id: string;
  member_id: string;
  date: string;
  yesterday: string;
  today: string;
  blockers: string;
  created_at: string;
}

const MemberDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [member, setMember] = useState<Member | null>(null);
  const [recentStandups, setRecentStandups] = useState<Standup[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'recent' | 'calendar'>('recent');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarStandups, setCalendarStandups] = useState<Standup[]>([]);
  
  // Edit states
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  const canEdit = user?.id === id;

  useEffect(() => {
    if (id) {
      fetchMember();
      fetchRecentStandups();
    }
  }, [id]);

  useEffect(() => {
    if (viewMode === 'calendar' && id) {
      fetchCalendarStandups();
    }
  }, [viewMode, currentDate, id]);

  const fetchMember = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
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
        .select('*')
        .eq('member_id', id)
        .order('date', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentStandups(data || []);
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
        .select('*')
        .eq('member_id', id)
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;
      setCalendarStandups(data || []);
    } catch (error) {
      console.error('Error fetching calendar standups:', error);
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

  const renderCalendarView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const standup = getStandupForDate(day);
      const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
      
      days.push(
        <div
          key={day}
          className={`h-24 border border-gray-200 p-2 ${isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'}`}
        >
          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>
            {day}
          </div>
          {standup && (
            <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              Standup
            </div>
          )}
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

        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-7 bg-gray-50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 border-r border-gray-200 last:border-r-0">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days}
          </div>
        </div>
      </div>
    );
  };

  if (!member) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
              </div>
              
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{member.name}</h1>
                <p className="text-lg text-gray-600 mb-4">{member.role}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {member.email}
                  </div>
                  {member.phone && (
                    <div className="flex items-center text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      {member.phone}
                    </div>
                  )}
                  {member.location && (
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {member.location}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Internship Info */}
            {member.internship_start && member.internship_end && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center mb-3">
                    <Calendar className="h-5 w-5 text-orange-600 mr-2" />
                    <h3 className="text-lg font-semibold text-orange-800">Internship Period</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-orange-700 font-medium">Start Date:</span>
                      <span className="text-orange-900">{formatDate(member.internship_start)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-orange-700 font-medium">End Date:</span>
                      <span className="text-orange-900">{formatDate(member.internship_end)}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-orange-200 mt-2">
                    <div className="flex justify-between">
                      <span className="text-orange-700 font-medium">Duration:</span>
                      <span className="text-orange-900">
                        {Math.ceil((new Date(member.internship_end).getTime() - new Date(member.internship_start).getTime()) / (1000 * 60 * 60 * 24 * 30))} months
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Description Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">About</h3>
              {canEdit && !isEditingDescription && (
                <button
                  onClick={() => setIsEditingDescription(true)}
                  className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-colors duration-200"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </button>
              )}
            </div>

            {isEditingDescription ? (
              <div className="space-y-3">
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Tell us about this member..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                  rows={4}
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveDescription}
                    disabled={loading === 'save-description'}
                    className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                  >
                    {loading === 'save-description' ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                    ) : (
                      <Save className="h-3 w-3 mr-1" />
                    )}
                    Save
                  </button>
                  <button
                    onClick={handleCancelDescription}
                    className="inline-flex items-center px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors duration-200"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                {member.description ? (
                  <p className="text-gray-700 text-sm leading-relaxed">{member.description}</p>
                ) : (
                  <p className="text-gray-500 text-sm italic">
                    {canEdit ? 'No description added yet. Click edit to add one.' : 'No description available.'}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Skills Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
              {canEdit && !isEditingSkills && (
                <button
                  onClick={() => setIsEditingSkills(true)}
                  className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-colors duration-200"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </button>
              )}
            </div>

            {isEditingSkills ? (
              <div className="space-y-3">
                {/* Add new skill */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                  />
                  <button
                    onClick={handleAddSkill}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Skills list */}
                <div className="space-y-2">
                  {editSkills.map((skill, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                      <span className="text-sm text-gray-700">{skill}</span>
                      <button
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-red-500 hover:text-red-700 transition-colors duration-200"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveSkills}
                    disabled={loading === 'save-skills'}
                    className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                  >
                    {loading === 'save-skills' ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                    ) : (
                      <Save className="h-3 w-3 mr-1" />
                    )}
                    Save
                  </button>
                  <button
                    onClick={handleCancelSkills}
                    className="inline-flex items-center px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors duration-200"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                {member.skills && member.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {member.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic">
                    {canEdit ? 'No skills added yet. Click edit to add some.' : 'No skills listed.'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="mb-6">
          <div className="flex items-center space-x-1 bg-white rounded-lg shadow-md border border-gray-200 p-1">
            <button
              onClick={() => setViewMode('recent')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                viewMode === 'recent'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Recent Standups
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                viewMode === 'calendar'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Calendar View
            </button>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'recent' ? (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              Recent Standups ({recentStandups.length})
            </h3>
            
            {recentStandups.length > 0 ? (
              <div className="space-y-6">
                {recentStandups.map(standup => (
                  <StandupCard key={standup.id} standup={standup} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <AlertCircle className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No standups yet
                </h3>
                <p className="text-gray-500">
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