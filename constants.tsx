
import { Team, Match, LeagueSettings } from './types.ts';

export const MAX_SQUAD_SIZE = 30;

export const DEFAULT_LEAGUE_SETTINGS: LeagueSettings = {
  name: 'LeaguePro',
  season: 'Season 2024',
  logo: '',
  description: 'A comprehensive digital league management application for sports teams.'
};

export const DISCIPLINARY_ACTIONS = {
  YELLOW: [
    'Unsporting Behavior',
    'Dissent by word or action',
    'Persistent Infringement',
    'Delaying restart of play',
    'Distance Infringement (Corner/Free Kick)',
    'Entering/Leaving pitch without permission',
    'Excessive Goal Celebration'
  ],
  RED: [
    'Serious Foul Play',
    'Violent Conduct',
    'Spitting at an opponent',
    'DOGSO (Handball)',
    'DOGSO (Foul)',
    'Offensive/Abusive Language',
    'Second Cautionable Offence'
  ]
};

export const INITIAL_TEAMS: Team[] = [
  {
    id: 't1',
    name: 'Thunder FC',
    logo: 'https://picsum.photos/seed/thunder/100/100',
    manager: 'Alex Ferguson',
    contact: 'alex@thunder.com',
    homeGround: 'Storm Arena',
    players: [],
    isApproved: true
  },
  {
    id: 't2',
    name: 'Lightning United',
    logo: 'https://picsum.photos/seed/lightning/100/100',
    manager: 'Pep Guardiola',
    contact: 'pep@lightning.com',
    homeGround: 'Voltage Stadium',
    players: [],
    isApproved: true
  },
  {
    id: 't3',
    name: 'Gale Warriors',
    logo: 'https://picsum.photos/seed/gale/100/100',
    manager: 'Jurgen Klopp',
    contact: 'jurgen@gale.com',
    homeGround: 'Windy Park',
    players: [],
    isApproved: true
  }
];

export const INITIAL_MATCHES: Match[] = [
  {
    id: 'm1',
    date: '2024-06-01',
    time: '15:00',
    venue: 'Storm Arena',
    homeTeamId: 't1',
    awayTeamId: 't2',
    isCompleted: false,
    matchWeek: 1
  },
  {
    id: 'm2',
    date: '2024-06-02',
    time: '18:00',
    venue: 'Windy Park',
    homeTeamId: 't3',
    awayTeamId: 't1',
    isCompleted: false,
    matchWeek: 2
  }
];
