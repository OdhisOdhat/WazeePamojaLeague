
import React, { useState, useRef, useEffect } from 'https://esm.sh/react@19.0.0';
import { Team } from '../types.ts';

interface TeamRegistrationProps {
  onRegister: (team: Omit<Team, 'id' | 'players'>) => void;
  existingNames: string[];
  initialData?: Team;
  onCancel?: () => void;
}

const TeamRegistration: React.FC<TeamRegistrationProps> = ({ onRegister, existingNames, initialData, onCancel }) => {
  const [formData, setFormData] = useState({ name: '', manager: '', contact: '', homeGround: '', logo: '' });
  const [error, setError] = useState('');
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({ name: initialData.name, manager: initialData.manager, contact: initialData.contact, homeGround: initialData.homeGround, logo: initialData.logo });
      setPreviewLogo(initialData.logo);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (existingNames.some(n => n.toLowerCase() === formData.name.toLowerCase() && n !== initialData?.name)) {
      setError('Name already exists'); return;
    }
    onRegister({ ...formData, logo: formData.logo || `https://picsum.photos/seed/${formData.name}/200` });
  };

  return (
    <div className="max-w-xl mx-auto p-8 bg-white rounded-[2.5rem] shadow-xl border border-gray-100">
      <h2 className="text-3xl font-black mb-6">{initialData ? 'Update Team' : 'Register Team'}</h2>
      {error && <p className="text-red-500 mb-4 font-bold">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
         <input required placeholder="Team Name" className="w-full p-4 border rounded-2xl font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
         <input required placeholder="Manager" className="w-full p-4 border rounded-2xl font-bold" value={formData.manager} onChange={e => setFormData({...formData, manager: e.target.value})} />
         <input required placeholder="Contact" className="w-full p-4 border rounded-2xl font-bold" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} />
         <input required placeholder="Stadium" className="w-full p-4 border rounded-2xl font-bold" value={formData.homeGround} onChange={e => setFormData({...formData, homeGround: e.target.value})} />
         <button type="submit" className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black uppercase tracking-widest">Confirm Registration</button>
         {onCancel && <button type="button" onClick={onCancel} className="w-full text-gray-400 font-bold">Cancel</button>}
      </form>
    </div>
  );
};

export default TeamRegistration;
