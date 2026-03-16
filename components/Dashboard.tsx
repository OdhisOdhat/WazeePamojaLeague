
import React, { useState, useEffect } from 'https://esm.sh/react@19.0.0';
import { Team, Match, Standing, LeagueSettings, UserRole, NewsItem, Ad } from '../types.ts';

interface DashboardProps {
  teams: Team[];
  matches: Match[];
  standings: Standing[];
  news: NewsItem[];
  ads: Ad[];
  setView: (v: string) => void;
  leagueSettings: LeagueSettings;
  role?: UserRole;
  selectedTeamId?: string | null;
}

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1552667466-07770ae110d0?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1511886929837-354d827aae26?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=2000&auto=format&fit=crop'
];

const Dashboard: React.FC<DashboardProps> = ({ 
  teams, matches, standings, news, ads, setView, leagueSettings, role, selectedTeamId 
}) => {
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [currentAdIdx, setCurrentAdIdx] = useState(0);
  const [currentHeroIdx, setCurrentHeroIdx] = useState(0);

  const activeAds = ads.filter(a => a.isActive);

  useEffect(() => {
    const heroInterval = setInterval(() => {
      setCurrentHeroIdx(prev => (prev + 1) % HERO_IMAGES.length);
    }, 6000);

    let adInterval: any;
    if (activeAds.length > 1) {
      adInterval = setInterval(() => {
        setCurrentAdIdx(prev => (prev + 1) % activeAds.length);
      }, 5000);
    }

    return () => {
      clearInterval(heroInterval);
      if (adInterval) clearInterval(adInterval);
    };
  }, [activeAds.length]);

  const upcomingMatches = matches
    .filter(m => !m.isCompleted)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const nextMatch = upcomingMatches[0];
  const topTeams = standings.slice(0, 3);
  const isManagerWithoutTeam = role === UserRole.TEAM_MANAGER && !selectedTeamId;

  const getTeam = (id: string) => teams.find(t => t.id === id);

  const externalLeagues = [
    { name: 'English Premier League', icon: 'fa-england', color: 'bg-purple-600', link: 'https://www.premierleague.com', logo: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    { name: 'Bundesliga', icon: 'fa-germany', color: 'bg-red-600', link: 'https://www.bundesliga.com', logo: '🇩🇪' },
    { name: 'Ligue 1', icon: 'fa-france', color: 'bg-blue-500', link: 'https://www.ligue1.com', logo: '🇫🇷' },
    { name: 'UEFA Champions League', icon: 'fa-star', color: 'bg-indigo-900', link: 'https://www.uefa.com/uefachampionsleague/', logo: '⭐' },
    { name: 'Kenya Premier League', icon: 'fa-africa', color: 'bg-green-600', link: 'https://footballkenya.org/', logo: '🇰🇪' },
  ];

  return (
    <div className="space-y-16 animate-in fade-in duration-500 pb-20">
      {/* Hero Section with Image Carousel */}
      <div className={`relative overflow-hidden rounded-[3rem] shadow-2xl transition-all duration-700 min-h-[500px] flex items-center ${
        isManagerWithoutTeam ? 'ring-8 ring-blue-50' : ''
      }`}>
        {/* Carousel Background */}
        {HERO_IMAGES.map((img, idx) => (
          <div 
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentHeroIdx ? 'opacity-100' : 'opacity-0'}`}
          >
            <img src={img} className="w-full h-full object-cover scale-110 animate-slow-zoom" alt="" />
            <div className={`absolute inset-0 bg-gradient-to-br ${
              isManagerWithoutTeam 
                ? 'from-indigo-900/90 via-blue-800/80 to-blue-900/90' 
                : 'from-blue-900/90 via-blue-800/70 to-indigo-900/90'
            }`}></div>
          </div>
        ))}

        <div className="relative z-10 w-full p-8 md:p-12 text-white">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-left space-y-4 flex-1">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-100">League Live • {leagueSettings.season}</span>
              </div>

              <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] drop-shadow-lg">
                {isManagerWithoutTeam ? (
                  <>Ready to lead your <span className="text-blue-300">own squad?</span></>
                ) : (
                  <>Welcome to <span className="text-blue-300">{leagueSettings.name}</span></>
                )}
              </h1>

              <p className="text-blue-50 text-lg opacity-90 max-w-2xl leading-relaxed drop-shadow-md">
                {isManagerWithoutTeam 
                  ? "You've successfully joined as a manager. The next step is to register your club and begin building your championship-winning squad." 
                  : leagueSettings.description}
              </p>

              <div className="pt-4 flex flex-wrap gap-4 justify-center md:justify-start">
                {isManagerWithoutTeam ? (
                  <button 
                    onClick={() => setView('registration')}
                    className="bg-white text-blue-700 px-10 py-4 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] hover:bg-blue-50 transition-all shadow-2xl hover:scale-105 active:scale-95 flex items-center space-x-3"
                  >
                    <i className="fas fa-plus-circle text-lg"></i>
                    <span>Register My Team Now</span>
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => setView('registration')}
                      className="bg-white text-blue-700 px-8 py-4 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-blue-50 transition-all shadow-xl hover:scale-105 active:scale-95"
                    >
                      Register a Team
                    </button>
                    <button 
                      onClick={() => setView('schedule')}
                      className="bg-blue-600/30 backdrop-blur border border-white/30 text-white px-8 py-4 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-blue-600/50 transition-all"
                    >
                      View Fixtures
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Ad Space in Hero */}
            <div className="w-full lg:w-1/3 flex flex-col space-y-4">
               {activeAds.length > 0 ? (
                 <a 
                  href={activeAds[currentAdIdx].linkUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group relative block bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-4 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500"
                 >
                   <div className="absolute top-3 right-3 z-20 bg-blue-500 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg">Sponsored</div>
                   <div className="flex items-center space-x-4">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white/10 flex-shrink-0">
                         <img src={activeAds[currentAdIdx].imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                      </div>
                      <div className="space-y-1">
                         <h4 className="text-sm font-black text-white group-hover:text-blue-300 transition-colors line-clamp-1">{activeAds[currentAdIdx].title}</h4>
                         <p className="text-[10px] text-blue-100/70 line-clamp-3 leading-relaxed">{activeAds[currentAdIdx].description}</p>
                         <div className="text-[8px] font-black text-blue-300 uppercase tracking-widest flex items-center mt-2">
                            Learn More <i className="fas fa-arrow-right ml-1 text-[6px]"></i>
                         </div>
                      </div>
                   </div>
                   {activeAds.length > 1 && (
                     <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
                        {activeAds.map((_, i) => (
                          <div key={i} className={`h-1 rounded-full transition-all ${i === currentAdIdx ? 'w-4 bg-blue-400' : 'w-1 bg-white/20'}`}></div>
                        ))}
                     </div>
                   )}
                 </a>
               ) : (
                 <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[3rem] shadow-2xl flex flex-col items-center justify-center space-y-4 text-white/30">
                    <i className="fas fa-bullhorn text-4xl"></i>
                    <p className="text-[8px] font-black uppercase tracking-[0.3em]">Sponsorship Space Available</p>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Carousel Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
          {HERO_IMAGES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentHeroIdx(idx)}
              className={`w-2 h-2 rounded-full transition-all ${idx === currentHeroIdx ? 'w-8 bg-blue-400' : 'bg-white/40 hover:bg-white/60'}`}
            />
          ))}
        </div>
      </div>

      {/* Main Stats and Featured Match */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[3rem] border border-gray-100 shadow-sm p-8 hover:shadow-xl transition-all">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Featured Match</h3>
            <button onClick={() => setView('schedule')} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Full Schedule <i className="fas fa-arrow-right ml-1"></i></button>
          </div>

          {nextMatch ? (
            <div className="flex flex-col md:flex-row items-center justify-between bg-gray-50 rounded-[2.5rem] p-10 border border-gray-100 group">
              <div className="flex flex-col items-center space-y-4 w-full md:w-1/3">
                <img src={getTeam(nextMatch.homeTeamId)?.logo} className="w-24 h-24 rounded-full shadow-lg bg-white p-2 object-cover border-4 border-white" alt="" />
                <span className="font-black text-gray-900 text-xl text-center leading-tight">{getTeam(nextMatch.homeTeamId)?.name}</span>
              </div>
              
              <div className="flex flex-col items-center justify-center py-8 md:py-0 w-full md:w-1/3">
                <div className="bg-white px-6 py-2 rounded-full shadow-sm border border-gray-100 mb-4 text-xs font-black text-blue-600 uppercase tracking-[0.3em]">VS</div>
                <div className="text-4xl font-black text-gray-900 tracking-tighter">{nextMatch.time}</div>
                <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">{new Date(nextMatch.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}</div>
              </div>

              <div className="flex flex-col items-center space-y-4 w-full md:w-1/3">
                <img src={getTeam(nextMatch.awayTeamId)?.logo} className="w-24 h-24 rounded-full shadow-lg bg-white p-2 object-cover border-4 border-white" alt="" />
                <span className="font-black text-gray-900 text-xl text-center leading-tight">{getTeam(nextMatch.awayTeamId)?.name}</span>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-[2.5rem] p-16 text-center text-gray-400 border-2 border-dashed border-gray-200">
              <i className="fas fa-calendar-day text-5xl mb-4 opacity-20"></i>
              <p className="font-black text-gray-900 uppercase tracking-widest">No Matches Scheduled</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-8 flex flex-col hover:shadow-xl transition-all">
          <h3 className="text-2xl font-black text-gray-900 mb-8 tracking-tight">Leaderboard</h3>
          <div className="space-y-4 flex-1">
            {topTeams.map((s, idx) => (
              <div key={s.teamId} className="group flex items-center justify-between p-5 rounded-[2rem] bg-gray-50 border border-transparent hover:border-blue-100 hover:bg-white transition-all cursor-default">
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-sm ${
                    idx === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900' : 
                    idx === 1 ? 'bg-gradient-to-br from-gray-200 to-gray-400 text-gray-700' : 
                    'bg-gradient-to-br from-orange-300 to-orange-500 text-orange-900'
                  }`}>
                    {idx + 1}
                  </div>
                  <img src={getTeam(s.teamId)?.logo} className="w-10 h-10 rounded-full bg-white p-0.5 border border-gray-100 shadow-sm" alt="" />
                  <span className="font-black text-gray-800 text-sm truncate max-w-[120px]">{s.teamName}</span>
                </div>
                <div className="text-right">
                  <div className="text-blue-600 font-black text-lg leading-none">{s.points}</div>
                  <div className="text-[9px] text-gray-400 font-black uppercase tracking-tighter mt-1">PTS • GD {s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}</div>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={() => setView('standings')}
            className="w-full mt-6 py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-lg"
          >
            Full Standings Table
          </button>
        </div>
      </div>

      {/* Global Football Hub Section */}
      <div className="space-y-8 pt-8 border-t border-gray-100">
        <div className="flex flex-col items-center text-center space-y-2">
           <h3 className="text-3xl font-black text-gray-900 tracking-tight">Global Football Hub</h3>
           <p className="text-gray-500 text-sm font-medium">Follow live scores and updates from other major championships.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {externalLeagues.map((league, idx) => (
            <a 
              key={idx} 
              href={league.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all flex flex-col items-center text-center space-y-4"
            >
              <div className={`w-16 h-16 rounded-[1.5rem] ${league.color} flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                {league.logo}
              </div>
              <div className="space-y-1">
                 <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest leading-tight">{league.name}</h4>
                 <div className="text-[8px] font-bold text-blue-500 uppercase tracking-[0.2em] group-hover:translate-y-1 transition-transform">View Live Data <i className="fas fa-external-link-alt ml-1"></i></div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* League News Section */}
      {news.length > 0 && (
        <div className="space-y-6 pt-8 border-t border-gray-100">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">League Updates & News</h3>
            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">Latest from Media Team</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map(item => (
              <div 
                key={item.id} 
                onClick={() => setSelectedNews(item)}
                className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all cursor-pointer flex flex-col"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img src={item.imageUrl || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000&auto=format&fit=crop'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                  {item.important && (
                    <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                      Important
                    </div>
                  )}
                </div>
                <div className="p-6 space-y-3 flex-1">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <h4 className="text-xl font-black text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">{item.title}</h4>
                  <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{item.content}</p>
                </div>
                <div className="p-6 pt-0">
                  <div className="flex items-center text-xs font-black text-gray-900 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                    Read Story <i className="fas fa-arrow-right ml-2 text-blue-500"></i>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* News Reader Modal */}
      {selectedNews && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 my-8">
             <div className="relative h-[40vh] md:h-[50vh]">
                <img src={selectedNews.imageUrl || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000&auto=format&fit=crop'} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent"></div>
                <button 
                  onClick={() => setSelectedNews(null)}
                  className="absolute top-8 right-8 w-12 h-12 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all shadow-xl"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
                {selectedNews.important && (
                  <div className="absolute bottom-8 left-8 bg-red-600 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-2xl">
                    Important Announcement
                  </div>
                )}
             </div>
             <div className="p-8 md:p-16 -mt-20 relative bg-white rounded-t-[4rem]">
                <p className="text-xs font-black text-blue-600 uppercase tracking-[0.3em] mb-4">
                  Posted on {new Date(selectedNews.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-8">
                  {selectedNews.title}
                </h2>
                <div className="prose prose-xl text-gray-600 max-w-none space-y-6">
                  {selectedNews.content.split('\n').map((para, i) => (
                    <p key={i} className="leading-relaxed text-lg">{para}</p>
                  ))}
                </div>
                <div className="mt-12 pt-8 border-t border-gray-100 flex justify-between items-center">
                   <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <i className="fas fa-shield-alt"></i>
                      </div>
                      <span className="text-sm font-black text-gray-400 uppercase tracking-widest">League Media Team</span>
                   </div>
                   <button 
                    onClick={() => setSelectedNews(null)}
                    className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl"
                  >
                    Close Article
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes slow-zoom {
          from { transform: scale(1); }
          to { transform: scale(1.1); }
        }
        .animate-slow-zoom {
          animation: slow-zoom 20s linear infinite alternate;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
