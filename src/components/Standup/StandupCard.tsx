import React from 'react';
import { Clock, User, AlertCircle, Target, Check, Square, Edit } from 'lucide-react';
import { Standup } from '../../types';
import { useApp } from '../../context/AppContext';

interface StandupCardProps {
  standup: Standup;
  onMemberClick?: (memberId: string) => void;
  onStandupClick?: (standupId: number) => void;
}

const StandupCard: React.FC<StandupCardProps> = ({ standup, onMemberClick, onStandupClick }) => {
  const { toggleTaskCompletion, currentUser } = useApp();
  
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleMemberClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMemberClick) {
      onMemberClick(standup.memberId);
    }
  };

  const handleStandupClick = () => {
    // Only allow clicking on own standups
    if (currentUser?.id === standup.member_id && onStandupClick) {
      onStandupClick(standup.id);
    }
  };

  const handleTaskToggle = async (e: React.MouseEvent, taskIndex: number) => {
    e.stopPropagation();
    // Only allow the standup owner to toggle tasks
    if (currentUser?.id === standup.member_id) {
      const result = await toggleTaskCompletion(standup.id, taskIndex);
      if (!result.success) {
        console.error('Failed to toggle task:', result.error);
      }
    }
  };

  const canEditTasks = currentUser?.id === standup.member_id;
  const isOwnStandup = currentUser?.id === standup.member_id;
  
  // Safely access tasks with fallback to empty array
  const tasks = standup.tasks || [];
  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;

  return (
    <div 
      className={`bg-white rounded-lg shadow-md border border-gray-200 p-6 transition-all duration-200 ${
        isOwnStandup 
          ? 'hover:shadow-lg hover:border-blue-300 cursor-pointer ring-2 ring-blue-100' 
          : 'hover:shadow-lg'
      }`}
      onClick={isOwnStandup ? handleStandupClick : undefined}
    >
      <div className="flex items-center justify-between mb-4">
        <div 
          className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors duration-200"
          onClick={handleMemberClick}
        >
          <img
            src={standup.memberAvatar}
            alt={standup.memberName}
            className="h-10 w-10 rounded-full ring-2 ring-gray-200 object-cover"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-200">
                {standup.memberName}
              </h3>
              {isOwnStandup && (
                <div className="flex items-center space-x-1">
                  <Edit className="h-4 w-4 text-blue-500" />
                  <span className="text-xs text-blue-600 font-medium">Click to edit</span>
                </div>
              )}
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              {formatTime(standup.timestamp)}
            </div>
          </div>
        </div>
        
        {totalTasks > 0 && (
          <div className="text-sm text-gray-500">
            <span className="font-medium text-green-600">{completedTasks}</span>
            <span className="mx-1">/</span>
            <span>{totalTasks}</span>
            <span className="ml-1">tasks</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="border-l-4 border-blue-400 pl-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Target className="h-4 w-4 text-blue-500 mr-2" />
              <h4 className="font-medium text-gray-900">Today's Tasks</h4>
            </div>
            {totalTasks > 0 && (
              <div className="text-xs text-gray-500">
                {Math.round((completedTasks / totalTasks) * 100)}% complete
              </div>
            )}
          </div>
          
          {tasks.length > 0 ? (
            <div className="space-y-2">
              {tasks.map((task, index) => (
                <div 
                  key={task.id} 
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 ${
                    task.completed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  } ${canEditTasks ? 'hover:shadow-sm' : ''}`}
                >
                  <div 
                    className={`flex-shrink-0 ${canEditTasks ? 'cursor-pointer' : 'cursor-default'}`}
                    onClick={canEditTasks ? (e) => handleTaskToggle(e, index) : undefined}
                  >
                    {task.completed ? (
                      <div className="w-5 h-5 bg-green-500 rounded border-2 border-green-500 flex items-center justify-center transition-colors duration-200">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    ) : (
                      <div className={`w-5 h-5 border-2 border-gray-300 rounded transition-colors duration-200 ${
                        canEditTasks ? 'hover:border-green-400' : ''
                      }`}>
                        <Square className="h-5 w-5 text-transparent" />
                      </div>
                    )}
                  </div>
                  <span className={`flex-1 text-sm leading-relaxed transition-all duration-200 ${
                    task.completed 
                      ? 'text-green-800 font-medium'
                      : 'text-gray-800'
                  }`}>
                    {task.text}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    #{index + 1}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">No tasks added</p>
          )}
        </div>

        {standup.blockers && (
          <div className="border-l-4 border-red-400 pl-4">
            <div className="flex items-center mb-2">
              <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
              <h4 className="font-medium text-gray-900">Blockers & Challenges</h4>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">{standup.blockers}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StandupCard;