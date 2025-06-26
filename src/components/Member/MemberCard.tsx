import React from 'react';
import { Mail, Calendar, User, Briefcase, Clock } from 'lucide-react';
import { TeamMember } from '../../types';

interface MemberCardProps {
  member: TeamMember;
  onClick: () => void;
  standupCount?: number;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, onClick, standupCount = 0 }) => {
  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], { 
      year: 'numeric', 
      month: 'short',
      day: 'numeric'
    });
  };

  const getPositionBadge = () => {
    switch (member.position) {
      case 'intern':
        return (
          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
            <User className="h-3 w-3 mr-1" />
            Intern
          </div>
        );
      case 'contractor':
        return (
          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
            <Briefcase className="h-3 w-3 mr-1" />
            Contractor
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
            <Briefcase className="h-3 w-3 mr-1" />
            Full-time
          </div>
        );
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer group"
    >
      <div className="flex items-center mb-4">
        <img
          src={member.profile_picture || member.avatar}
          alt={member.name}
          className="h-16 w-16 rounded-full ring-4 ring-gray-100 group-hover:ring-blue-200 transition-all duration-200"
        />
        <div className="ml-4 flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
            {getPositionBadge()}
          </div>
          <p className="text-sm text-gray-600 font-medium">{member.role}</p>
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-500">
        <div className="flex items-center">
          <Mail className="h-4 w-4 mr-2" />
          {member.email}
        </div>
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2" />
          Joined {formatJoinDate(member.joinDate)}
        </div>
        {member.position === 'intern' && member.internshipStart && member.internshipEnd && (
          <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mt-3">
            <div className="flex items-center mb-2">
              <Clock className="h-4 w-4 text-orange-600 mr-2" />
              <span className="text-orange-800 font-medium text-xs">Internship Period</span>
            </div>
            <div className="text-xs text-orange-700 space-y-1">
              <div>{formatDate(member.internshipStart)} - {formatDate(member.internshipEnd)}</div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="text-sm font-medium text-blue-600 group-hover:text-blue-700">
          View Details →
        </div>
      </div>
    </div>
  );
};

export default MemberCard;