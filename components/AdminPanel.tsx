
import React, { useState, useRef } from 'https://esm.sh/react@19.0.0';
import { Team, Match, GoalScorer, LeagueSettings, NewsItem, Ad } from '../types.ts';

interface AdminPanelProps {
  teams: Team[];
  matches: Match[];
  news: NewsItem[];
  ads: Ad[];
  leagueSettings: LeagueSettings;
  onUpdateLeagueSettings: (settings: LeagueSettings) => void;
  onUpdateMatch: (id: string, h: number, a: number, scorers?: GoalScorer[], cards?: any[], refereeName?: string) => void;
  onUpdateTeam?: (updatedTeam: Team) => void;
  onSaveNews: (item: NewsItem) => void;
  onDeleteNews: (id: string) => void;
  onSaveAd: (ad: Ad) => void;
  onDeleteAd: (id: string) => void;
  onRegisterTeam: (team: Omit<Team, 'id' | 'players'>) => void;
  onManageSquad: (teamId: string) => void;
  onReset: () => void;
  onImportState: (data: any) => void;
  dbLogs?: string[];
  onForceSync?: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  teams, news, ads, leagueSettings, onUpdateLeagueSettings, onUpdateTeam, onSaveNews, onDeleteNews, onSaveAd, onDeleteAd, onManageSquad, onReset, dbLogs, onForceSync 
}) => {
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [settingsForm, setSettingsForm] = useState<LeagueSettings>(leagueSettings);
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
    news: true,
    ads: true
  });
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const newsImgRef = useRef<HTMLInputElement>(null);
  const adImgRef = useRef<HTMLInputElement>(null);

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
                {ads.map(ad => (
                  <div key={ad.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-100 transition-all group">
                    <div className="flex items-center space-x-4">
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
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-4">Manage Recent Posts</p>
                {news.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-100 transition-all group">
                    <div className="flex items-center space-x-4">
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

      {/* Teams Management */}
      <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl">
        <SectionHeader title={`Manage Teams (${teams.length})`} icon="fa-shield-alt" sectionKey="members" />
        {expandedSections.members && (
          <div className="space-y-3 animate-in slide-in-from-top-2">
            {teams.map(team => (
              <div key={team.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-md transition-all group border border-transparent hover:border-blue-50">
                <div className="flex items-center space-x-4">
                  <img src={team.logo} className="w-12 h-12 rounded-xl object-cover shadow-sm bg-white" alt="" />
                  <div><p className="font-black text-gray-900 leading-none mb-1">{team.name}</p><p className="text-[10px] font-bold text-gray-400 uppercase">{team.manager} • {team.players.length} Players</p></div>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => setEditingTeam(team)} className="p-3 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"><i className="fas fa-edit"></i></button>
                  <button onClick={() => onManageSquad(team.id)} className="p-3 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-colors"><i className="fas fa-users"></i></button>
                </div>
              </div>
            ))}
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
