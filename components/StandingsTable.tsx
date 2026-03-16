
import React from 'https://esm.sh/react@19.0.0';
import { Standing, Team, LeagueSettings } from '../types.ts';

interface StandingsTableProps {
  standings: Standing[];
  teams: Team[];
  leagueSettings: LeagueSettings;
}

const StandingsTable: React.FC<StandingsTableProps> = ({ standings, teams, leagueSettings }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{leagueSettings.name} Standings</h1>
          <p className="text-gray-500">Live updates after every match result.</p>
        </div>
        <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider">
          {leagueSettings.season}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Pos</th>
                <th className="px-6 py-4">Team</th>
                <th className="px-4 py-4 text-center">P</th>
                <th className="px-4 py-4 text-center">W</th>
                <th className="px-4 py-4 text-center">D</th>
                <th className="px-4 py-4 text-center">L</th>
                <th className="px-4 py-4 text-center">GF</th>
                <th className="px-4 py-4 text-center">GA</th>
                <th className="px-4 py-4 text-center">GD</th>
                <th className="px-6 py-4 text-center bg-blue-50 text-blue-600">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {standings.map((s, idx) => {
                const team = teams.find(t => t.id === s.teamId);
                return (
                  <tr key={s.teamId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-500">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img src={team?.logo} alt="" className="w-8 h-8 rounded-full bg-gray-100 object-cover" />
                        <span className="font-semibold text-gray-900">{s.teamName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center font-medium">{s.played}</td>
                    <td className="px-4 py-4 text-center">{s.won}</td>
                    <td className="px-4 py-4 text-center">{s.drawn}</td>
                    <td className="px-4 py-4 text-center">{s.lost}</td>
                    <td className="px-4 py-4 text-center">{s.goalsFor}</td>
                    <td className="px-4 py-4 text-center">{s.goalsAgainst}</td>
                    <td className="px-4 py-4 text-center text-gray-500">{s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}</td>
                    <td className="px-6 py-4 text-center font-bold text-blue-600 bg-blue-50/50">{s.points}</td>
                  </tr>
                );
              })}
              {standings.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-20 text-center text-gray-400">
                    No teams registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard icon="fa-users" title="Total Teams" value={teams.length.toString()} color="blue" />
        <StatsCard icon="fa-futbol" title="Matches Played" value={standings.reduce((acc, s) => acc + s.played, 0).toString()} color="indigo" />
        <StatsCard icon="fa-star" title="Avg Goals/Game" value={(standings.reduce((acc, s) => acc + s.goalsFor, 0) / Math.max(1, standings.reduce((acc, s) => acc + s.played, 0) / 2)).toFixed(1)} color="purple" />
      </div>
    </div>
  );
};

const StatsCard: React.FC<{ icon: string; title: string; value: string; color: string }> = ({ icon, title, value, color }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
    <div className={`w-12 h-12 rounded-xl bg-${color}-100 flex items-center justify-center text-${color}-600 text-xl`}>
      <i className={`fas ${icon}`}></i>
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

export default StandingsTable;
