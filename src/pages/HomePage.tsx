import React, { useState } from 'react';
import { Search, Calendar, Users, TrendingUp, Clock, FileText, UserCheck, Brain } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Layout/Header';
import TeamCard from '../components/Team/TeamCard';

interface HomePageProps {
  onTeamClick: (teamId: number) => void;
  onCreateStandup: () => void;
  onProfileClick?: () => void;
  onMentorTraineesClick?: () => void;
  onLeaveManagementClick?: () => void;
  onAIEmployeeMatcherClick?: () => void;
  onSemanticSearchClick?: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ 
  onTeamClick, 
  onCreateStandup, 
  onProfileClick,
  onMentorTraineesClick,
  onLeaveManagementClick,
  onAIEmployeeMatcherClick,
  onSemanticSearchClick
}) => {
  const { teams, standups, members, leaves, getTodaysStandupByMember } = useApp();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const todayStandups = standups.filter(standup => {
    const today = new Date().toISOString().split('T')[0];
    return standup.date === today;
  });

  const totalMembers = members.length;
  const todayParticipation = todayStandups.length;
  const participationRate = totalMembers > 0 ? Math.round((todayParticipation / totalMembers) * 100) : 0;

  // Check if current user has today's standup
  const hasStandupToday = user ? getTodaysStandupByMember(user.id) : null;

  // Calculate leave stats
  const pendingLeaves = leaves.filter(leave => leave.approved === false).length;
  const userPendingLeaves = user ? leaves.filter(leave => 
    leave.member_id === user.id && leave.approved === false
  ).length : 0;

  // Calculate mentor-specific stats
  const myTrainees = user?.role === 'mentor' 
    ? members.filter(member => member.mentor_id === user.id && member.role === 'trainee')
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <Header 
        title="Daily Standup Management" 
        showCreateButton 
        onCreateClick={onCreateStandup}
        onProfileClick={onProfileClick}
        user={user}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome back, {user?.name}!
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Track your team's progress and stay aligned with daily standups across all teams.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Teams</p>
                  <p className="text-2xl font-bold text-gray-900">{teams.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Today's Standups</p>
                  <p className="text-2xl font-bold text-gray-900">{todayParticipation}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Participation Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{participationRate}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex items-center">
                <div className={`${hasStandupToday ? 'bg-green-100' : 'bg-orange-100'} p-3 rounded-lg`}>
                  <Clock className={`h-6 w-6 ${hasStandupToday ? 'text-green-600' : 'text-orange-600'}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Your Status</p>
                  <p className={`text-sm font-bold ${hasStandupToday ? 'text-green-600' : 'text-orange-600'}`}>
                    {hasStandupToday ? 'Completed' : 'Pending'}
                  </p>
                </div>
              </div>
            </div>

            <div 
              className="bg-white rounded-lg shadow-md border border-gray-200 p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200"
              onClick={onLeaveManagementClick}
            >
              <div className="flex items-center">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <FileText className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {user?.role === 'trainee' ? 'My Leaves' : 'Pending Leaves'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {user?.role === 'trainee' ? userPendingLeaves : pendingLeaves}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Cards Section */}
          <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Semantic Search Card */}
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              onClick={onSemanticSearchClick}
            >
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center">
                  <div className="bg-white bg-opacity-20 p-3 rounded-lg mr-4">
                    <Search className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">Semantic Search</h3>
                    <p className="text-indigo-100">
                      Find employees using AI-powered natural language search
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">AI</div>
                  <div className="text-sm text-indigo-200">Search</div>
                </div>
              </div>
            </div>

            {/* Mentor-specific section */}
            {user?.role === 'mentor' && (
              <>
                {/* My Trainees Card */}
                <div 
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  onClick={onMentorTraineesClick}
                >
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center">
                      <div className="bg-white bg-opacity-20 p-3 rounded-lg mr-4">
                        <UserCheck className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-1">My Trainees</h3>
                        <p className="text-purple-100">
                          Manage and monitor your {myTrainees.length} assigned trainee{myTrainees.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">{myTrainees.length}</div>
                      <div className="text-sm text-purple-200">Trainees</div>
                    </div>
                  </div>
                </div>

                {/* AI Employee Matcher Card */}
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  onClick={onAIEmployeeMatcherClick}
                >
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center">
                      <div className="bg-white bg-opacity-20 p-3 rounded-lg mr-4">
                        <Brain className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-1">AI Employee Matcher</h3>
                        <p className="text-emerald-100">
                          Find the best team members for your tasks using AI
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">AI</div>
                      <div className="text-sm text-emerald-200">Powered</div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* For non-mentors, show additional feature cards */}
            {user?.role !== 'mentor' && (
              <>
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg p-6">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center">
                      <div className="bg-white bg-opacity-20 p-3 rounded-lg mr-4">
                        <TrendingUp className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-1">Analytics</h3>
                        <p className="text-green-100">
                          Track your progress and team performance
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-lg shadow-lg p-6">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center">
                      <div className="bg-white bg-opacity-20 p-3 rounded-lg mr-4">
                        <Calendar className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-1">Schedule</h3>
                        <p className="text-orange-100">
                          Manage your calendar and upcoming events
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Search */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search teams..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Teams Grid */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Your Teams</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map(team => (
              <TeamCard
                key={team.id}
                team={team}
                onClick={() => onTeamClick(team.id)}
                memberCount={members.filter(m => m.team_id === team.id).length}
              />
            ))}
          </div>

          {filteredTeams.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No teams found</h3>
              <p className="text-gray-500">Try adjusting your search terms.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HomePage;