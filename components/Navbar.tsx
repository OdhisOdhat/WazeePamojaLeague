
import React from 'https://esm.sh/react@19.0.0';
import { UserRole, Team, LeagueSettings } from '../types.ts';

interface NavbarProps {
  currentView: string;
  setView: (v: string) => void;
  role: UserRole;
  username: string | null;
  onLogout: () => void;
  selectedTeamId: string | null;
  teams: Team[];
  isSyncing?: boolean;
  syncError?: string | null;
  leagueSettings: LeagueSettings;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, setView, role, username, onLogout, selectedTeamId, teams, isSyncing, syncError, leagueSettings }) => {
  const managedTeam = teams.find(t => t.id === selectedTeamId);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center h-auto md:h-16 py-3 md:py-0">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView('dashboard')}>
          {leagueSettings.logo ? (
            <img src={leagueSettings.logo} alt="" className="w-10 h-10 object-contain rounded-lg" />
          ) : (
            <div className="bg-blue-600 p-2 rounded-lg">
              <i className="fas fa-trophy text-white text-xl"></i>
            </div>
          )}
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            {leagueSettings.name}
          </span>
        </div>

        <div className="flex flex-wrap justify-center space-x-1 md:space-x-4 mt-4 md:mt-0">
          <NavItem active={currentView === 'dashboard'} onClick={() => setView('dashboard')} icon="fa-home" label="Dashboard" />
          <NavItem active={currentView === 'standings'} onClick={() => setView('standings')} icon="fa-list-ol" label="Standings" />
          <NavItem active={currentView === 'schedule'} onClick={() => setView('schedule')} icon="fa-calendar-alt" label="Fixtures" />
          
          {role === UserRole.PUBLIC && (
            <NavItem active={currentView === 'registration'} onClick={() => setView('registration')} icon="fa-user-plus" label="Join League" />
          )}
          
          {role === UserRole.TEAM_MANAGER && selectedTeamId && (
            <NavItem active={currentView === 'players'} onClick={() => setView('players')} icon="fa-users" label="My Squad" />
          )}

          {role === UserRole.TEAM_MANAGER && !selectedTeamId && (
            <NavItem active={currentView === 'registration'} onClick={() => setView('registration')} icon="fa-plus-circle" label="Register My Team" />
          )}
          
          {role === UserRole.ADMIN && (
            <NavItem active={currentView === 'admin'} onClick={() => setView('admin')} icon="fa-cog" label="Control Panel" />
          )}
        </div>

        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <div className={`hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-full border transition-colors ${syncError ? 'bg-red-50 border-red-100' : isSyncing ? 'bg-amber-50 border-amber-100' : 'bg-green-50 border-green-100'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${syncError ? 'bg-red-500' : isSyncing ? 'bg-amber-500 animate-spin' : 'bg-green-500 animate-pulse'}`}></div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${syncError ? 'text-red-700' : isSyncing ? 'text-amber-700' : 'text-green-700'}`}>
              {syncError ? 'Turso Offline' : isSyncing ? 'Turso Cloud Sync' : 'Turso Data Active'}
            </span>
          </div>

          {role === UserRole.PUBLIC ? (
            <button
              onClick={() => setView('login')}
              className="bg-gray-900 text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-gray-800 transition-all flex items-center space-x-2"
            >
              <i className="fas fa-user-shield"></i>
              <span>Staff Login</span>
            </button>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">
                  {username || (role === UserRole.ADMIN ? 'Admin Session' : role === UserRole.GUEST ? 'Social Guest' : 'Manager Session')}
                </p>
                <p className="text-xs font-bold text-gray-700 truncate max-w-[120px]">
                  {role === UserRole.ADMIN ? 'System Administrator' : role === UserRole.GUEST ? 'Authenticated Viewer' : managedTeam?.name || 'Unlinked Manager'}
                </p>
              </div>
              <button
                onClick={onLogout}
                className="bg-red-50 text-red-600 w-9 h-9 rounded-full flex items-center justify-center hover:bg-red-100 transition-all border border-red-100"
                title="Logout"
              >
                <i className="fas fa-power-off"></i>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: string; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-200 ${
      active ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    <i className={`fas ${icon} text-sm`}></i>
    <span className="text-sm">{label}</span>
  </button>
);

export default Navbar;
