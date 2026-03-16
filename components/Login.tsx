
import React, { useState } from 'https://esm.sh/react@19.0.0';
import { UserRole, Team } from '../types.ts';

interface LoginProps {
  teams: Team[];
  onLogin: (role: UserRole, teamId?: string, userId?: string) => void;
  onBack: () => void;
  loginFn: (u: string, p: string) => Promise<{role: UserRole, teamId?: string, id?: string}>;
  registerFn?: (u: string, p: string, teamId: string) => Promise<any>;
}

const Login: React.FC<LoginProps> = ({ teams, onLogin, onBack, loginFn, registerFn }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [activeTab, setActiveTab] = useState<'manager' | 'admin'>('manager');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isRegistering) {
        if (activeTab === 'admin') throw new Error('Admin registration disabled');
        if (!registerFn) throw new Error('Registration unavailable');

        const user = await registerFn(username, password, selectedTeamId);
        onLogin(UserRole.TEAM_MANAGER, user.teamId, user.id);
      } else {
        const user = await loginFn(username, password);
        onLogin(user.role, user.teamId, user.id);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 animate-in fade-in zoom-in duration-300">
      <div className="max-w-md w-full space-y-8 bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl border border-gray-100">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 mb-4 text-white">
            <i className={`fas ${isRegistering ? 'fa-user-plus' : 'fa-shield-halved'} text-2xl`}></i>
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">
            {isRegistering ? 'Join LeaguePro' : 'Secure Access'}
          </h2>
          <p className="mt-2 text-sm text-gray-500 font-medium">
            {isRegistering ? 'Create a manager account' : 'Sign in to manage operations'}
          </p>
        </div>

        {!isRegistering && (
          <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
            <button
              onClick={() => setActiveTab('manager')}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                activeTab === 'manager' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              Manager
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                activeTab === 'admin' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              Admin
            </button>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleAuth}>
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold flex items-center space-x-2 animate-in shake duration-300">
              <i className="fas fa-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Username</label>
              <input
                type="text"
                required
                className="w-full rounded-2xl px-5 py-4 border border-gray-200 bg-gray-50 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-bold"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Password</label>
              <input
                type="password"
                required
                className="w-full rounded-2xl px-5 py-4 border border-gray-200 bg-gray-50 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-bold"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {isRegistering && (
              <div className="animate-in slide-in-from-top-2">
                <div className="flex justify-between items-center mb-2 ml-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Affiliated Team</label>
                  <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full uppercase">Optional</span>
                </div>
                <select
                  className="w-full rounded-2xl px-5 py-4 border border-gray-200 bg-gray-50 focus:ring-4 focus:ring-blue-50 outline-none font-bold bg-white"
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                >
                  <option value="">None / Register Team Later</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <p className="mt-2 text-[10px] text-gray-400 font-medium px-1 italic">You can link or register a team once logged in.</p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-5 px-4 border border-transparent text-sm font-black rounded-2xl text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 disabled:opacity-50"
          >
            {isLoading ? (
              <i className="fas fa-circle-notch fa-spin text-xl"></i>
            ) : (
              <span className="tracking-widest">{isRegistering ? 'CREATE ACCOUNT' : 'AUTHENTICATE'}</span>
            )}
          </button>

          <div className="flex flex-col space-y-3 pt-2 text-center">
            {!isRegistering && activeTab === 'manager' && (
              <button
                type="button"
                onClick={() => setIsRegistering(true)}
                className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest"
              >
                No account? Register as Manager
              </button>
            )}
            {isRegistering && (
              <button
                type="button"
                onClick={() => setIsRegistering(false)}
                className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest"
              >
                Already registered? Login
              </button>
            )}
            <button
              type="button"
              onClick={onBack}
              className="text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest"
            >
              Back to Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
