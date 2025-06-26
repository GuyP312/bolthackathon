import React, { useState } from 'react';
import { ArrowLeft, Users, Calendar as CalendarIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Layout/Header';
import DatePicker from '../components/Calendar/DatePicker';
import StandupCard from '../components/Standup/StandupCard';

interface TeamPageProps {
  teamId: string;
  onBack: () => void;
  onMembersClick: (teamId: number) => void;
  onCreateStandup: () => void;
  onMemberClick?: (memberId: number, teamId: number) => void;
  onProfileClick?: () => void;
  onEditStandup?: () => void;
}

const TeamPage: React.FC<TeamPageProps> = ({ 
  teamId, 
  onBack, 
  onMembersClick, 
  onCreateStandup,
  onMemberClick,
  onProfileClick,
  onEditStandup 
}) => {
  const { user } = useAuth();
  const { getTeamById, selectedDate, setSelectedDate, getStandupsByTeamAndDate, getMembersByTeamId, standups, leaves } = useApp();
  const [showCalendar, setShowCalendar] = useState(false);
  
  const teamIdNumber = parseInt(teamId);
  const team = getTeamById(teamIdNumber);
  const teamStandups = getStandupsByTeamAndDate(teamIdNumber, selectedDate);
  const members = getMembersByTeamId(teamIdNumber);

  console.log('TeamPage - teamId:', teamId, 'teamIdNumber:', teamIdNumber, 'team:', team, 'standups:', teamStandups, 'members:', members);

  // Sort standups to show current user's standup first
  const sortedStandups = [...teamStandups].sort((a, b) => {
    // If current user's standup, put it first
    if (user && a.member_id === user.id) return -1;
    if (user && b.member_id === user.id) return 1;
    
    // For others, maintain original order (by timestamp)
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });

  // Get standup dates for this team (for calendar coloring)
  const getTeamStandupDates = () => {
    return standups
      .filter(standup => standup.team_id === teamIdNumber)
      .map(standup => standup.date);
  };

  // Get leave dates for this team (for calendar coloring)
  const getTeamLeaveDates = () => {
    const teamMemberIds = members.map(member => member.id);
    return leaves
      .filter(leave => teamMemberIds.includes(leave.member_id) && leave.approved === true)
      .map(leave => leave.date);
  };

  if (!team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <Header 
          title="Team Not Found" 
          user={user} 
          onProfileClick={onProfileClick}
          onBack={onBack}
          showBackButton={true}
        />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Team Not Found</h2>
            <p className="text-gray-600 mb-4">The team you're looking for doesn't exist or you don't have access to it.</p>
            <p className="text-sm text-gray-500 mb-4">Team ID: {teamId}</p>
            <button
              onClick={onBack}
              className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
          </div>
        </main>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleMemberClick = (memberId: string) => {
    if (onMemberClick) {
      onMemberClick(parseInt(memberId), teamIdNumber);
    }
  };

  const handleMembersClick = () => {
    console.log('Navigating to team members for team:', teamIdNumber);
    onMembersClick(teamIdNumber);
  };

  const handleStandupClick = (standupId: number) => {
    // Navigate to edit standup page
    if (onEditStandup) {
      onEditStandup();
    }
  };

  const getTeamColor = (teamId: number) => {
    const colors = [
      'bg-blue-500',
      'bg-emerald-500', 
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500'
    ];
    return colors[teamId % colors.length];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <Header 
        title={team.name}
        showCreateButton 
        onCreateClick={onCreateStandup}
        onProfileClick={onProfileClick}
        onBack={onBack}
        showBackButton={true}
        user={user}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-4 lg:mb-0">
                <div className="flex items-center mb-2">
                  <div className={`${getTeamColor(teamIdNumber)} p-2 rounded-lg mr-3`}>
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{team.name}</h2>
                </div>
                <p className="text-gray-600 mb-3">{team.description}</p>
                <div className="text-sm text-gray-500">
                  {members.length} team members
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {formatDate(selectedDate)}
                </button>
                <button
                  onClick={handleMembersClick}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Team Members
                </button>
              </div>
            </div>
          </div>

          {showCalendar && (
            <div className="mb-6">
              <DatePicker
                selectedDate={selectedDate}
                onDateChange={(date) => {
                  setSelectedDate(date);
                  setShowCalendar(false);
                }}
                standupDates={getTeamStandupDates()}
                leaveDates={getTeamLeaveDates()}
                showStatusColors={false}
              />
            </div>
          )}
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Daily Standups - {formatDate(selectedDate)}
          </h3>
          
          {sortedStandups.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sortedStandups.map(standup => (
                <StandupCard 
                  key={standup.id} 
                  standup={standup} 
                  onMemberClick={handleMemberClick}
                  onStandupClick={handleStandupClick}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
              <div className="text-gray-400 mb-4">
                <CalendarIcon className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No standups for this date
              </h3>
              <p className="text-gray-500 mb-4">
                No team members have submitted their daily standup for {formatDate(selectedDate)}.
              </p>
              {/* <button
                onClick={onCreateStandup}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Create First Standup
              </button> */}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TeamPage;