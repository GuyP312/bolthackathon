import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import TeamPage from './pages/TeamPage';
import TeamMembersPage from './pages/TeamMembersPage';
import MemberDetailPage from './pages/MemberDetailPage';
import CreateStandupPage from './pages/CreateStandupPage';
import ProfilePage from './pages/ProfilePage';
import LeaveManagementPage from './pages/LeaveManagementPage';
import MentorTraineesPage from './pages/MentorTraineesPage';
import AIEmployeeMatcherPage from './pages/AIEmployeeMatcherPage';
import SemanticSearchPage from './pages/SemanticSearchPage';

type Page = 
  | { type: 'login' }
  | { type: 'register' }
  | { type: 'home' }
  | { type: 'team'; teamId: number }
  | { type: 'team-members'; teamId: number }
  | { type: 'member-detail'; memberId: number; teamId: number }
  | { type: 'create-standup' }
  | { type: 'profile' }
  | { type: 'leave-management' }
  | { type: 'mentor-trainees' }
  | { type: 'ai-employee-matcher' }
  | { type: 'semantic-search' };

function AppContent() {
  const { user, loading } = useAuth();
  const { pushToHistory, goBack } = useNavigation();
  const [currentPage, setCurrentPage] = useState<Page>({ type: 'login' });

  const navigateToPage = (page: Page) => {
    // Track navigation history
    pushToHistory(page.type + (page.type === 'team' ? `-${(page as any).teamId}` : 
                              page.type === 'team-members' ? `-${(page as any).teamId}` : 
                              page.type === 'member-detail' ? `-${(page as any).memberId}-${(page as any).teamId}` : ''));
    setCurrentPage(page);
  };

  const handleDynamicBack = () => {
    const previousPage = goBack();
    
    if (!previousPage) {
      setCurrentPage({ type: 'home' });
      return;
    }

    // Parse the previous page string and navigate accordingly
    if (previousPage === 'home') {
      setCurrentPage({ type: 'home' });
    } else if (previousPage === 'profile') {
      setCurrentPage({ type: 'profile' });
    } else if (previousPage === 'leave-management') {
      setCurrentPage({ type: 'leave-management' });
    } else if (previousPage === 'mentor-trainees') {
      setCurrentPage({ type: 'mentor-trainees' });
    } else if (previousPage === 'create-standup') {
      setCurrentPage({ type: 'create-standup' });
    } else if (previousPage === 'ai-employee-matcher') {
      setCurrentPage({ type: 'ai-employee-matcher' });
    } else if (previousPage === 'semantic-search') {
      setCurrentPage({ type: 'semantic-search' });
    } else if (previousPage.startsWith('team-members-')) {
      const teamId = parseInt(previousPage.split('-')[2]);
      setCurrentPage({ type: 'team-members', teamId });
    } else if (previousPage.startsWith('member-detail-')) {
      const parts = previousPage.split('-');
      const memberId = parseInt(parts[2]);
      const teamId = parseInt(parts[3]);
      setCurrentPage({ type: 'member-detail', memberId, teamId });
    } else if (previousPage.startsWith('team-')) {
      const teamId = parseInt(previousPage.split('-')[1]);
      setCurrentPage({ type: 'team', teamId });
    } else {
      // Fallback to home
      setCurrentPage({ type: 'home' });
    }
  };

  const navigateToLogin = () => navigateToPage({ type: 'login' });
  const navigateToRegister = () => navigateToPage({ type: 'register' });
  const navigateToHome = () => navigateToPage({ type: 'home' });
  const navigateToTeam = (teamId: number) => navigateToPage({ type: 'team', teamId });
  const navigateToTeamMembers = (teamId: number) => {
    console.log('Navigating to team members page for team ID:', teamId);
    navigateToPage({ type: 'team-members', teamId });
  };
  const navigateToMemberDetail = (memberId: number, teamId: number) => navigateToPage({ type: 'member-detail', memberId, teamId });
  const navigateToCreateStandup = () => navigateToPage({ type: 'create-standup' });
  const navigateToProfile = () => navigateToPage({ type: 'profile' });
  const navigateToLeaveManagement = () => navigateToPage({ type: 'leave-management' });
  const navigateToMentorTrainees = () => navigateToPage({ type: 'mentor-trainees' });
  const navigateToAIEmployeeMatcher = () => navigateToPage({ type: 'ai-employee-matcher' });
  const navigateToSemanticSearch = () => navigateToPage({ type: 'semantic-search' });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show auth pages
  if (!user) {
    switch (currentPage.type) {
      case 'register':
        return (
          <RegisterPage
            onRegisterSuccess={navigateToHome}
            onBackToLogin={navigateToLogin}
          />
        );
      default:
        return (
          <LoginPage
            onLoginSuccess={navigateToHome}
            onNavigateToRegister={navigateToRegister}
          />
        );
    }
  }

  // If user is authenticated, show app pages
  switch (currentPage.type) {
    case 'team':
      return (
        <TeamPage
          teamId={currentPage.teamId.toString()}
          onBack={handleDynamicBack}
          onMembersClick={navigateToTeamMembers}
          onCreateStandup={navigateToCreateStandup}
          onMemberClick={navigateToMemberDetail}
          onProfileClick={navigateToProfile}
          onEditStandup={navigateToCreateStandup}
        />
      );
    case 'team-members':
      return (
        <TeamMembersPage
          teamId={currentPage.teamId.toString()}
          onBack={handleDynamicBack}
          onMemberClick={(memberId) => navigateToMemberDetail(parseInt(memberId), currentPage.teamId)}
          onProfileClick={navigateToProfile}
        />
      );
    case 'member-detail':
      return (
        <MemberDetailPage
          memberId={currentPage.memberId.toString()}
          onBack={handleDynamicBack}
          onProfileClick={navigateToProfile}
        />
      );
    case 'create-standup':
      return (
        <CreateStandupPage
          onBack={handleDynamicBack}
          onSuccess={handleDynamicBack}
          onProfileClick={navigateToProfile}
        />
      );
    case 'profile':
      return (
        <ProfilePage
          onBack={handleDynamicBack}
          onLeaveManagement={navigateToLeaveManagement}
          onProfileClick={navigateToProfile}
          onTeamClick={navigateToTeam}
        />
      );
    case 'leave-management':
      return (
        <LeaveManagementPage
          onBack={handleDynamicBack}
          onProfileClick={navigateToProfile}
        />
      );
    case 'mentor-trainees':
      return (
        <MentorTraineesPage
          onBack={handleDynamicBack}
          onProfileClick={navigateToProfile}
        />
      );
    case 'ai-employee-matcher':
      return (
        <AIEmployeeMatcherPage
          onBack={handleDynamicBack}
          onProfileClick={navigateToProfile}
        />
      );
    case 'semantic-search':
      return (
        <SemanticSearchPage
          onBack={handleDynamicBack}
          onProfileClick={navigateToProfile}
        />
      );
    default:
      return (
        <HomePage
          onTeamClick={navigateToTeam}
          onCreateStandup={navigateToCreateStandup}
          onProfileClick={navigateToProfile}
          onMentorTraineesClick={navigateToMentorTrainees}
          onLeaveManagementClick={navigateToLeaveManagement}
          onAIEmployeeMatcherClick={navigateToAIEmployeeMatcher}
          onSemanticSearchClick={navigateToSemanticSearch}
        />
      );
  }
}

function App() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <AppProvider>
          <div className="App">
            <AppContent />
          </div>
        </AppProvider>
      </NavigationProvider>
    </AuthProvider>
  );
}

export default App;