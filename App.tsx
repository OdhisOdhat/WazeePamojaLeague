
import React, { useState, useMemo, useEffect } from 'https://esm.sh/react@19.0.0';
import { createClient } from 'https://esm.sh/@libsql/client@0.17.0/web';
import { Team, Match, Player, Standing, UserRole, GoalScorer, CardEvent, LeagueSettings, NewsItem, Ad } from './types.ts';
import { INITIAL_TEAMS, INITIAL_MATCHES, DEFAULT_LEAGUE_SETTINGS } from './constants.tsx';
import Dashboard from './components/Dashboard.tsx';
import TeamRegistration from './components/TeamRegistration.tsx';
import StandingsTable from './components/StandingsTable.tsx';
import MatchScheduler from './components/MatchScheduler.tsx';
import AdminPanel from './components/AdminPanel.tsx';
import PlayerManager from './components/PlayerManager.tsx';
import Navbar from './components/Navbar.tsx';
import Login from './components/Login.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';

// Turso Cloud Configuration
const TURSO_CONFIG = {
  url: "https://odhisodhat-vercel-icfg-ftcymaxmqxj9bs7ney2w5mpx.aws-us-east-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjkwODMyMjEsImlkIjoiNzA2MmVkNjItNDUwOS00YmEzLWIwYWYtNjBjY2YzNDJlMTg4IiwicmlkIjoiMDQ4ZmNlMDctMGEwOS00OGIxLTg3OWQtNTEzZGZiMWUxZmUzIn0.0i537WhP95mSF1AUrhIiakcMQebMcDFk21Q2C0d4b-YZpgJB4Plba8ox3wDDLtoFhJrsKDtr7r_E-dQ_aIDiBw"
};

const STORAGE_KEYS = {
  TEAMS: 'lp_teams_v2',
  MATCHES: 'lp_matches_v2',
  SETTINGS: 'lp_settings_v2',
  NEWS: 'lp_news_v1',
  ADS: 'lp_ads_v1',
  SESSION: 'lp_session_v3'
};

const db = createClient(TURSO_CONFIG);

const App: React.FC = () => {
  const [view, setView] = useState<string>('dashboard');
  const [role, setRole] = useState<UserRole>(UserRole.PUBLIC);
  const [userId, setUserId] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [leagueSettings, setLeagueSettings] = useState<LeagueSettings>(DEFAULT_LEAGUE_SETTINGS);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [dbLogs, setDbLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDbLogs(prev => [`[${timestamp}] ${msg}`, ...prev].slice(0, 20));
    console.log(`[Turso] ${msg}`);
  };

  const dbService = {
    setup: async () => {
      addLog('Verifying Cloud Database schema...');
      try {
        await db.execute(`CREATE TABLE IF NOT EXISTS teams (id TEXT PRIMARY KEY, data TEXT);`);
        await db.execute(`CREATE TABLE IF NOT EXISTS matches (id TEXT PRIMARY KEY, data TEXT);`);
        await db.execute(`CREATE TABLE IF NOT EXISTS news (id TEXT PRIMARY KEY, data TEXT);`);
        await db.execute(`CREATE TABLE IF NOT EXISTS ads (id TEXT PRIMARY KEY, data TEXT);`);
        await db.execute(`CREATE TABLE IF NOT EXISTS settings (id TEXT PRIMARY KEY, data TEXT);`);
        await db.execute(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE, password TEXT, role TEXT, teamId TEXT);`);
        addLog('✅ Schema ready');
      } catch (e) {
        addLog('❌ Schema verification failed');
        throw e;
      }
    },
    saveTeam: async (team: Team) => {
      await db.execute({
        sql: "INSERT INTO teams (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data",
        args: [team.id, JSON.stringify(team)]
      });
    },
    saveMatch: async (match: Match) => {
      await db.execute({
        sql: "INSERT INTO matches (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data",
        args: [match.id, JSON.stringify(match)]
      });
    },
    saveNewsItem: async (item: NewsItem) => {
      await db.execute({
        sql: "INSERT INTO news (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data",
        args: [item.id, JSON.stringify(item)]
      });
    },
    saveAd: async (ad: Ad) => {
      await db.execute({
        sql: "INSERT INTO ads (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data",
        args: [ad.id, JSON.stringify(ad)]
      });
    },
    deleteAd: async (id: string) => {
      await db.execute({
        sql: "DELETE FROM ads WHERE id = ?",
        args: [id]
      });
    },
    deleteNewsItem: async (id: string) => {
      await db.execute({
        sql: "DELETE FROM news WHERE id = ?",
        args: [id]
      });
    },
    saveSettings: async (settings: LeagueSettings) => {
      await db.execute({
        sql: "INSERT INTO settings (id, data) VALUES ('global', ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data",
        args: [JSON.stringify(settings)]
      });
    },
    fetchCloudData: async () => {
      addLog('Pulling latest cloud state...');
      const t = await db.execute("SELECT data FROM teams");
      const m = await db.execute("SELECT data FROM matches");
      const n = await db.execute("SELECT data FROM news");
      const a = await db.execute("SELECT data FROM ads");
      const s = await db.execute("SELECT data FROM settings WHERE id = 'global'");
      return {
        teams: t.rows.map(r => JSON.parse(r.data as string)) as Team[],
        matches: m.rows.map(r => JSON.parse(r.data as string)) as Match[],
        news: n.rows.map(r => JSON.parse(r.data as string)) as NewsItem[],
        ads: a.rows.map(r => JSON.parse(r.data as string)) as Ad[],
        settings: s.rows.length > 0 ? JSON.parse(s.rows[0].data as string) as LeagueSettings : null
      };
    },
    login: async (username: string, password: string) => {
      if (username === 'admin' && password === 'admin123') return { role: UserRole.ADMIN, id: 'u-admin' };
      const res = await db.execute({
        sql: "SELECT id, role, teamId FROM users WHERE username = ? AND password = ?",
        args: [username, password]
      });
      if (res.rows.length > 0) return { 
        id: res.rows[0].id as string, 
        role: res.rows[0].role as UserRole, 
        teamId: res.rows[0].teamId as string 
      };
      throw new Error("Invalid credentials");
    },
    register: async (username: string, password: string, teamId: string) => {
      const id = `u-${Date.now()}`;
      const actualTeamId = teamId || null;
      await db.execute({
        sql: "INSERT INTO users (id, username, password, role, teamId) VALUES (?, ?, ?, ?, ?)",
        args: [id, username, password, UserRole.TEAM_MANAGER, actualTeamId]
      });
      return { id, username, role: UserRole.TEAM_MANAGER, teamId: actualTeamId };
    },
    linkUserToTeam: async (uid: string, tid: string) => {
      await db.execute({
        sql: "UPDATE users SET teamId = ? WHERE id = ?",
        args: [tid, uid]
      });
    }
  };

  useEffect(() => {
    const boot = async () => {
      addLog('Starting application boot...');
      const localT = localStorage.getItem(STORAGE_KEYS.TEAMS);
      const localM = localStorage.getItem(STORAGE_KEYS.MATCHES);
      const localS = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const localN = localStorage.getItem(STORAGE_KEYS.NEWS);
      const localA = localStorage.getItem(STORAGE_KEYS.ADS);
      
      setTeams(localT ? JSON.parse(localT) : INITIAL_TEAMS);
      setMatches(localM ? JSON.parse(localM) : INITIAL_MATCHES);
      setLeagueSettings(localS ? JSON.parse(localS) : DEFAULT_LEAGUE_SETTINGS);
      setNews(localN ? JSON.parse(localN) : []);
      setAds(localA ? JSON.parse(localA) : []);

      const savedSession = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (savedSession) {
        const session = JSON.parse(savedSession);
        setRole(session.role);
        setUserId(session.userId || null);
        setSelectedTeamId(session.teamId || null);
      }
      setIsLoaded(true);

      try {
        setIsSyncing(true);
        await dbService.setup();
        const cloudData = await dbService.fetchCloudData();
        
        if (cloudData.teams.length > 0) {
          setTeams(cloudData.teams);
          setMatches(cloudData.matches);
          setNews(cloudData.news);
          setAds(cloudData.ads);
          if (cloudData.settings) setLeagueSettings(cloudData.settings);
          addLog("✅ Cloud sync successful");
        }
      } catch (e) {
        setSyncError("Cloud connection failed.");
      } finally {
        setIsSyncing(false);
      }
    };
    boot();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
      localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(leagueSettings));
      localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(news));
      localStorage.setItem(STORAGE_KEYS.ADS, JSON.stringify(ads));
      if (role !== UserRole.PUBLIC) {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({ role, userId, teamId: selectedTeamId }));
      } else {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
      }
    }
  }, [teams, matches, leagueSettings, news, ads, role, selectedTeamId, userId, isLoaded]);

  const standings = useMemo(() => {
    const table: Record<string, Standing> = {};
    teams.forEach(team => {
      table[team.id] = { teamId: team.id, teamName: team.name, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 };
    });
    matches.filter(m => m.isCompleted).forEach(match => {
      const home = table[match.homeTeamId];
      const away = table[match.awayTeamId];
      if (!home || !away) return;
      const hScore = match.homeScore || 0;
      const aScore = match.awayScore || 0;
      home.played += 1; away.played += 1;
      home.goalsFor += hScore; home.goalsAgainst += aScore;
      away.goalsFor += aScore; away.goalsAgainst += hScore;
      if (hScore > aScore) { home.won += 1; home.points += 3; away.lost += 1; }
      else if (aScore > hScore) { away.won += 1; away.points += 3; home.lost += 1; }
      else { home.drawn += 1; away.drawn += 1; home.points += 1; away.points += 1; }
      home.goalDifference = home.goalsFor - home.goalsAgainst;
      away.goalDifference = away.goalsFor - away.goalsAgainst;
    });
    return Object.values(table).sort((a, b) => b.points !== a.points ? b.points - a.points : b.goalDifference !== a.goalDifference ? b.goalDifference - a.goalDifference : b.goalsFor - a.goalsFor);
  }, [teams, matches]);

  const forcePushToCloud = async () => {
    try {
      setIsSyncing(true);
      for (const t of teams) await dbService.saveTeam(t);
      for (const m of matches) await dbService.saveMatch(m);
      for (const n of news) await dbService.saveNewsItem(n);
      for (const a of ads) await dbService.saveAd(a);
      await dbService.saveSettings(leagueSettings);
      addLog("✅ Force Push successful!");
    } catch (e) {
      addLog("❌ Force Push failed");
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isLoaded) return <div className="h-screen w-full flex items-center justify-center bg-gray-50 text-blue-600"><i className="fas fa-circle-notch fa-spin text-4xl"></i></div>;

  return (
    <div className="min-h-screen flex flex-col selection:bg-blue-100 selection:text-blue-900">
      <Navbar 
        currentView={view} setView={setView} role={role} 
        onLogout={() => { setRole(UserRole.PUBLIC); setUserId(null); setSelectedTeamId(null); setView('dashboard'); }} 
        selectedTeamId={selectedTeamId} teams={teams} 
        isSyncing={isSyncing} syncError={syncError} leagueSettings={leagueSettings}
      />
      
      {isSyncing && (
        <div className="fixed top-0 left-0 w-full h-1 bg-blue-100 z-[100]">
          <div className="h-full bg-blue-600 animate-[progress_1.5s_infinite_linear]" style={{width: '30%'}}></div>
        </div>
      )}

      <main className="flex-1 container mx-auto px-4 py-8 max-width-6xl">
        <ErrorBoundary componentName={`View: ${view}`}>
          {(() => {
            switch (view) {
              case 'login': return (
                <Login 
                  teams={teams} 
                  onLogin={(r, t, uid) => { setRole(r); setSelectedTeamId(t || null); setUserId(uid || null); setView('dashboard'); }} 
                  onBack={() => setView('dashboard')} 
                  loginFn={dbService.login} 
                  registerFn={dbService.register}
                />
              );
              case 'dashboard': return <Dashboard teams={teams} matches={matches} standings={standings} news={news} ads={ads} setView={setView} leagueSettings={leagueSettings} role={role} selectedTeamId={selectedTeamId} />;
              case 'standings': return <StandingsTable standings={standings} teams={teams} leagueSettings={leagueSettings} />;
              case 'registration': return <TeamRegistration onRegister={(tData) => { 
                  const newTeamId = `t${Date.now()}`;
                  const newTeam = { ...tData, id: newTeamId, players: [] };
                  setTeams(p => [...p, newTeam]);
                  dbService.saveTeam(newTeam).catch(() => {});
                  if (role === UserRole.TEAM_MANAGER && !selectedTeamId && userId) {
                    setSelectedTeamId(newTeamId);
                    dbService.linkUserToTeam(userId, newTeamId).catch(() => {});
                  }
                  setView('players');
                }} existingNames={teams.map(t => t.name)} />;
              case 'schedule': return <MatchScheduler 
                matches={matches} teams={teams} isAdmin={role === UserRole.ADMIN} role={role} 
                selectedTeamId={selectedTeamId} onAddMatch={(m) => { setMatches(p => [...p, m]); dbService.saveMatch(m).catch(() => {}); }} 
                onUpdateMatch={(id, h, a, sc, c, ref, refG) => {
                  const updated = matches.map(m => m.id === id ? { ...m, homeScore: h, awayScore: a, scorers: sc, cards: c, refereeName: ref, refereeGrade: refG, isCompleted: true } : m);
                  setMatches(updated);
                  const m = updated.find(u => u.id === id);
                  if (m) dbService.saveMatch(m).catch(() => {});
                }} 
                leagueSettings={leagueSettings} 
              />;
              case 'admin': return <AdminPanel 
                teams={teams} matches={matches} news={news} ads={ads} leagueSettings={leagueSettings}
                onUpdateLeagueSettings={(s) => { setLeagueSettings(s); dbService.saveSettings(s).catch(() => {}); }}
                onUpdateMatch={() => {}} 
                onUpdateTeam={(t) => { setTeams(p => p.map(u => u.id === t.id ? t : u)); dbService.saveTeam(t).catch(() => {}); }}
                onSaveNews={(item) => {
                  const exists = news.find(n => n.id === item.id);
                  const updatedNews = exists ? news.map(n => n.id === item.id ? item : n) : [item, ...news];
                  setNews(updatedNews);
                  dbService.saveNewsItem(item).catch(() => {});
                }}
                onDeleteNews={(id) => {
                  setNews(news.filter(n => n.id !== id));
                  dbService.deleteNewsItem(id).catch(() => {});
                }}
                onSaveAd={(ad) => {
                  const exists = ads.find(a => a.id === ad.id);
                  const updatedAds = exists ? ads.map(a => a.id === ad.id ? ad : a) : [ad, ...ads];
                  setAds(updatedAds);
                  dbService.saveAd(ad).catch(() => {});
                }}
                onDeleteAd={(id) => {
                  setAds(ads.filter(a => a.id !== id));
                  dbService.deleteAd(id).catch(() => {});
                }}
                onRegisterTeam={() => {}} 
                onManageSquad={(tid) => { setSelectedTeamId(tid); setView('players'); }}
                onReset={() => { if(confirm('Reset local data?')) { setTeams(INITIAL_TEAMS); setMatches(INITIAL_MATCHES); } }} 
                onForceSync={forcePushToCloud}
                dbLogs={dbLogs}
                onImportState={() => {}}
              />;
              case 'players':
                const teamToManage = teams.find(t => t.id === selectedTeamId);
                return teamToManage ? <PlayerManager team={teamToManage} onUpdate={(p) => { 
                  const updated = { ...teamToManage, players: p };
                  setTeams(teams.map(t => t.id === teamToManage.id ? updated : t));
                  dbService.saveTeam(updated).catch(() => {});
                }} onBack={() => setView(role === UserRole.ADMIN ? 'admin' : 'dashboard')} isAdminOverride={role === UserRole.ADMIN} /> : null;
              default: return <Dashboard teams={teams} matches={matches} standings={standings} news={news} ads={ads} setView={setView} leagueSettings={leagueSettings} role={role} selectedTeamId={selectedTeamId} />;
            }
          })()}
        </ErrorBoundary>
      </main>
      <style>{`@keyframes progress { 0% { left: -30%; } 100% { left: 100%; } }`}</style>
    </div>
  );
};

export default App;
