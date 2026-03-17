
import React, { useState, useRef } from 'https://esm.sh/react@19.0.0';
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';
import { Team, Match, Standing, GoalScorer, LeagueSettings, NewsItem, Ad, StandingOverride, User, UserRole } from '../types.ts';

interface AdminPanelProps {
  teams: Team[];
  matches: Match[];
  standings: Standing[];
  news: NewsItem[];
  ads: Ad[];
  users: User[];
  leagueSettings: LeagueSettings;
  onUpdateLeagueSettings: (settings: LeagueSettings) => void;
  onUpdateMatch: (id: string, h: number, a: number, scorers: GoalScorer[], cards?: any[], refereeName?: string, refereeGrade?: string, isCompleted?: boolean, isLive?: boolean, date?: string, time?: string, venue?: string, status?: 'scheduled' | 'live' | 'finished' | 'postponed') => void;
  onUpdateTeam?: (updatedTeam: Team) => void;
  onApproveTeam?: (id: string) => void;
  onSaveNews: (item: NewsItem) => void;
  onDeleteNews: (id: string) => void;
  onDeleteNewsItems?: (ids: string[]) => void;
  onSaveAd: (ad: Ad) => void;
  onDeleteAd: (id: string) => void;
  onDeleteAds?: (ids: string[]) => void;
  onRegisterTeam: () => void;
  onManageSquad: (teamId: string) => void;
  onReset: () => void;
  onImportState?: (data: any) => void;
  onImportMatches: (matches: Match[]) => void;
  onUpdateStandingOverrides: (overrides: StandingOverride[]) => void;
  onUpdateUserStatus: (id: string, isApproved: boolean, role?: UserRole) => void;
  onDeleteUser: (id: string) => void;
  onDeleteTeam?: (id: string) => void;
  dbLogs?: string[];
  onForceSync?: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  teams, matches, standings, news, ads, users, leagueSettings, onUpdateLeagueSettings, onUpdateTeam, onApproveTeam, onSaveNews, onDeleteNews, onDeleteNewsItems, onSaveAd, onDeleteAd, onDeleteAds, onRegisterTeam, onManageSquad, onReset, dbLogs, onForceSync, onImportMatches, onUpdateStandingOverrides, onUpdateUserStatus, onDeleteUser, onDeleteTeam 
}) => {
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [settingsForm, setSettingsForm] = useState<LeagueSettings>(leagueSettings);
  const [selectedNewsIds, setSelectedNewsIds] = useState<string[]>([]);
  const [selectedAdIds, setSelectedAdIds] = useState<string[]>([]);
  const [teamSearch, setTeamSearch] = useState('');
  const [newsForm, setNewsForm] = useState<Partial<NewsItem>>({
    title: '', content: '', imageUrl: '', important: false
  });
  const [adForm, setAdForm] = useState<Partial<Ad>>({
    title: '', description: '', imageUrl: '', linkUrl: '', isActive: true
  });
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    branding: false,
    cloud: true,
    members: false,
    news: false,
    ads: false,
    users: true,
    fixtures: true,
    standings: false,
    pendingTeams: true
  });
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const newsImgRef = useRef<HTMLInputElement>(null);
  const adImgRef = useRef<HTMLInputElement>(null);
  const xlsInputRef = useRef<HTMLInputElement>(null);

  const [overrides, setOverrides] = useState<StandingOverride[]>(leagueSettings.standingOverrides || []);

  const downloadFixturesTemplate = () => {
    const data = [
      { HomeTeam: 'Team A', AwayTeam: 'Team B', Date: '2024-05-20', Time: '15:00', Venue: 'Stadium X', Week: 1 },
      { HomeTeam: 'Team C', AwayTeam: 'Team D', Date: '2024-05-21', Time: '16:30', Venue: 'Stadium Y', Week: 1 }
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fixtures");
    XLSX.writeFile(wb, "LeaguePro_Fixtures_Template.xlsx");
  };

  const downloadResultsTemplate = () => {
    const data = [
      { HomeTeam: 'Team A', AwayTeam: 'Team B', HomeScore: 2, AwayScore: 1, Referee: 'John Doe', RefereeGrade: 'Level 1', Date: '2024-05-20' },
      { HomeTeam: 'Team C', AwayTeam: 'Team D', HomeScore: 0, AwayScore: 0, Referee: 'Jane Smith', RefereeGrade: 'Level 2', Date: '2024-05-21' }
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, "LeaguePro_Results_Template.xlsx");
  };

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

        console.log("Imported Raw Data (Admin):", data);

        if (data.length === 0) {
          alert("The Excel file seems to be empty.");
          return;
        }

        const importedMatches: Match[] = data.map((row, index) => {
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

          let matchDate = getVal(['date', 'matchdate']);
          if (matchDate instanceof Date) {
            matchDate = matchDate.toISOString().split('T')[0];
          } else if (typeof matchDate === 'number') {
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
          alert("No valid matches found. Please check that team names match exactly and columns are named correctly.");
        }
      } catch (err) {
        console.error("XLSX Import Error (Admin):", err);
        alert("Error parsing Excel file. Please ensure it is a valid .xlsx or .xls file.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const updateOverride = (teamId: string, field: keyof StandingOverride, value: number) => {
    const existing = overrides.find(o => o.teamId === teamId);
    let newOverrides;
    if (existing) {
      newOverrides = overrides.map(o => o.teamId === teamId ? { ...o, [field]: value } : o);
    } else {
      newOverrides = [...overrides, {
        teamId,
        pointsAdjustment: 0,
        goalsForAdjustment: 0,
        goalsAgainstAdjustment: 0,
        playedAdjustment: 0,
        wonAdjustment: 0,
        drawnAdjustment: 0,
        lostAdjustment: 0,
        [field]: value
      }];
    }
    setOverrides(newOverrides);
  };

  const handleSaveOverrides = () => {
    onUpdateStandingOverrides(overrides);
    alert('Standings adjustments saved successfully!');
  };

  const handleClearOverrides = () => {
    if (confirm('Are you sure you want to clear all standings adjustments?')) {
      setOverrides([]);
      onUpdateStandingOverrides([]);
    }
  };

  const toggleSection = (section: string) => setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'news' | 'ad') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (target === 'logo') setSettingsForm({ ...settingsForm, logo: base64 });
        else if (target === 'news') setNewsForm({ ...newsForm, imageUrl: base64 });
        else if (target === 'ad') setAdForm({ ...adForm, imageUrl: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsForm.title || !newsForm.content) return;
    onSaveNews({
      id: newsForm.id || `news-${Date.now()}`,
      title: newsForm.title,
      content: newsForm.content,
      imageUrl: newsForm.imageUrl || '',
      important: newsForm.important || false,
      date: newsForm.date || new Date().toISOString()
    });
    setNewsForm({ title: '', content: '', imageUrl: '', important: false });
    alert('News published to league feed.');
  };

  const handlePostAd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adForm.title || !adForm.linkUrl) return;
    onSaveAd({
      id: adForm.id || `ad-${Date.now()}`,
      title: adForm.title,
      description: adForm.description || '',
      imageUrl: adForm.imageUrl || '',
      linkUrl: adForm.linkUrl,
      isActive: adForm.isActive !== undefined ? adForm.isActive : true
    });
    setAdForm({ title: '', description: '', imageUrl: '', linkUrl: '', isActive: true });
    alert('Sponsorship advertisement updated.');
  };

  const SectionHeader: React.FC<{ title: string; icon: string; sectionKey: string }> = ({ title, icon, sectionKey }) => (
    <div className="flex justify-between items-center cursor-pointer group mb-4" onClick={() => toggleSection(sectionKey)}>
      <h3 className="text-xl font-black text-gray-900 flex items-center tracking-tight">
        <i className={`fas ${icon} mr-3 text-blue-600`}></i>
        {title}
      </h3>
      <div className={`text-gray-300 transition-all ${expandedSections[sectionKey] ? 'rotate-180' : ''}`}>
        <i className="fas fa-chevron-down"></i>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500 max-w-5xl mx-auto">
      {/* Cloud Management Section */}
      <div className="bg-indigo-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <SectionHeader title="Turso Cloud Management" icon="fa-cloud" sectionKey="cloud" />
        {expandedSections.cloud && (
          <div className="space-y-6 animate-in slide-in-from-top-2">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <button onClick={onForceSync} className="bg-white text-indigo-900 px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-indigo-50 transition-all flex items-center space-x-2 shadow-lg">
                <i className="fas fa-sync-alt"></i>
                <span>Force Push to Cloud</span>
              </button>
            </div>
            <div className="bg-black/20 rounded-2xl p-4 border border-white/10">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-3">Cloud Transaction Log</p>
              <div className="space-y-1.5 h-40 overflow-y-auto custom-scrollbar font-mono text-[11px]">
                {dbLogs?.map((log, i) => <div key={i} className="text-indigo-100 border-l border-indigo-500/30 pl-3 py-0.5">{log}</div>)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixtures Import Section */}
      <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl">
        <SectionHeader title="Fixtures & Results Import" icon="fa-file-excel" sectionKey="fixtures" />
        {expandedSections.fixtures && (
          <div className="space-y-6 animate-in slide-in-from-top-2">
            <div className="bg-green-50/50 p-6 rounded-3xl border border-green-100/50">
              <div className="flex items-center space-x-2 mb-4">
                <i className="fas fa-info-circle text-green-600"></i>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-600">Excel Import Guide</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                Upload an Excel file (.xlsx) with columns: <span className="font-bold">HomeTeam, AwayTeam, Date, Time, Venue, Week</span>. 
                To import results, include <span className="font-bold">HomeScore</span> and <span className="font-bold">AwayScore</span>.
              </p>
              <div className="flex flex-col md:flex-row gap-4">
                <button 
                  onClick={() => xlsInputRef.current?.click()}
                  className="bg-green-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-green-700 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-green-100"
                >
                  <i className="fas fa-upload"></i>
                  <span>Upload Fixtures File</span>
                </button>
                <button 
                  onClick={downloadFixturesTemplate}
                  className="bg-white text-green-600 border-2 border-green-600 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-green-50 transition-all flex items-center justify-center space-x-2"
                >
                  <i className="fas fa-download"></i>
                  <span>Fixtures Template</span>
                </button>
                <button 
                  onClick={downloadResultsTemplate}
                  className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-50 transition-all flex items-center justify-center space-x-2"
                >
                  <i className="fas fa-download"></i>
                  <span>Results Template</span>
                </button>
                <input type="file" ref={xlsInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleXlsUpload} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Standings Manual Adjustment */}
      <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <SectionHeader title="Standings Adjustments" icon="fa-table" sectionKey="standings" />
          {expandedSections.standings && (
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleClearOverrides}
                className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors"
              >
                Clear All
              </button>
              <button 
                onClick={handleSaveOverrides}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
              >
                Save Adjustments
              </button>
            </div>
          )}
        </div>
        {expandedSections.standings && (
          <div className="space-y-6 animate-in slide-in-from-top-2">
            <p className="text-xs text-gray-500 mb-4 italic">Manually adjust points, goals, or matches played for specific teams. These values are added to the calculated standings.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <th className="pb-4">Team</th>
                    <th className="pb-4 text-center">Actual Pts</th>
                    <th className="pb-4 text-center">Pts +/-</th>
                    <th className="pb-4 text-center">Actual GF</th>
                    <th className="pb-4 text-center">GF +/-</th>
                    <th className="pb-4 text-center">Actual GA</th>
                    <th className="pb-4 text-center">GA +/-</th>
                    <th className="pb-4 text-center">Actual P</th>
                    <th className="pb-4 text-center">P +/-</th>
                    <th className="pb-4 text-center">Actual W</th>
                    <th className="pb-4 text-center">W +/-</th>
                    <th className="pb-4 text-center">Actual D</th>
                    <th className="pb-4 text-center">D +/-</th>
                    <th className="pb-4 text-center">Actual L</th>
                    <th className="pb-4 text-center">L +/-</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {teams.map(team => {
                    const override = overrides.find(o => o.teamId === team.id) || {
                      pointsAdjustment: 0, goalsForAdjustment: 0, goalsAgainstAdjustment: 0, playedAdjustment: 0, wonAdjustment: 0, drawnAdjustment: 0, lostAdjustment: 0
                    };
                    const actual = standings.find(s => s.teamId === team.id) || {
                      points: 0, goalsFor: 0, goalsAgainst: 0, played: 0, won: 0, drawn: 0, lost: 0
                    };
                    
                    const matchesOnly = {
                      points: actual.points - (override.pointsAdjustment || 0),
                      goalsFor: actual.goalsFor - (override.goalsForAdjustment || 0),
                      goalsAgainst: actual.goalsAgainst - (override.goalsAgainstAdjustment || 0),
                      played: actual.played - (override.playedAdjustment || 0),
                      won: actual.won - (override.wonAdjustment || 0),
                      drawn: actual.drawn - (override.drawnAdjustment || 0),
                      lost: actual.lost - (override.lostAdjustment || 0)
                    };

                    return (
                      <tr key={team.id} className="group hover:bg-gray-50/50 transition-colors">
                        <td className="py-4">
                          <div className="flex items-center space-x-2">
                            <img src={team.logo} className="w-8 h-8 rounded-full border border-gray-100 shadow-sm" alt="" />
                            <span className="text-sm font-black text-gray-900">{team.name}</span>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <span className="text-xs font-bold text-gray-400">{matchesOnly.points}</span>
                        </td>
                        <td className="py-4 text-center">
                          <input type="number" className="w-16 text-center border border-gray-200 rounded-lg p-1.5 text-sm font-black text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none" value={override.pointsAdjustment} onChange={e => updateOverride(team.id, 'pointsAdjustment', parseInt(e.target.value) || 0)} />
                        </td>
                        <td className="py-4 text-center">
                          <span className="text-xs font-bold text-gray-400">{matchesOnly.goalsFor}</span>
                        </td>
                        <td className="py-4 text-center">
                          <input type="number" className="w-16 text-center border border-gray-200 rounded-lg p-1.5 text-sm font-black text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none" value={override.goalsForAdjustment} onChange={e => updateOverride(team.id, 'goalsForAdjustment', parseInt(e.target.value) || 0)} />
                        </td>
                        <td className="py-4 text-center">
                          <span className="text-xs font-bold text-gray-400">{matchesOnly.goalsAgainst}</span>
                        </td>
                        <td className="py-4 text-center">
                          <input type="number" className="w-16 text-center border border-gray-200 rounded-lg p-1.5 text-sm font-black text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none" value={override.goalsAgainstAdjustment} onChange={e => updateOverride(team.id, 'goalsAgainstAdjustment', parseInt(e.target.value) || 0)} />
                        </td>
                        <td className="py-4 text-center">
                          <span className="text-xs font-bold text-gray-400">{matchesOnly.played}</span>
                        </td>
                        <td className="py-4 text-center">
                          <input type="number" className="w-16 text-center border border-gray-200 rounded-lg p-1.5 text-sm font-black text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none" value={override.playedAdjustment} onChange={e => updateOverride(team.id, 'playedAdjustment', parseInt(e.target.value) || 0)} />
                        </td>
                        <td className="py-4 text-center">
                          <span className="text-xs font-bold text-gray-400">{matchesOnly.won}</span>
                        </td>
                        <td className="py-4 text-center">
                          <input type="number" className="w-16 text-center border border-gray-200 rounded-lg p-1.5 text-sm font-black text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none" value={override.wonAdjustment} onChange={e => updateOverride(team.id, 'wonAdjustment', parseInt(e.target.value) || 0)} />
                        </td>
                        <td className="py-4 text-center">
                          <span className="text-xs font-bold text-gray-400">{matchesOnly.drawn}</span>
                        </td>
                        <td className="py-4 text-center">
                          <input type="number" className="w-16 text-center border border-gray-200 rounded-lg p-1.5 text-sm font-black text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none" value={override.drawnAdjustment} onChange={e => updateOverride(team.id, 'drawnAdjustment', parseInt(e.target.value) || 0)} />
                        </td>
                        <td className="py-4 text-center">
                          <span className="text-xs font-bold text-gray-400">{matchesOnly.lost}</span>
                        </td>
                        <td className="py-4 text-center">
                          <input type="number" className="w-16 text-center border border-gray-200 rounded-lg p-1.5 text-sm font-black text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none" value={override.lostAdjustment} onChange={e => updateOverride(team.id, 'lostAdjustment', parseInt(e.target.value) || 0)} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* User Management Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <button 
          onClick={() => setExpandedSections(prev => ({ ...prev, users: !prev.users }))}
          className="w-full px-6 py-4 flex items-center justify-between bg-gray-50/50 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900">User Management</h2>
          </div>
          <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.users ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {expandedSections.users && (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-3 px-4 text-xs font-black uppercase tracking-widest text-gray-400">Username</th>
                    <th className="py-3 px-4 text-xs font-black uppercase tracking-widest text-gray-400">Role</th>
                    <th className="py-3 px-4 text-xs font-black uppercase tracking-widest text-gray-400">Team</th>
                    <th className="py-3 px-4 text-xs font-black uppercase tracking-widest text-gray-400">Status</th>
                    <th className="py-3 px-4 text-xs font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => u.username !== 'admin').map(user => {
                    const userTeam = teams.find(t => t.id === user.teamId);
                    return (
                      <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-4">
                          <span className="font-bold text-gray-900">{user.username}</span>
                        </td>
                        <td className="py-4 px-4">
                          <select 
                            value={user.role}
                            onChange={(e) => onUpdateUserStatus(user.id, user.isApproved, e.target.value as UserRole)}
                            className="text-xs font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded-lg uppercase outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value={UserRole.GUEST}>Guest</option>
                            <option value={UserRole.TEAM_MANAGER}>Team Manager</option>
                            <option value={UserRole.ADMIN}>Admin</option>
                          </select>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-600">{userTeam?.name || 'N/A'}</span>
                        </td>
                        <td className="py-4 px-4">
                          {user.isApproved ? (
                            <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                              Approved
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-amber-600 text-xs font-bold uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                              Pending Approval
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!user.isApproved ? (
                              <button
                                onClick={() => onUpdateUserStatus(user.id, true)}
                                className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors uppercase tracking-wider"
                              >
                                Approve
                              </button>
                            ) : (
                              <button
                                onClick={() => onUpdateUserStatus(user.id, false)}
                                className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors uppercase tracking-wider"
                              >
                                Suspend
                              </button>
                            )}
                            <button
                              onClick={() => onDeleteUser(user.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete User"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {users.filter(u => u.username !== 'admin').length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-400 font-medium italic">
                        No registered users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Hero Ad Management - Strictly for Admin */}
      <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl">
        <SectionHeader title="Hero Ad Management" icon="fa-ad" sectionKey="ads" />
        {expandedSections.ads && (
          <div className="space-y-8 animate-in slide-in-from-top-2">
             <div className="bg-blue-50/30 p-6 rounded-3xl border border-blue-100/50">
               <div className="flex items-center space-x-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Sponsorship Editor (Admin Only)</span>
               </div>
               <form onSubmit={handlePostAd} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sponsor/Ad Name</label>
                        <input required className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-blue-500" value={adForm.title} onChange={e => setAdForm({...adForm, title: e.target.value})} placeholder="e.g. Nike Football" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Redirect URL</label>
                        <input required className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-blue-500" value={adForm.linkUrl} onChange={e => setAdForm({...adForm, linkUrl: e.target.value})} placeholder="https://..." />
                      </div>
                      <div className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-gray-200">
                         <input type="checkbox" id="adActive" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked={adForm.isActive} onChange={e => setAdForm({...adForm, isActive: e.target.checked})} />
                         <label htmlFor="adActive" className="text-xs font-black text-gray-600 uppercase tracking-widest cursor-pointer">Live on Dashboard</label>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ad Creative (Logo/Photo)</label>
                      <div className="flex items-center space-x-4">
                         <div className="w-24 h-24 bg-white rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden">
                            {adForm.imageUrl ? <img src={adForm.imageUrl} className="w-full h-full object-cover" /> : <i className="fas fa-bullhorn text-gray-200 text-2xl"></i>}
                         </div>
                         <button type="button" onClick={() => adImgRef.current?.click()} className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-200 transition-all">Select Image</button>
                         <input type="file" ref={adImgRef} className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'ad')} />
                      </div>
                      <div className="mt-4 space-y-1">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Promotional Text</label>
                         <textarea rows={2} className="w-full border border-gray-200 bg-white rounded-xl px-4 py-2 font-bold outline-none focus:ring-2 focus:ring-blue-500 resize-none" value={adForm.description} onChange={e => setAdForm({...adForm, description: e.target.value})} placeholder="Short marketing blurb..." />
                      </div>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg hover:bg-blue-700 transition-all">
                    {adForm.id ? 'Update Advertisement' : 'Add Sponsor Banner'}
                  </button>
               </form>
             </div>

             <div className="space-y-3">
                <div className="flex justify-between items-center mb-2">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Manage Ads</p>
                   {selectedAdIds.length > 0 && (
                      <button 
                        onClick={() => {
                          if(confirm(`Delete ${selectedAdIds.length} ads?`)) {
                            onDeleteAds?.(selectedAdIds);
                            setSelectedAdIds([]);
                          }
                        }}
                        className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline"
                      >
                        Delete Selected ({selectedAdIds.length})
                      </button>
                   )}
                </div>
                {ads.map(ad => (
                  <div key={ad.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all group ${selectedAdIds.includes(ad.id) ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-transparent hover:border-blue-100'}`}>
                    <div className="flex items-center space-x-4">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" 
                        checked={selectedAdIds.includes(ad.id)}
                        onChange={() => setSelectedAdIds(prev => prev.includes(ad.id) ? prev.filter(id => id !== ad.id) : [...prev, ad.id])}
                      />
                      <img src={ad.imageUrl} className="w-12 h-12 rounded-lg object-cover bg-white" />
                      <div>
                        <p className="font-black text-gray-900 text-sm">{ad.title}</p>
                        <p className={`text-[9px] font-black uppercase tracking-widest ${ad.isActive ? 'text-green-500' : 'text-gray-300'}`}>
                          {ad.isActive ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button onClick={() => setAdForm(ad)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><i className="fas fa-edit"></i></button>
                      <button onClick={() => confirm('Remove this ad?') && onDeleteAd(ad.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><i className="fas fa-trash-alt"></i></button>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>

      {/* League News Management - Strictly for Admin */}
      <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl">
        <SectionHeader title="League News & Updates" icon="fa-newspaper" sectionKey="news" />
        {expandedSections.news && (
          <div className="space-y-8 animate-in slide-in-from-top-2">
             <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">News Publisher (Admin Only)</span>
                </div>
                <form onSubmit={handlePostNews} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Post Title</label>
                        <input required className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-blue-500" value={newsForm.title} onChange={e => setNewsForm({...newsForm, title: e.target.value})} placeholder="Main headline..." />
                      </div>
                      <div className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-gray-200">
                         <input type="checkbox" id="important" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked={newsForm.important} onChange={e => setNewsForm({...newsForm, important: e.target.checked})} />
                         <label htmlFor="important" className="text-xs font-black text-gray-600 uppercase tracking-widest cursor-pointer">Mark as Important Update</label>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cover Image</label>
                      <div className="flex items-center space-x-4">
                         <div className="w-20 h-20 bg-white rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden">
                            {newsForm.imageUrl ? <img src={newsForm.imageUrl} className="w-full h-full object-cover" /> : <i className="fas fa-image text-gray-200"></i>}
                         </div>
                         <button type="button" onClick={() => newsImgRef.current?.click()} className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-200 transition-all">Upload Photo</button>
                         <input type="file" ref={newsImgRef} className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'news')} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Article Content</label>
                    <textarea rows={5} required className="w-full border border-gray-200 bg-white rounded-2xl px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-blue-500 resize-none" value={newsForm.content} onChange={e => setNewsForm({...newsForm, content: e.target.value})} placeholder="Write the full story here..." />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg hover:bg-blue-700 transition-all">
                    {newsForm.id ? 'Update News Article' : 'Publish to League Feed'}
                  </button>
                </form>
             </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center mb-2">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Manage Recent Posts</p>
                   {selectedNewsIds.length > 0 && (
                      <button 
                        onClick={() => {
                          if(confirm(`Delete ${selectedNewsIds.length} posts?`)) {
                            onDeleteNewsItems?.(selectedNewsIds);
                            setSelectedNewsIds([]);
                          }
                        }}
                        className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline"
                      >
                        Delete Selected ({selectedNewsIds.length})
                      </button>
                   )}
                </div>
                {news.map(item => (
                  <div key={item.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all group ${selectedNewsIds.includes(item.id) ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-transparent hover:border-blue-100'}`}>
                    <div className="flex items-center space-x-4">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" 
                        checked={selectedNewsIds.includes(item.id)}
                        onChange={() => setSelectedNewsIds(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id])}
                      />
                      <img src={item.imageUrl} className="w-12 h-12 rounded-lg object-cover bg-white" />
                      <div>
                        <p className="font-black text-gray-900 text-sm">{item.title}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">{new Date(item.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button onClick={() => setNewsForm(item)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><i className="fas fa-edit"></i></button>
                      <button onClick={() => confirm('Delete this post?') && onDeleteNews(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><i className="fas fa-trash-alt"></i></button>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>

      {/* League Identity Section */}
      <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl">
        <SectionHeader title="League Identity" icon="fa-id-card" sectionKey="branding" />
        {expandedSections.branding && (
          <form onSubmit={(e) => { e.preventDefault(); onUpdateLeagueSettings(settingsForm); alert('Branding Updated'); }} className="space-y-8 animate-in slide-in-from-top-2">
            <div className="flex flex-col md:flex-row items-center gap-8 bg-gray-50 p-6 rounded-3xl border border-gray-100">
              <div className="relative group">
                <div className="w-32 h-32 bg-white rounded-3xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
                  {settingsForm.logo ? <img src={settingsForm.logo} className="w-full h-full object-contain p-2" /> : <i className="fas fa-image text-gray-200 text-4xl"></i>}
                </div>
                <button type="button" onClick={() => logoInputRef.current?.click()} className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all border-4 border-white"><i className="fas fa-camera text-xs"></i></button>
                <input type="file" ref={logoInputRef} onChange={e => handleFileUpload(e, 'logo')} accept="image/*" className="hidden" />
              </div>
              <div className="flex-1 space-y-3 w-full">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">League Logo Source</label>
                <input type="text" className="w-full border border-gray-200 bg-white rounded-xl px-4 py-2.5 font-bold outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Paste Logo URL..." value={settingsForm.logo} onChange={e => setSettingsForm({...settingsForm, logo: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input required className="w-full border border-gray-100 bg-gray-50 rounded-xl px-5 py-3.5 font-bold outline-none focus:ring-4 focus:ring-blue-50" value={settingsForm.name} onChange={e => setSettingsForm({...settingsForm, name: e.target.value})} placeholder="League Name" />
              <input required className="w-full border border-gray-100 bg-gray-50 rounded-xl px-5 py-3.5 font-bold outline-none focus:ring-4 focus:ring-blue-50" value={settingsForm.season} onChange={e => setSettingsForm({...settingsForm, season: e.target.value})} placeholder="Season" />
              <textarea rows={3} className="md:col-span-2 w-full border border-gray-100 bg-gray-50 rounded-2xl px-5 py-3.5 font-bold outline-none focus:ring-4 focus:ring-blue-50 resize-none" value={settingsForm.description} onChange={e => setSettingsForm({...settingsForm, description: e.target.value})} placeholder="Description" />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black uppercase text-sm tracking-widest shadow-xl hover:bg-blue-700 transition-all">Save Branding</button>
          </form>
        )}
      </div>

      {/* Pending Team Registrations */}
      {teams.some(t => !t.isApproved) && (
        <div className="bg-amber-50 p-8 rounded-[2rem] border border-amber-100 shadow-xl">
          <SectionHeader title={`Pending Team Approvals (${teams.filter(t => !t.isApproved).length})`} icon="fa-clock" sectionKey="pendingTeams" />
          {expandedSections.pendingTeams && (
            <div className="space-y-3 mt-6 animate-in slide-in-from-top-2">
              {teams.filter(t => !t.isApproved).map(team => (
                <div key={team.id} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-amber-100">
                  <div className="flex items-center space-x-4">
                    <img src={team.logo} className="w-12 h-12 rounded-xl object-cover shadow-sm bg-white" alt="" />
                    <div>
                      <p className="font-black text-gray-900 leading-none mb-1">{team.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{team.manager} • {team.contact}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => onApproveTeam?.(team.id)} 
                      className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => onDeleteTeam?.(team.id)} 
                      className="bg-red-50 text-red-600 px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-100 transition-all"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Teams Management */}
      <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <SectionHeader title={`Manage Teams (${teams.filter(t => t.isApproved).length})`} icon="fa-shield-alt" sectionKey="members" />
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
              <input 
                type="text" 
                placeholder="Search teams..." 
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={teamSearch}
                onChange={e => setTeamSearch(e.target.value)}
              />
            </div>
            <button 
              onClick={onRegisterTeam}
              className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-all flex items-center space-x-2 shadow-lg"
            >
              <i className="fas fa-plus"></i>
              <span>Register New Team</span>
            </button>
          </div>
        </div>
        {expandedSections.members && (
          <div className="space-y-3 animate-in slide-in-from-top-2">
            {teams
              .filter(t => t.isApproved)
              .filter(t => t.name.toLowerCase().includes(teamSearch.toLowerCase()) || t.manager.toLowerCase().includes(teamSearch.toLowerCase()))
              .map(team => (
              <div key={team.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-md transition-all group border border-transparent hover:border-blue-50">
                <div className="flex items-center space-x-4">
                  <img src={team.logo} className="w-12 h-12 rounded-xl object-cover shadow-sm bg-white" alt="" />
                  <div><p className="font-black text-gray-900 leading-none mb-1">{team.name}</p><p className="text-[10px] font-bold text-gray-400 uppercase">{team.manager} • {team.players.length} Players</p></div>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => setEditingTeam(team)} className="p-3 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors" title="Edit Team"><i className="fas fa-edit"></i></button>
                  <button onClick={() => onManageSquad(team.id)} className="p-3 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-colors" title="Manage Squad"><i className="fas fa-users"></i></button>
                  <button 
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete ${team.name}? This will also delete its matches.`)) {
                        onDeleteTeam?.(team.id);
                      }
                    }} 
                    className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Delete Team"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
            ))}
            {teams.filter(t => t.name.toLowerCase().includes(teamSearch.toLowerCase()) || t.manager.toLowerCase().includes(teamSearch.toLowerCase())).length === 0 && (
              <div className="py-12 text-center text-gray-400 font-medium italic">
                No teams found matching your search.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="text-center pt-10">
        <button onClick={onReset} className="text-red-400 hover:text-red-600 text-xs font-black uppercase tracking-widest transition-colors">
          <i className="fas fa-trash-alt mr-2"></i> Reset Local Data
        </button>
      </div>

      {editingTeam && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden p-8 animate-in zoom-in-95">
            <h3 className="text-2xl font-black mb-6 text-gray-900">Edit Team: {editingTeam.name}</h3>
            <div className="space-y-4">
              <input className="w-full p-4 border border-gray-100 bg-gray-50 rounded-2xl font-bold" value={editingTeam.name} onChange={e => setEditingTeam({...editingTeam, name: e.target.value})} placeholder="Team Name" />
              <input className="w-full p-4 border border-gray-100 bg-gray-50 rounded-2xl font-bold" value={editingTeam.manager} onChange={e => setEditingTeam({...editingTeam, manager: e.target.value})} placeholder="Manager" />
              <button onClick={() => { onUpdateTeam?.(editingTeam); setEditingTeam(null); }} className="w-full bg-blue-600 text-white p-5 rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl">Save Team Changes</button>
              <button onClick={() => setEditingTeam(null)} className="w-full text-gray-400 font-bold py-2 uppercase text-[10px] tracking-widest">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
