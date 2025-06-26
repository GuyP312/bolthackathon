export interface Team {
  id: number;
  name: string;
  description: string;
  profile_picture?: string; // Add profile_picture field
}

export interface Member {
  id: number;
  name: string;
  email: string;
  phone?: string;
  internship_start?: string;
  internship_end?: string;
  team_id: number;
  role: 'trainee' | 'mentor';
  username: string;
  password?: string;
  admin: boolean;
  mentor_id?: number; // Add mentor_id field
  team?: Team;
  description?: string; // Add description field
  skills?: string[]; // Add skills field
  profile_picture?: string; // Add profile_picture field
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  profile_picture?: string; // Add profile_picture field
}

export interface Standup {
  id: number;
  member_id: number;
  team_id: number;
  date: string;
  content: string[];
  content_stat: boolean[];
  created_at: string;
  member?: Member;
  team?: Team;
  // Add computed properties for compatibility with StandupCard
  tasks: Task[];
  blockers: string;
  memberId: string;
  memberName: string;
  memberAvatar: string;
  timestamp: string;
}

export interface Leave {
  id: number;
  member_id: number;
  team_id: number;
  date: string;
  reason: string;
  type: 'sick' | 'personal' | 'other';
  approved: boolean;
  member?: Member;
  team?: Team;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  username: string;
  role: 'trainee' | 'mentor';
  admin: boolean;
  team_id: number;
  mentor_id?: number; // Add mentor_id field
  team?: Team;
  description?: string; // Add description field
  skills?: string[]; // Add skills field
  profile_picture?: string; // Add profile_picture field
}

export interface TeamMember {


  id: string;


  name: string;


  email: string;


  avatar: string;


  role: string;


  teamId: string;


  joinDate: string;


  position: 'full-time' | 'intern' | 'contractor';


  internshipStart?: string;


  internshipEnd?: string;


  profile_picture?: string;


}

export interface User {


  id: string;


  name: string;


  email: string;


  avatar: string;


  role: string;
}


export interface teamMembership {


    id: string;


    teamId: string;


    role: string;


    joinDate: string;


    position: string;


  }