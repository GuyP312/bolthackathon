import React from 'react';
import { Users, Calendar, Plus, Settings, Edit, LogOut, FileText, CheckCircle, ArrowLeft, Brain } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '../../context/NavigationContext';
import { AuthUser } from '../../types';

interface HeaderProps {
  title: string;
  showCreateButton?: boolean;
  onCreateClick?: () => void;
  onProfileClick?: () => void;
  onBack?: () => void;
  user: AuthUser | null;
  children?: React.ReactNode;
  showBackButton?: boolean;
  onAIEmployeeMatcherClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  showCreateButton = false, 
  onCreateClick,
  onProfileClick,
  onBack,
  user,
  children,
  showBackButton = false,
  onAIEmployeeMatcherClick
}) => {
  const { logout } = useAuth();
  const { getTodaysStandupByMember, shouldSkipStandup, getUserLeaveStatus } = useApp();
  const { getBackButtonText } = useNavigation();

  // Check if current user has today's standup
  const hasStandupToday = user ? getTodaysStandupByMember(user.id) : null;
  
  // Check if user should skip standup today (on approved leave)
  const skipStandupToday = user ? shouldSkipStandup(user.id) : false;
  
  // Get leave status for today
  const leaveStatus = user ? getUserLeaveStatus(user.id) : { onLeave: false };

  const getCreateButtonText = () => {
    if (skipStandupToday) {
      return "On Leave Today";
    }
    if (hasStandupToday) {
      return "Edit Daily Standup";
    }
    return "Create Daily Standup";
  };

  const getCreateButtonIcon = () => {
    if (skipStandupToday) {
      return <CheckCircle className="h-4 w-4 mr-2" />;
    }
    if (hasStandupToday) {
      return <Edit className="h-4 w-4 mr-2" />;
    }
    return <Plus className="h-4 w-4 mr-2" />;
  };

  const getCreateButtonClasses = () => {
    if (skipStandupToday) {
      return "inline-flex items-center px-4 py-2 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-md bg-green-500 text-white cursor-default";
    }
    if (hasStandupToday) {
      return "inline-flex items-center px-4 py-2 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700";
    }
    return "inline-flex items-center px-4 py-2 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700";
  };

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  const handleCreateClick = () => {
    if (!skipStandupToday && onCreateClick) {
      onCreateClick();
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            </div>
            
            {/* Dynamic Back Button - Matching the inspected design */}
            {(showBackButton || onBack) && (
              <button
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                {getBackButtonText()}
              </button>
            )}
            
            {children}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* AI Employee Matcher Button for Mentors */}
            {user?.role === 'mentor' && onAIEmployeeMatcherClick && (
              <button
                onClick={onAIEmployeeMatcherClick}
                className="inline-flex items-center px-4 py-2 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
              >
                <Brain className="h-4 w-4 mr-2" />
                AI Matcher
              </button>
            )}

            {showCreateButton && (
              <div className="relative">
                <button
                  onClick={handleCreateClick}
                  disabled={skipStandupToday}
                  className={getCreateButtonClasses()}
                  title={skipStandupToday ? `On ${leaveStatus.leaveType} leave: ${leaveStatus.reason}` : undefined}
                >
                  {getCreateButtonIcon()}
                  {getCreateButtonText()}
                </button>
                
                {skipStandupToday && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    On {leaveStatus.leaveType} leave - No standup required
                  </div>
                )}
              </div>
            )}
            
            {user && (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
                <div className="relative group">
                  <button
                    onClick={onProfileClick}
                    className="flex items-center space-x-2 hover:bg-gray-50 rounded-lg p-2 transition-colors duration-200"
                  >
                    
                    {user.profile_picture ? (


                      <img


                        src={user.profile_picture}


                        alt={user.name}


                        className="h-10 w-10 rounded-full object-cover ring-2 ring-gray-200"


                      />


                    ) : (


                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center ring-2 ring-gray-200">


                        <span className="text-white font-medium text-sm">


                          {user.name.charAt(0).toUpperCase()}


                        </span>


                      </div>


                    )}
                    <Settings className="h-4 w-4 text-gray-400" />
                  </button>
                  
                  {/* Dropdown menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1">
                      <button
                        onClick={onProfileClick}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Profile & Settings
                      </button>
                      {user.role === 'mentor' && onAIEmployeeMatcherClick && (
                        <button
                          onClick={onAIEmployeeMatcherClick}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                        >
                          <Brain className="h-4 w-4 mr-2" />
                          AI Employee Matcher
                        </button>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;