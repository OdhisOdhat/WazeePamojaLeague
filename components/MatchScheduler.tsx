
import React, { useState, useMemo, useRef } from 'https://esm.sh/react@19.0.0';
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';
import { Match, Team, UserRole, GoalScorer, Player, CardEvent, LeagueSettings } from '../types.ts';
import { DISCIPLINARY_ACTIONS } from '../constants.tsx';

interface MatchSchedulerProps {
  matches: Match[];
  teams: Team[];
  isAdmin: boolean;
  role: UserRole;
  selectedTeamId: string | null;
  onAddMatch: (m: Match) => void;
  onImportMatches: (m: Match[]) => void;
  onUpdateMatch: (id: string, h: number, a: number, scorers: GoalScorer[], cards?: CardEvent[], refereeName?: string, refereeGrade?: string, isCompleted?: boolean, isLive?: boolean, date?: string, time?: string, venue?: string) => void;
  leagueSettings: LeagueSettings;
}

const MatchScheduler: React.FC<MatchSchedulerProps> = ({ 
  matches, 
  teams, 
  isAdmin, 
  role,
  selectedTeamId,
  onAddMatch, 
  onImportMatches,
  onUpdateMatch,
  leagueSettings
}) => {
  const [showAdd, setShowAdd] = useState(false);
  const xlsInputRef = useRef<HTMLInputElement>(null);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [viewingMatchId, setViewingMatchId] = useState<string | null>(null);
  const [scores, setScores] = useState({ home: 0, away: 0 });
  const [currentScorers, setCurrentScorers] = useState<GoalScorer[]>([]);
  const [currentCards, setCurrentCards] = useState<CardEvent[]>([]);
  const [currentReferee, setCurrentReferee] = useState('');
  const [currentRefereeGrade, setCurrentRefereeGrade] = useState('');
  const [isMatchLive, setIsMatchLive] = useState(false);
  const [isMatchCompleted, setIsMatchCompleted] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editVenue, setEditVenue] = useState('');
  const [manualScorerNames, setManualScorerNames] = useState<Record<string, string>>({});
  
  const [newMatch, setNewMatch] = useState<Partial<Match>>({
    date: '',
    time: '',
    venue: '',
    homeTeamId: '',
    awayTeamId: '',
    matchWeek: 1,
    refereeName: '',
    refereeGrade: ''
  });

  const handleXlsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const dataBuffer = evt.target?.result;
        const wb = XLSX.read(dataBuffer, { type: 'array', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        console.log("Imported Raw Data:", data);

        if (data.length === 0) {
          alert("The Excel file seems to be empty.");
          return;
        }

        const importedMatches: Match[] = data.map((row, index) => {
          // Normalize keys to handle case-insensitivity and common variations
          const getVal = (keys: string[]) => {
            const foundKey = Object.keys(row).find(k => keys.includes(k.trim().toLowerCase()));
            return foundKey ? row[foundKey] : undefined;
          };

          const homeName = (getVal(['hometeam', 'home', 'team1']) || '').toString().trim();
          const awayName = (getVal(['awayteam', 'away', 'team2']) || '').toString().trim();
          
          const homeTeam = teams.find(t => t.name.toLowerCase() === homeName.toLowerCase());
          const awayTeam = teams.find(t => t.name.toLowerCase() === awayName.toLowerCase());

          if (!homeTeam || !awayTeam) {
            console.warn(`Row ${index + 1}: Team not found. Home: "${homeName}", Away: "${awayName}"`);
            return null;
          }

          const homeScore = getVal(['homescore', 'score1', 'hscore']);
          const awayScore = getVal(['awayscore', 'score2', 'ascore']);
          const isCompleted = homeScore !== undefined && awayScore !== undefined;

          // Handle Date
          let matchDate = getVal(['date', 'matchdate']);
          if (matchDate instanceof Date) {
            matchDate = matchDate.toISOString().split('T')[0];
          } else if (typeof matchDate === 'number') {
            // Excel serial date
            const date = new Date(Math.round((matchDate - 25569) * 86400 * 1000));
            matchDate = date.toISOString().split('T')[0];
          } else {
            matchDate = (matchDate || new Date().toISOString().split('T')[0]).toString();
          }

          return {
            id: `m-xls-${Date.now()}-${index}`,
            date: matchDate,
            time: (getVal(['time', 'matchtime']) || '15:00').toString(),
            venue: (getVal(['venue', 'stadium', 'pitch']) || homeTeam.homeGround || 'TBD').toString(),
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            homeScore: isCompleted ? parseInt(homeScore.toString()) : undefined,
            awayScore: isCompleted ? parseInt(awayScore.toString()) : undefined,
            isCompleted: isCompleted,
            matchWeek: parseInt((getVal(['week', 'matchweek', 'round']) || '1').toString()),
            refereeName: (getVal(['referee', 'ref', 'official']) || '').toString(),
            refereeGrade: (getVal(['refereegrade', 'grade']) || '').toString()
          };
        }).filter(m => m !== null) as Match[];

        if (importedMatches.length > 0) {
          onImportMatches(importedMatches);
        } else {
          alert("No valid matches found. Please check that team names match exactly and columns are named correctly (HomeTeam, AwayTeam).");
        }
      } catch (err) {
        console.error("XLSX Import Error:", err);
        alert("Error parsing Excel file. Please ensure it is a valid .xlsx or .xls file.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMatch.homeTeamId && newMatch.awayTeamId && newMatch.homeTeamId !== newMatch.awayTeamId) {
      onAddMatch({
        ...newMatch as Match,
        id: `m${Date.now()}`,
        isCompleted: false
      });
      setShowAdd(false);
      setNewMatch({
        date: '',
        time: '',
        venue: '',
        homeTeamId: '',
        awayTeamId: '',
        matchWeek: 1,
        refereeName: '',
        refereeGrade: ''
      });
    }
  };

  const getTeam = (id: string) => teams.find(t => t.id === id);

  const canManageMatch = (match: Match) => {
    if (isAdmin) return true;
    if (role === UserRole.TEAM_MANAGER && selectedTeamId) {
      return match.homeTeamId === selectedTeamId || match.awayTeamId === selectedTeamId;
    }
    return false;
  };

  const startEditing = (e: React.MouseEvent, match: Match) => {
    e.stopPropagation();
    setEditingMatchId(match.id);
    setScores({ home: match.homeScore || 0, away: match.awayScore || 0 });
    setCurrentScorers(match.scorers || []);
    setCurrentCards(match.cards || []);
    setCurrentReferee(match.refereeName || '');
    setCurrentRefereeGrade(match.refereeGrade || '');
    setIsMatchLive(match.isLive || false);
    setIsMatchCompleted(match.isCompleted || false);
    setEditDate(match.date || '');
    setEditTime(match.time || '');
    setEditVenue(match.venue || '');
    setManualScorerNames({});
  };

  const addGoal = (player: Player, teamId: string) => {
    const minute = currentScorers.length > 0 ? Math.min(90, currentScorers[currentScorers.length - 1].minute + 5) : 10;
    setCurrentScorers([...currentScorers, { 
      playerId: player.id, 
      playerName: player.name, 
      teamId, 
      goals: 1, 
      minute 
    }].sort((a, b) => a.minute - b.minute));
  };

  const addManualGoal = (teamId: string) => {
    const name = manualScorerNames[teamId];
    if (!name || !name.trim()) return;
    
    const minute = currentScorers.length > 0 ? Math.min(90, currentScorers[currentScorers.length - 1].minute + 5) : 10;
    setCurrentScorers([...currentScorers, { 
      playerId: `manual-${Date.now()}`, 
      playerName: name.trim(), 
      teamId, 
      goals: 1, 
      minute 
    }].sort((a, b) => a.minute - b.minute));
    
    setManualScorerNames(prev => ({ ...prev, [teamId]: '' }));
  };

  const addCard = (player: Player, teamId: string, type: 'yellow' | 'red', reason?: string) => {
    setCurrentCards([...currentCards, {
      playerId: player.id,
      playerName: player.name,
      teamId,
      type,
      minute: 45,
      reason
    }].sort((a, b) => a.minute - b.minute));
  };

  const updateScorerMinute = (index: number, minute: number) => {
    const updated = [...currentScorers];
    updated[index] = { ...updated[index], minute: Math.max(0, Math.min(120, minute)) };
    setCurrentScorers(updated.sort((a, b) => a.minute - b.minute));
  };

  const updateCardMinute = (index: number, minute: number) => {
    const updated = [...currentCards];
    updated[index] = { ...updated[index], minute: Math.max(0, Math.min(120, minute)) };
    setCurrentCards(updated.sort((a, b) => a.minute - b.minute));
  };

  const saveResult = (match: Match) => {
    onUpdateMatch(match.id, scores.home, scores.away, currentScorers, currentCards, currentReferee, currentRefereeGrade, isMatchCompleted, isMatchLive, editDate, editTime, editVenue);
    setEditingMatchId(null);
  };

  const getPlayerPhoto = (playerId: string) => {
    for (const team of teams) {
      const player = team.players.find(p => p.id === playerId);
      if (player) return player.photoUrl;
    }
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${playerId}`;
  };

  const selectedMatch = matches.find(m => m.id === viewingMatchId);

  const timelineEvents = useMemo(() => {
    if (!selectedMatch) return [];
    const events = [
      ...(selectedMatch.scorers || []).map(s => ({ ...s, eventType: 'goal' as const })),
      ...(selectedMatch.cards || []).map(c => ({ ...c, eventType: 'card' as const }))
    ];
    return events.sort((a, b) => a.minute - b.minute);
  }, [selectedMatch]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Fixtures & Results</h2>
          <p className="text-gray-500">{leagueSettings.name} matches for {leagueSettings.season}.</p>
        </div>
        {isAdmin && (
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <button 
              onClick={() => xlsInputRef.current?.click()}
              className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-green-100 hover:bg-green-700 transition-all flex items-center space-x-2 flex-1 md:flex-none justify-center"
            >
              <i className="fas fa-calendar-plus"></i>
              <span>Import Fixtures</span>
            </button>
            <button 
              onClick={() => xlsInputRef.current?.click()}
              className="bg-blue-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-600 transition-all flex items-center space-x-2 flex-1 md:flex-none justify-center"
            >
              <i className="fas fa-poll-h"></i>
              <span>Upload Results</span>
            </button>
            <input type="file" ref={xlsInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleXlsUpload} />
            <button 
              onClick={() => setShowAdd(!showAdd)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center space-x-2 flex-1 md:flex-none justify-center"
            >
              <i className={`fas ${showAdd ? 'fa-times' : 'fa-plus'}`}></i>
              <span>{showAdd ? 'Cancel' : 'Schedule New Match'}</span>
            </button>
          </div>
        )}
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-blue-100 shadow-2xl grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-300">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Home Team</label>
            <select required className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 font-bold" value={newMatch.homeTeamId} onChange={e => setNewMatch({ ...newMatch, homeTeamId: e.target.value })}>
              <option value="">Select Home</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="space-y-2 text-center flex flex-col justify-center">
            <span className="text-2xl font-black text-gray-200">VS</span>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Away Team</label>
            <select required className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 font-bold" value={newMatch.awayTeamId} onChange={e => setNewMatch({ ...newMatch, awayTeamId: e.target.value })}>
              <option value="">Select Away</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Date & Time</label>
            <div className="flex space-x-2">
              <input type="date" required className="flex-1 border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 font-bold" value={newMatch.date} onChange={e => setNewMatch({ ...newMatch, date: e.target.value })} />
              <input type="time" required className="w-28 border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 font-bold" value={newMatch.time} onChange={e => setNewMatch({ ...newMatch, time: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Venue</label>
            <input type="text" required className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 font-bold" placeholder="Stadium Name" value={newMatch.venue} onChange={e => setNewMatch({ ...newMatch, venue: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Match Week</label>
            <input type="number" min="1" required className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 1" value={newMatch.matchWeek} onChange={e => setNewMatch({ ...newMatch, matchWeek: parseInt(e.target.value) || 1 })} />
          </div>

          <div className="md:col-span-3 bg-blue-50/30 p-6 rounded-[2rem] border border-dashed border-blue-200 space-y-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-user-tie text-blue-600"></i>
              <span className="text-xs font-black text-gray-900 uppercase tracking-widest">Assign Match Official (Admin Only)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Official Name</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white font-bold outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Enter Referee Name..." 
                  value={newMatch.refereeName || ''} 
                  onChange={e => setNewMatch({ ...newMatch, refereeName: e.target.value })} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Official Grade / Class</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white font-bold outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="e.g. National / FIFA / Grade 1" 
                  value={newMatch.refereeGrade || ''} 
                  onChange={e => setNewMatch({ ...newMatch, refereeGrade: e.target.value })} 
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button type="submit" className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 uppercase tracking-widest text-xs">
              Confirm Schedule & Assign Official
            </button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {matches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(match => {
          const isManagerMatch = !isAdmin && role === UserRole.TEAM_MANAGER && (match.homeTeamId === selectedTeamId || match.awayTeamId === selectedTeamId);
          const isEditing = editingMatchId === match.id;
          const homeTeam = getTeam(match.homeTeamId);
          const awayTeam = getTeam(match.awayTeamId);
          
          return (
            <div 
              key={match.id} 
              onClick={() => match.isCompleted && !isEditing && setViewingMatchId(match.id)}
              className={`bg-white rounded-3xl border transition-all relative overflow-hidden flex flex-col ${match.isCompleted && !isEditing ? 'cursor-pointer hover:border-blue-300 hover:shadow-2xl' : ''} ${isManagerMatch ? 'border-blue-200 ring-4 ring-blue-50/50 shadow-xl' : 'border-gray-100'} p-6 group`}
            >
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="flex flex-col items-center md:items-start space-y-1 mb-4 md:mb-0 w-full md:w-1/4">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">WEEK {match.matchWeek}</span>
                  </div>
                  <span className="text-lg font-black text-gray-900">{new Date(match.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-widest">{match.time} • {match.venue}</span>
                    {match.refereeName && (
                      <span className="text-[9px] font-black text-blue-400 uppercase mt-1 flex items-center">
                        <i className="fas fa-user-tie mr-1 text-[8px]"></i> {match.refereeName} {match.refereeGrade && <span className="text-gray-300 ml-1">({match.refereeGrade})</span>}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-4 md:space-x-8 w-full md:w-2/4">
                  <div className="flex flex-col items-center space-y-3 w-1/3 text-center">
                    <img src={homeTeam?.logo} alt="" className="w-14 h-14 rounded-full border-4 border-white shadow-md object-cover" />
                    <span className="text-sm font-black text-gray-900 leading-tight">{homeTeam?.name}</span>
                  </div>

                  <div className="flex flex-col items-center justify-center px-4 min-w-[140px]">
                    {isEditing ? (
                      <div className="flex flex-col items-center space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center space-x-2">
                          <div className="flex flex-col items-center">
                            <label className="text-[8px] font-bold text-gray-400 uppercase">Home</label>
                            <input type="number" min="0" className="w-12 text-center border-2 border-blue-300 rounded-lg font-black py-2 text-blue-700" value={scores.home} onChange={(e) => setScores({ ...scores, home: parseInt(e.target.value) || 0 })} />
                          </div>
                          <span className="font-bold text-blue-300 text-lg mt-4">:</span>
                          <div className="flex flex-col items-center">
                            <label className="text-[8px] font-bold text-gray-400 uppercase">Away</label>
                            <input type="number" min="0" className="w-12 text-center border-2 border-blue-300 rounded-lg font-black py-2 text-blue-700" value={scores.away} onChange={(e) => setScores({ ...scores, away: parseInt(e.target.value) || 0 })} />
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            type="button"
                            onClick={() => { setIsMatchLive(!isMatchLive); if(!isMatchLive) setIsMatchCompleted(false); }}
                            className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${isMatchLive ? 'bg-red-500 text-white border-red-600' : 'bg-white text-gray-400 border-gray-200'}`}
                          >
                            {isMatchLive ? 'Live Now' : 'Mark Live'}
                          </button>
                          <button 
                            type="button"
                            onClick={() => { setIsMatchCompleted(!isMatchCompleted); if(!isMatchCompleted) setIsMatchLive(false); }}
                            className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${isMatchCompleted ? 'bg-green-500 text-white border-green-600' : 'bg-white text-gray-400 border-gray-200'}`}
                          >
                            {isMatchCompleted ? 'Completed' : 'Mark Finished'}
                          </button>
                        </div>
                      </div>
                    ) : match.isLive ? (
                      <div className="flex flex-col items-center">
                        <div className="flex items-center space-x-4 bg-red-50 px-6 py-2 rounded-2xl border border-red-100 animate-pulse">
                          <span className="text-3xl font-black text-red-600">{match.homeScore || 0}</span>
                          <span className="text-red-300 font-bold text-xl">:</span>
                          <span className="text-3xl font-black text-red-600">{match.awayScore || 0}</span>
                        </div>
                        <span className="text-[9px] font-black text-red-500 mt-2 uppercase tracking-widest">LIVE NOW</span>
                      </div>
                    ) : match.isCompleted ? (
                      <div className="flex flex-col items-center">
                        <div className="flex items-center space-x-4 bg-gray-50 px-6 py-2 rounded-2xl border border-gray-100">
                          <span className="text-3xl font-black text-gray-900">{match.homeScore}</span>
                          <span className="text-gray-300 font-bold text-xl">:</span>
                          <span className="text-3xl font-black text-gray-900">{match.awayScore}</span>
                        </div>
                        <span className="text-[9px] font-black text-blue-400 mt-2 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">View Match Center</span>
                      </div>
                    ) : (
                      <div className="bg-gray-100 text-gray-400 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border border-gray-200">UPCOMING</div>
                    )}
                  </div>

                  <div className="flex flex-col items-center space-y-3 w-1/3 text-center">
                    <img src={awayTeam?.logo} alt="" className="w-14 h-14 rounded-full border-4 border-white shadow-md object-cover" />
                    <span className="text-sm font-black text-gray-900 leading-tight">{awayTeam?.name}</span>
                  </div>
                </div>

                <div className="flex justify-center md:justify-end w-full md:w-1/4 mt-6 md:mt-0">
                  {canManageMatch(match) && !isEditing ? (
                    <button onClick={(e) => startEditing(e, match)} className="bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-black hover:bg-green-700 shadow-lg transition-all flex items-center space-x-2">
                      <i className="fas fa-edit"></i>
                      <span>{match.isCompleted ? 'Edit Result' : 'Enter Result'}</span>
                    </button>
                  ) : isEditing ? (
                    <div className="flex space-x-2" onClick={e => e.stopPropagation()}>
                      <button onClick={() => saveResult(match)} className="bg-blue-600 text-white text-xs px-4 py-2 rounded-lg font-black uppercase">Save</button>
                      <button onClick={() => setEditingMatchId(null)} className="bg-white text-gray-500 text-xs px-4 py-2 rounded-lg font-black uppercase border border-gray-200">Cancel</button>
                    </div>
                  ) : match.isCompleted ? (
                    <div className="flex items-center space-x-1.5 bg-green-50 px-4 py-2 rounded-xl">
                      <i className="fas fa-check-double text-green-500 text-xs"></i>
                      <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Verified</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {isEditing && (
                <div className="mt-8 pt-8 border-t border-gray-100 space-y-8 animate-in slide-in-from-bottom-2 duration-300" onClick={e => e.stopPropagation()}>
                  {/* Reschedule Section */}
                  <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100">
                    <div className="flex items-center space-x-2 mb-4">
                      <i className="fas fa-calendar-alt text-amber-600"></i>
                      <span className="text-[10px] font-black text-amber-800 uppercase tracking-[0.2em]">Reschedule Match</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Date</label>
                        <input 
                          type="date" 
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 font-bold focus:ring-2 focus:ring-amber-400 outline-none" 
                          value={editDate} 
                          onChange={(e) => setEditDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Time</label>
                        <input 
                          type="time" 
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 font-bold focus:ring-2 focus:ring-amber-400 outline-none" 
                          value={editTime} 
                          onChange={(e) => setEditTime(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Venue</label>
                        <input 
                          type="text" 
                          placeholder="Change Venue..."
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 font-bold focus:ring-2 focus:ring-amber-400 outline-none" 
                          value={editVenue} 
                          onChange={(e) => setEditVenue(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                      <div className="flex items-center space-x-2 mb-4">
                        <i className="fas fa-user-shield text-blue-600"></i>
                        <span className="text-[10px] font-black text-blue-800 uppercase tracking-[0.2em]">Match Official Assignment</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Official Name</label>
                          <input 
                            type="text" 
                            placeholder="Assign Official..." 
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 font-bold focus:ring-2 focus:ring-blue-400 outline-none" 
                            value={currentReferee} 
                            onChange={(e) => setCurrentReferee(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Official Grade</label>
                          <input 
                            type="text" 
                            placeholder="e.g. FIFA / National" 
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 font-bold focus:ring-2 focus:ring-blue-400 outline-none" 
                            value={currentRefereeGrade} 
                            onChange={(e) => setCurrentRefereeGrade(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {[match.homeTeamId, match.awayTeamId].map((tId) => {
                      const team = getTeam(tId);
                      return (
                        <div key={tId} className="space-y-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <img src={team?.logo} className="w-6 h-6 rounded-full" alt="" />
                            <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-wider">{team?.name} Timeline</h4>
                          </div>
                          
                          <div className="space-y-3">
                            {currentScorers.filter(s => s.teamId === tId).map((s, idx) => (
                              <div key={`g-${idx}`} className="flex items-center justify-between bg-blue-50/40 p-3 rounded-2xl border border-blue-100/50">
                                <div className="flex items-center space-x-4">
                                  <div className="flex flex-col">
                                    <label className="text-[7px] font-black text-blue-400 uppercase ml-1">Min</label>
                                    <input 
                                      type="number" min="0" max="120" className="w-12 text-center bg-white border border-blue-100 rounded-lg font-black py-1 text-xs" 
                                      value={s.minute} onChange={(e) => updateScorerMinute(currentScorers.indexOf(s), parseInt(e.target.value) || 0)}
                                    />
                                  </div>
                                  <i className="fas fa-futbol text-blue-600 text-xs mt-3"></i>
                                  <span className="text-xs font-bold text-gray-700 mt-3">{s.playerName}</span>
                                </div>
                                <button onClick={() => setCurrentScorers(currentScorers.filter((_, i) => i !== currentScorers.indexOf(s)))} className="text-red-400 hover:text-red-600 mt-3"><i className="fas fa-times"></i></button>
                              </div>
                            ))}
                            {currentCards.filter(c => c.teamId === tId).map((c, idx) => (
                              <div key={`c-${idx}`} className="flex items-center justify-between bg-orange-50/40 p-3 rounded-2xl border border-orange-100/50">
                                <div className="flex items-center space-x-4">
                                  <div className="flex flex-col">
                                    <label className="text-[7px] font-black text-orange-400 uppercase ml-1">Min</label>
                                    <input 
                                      type="number" min="0" max="120" className="w-12 text-center bg-white border border-orange-100 rounded-lg font-black py-1 text-xs" 
                                      value={c.minute} onChange={(e) => updateCardMinute(currentCards.indexOf(c), parseInt(e.target.value) || 0)}
                                    />
                                  </div>
                                  <i className={`fas fa-square text-${c.type === 'yellow' ? 'yellow' : 'red'}-500 text-xs mt-3`}></i>
                                  <div className="flex flex-col mt-3">
                                    <span className="text-xs font-bold text-gray-700 leading-none">{c.playerName}</span>
                                    {c.reason && <span className="text-[8px] font-black uppercase text-gray-400 tracking-tighter mt-1">{c.reason}</span>}
                                  </div>
                                </div>
                                <button onClick={() => setCurrentCards(currentCards.filter((_, i) => i !== currentCards.indexOf(c)))} className="text-red-400 hover:text-red-600 mt-3"><i className="fas fa-times"></i></button>
                              </div>
                            ))}

                            <div className="pt-2 flex flex-col space-y-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Registered Squad Selection</label>
                                <select className="w-full text-xs font-bold border-2 border-gray-100 rounded-xl p-2 bg-gray-50 outline-none" onChange={(e) => {
                                  const p = team?.players.find(p => p.id === e.target.value);
                                  if (p) addGoal(p, tId);
                                  e.target.value = "";
                                }}>
                                  <option value="">+ Record Goal Scorer...</option>
                                  {team?.players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Manual Goal Scorer Entry</label>
                                <div className="flex space-x-2">
                                  <input 
                                    type="text" 
                                    placeholder="Enter scorer name..." 
                                    className="flex-1 text-xs font-bold border-2 border-gray-100 rounded-xl p-2 bg-gray-50 outline-none focus:border-blue-300 transition-colors"
                                    value={manualScorerNames[tId] || ''}
                                    onChange={(e) => setManualScorerNames(prev => ({ ...prev, [tId]: e.target.value }))}
                                    onKeyDown={(e) => e.key === 'Enter' && addManualGoal(tId)}
                                  />
                                  <button 
                                    type="button"
                                    onClick={() => addManualGoal(tId)}
                                    className="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all shadow-md"
                                  >
                                    <i className="fas fa-plus text-xs"></i>
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-1 pt-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Disciplinary Actions</label>
                                <div className="grid grid-cols-1 gap-2">
                                  <select className="w-full text-xs font-bold border-2 border-gray-100 rounded-xl p-2 bg-gray-50 outline-none" onChange={(e) => {
                                    const [pId, type, reason] = e.target.value.split('|');
                                    const p = team?.players.find(p => p.id === pId);
                                    if (p) addCard(p, tId, type as 'yellow' | 'red', reason);
                                    e.target.value = "";
                                  }}>
                                    <option value="">+ Record Infraction...</option>
                                    <optgroup label="Yellow Cards">
                                      {team?.players.map(p => (
                                        DISCIPLINARY_ACTIONS.YELLOW.map(reason => (
                                          <option key={`${p.id}-y-${reason}`} value={`${p.id}|yellow|${reason}`}>{p.name}: {reason}</option>
                                        ))
                                      ))}
                                    </optgroup>
                                    <optgroup label="Red Cards">
                                      {team?.players.map(p => (
                                        DISCIPLINARY_ACTIONS.RED.map(reason => (
                                          <option key={`${p.id}-r-${reason}`} value={`${p.id}|red|${reason}`}>{p.name}: {reason}</option>
                                        ))
                                      ))}
                                    </optgroup>
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {viewingMatchId && selectedMatch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300 my-8">
            <div className="bg-gradient-to-br from-gray-900 to-blue-900 p-10 text-white relative">
              <button 
                onClick={() => setViewingMatchId(null)} 
                className="absolute top-8 right-8 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all"
              >
                <i className="fas fa-times"></i>
              </button>
              
              <div className="text-center space-y-2 mb-8">
                <span className="text-[10px] font-black text-blue-300 uppercase tracking-[0.3em]">{leagueSettings.season} • Matchweek {selectedMatch.matchWeek}</span>
                <p className="text-sm font-bold text-gray-400">{selectedMatch.venue}</p>
                {selectedMatch.refereeName && (
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 mt-2">
                    <i className="fas fa-user-tie text-[10px] text-blue-400"></i>
                    <span className="text-[10px] font-black uppercase tracking-widest">Referee: {selectedMatch.refereeName} {selectedMatch.refereeGrade && `(${selectedMatch.refereeGrade})`}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col items-center space-y-4 w-1/3">
                  <img src={getTeam(selectedMatch.homeTeamId)?.logo} className="w-20 h-20 rounded-full border-4 border-white/20 shadow-2xl object-cover" alt="" />
                  <h3 className="text-xl font-black tracking-tight text-center leading-tight">{getTeam(selectedMatch.homeTeamId)?.name}</h3>
                </div>
                
                <div className="flex flex-col items-center justify-center px-4 w-1/3">
                  <div className="flex items-center space-x-6">
                    <span className="text-6xl font-black tracking-tighter">{selectedMatch.homeScore}</span>
                    <span className="text-4xl font-black text-white/20">-</span>
                    <span className="text-6xl font-black tracking-tighter">{selectedMatch.awayScore}</span>
                  </div>
                  <div className="mt-4 px-4 py-1.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-[10px] font-black tracking-widest uppercase">Full Time</div>
                </div>

                <div className="flex flex-col items-center space-y-4 w-1/3">
                  <img src={getTeam(selectedMatch.awayTeamId)?.logo} className="w-20 h-20 rounded-full border-4 border-white/20 shadow-2xl object-cover" alt="" />
                  <h3 className="text-xl font-black tracking-tight text-center leading-tight">{getTeam(selectedMatch.awayTeamId)?.name}</h3>
                </div>
              </div>
            </div>

            <div className="p-10 bg-gray-50">
              <h4 className="text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-10">Match Timeline</h4>
              
              <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                {timelineEvents.map((event, idx) => {
                  const isHome = event.teamId === selectedMatch.homeTeamId;
                  const isCard = 'type' in event;
                  
                  return (
                    <div key={idx} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group animate-in slide-in-from-bottom-4`} style={{ animationDelay: `${idx * 100}ms` }}>
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full border border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${
                        'eventType' in event && event.eventType === 'goal' ? 'bg-blue-600 text-white' : 
                        isCard && (event as CardEvent).type === 'yellow' ? 'bg-yellow-400 text-yellow-900' : 'bg-red-500 text-white'
                      }`}>
                        <span className="text-[10px] font-black">{event.minute}'</span>
                      </div>
                      
                      <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-white border border-gray-100 shadow-sm transition-all hover:shadow-md ${isHome ? 'md:ml-auto' : 'md:mr-auto'}`}>
                        <div className="flex items-center space-x-3">
                          <img src={getPlayerPhoto(event.playerId)} className="w-8 h-8 rounded-full border border-gray-100" alt="" />
                          <div className="flex-1">
                            <p className="text-sm font-black text-gray-900">{event.playerName}</p>
                            <div className="flex items-center flex-wrap gap-1.5 mt-1">
                              { 'eventType' in event && event.eventType === 'goal' ? (
                                <>
                                  <i className="fas fa-futbol text-[10px] text-blue-500"></i>
                                  <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Goal Scored</span>
                                </>
                              ) : (
                                <>
                                  <i className={`fas fa-square text-[10px] text-${(event as CardEvent).type === 'yellow' ? 'yellow' : 'red'}-500`}></i>
                                  <span className={`text-[9px] font-black text-${(event as CardEvent).type === 'yellow' ? 'yellow' : 'red'}-600 uppercase tracking-widest`}>{(event as CardEvent).type} Card</span>
                                  { (event as CardEvent).reason && (
                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded bg-${(event as CardEvent).type === 'yellow' ? 'yellow' : 'red'}-50 text-${(event as CardEvent).type === 'yellow' ? 'yellow' : 'red'}-700 border border-${(event as CardEvent).type === 'yellow' ? 'yellow' : 'red'}-100`}>
                                      {(event as CardEvent).reason}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {timelineEvents.length === 0 && (
                  <div className="text-center py-20 text-gray-400 italic">No significant match events recorded.</div>
                )}
              </div>

              <div className="mt-12 text-center">
                <button 
                  onClick={() => setViewingMatchId(null)}
                  className="bg-white text-gray-900 border border-gray-200 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"
                >
                  Close Match Center
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchScheduler;
