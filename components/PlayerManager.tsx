
import React, { useState, useRef } from 'https://esm.sh/react@19.0.0';
import { Player, Team } from '../types.ts';
import { MAX_SQUAD_SIZE } from '../constants.tsx';

interface PlayerManagerProps {
  team: Team;
  onUpdate: (players: Player[]) => void;
  onBack: () => void;
  isAdminOverride?: boolean;
}

const PlayerManager: React.FC<PlayerManagerProps> = ({ team, onUpdate, onBack, isAdminOverride }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [previewPhoto, setPreviewPhoto] = useState<string>('');
  const [newPlayer, setNewPlayer] = useState<Partial<Player>>({
    name: '',
    jerseyNumber: 1,
    position: 'Goalkeeper',
    age: 33,
    photoUrl: '',
    goals: 0,
    assists: 0,
    appearances: 0
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreviewPhoto(base64String);
        setNewPlayer(prev => ({ ...prev, photoUrl: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const isJerseyTaken = (num: number, excludeId: string | null) => {
    return team.players.some(p => p.jerseyNumber === num && p.id !== excludeId);
  };

  const savePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const jerseyNum = Number(newPlayer.jerseyNumber) || 0;
    const playerAge = Number(newPlayer.age) || 0;

    if (playerAge < 33 || playerAge > 75) {
      setError(`League Eligibility Error: Players must be between 33 and 75 years old.`);
      return;
    }

    if (isJerseyTaken(jerseyNum, editingPlayerId)) {
      setError(`Jersey number #${jerseyNum} is already assigned to another player.`);
      return;
    }

    if (editingPlayerId) {
      onUpdate(team.players.map(p => p.id === editingPlayerId ? { ...p, ...newPlayer as Player } : p));
    } else {
      if (team.players.length >= MAX_SQUAD_SIZE) {
        setError(`Squad limit reached (${MAX_SQUAD_SIZE} players max).`);
        return;
      }
      onUpdate([...team.players, { 
        ...newPlayer as Player, 
        id: `p${Date.now()}`, 
        photoUrl: newPlayer.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${newPlayer.name || 'default'}` 
      }]);
    }

    setShowAdd(false);
    resetForm();
  };

  const resetForm = () => {
    setNewPlayer({ name: '', jerseyNumber: 1, position: 'Goalkeeper', age: 33, photoUrl: '', goals: 0, assists: 0, appearances: 0 });
    setPreviewPhoto('');
    setEditingPlayerId(null);
    setError(null);
  };

  const startEdit = (player: Player) => {
    setNewPlayer(player);
    setPreviewPhoto(player.photoUrl);
    setEditingPlayerId(player.id);
    setShowAdd(true);
  };

  const deletePlayer = (id: string) => {
    if (confirm('Are you sure you want to remove this player?')) {
      onUpdate(team.players.filter(p => p.id !== id));
    }
  };

  const updateSingleStat = (e: React.MouseEvent, playerId: string, field: keyof Player, delta: number) => {
    e.stopPropagation();
    onUpdate(team.players.map(p => p.id === playerId ? { ...p, [field]: Math.max(0, ((p[field] as number) || 0) + delta) } : p));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="bg-white border border-gray-200 p-3 rounded-xl shadow-sm hover:bg-gray-50 transition-colors">
            <i className="fas fa-arrow-left"></i>
          </button>
          <div className="flex items-center space-x-4">
            <img src={team.logo} className="w-16 h-16 rounded-2xl shadow-md object-cover bg-white" alt="" />
            <div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">{team.name}</h2>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Squad Management • {team.players.length}/{MAX_SQUAD_SIZE}</p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => { resetForm(); setShowAdd(true); }} 
          className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center space-x-2"
        >
          <i className="fas fa-plus"></i>
          <span>Add New Player</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {team.players.map(player => (
          <div key={player.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-5 group hover:shadow-xl transition-all border-b-4 border-b-blue-600/0 hover:border-b-blue-600">
             <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 bg-gray-50">
                <img src={player.photoUrl} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                   <button onClick={() => startEdit(player)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-lg"><i className="fas fa-edit"></i></button>
                   <button onClick={() => deletePlayer(player.id)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-red-500 shadow-lg"><i className="fas fa-trash-alt"></i></button>
                </div>
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-lg shadow-sm">
                   <span className="text-xs font-black text-gray-900">#{player.jerseyNumber}</span>
                </div>
             </div>
             
             <div className="space-y-1 mb-4">
                <p className="font-black text-lg text-gray-900 leading-none">{player.name}</p>
                <div className="flex items-center space-x-2">
                   <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{player.position}</span>
                   <span className="text-[10px] uppercase font-bold text-gray-400">{player.age} Years</span>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                   <div className="flex justify-between items-center mb-1">
                      <p className="text-[9px] font-black text-gray-400 uppercase">Goals</p>
                      <div className="flex space-x-1">
                        <button onClick={(e) => updateSingleStat(e, player.id, 'goals', 1)} className="w-5 h-5 bg-white text-blue-600 rounded-lg shadow-sm flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"><i className="fas fa-plus text-[8px]"></i></button>
                        <button onClick={(e) => updateSingleStat(e, player.id, 'goals', -1)} className="w-5 h-5 bg-white text-gray-400 rounded-lg shadow-sm flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"><i className="fas fa-minus text-[8px]"></i></button>
                      </div>
                   </div>
                   <p className="font-black text-xl text-gray-900">{player.goals || 0}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                   <div className="flex justify-between items-center mb-1">
                      <p className="text-[9px] font-black text-gray-400 uppercase">Assists</p>
                      <div className="flex space-x-1">
                        <button onClick={(e) => updateSingleStat(e, player.id, 'assists', 1)} className="w-5 h-5 bg-white text-blue-600 rounded-lg shadow-sm flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"><i className="fas fa-plus text-[8px]"></i></button>
                        <button onClick={(e) => updateSingleStat(e, player.id, 'assists', -1)} className="w-5 h-5 bg-white text-gray-400 rounded-lg shadow-sm flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"><i className="fas fa-minus text-[8px]"></i></button>
                      </div>
                   </div>
                   <p className="font-black text-xl text-gray-900">{player.assists || 0}</p>
                </div>
             </div>
          </div>
        ))}
        {team.players.length === 0 && (
          <div className="col-span-full py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-400">
             <i className="fas fa-user-friends text-5xl mb-4 opacity-20"></i>
             <p className="font-bold text-lg">No players in squad</p>
             <p className="text-sm">Click the add button above to register players.</p>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-2xl font-black text-gray-900">{editingPlayerId ? 'Edit Player' : 'Register Player'}</h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-900 transition-colors"><i className="fas fa-times text-xl"></i></button>
            </div>
            
            <form onSubmit={savePlayer} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 flex items-center space-x-3 text-sm font-bold animate-in shake duration-300">
                  <i className="fas fa-exclamation-triangle"></i>
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 flex flex-col items-center justify-center space-y-4">
                  <div className="w-32 h-32 rounded-[2rem] bg-gray-100 border-2 border-dashed border-gray-200 overflow-hidden relative group">
                    <img src={previewPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${newPlayer.name || 'default'}`} className="w-full h-full object-cover" alt="" />
                    <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                      <i className="fas fa-camera text-white text-2xl"></i>
                      <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" className="hidden" />
                    </label>
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Player Profile Photo</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input 
                    required 
                    placeholder="e.g. John Doe" 
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold focus:ring-4 focus:ring-blue-50 outline-none focus:border-blue-500 transition-all" 
                    value={newPlayer.name} 
                    onChange={e => setNewPlayer({...newPlayer, name: e.target.value})} 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Jersey Number</label>
                  <input 
                    type="number" 
                    required 
                    min="1" 
                    max="99" 
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold focus:ring-4 focus:ring-blue-50 outline-none focus:border-blue-500 transition-all" 
                    value={newPlayer.jerseyNumber} 
                    onChange={e => setNewPlayer({...newPlayer, jerseyNumber: Number(e.target.value)})} 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Position</label>
                  <select 
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold focus:ring-4 focus:ring-blue-50 outline-none focus:border-blue-500 transition-all" 
                    value={newPlayer.position} 
                    onChange={e => setNewPlayer({...newPlayer, position: e.target.value})}
                  >
                    <option>Goalkeeper</option>
                    <option>Defender</option>
                    <option>Midfielder</option>
                    <option>Forward</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Age (Eligibility: 33+)</label>
                  <input 
                    type="number" 
                    required 
                    min="33" 
                    max="75" 
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold focus:ring-4 focus:ring-blue-50 outline-none focus:border-blue-500 transition-all" 
                    value={newPlayer.age} 
                    onChange={e => setNewPlayer({...newPlayer, age: Number(e.target.value)})} 
                  />
                </div>
              </div>

              <div className="pt-4 flex flex-col space-y-3">
                <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black uppercase text-sm tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">
                  {editingPlayerId ? 'Save Changes' : 'Confirm Registration'}
                </button>
                <button type="button" onClick={() => setShowAdd(false)} className="w-full text-gray-400 font-bold uppercase text-[10px] tracking-widest py-2">
                  Discard Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerManager;
