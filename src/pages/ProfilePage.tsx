import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Briefcase, Settings, UserPlus, AlertCircle, CheckCircle, Search, RefreshCw, Calendar, FileText, Clock, Edit, Save, X, Plus, Trash2, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import Header from '../components/Layout/Header';
import StandupCard from '../components/Standup/StandupCard';
import ProfilePictureUpload from '../components/ProfilePictureUpload';
import { Member } from '../types';

interface ProfilePageProps {
  onBack: () => void;
  onLeaveManagement: () => void;
  onProfileClick?: () => void;
  onTeamClick?: (teamId: number) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onBack, onLeaveManagement, onProfileClick, onTeamClick }) => {
  const { user } = useAuth();
  const { 
    getMentorById, 
    assignMentor, 
    fetchMentors,
    refreshCurrentUser,
    getStandupsByMemberId,
    leaves,
    updateProfile,
    uploadProfilePicture
  } = useApp();
  
  const [showMentorAssignment, setShowMentorAssignment] = useState(false);
  const [selectedMentorId, setSelectedMentorId] = useState<string>('');
  const [availableMentors, setAvailableMentors] = useState<Member[]>([]);
  const [mentorSearchTerm, setMentorSearchTerm] = useState('');
  const [fetchingMentors, setFetchingMentors] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showProfilePictureUpload, setShowProfilePictureUpload] = useState(false);

  // Profile editing states
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  // Get current user's mentor
  const currentMentor = user?.mentor_id ? getMentorById(user.mentor_id) : null;

  // Get user's recent standups
  const userStandups = user ? getStandupsByMemberId(user.id).slice(0, 5) : [];

  // Get user's leave requests
  const userLeaves = user ? leaves.filter(leave => leave.member_id === user.id).slice(0, 3) : [];

  // Initialize edit states when user data changes
  useEffect(() => {
    if (user) {
      setEditDescription(user.description || '');
      setEditSkills(user.skills || []);
    }
  }, [user]);

  // Fetch mentors when modal opens
  useEffect(() => {
    if (showMentorAssignment) {
      loadMentors();
    }
  }, [showMentorAssignment]);

  const loadMentors = async () => {
    setFetchingMentors(true);
    try {
      const mentors = await fetchMentors();
      setAvailableMentors(mentors);
      console.log('Loaded mentors for assignment:', mentors);
    } catch (error) {
      console.error('Error loading mentors:', error);
      setMessage({ type: 'error', text: 'Failed to load mentors' });
    } finally {
      setFetchingMentors(false);
    }
  };

  // Filter mentors based on search term
  const filteredMentors = availableMentors.filter(mentor =>
    mentor.name?.toLowerCase().includes(mentorSearchTerm.toLowerCase()) ||
    mentor.email?.toLowerCase().includes(mentorSearchTerm.toLowerCase()) ||
    mentor.id.toString().includes(mentorSearchTerm)
  );

  const handleAssignMentor = async () => {
    if (!selectedMentorId) {
      setMessage({ type: 'error', text: 'Please select a mentor first' });
      return;
    }
    
    setLoading('assign-mentor');
    setMessage(null);
    
    try {
      console.log('Assigning mentor ID:', selectedMentorId, 'to user:', user?.id);
      const result = await assignMentor(parseInt(selectedMentorId));
      
      if (result.success) {
        setShowMentorAssignment(false);
        setSelectedMentorId('');
        setMentorSearchTerm('');
        setMessage({ type: 'success', text: 'Mentor assigned successfully!' });
        
        // Refresh current user data to get updated mentor info
        await refreshCurrentUser();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to assign mentor' });
      }
    } catch (error) {
      console.error('Error assigning mentor:', error);
      setMessage({ type: 'error', text: 'An error occurred while assigning mentor' });
    } finally {
      setLoading(null);
    }
  };

  const handleSaveDescription = async () => {
    setLoading('save-description');
    try {
      const result = await updateProfile({ description: editDescription });
      if (result.success) {
        setIsEditingDescription(false);
        setMessage({ type: 'success', text: 'Description updated successfully!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update description' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while updating description' });
    } finally {
      setLoading(null);
    }
  };

  const handleSaveSkills = async () => {
    setLoading('save-skills');
    try {
      const result = await updateProfile({ skills: editSkills });
      if (result.success) {
        setIsEditingSkills(false);
        setMessage({ type: 'success', text: 'Skills updated successfully!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update skills' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while updating skills' });
    } finally {
      setLoading(null);
    }
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

  const handleCancelDescription = () => {
    setEditDescription(user?.description || '');
    setIsEditingDescription(false);
  };

  const handleCancelSkills = () => {
    setEditSkills(user?.skills || []);
    setIsEditingSkills(false);
    setNewSkill('');
  };

  const handleTeamClick = () => {
    if (user?.team_id && onTeamClick) {
      onTeamClick(user.team_id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getLeaveStatusColor = (approved: boolean | null) => {
    if (approved === true) return 'text-green-600';
    if (approved === false) return 'text-orange-600';
    return 'text-gray-600';
  };

  const getLeaveStatusText = (approved: boolean | null) => {
    if (approved === true) return 'Approved';
    if (approved === false) return 'Pending';
    return 'Unknown';
  };

  const handleProfilePictureUpload = async (imageUrl: string) => {


    setLoading('upload-profile-picture');


    try {


      const result = await uploadProfilePicture(imageUrl);


      if (result.success) {


        setShowProfilePictureUpload(false);


        setMessage({ type: 'success', text: 'Profile picture updated successfully! All pages will show your new photo.' });


        


        // Clear the message after 5 seconds


        setTimeout(() => {


          setMessage(null);


        }, 5000);


      } else {


        setMessage({ type: 'error', text: result.error || 'Failed to upload profile picture' });


      }


    } catch (error) {


      setMessage({ type: 'error', text: 'An error occurred while uploading profile picture' });


    } finally {


      setLoading(null);


    }


  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Not Authenticated</h2>
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <Header title="Profile & Settings" user={user} onProfileClick={onProfileClick}>
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Home
        </button>
      </Header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 mr-2" />
              )}
              {message.text}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information - Left Column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 mb-8">
              <div className="text-center mb-6">
                                {/* Profile Picture */}


                <div className="relative inline-block mb-4">


                  {user.profile_picture ? (


                    <img


                      src={user.profile_picture}


                      alt={user.name}


                      className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"


                    />


                  ) : (


                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 rounded-full inline-block w-24 h-24 flex items-center justify-center">


                      <User className="h-12 w-12 text-white" />


                    </div>


                  )}


                  <button


                    onClick={() => setShowProfilePictureUpload(true)}


                    className="absolute -bottom-2 -right-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors duration-200"


                    title="Change profile picture"


                  >


                    <Camera className="h-4 w-4" />


                  </button>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{user.name}</h2>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${
                  user.role === 'mentor' 
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : 'bg-orange-100 text-orange-800 border border-orange-200'
                }`}>
                  <Briefcase className="h-4 w-4 mr-1" />
                  {user.role === 'mentor' ? 'Mentor' : 'Trainee'}
                </div>
              </div>
              
              <div className="space-y-3 text-gray-600 mb-6">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-3" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-3" />
                  <span className="text-sm">@{user.username}</span>
                </div>
              </div>

              {/* Description Section */}
              <div className="mb-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">About Me</h3>
                  {!isEditingDescription && (
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
                      placeholder="Tell us about yourself..."
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
                    {user.description ? (
                      <p className="text-gray-700 text-sm leading-relaxed">{user.description}</p>
                    ) : (
                      <p className="text-gray-500 text-sm italic">No description added yet. Click edit to add one.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Skills Section */}
              <div className="mb-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
                  {!isEditingSkills && (
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
                    {user.skills && user.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {user.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm italic">No skills added yet. Click edit to add some.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Team Information */}
              {user.team && (
                <div className="mb-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Information</h3>
                  <div 
                    className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 hover:shadow-md transition-all duration-200 group"
                    onClick={handleTeamClick}
                  >
                    <div className="flex items-center">
                      <div className="bg-blue-500 p-2 rounded-lg mr-3 group-hover:bg-blue-600 transition-colors duration-200">
                        <Briefcase className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">{user.team.name}</h4>
                        <p className="text-sm text-gray-600">{user.team.description}</p>
                      </div>
                      <div className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <span className="text-xs font-medium">View →</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mentor Section */}
              <div className="mb-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">My Mentor</h3>
                  {!currentMentor && (
                    <button
                      onClick={() => setShowMentorAssignment(true)}
                      className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Mentor
                    </button>
                  )}
                </div>

                {currentMentor ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="bg-green-100 p-2 rounded-full mr-3">
                          <User className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-green-900">{currentMentor.name}</p>
                          <p className="text-sm text-green-700">{currentMentor.email}</p>
                          <p className="text-xs text-green-600">ID: {currentMentor.id}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowMentorAssignment(true)}
                        className="inline-flex items-center px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors duration-200"
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                      <p className="text-amber-800 text-sm">
                        No mentor assigned. Click "Add Mentor" to assign one from the available mentors.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Leave Management Link */}
              <div className="pt-6 border-t border-gray-200">
                <button
                  onClick={onLeaveManagement}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-medium py-3 px-4 rounded-lg hover:from-orange-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <div className="flex items-center justify-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Manage Leave Requests
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity - Right Column */}
          <div className="lg:col-span-2">
            {/* Recent Standups */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-lg mr-4">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Recent Standups</h3>
                    <p className="text-gray-600">Your latest daily standup submissions</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {userStandups.length} recent
                </div>
              </div>

              {userStandups.length > 0 ? (
                <div className="space-y-4">
                  {userStandups.map(standup => (
                    <StandupCard key={standup.id} standup={standup} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No standups yet</h4>
                  <p className="text-gray-500">You haven't submitted any daily standups yet.</p>
                </div>
              )}
            </div>

            {/* Recent Leave Requests */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-orange-500 to-red-600 p-3 rounded-lg mr-4">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Recent Leave Requests</h3>
                    <p className="text-gray-600">Your latest leave request submissions</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {userLeaves.length} recent
                </div>
              </div>

              {userLeaves.length > 0 ? (
                <div className="space-y-4">
                  {userLeaves.map(leave => (
                    <div key={leave.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-gray-900">{formatDate(leave.date)}</span>
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                            leave.type === 'sick' ? 'bg-red-100 text-red-800 border-red-200' :
                            leave.type === 'personal' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {leave.type.charAt(0).toUpperCase() + leave.type.slice(1)}
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          {leave.approved === true ? (
                            <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                          ) : leave.approved === false ? (
                            <Clock className="h-4 w-4 text-orange-600 mr-1" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-gray-600 mr-1" />
                          )}
                          <span className={`text-sm font-medium ${getLeaveStatusColor(leave.approved)}`}>
                            {getLeaveStatusText(leave.approved)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700">{leave.reason}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No leave requests</h4>
                  <p className="text-gray-500">You haven't submitted any leave requests yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mentor Assignment Modal */}
        {showMentorAssignment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Assign Mentor</h3>
                <button
                  onClick={loadMentors}
                  disabled={fetchingMentors}
                  className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-colors duration-200 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${fetchingMentors ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
              
              {/* Search Input */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search mentors by name, email, or ID..."
                    value={mentorSearchTerm}
                    onChange={(e) => setMentorSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Selection Status */}
              {selectedMentorId && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-blue-800 text-sm font-medium">
                      Selected: {filteredMentors.find(m => m.id.toString() === selectedMentorId)?.name}
                    </span>
                  </div>
                </div>
              )}

              {/* Mentors List */}
              <div className="flex-1 overflow-y-auto mb-4">
                {fetchingMentors ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading mentors...</span>
                  </div>
                ) : filteredMentors.length > 0 ? (
                  <div className="space-y-2">
                    {filteredMentors.map(mentor => (
                      <div
                        key={mentor.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedMentorId === mentor.id.toString()
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedMentorId(mentor.id.toString())}
                      >
                        <div className="flex items-center">
                          <div className="bg-purple-100 p-2 rounded-full mr-3">
                            <User className="h-4 w-4 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">{mentor.name}</p>
                            <p className="text-xs text-gray-600">{mentor.email}</p>
                            <div className="flex items-center mt-1">
                              <span className="text-xs text-gray-500">ID: {mentor.id}</span>
                              {mentor.team && (
                                <span className="ml-2 text-xs text-blue-600">
                                  Team: {mentor.team.name}
                                </span>
                              )}
                            </div>
                          </div>
                          {selectedMentorId === mentor.id.toString() && (
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">
                      {mentorSearchTerm ? 'No mentors found matching your search' : 'No mentors available'}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowMentorAssignment(false);
                    setSelectedMentorId('');
                    setMentorSearchTerm('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignMentor}
                  disabled={!selectedMentorId || loading === 'assign-mentor'}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading === 'assign-mentor' ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Assigning...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Assign Mentor
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
            {/* Profile Picture Upload Modal */}


      {showProfilePictureUpload && (


        <ProfilePictureUpload


          onImageUpdate={handleProfilePictureUpload}


          onClose={() => setShowProfilePictureUpload(false)}


          loading={loading === 'upload-profile-picture'}


        />


      )}
    </div>
  );
};

export default ProfilePage;