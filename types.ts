
export interface Player {
  id: string;
  name: string;
  jerseyNumber: number;
  position: string;
  age: number;
  photoUrl: string;
  goals: number;
  assists: number;
  appearances: number;
}

export interface Team {
  id: string;
  name: string;
  logo: string;
  manager: string;
  contact: string;
  homeGround: string;
  players: Player[];
  isApproved: boolean;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  date: string;
  important: boolean;
}

export interface Ad {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
}

export interface GoalScorer {
  playerId: string;
  playerName: string;
  teamId: string;
  goals: number;
  minute: number; 
}

export interface CardEvent {
  playerId: string;
  playerName: string;
  teamId: string;
  type: 'yellow' | 'red';
  minute: number;
  reason?: string;
}

export interface Match {
  id: string;
  date: string;
  time: string;
  venue: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore?: number;
  awayScore?: number;
  scorers?: GoalScorer[];
  cards?: CardEvent[];
  isCompleted: boolean;
  isLive?: boolean;
  status?: 'scheduled' | 'live' | 'finished' | 'postponed';
  matchWeek: number;
  refereeName?: string;
  refereeGrade?: string;
}

export interface Standing {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface StandingOverride {
  teamId: string;
  pointsAdjustment: number;
  goalsForAdjustment: number;
  goalsAgainstAdjustment: number;
  playedAdjustment: number;
  wonAdjustment: number;
  drawnAdjustment: number;
  lostAdjustment: number;
}

export interface LeagueSettings {
  name: string;
  season: string;
  logo: string;
  description: string;
  standingOverrides?: StandingOverride[];
}

export enum UserRole {
  PUBLIC = 'PUBLIC',
  GUEST = 'GUEST',
  TEAM_MANAGER = 'TEAM_MANAGER',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  teamId?: string;
  isApproved: boolean;
}
