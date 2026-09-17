import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Award, Zap, Target, Mic2, ChevronDown, Crown, Medal, Star } from 'lucide-react';
import api from '@/lib/api';
import { getProfileImageUrl } from '@/utils/getProfileImageUrl';

interface PlayerStat {
  id: string;
  name: string;
  profilePicture: string | null;
  position: string;
  careerStats: {
    matches: number; runs: number; ballsFaced: number; fours: number; sixes: number;
    highestScore: number; notOuts: number; wickets: number; ballsBowled: number;
    runsConceded: number; economy: number; strikeRate: number; average: number;
    catches: number; stumpings: number;
  };
}

interface Season {
  _id: string;
  seasonNumber: number;
  isCurrent: boolean;
  entryDeadline: string;
}

interface TabConfig {
  key: string;
  label: string;
  icon: React.ReactNode;
  sortField: keyof PlayerStat['careerStats'];
  accentColor: 'orange' | 'purple' | 'blue' | 'emerald' | 'amber';
  statLabels: { key: string; label: string; field: string | ((p: PlayerStat) => any); color?: string }[];
}

const TournamentStats = () => {
  const [allPlayers, setAllPlayers] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('runs');
  const [allSeasons, setAllSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [seasonOpen, setSeasonOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const [seasonsRes, currentRes] = await Promise.all([
          api.get('/seasons').catch(() => ({ data: [] })),
          api.get('/seasons/current').catch(() => ({ data: null })),
        ]);
        const seasons: Season[] = Array.isArray(seasonsRes.data) ? seasonsRes.data : [];
        const current = currentRes.data;
        setAllSeasons(seasons);
        const defaultId = current?._id || seasons[0]?._id || '';
        setSelectedSeasonId(defaultId);
        if (defaultId) await fetchData(defaultId);
      } catch {}
    };
    init().finally(() => setLoading(false));
  }, []);

  const fetchData = async (seasonId: string) => {
    try {
      const r = await api.get(`/player/top-performers?limit=100&seasonId=${seasonId}`);
      const merged = [...(r.data.topBatsmen || []), ...(r.data.topBowlers || [])];
      const seen = new Set<string>();
      setAllPlayers(merged.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; }));
    } catch { setAllPlayers([]); }
  };

  const handleSeasonChange = (value: string) => {
    if (value === selectedSeasonId) return;
    setSelectedSeasonId(value);
    setLoading(true);
    fetchData(value).finally(() => setLoading(false));
  };

  const tabs: TabConfig[] = [
    {
      key: 'runs', label: 'Most Runs', icon: <TrendingUp className="h-4 w-4" />,
      sortField: 'runs', accentColor: 'orange',
      statLabels: [
        { key: 'runs', label: 'Runs', field: 'runs', color: 'text-orange-600' },
        { key: 'avg', label: 'Avg', field: (p) => p.careerStats.average > 0 ? p.careerStats.average.toFixed(1) : '-' },
        { key: 'sr', label: 'SR', field: (p) => p.careerStats.strikeRate > 0 ? p.careerStats.strikeRate.toFixed(1) : '-' },
        { key: 'matches', label: 'Mat', field: 'matches' },
        { key: 'hs', label: 'HS', field: 'highestScore' },
      ],
    },
    {
      key: 'wickets', label: 'Most Wickets', icon: <Award className="h-4 w-4" />,
      sortField: 'wickets', accentColor: 'purple',
      statLabels: [
        { key: 'wickets', label: 'Wkts', field: 'wickets', color: 'text-purple-600' },
        { key: 'econ', label: 'Econ', field: (p) => p.careerStats.economy > 0 ? p.careerStats.economy.toFixed(1) : '-' },
        { key: 'avg', label: 'Avg', field: (p) => p.careerStats.average > 0 ? p.careerStats.average.toFixed(1) : '-' },
        { key: 'matches', label: 'Mat', field: 'matches' },
        { key: 'sr', label: 'SR', field: (p) => p.careerStats.strikeRate > 0 ? p.careerStats.strikeRate.toFixed(1) : '-' },
      ],
    },
    {
      key: 'sixes', label: 'Most Sixes', icon: <Zap className="h-4 w-4" />,
      sortField: 'sixes', accentColor: 'blue',
      statLabels: [
        { key: 'sixes', label: '6s', field: 'sixes', color: 'text-blue-600' },
        { key: 'runs', label: 'Runs', field: 'runs' },
        { key: 'sr', label: 'SR', field: (p) => p.careerStats.strikeRate > 0 ? p.careerStats.strikeRate.toFixed(1) : '-' },
        { key: 'matches', label: 'Mat', field: 'matches' },
      ],
    },
    {
      key: 'fours', label: 'Most Fours', icon: <Target className="h-4 w-4" />,
      sortField: 'fours', accentColor: 'emerald',
      statLabels: [
        { key: 'fours', label: '4s', field: 'fours', color: 'text-emerald-600' },
        { key: 'runs', label: 'Runs', field: 'runs' },
        { key: 'sr', label: 'SR', field: (p) => p.careerStats.strikeRate > 0 ? p.careerStats.strikeRate.toFixed(1) : '-' },
        { key: 'matches', label: 'Mat', field: 'matches' },
      ],
    },
    {
      key: 'catches', label: 'Most Catches', icon: <Mic2 className="h-4 w-4" />,
      sortField: 'catches', accentColor: 'amber',
      statLabels: [
        { key: 'catches', label: 'Ct', field: 'catches', color: 'text-amber-600' },
        { key: 'stumpings', label: 'St', field: (p) => p.careerStats.stumpings || 0 },
        { key: 'total', label: 'Total', field: (p) => p.careerStats.catches + (p.careerStats.stumpings || 0) },
        { key: 'matches', label: 'Mat', field: 'matches' },
      ],
    },
  ];

  const activeTabConfig = tabs.find(t => t.key === activeTab) || tabs[0];

  const sortedData = useMemo(() => {
    return [...allPlayers]
      .sort((a, b) => b.careerStats[activeTabConfig.sortField] - a.careerStats[activeTabConfig.sortField])
      .slice(0, 50);
  }, [allPlayers, activeTabConfig.sortField]);

  const colorMap = {
    orange: 'from-orange-500 to-amber-500',
    purple: 'from-purple-600 to-violet-600',
    blue: 'from-blue-500 to-cyan-500',
    emerald: 'from-emerald-500 to-green-500',
    amber: 'from-amber-500 to-yellow-500',
  };

  const accentBg = {
    orange: 'from-orange-500 to-amber-500',
    purple: 'from-purple-600 to-violet-600',
    blue: 'from-blue-500 to-cyan-500',
    emerald: 'from-emerald-500 to-green-500',
    amber: 'from-amber-500 to-yellow-500',
  };

  const accentRing = {
    orange: 'ring-orange-300',
    purple: 'ring-purple-300',
    blue: 'ring-blue-300',
    emerald: 'ring-emerald-300',
    amber: 'ring-amber-300',
  };

  const accentText = {
    orange: 'text-orange-600',
    purple: 'text-purple-600',
    blue: 'text-blue-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
  };

  const accentBgSoft = {
    orange: 'bg-orange-50',
    purple: 'bg-purple-50',
    blue: 'bg-blue-50',
    emerald: 'bg-emerald-50',
    amber: 'bg-amber-50',
  };

  const selectedSeason = allSeasons.find(s => s._id === selectedSeasonId);
  const seasonLabel = selectedSeason
    ? selectedSeason.seasonLabel || `Season ${selectedSeason.seasonNumber}`
    : '';

  const getValue = (p: PlayerStat, field: string | ((p: PlayerStat) => any)) => {
    if (typeof field === 'function') return field(p);
    return p.careerStats[field as keyof PlayerStat['careerStats']] ?? '-';
  };

  const top1 = sortedData[0];
  const rest = sortedData.slice(1);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 via-purple-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-10 sm:py-12">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 mb-3">
              <Star className="h-4 w-4 text-yellow-300" />
              <span className="text-xs font-bold uppercase tracking-wider">Season {selectedSeason?.seasonNumber || ''}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-2">LEADERBOARD</h1>
            <p className="text-white/70 text-base md:text-lg uppercase">Top performers and their stats</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        {/* Season + Tab Buttons */}
        <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:justify-center sm:gap-2 mb-8">
          <div className="relative col-span-3">
            <button
              onClick={() => setSeasonOpen(!seasonOpen)}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg bg-white text-gray-600 border border-gray-200 hover:text-gray-900 hover:border-gray-300 transition-all duration-200 shadow-sm uppercase"
            >
              <span className="text-sm sm:text-base">📅</span>
              Season {selectedSeason?.seasonNumber || ''}{selectedSeason?.isCurrent ? ' (Current)' : ''}
              <ChevronDown className={`h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform duration-200 ${seasonOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {seasonOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setSeasonOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-xl py-1 min-w-[180px]"
                  >
                    {allSeasons.map(s => (
                      <button
                        key={s._id}
                        onClick={() => { handleSeasonChange(s._id); setSeasonOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          s._id === selectedSeasonId
                            ? 'bg-gray-100 text-gray-900 font-semibold'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        Season {s.seasonNumber}{s.isCurrent ? ' (Current)' : ''}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center justify-center gap-1 px-1.5 py-1.5 sm:px-4 sm:py-2 text-[9px] sm:text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === tab.key
                  ? `bg-gradient-to-r ${colorMap[tab.accentColor]} text-white shadow-md`
                  : 'bg-white text-gray-600 border border-gray-200 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span className="uppercase">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin w-10 h-10 border-4 border-gray-800 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-500 text-sm uppercase">Loading...</p>
            </div>
          </div>
        ) : sortedData.length === 0 ? (
          <div className="py-10 text-center">
            <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-orange-500 via-purple-500 to-indigo-500" />
              <div className="p-8">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 mb-5 shadow-inner"
                >
                  <TrendingUp className="h-7 w-7 text-gray-500" />
                </motion.div>
                <h3 className="text-lg font-bold text-gray-800 mb-2 uppercase">No Data Available</h3>
                <div className="w-10 h-0.5 bg-gradient-to-r from-orange-400 to-purple-500 mx-auto mb-4 rounded-full" />
                <p className="text-sm text-gray-500 leading-relaxed uppercase">
                  {seasonLabel ? `No performance data found for ${seasonLabel}. Stats will appear once matches are played.` : 'Select a season to view player stats.'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <motion.div
            key={`${selectedSeasonId}-${activeTab}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* #1 Featured Player Card */}
            {top1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="mb-6"
              >
                <div className={`relative bg-gradient-to-r ${accentBg[activeTabConfig.accentColor]} rounded-2xl p-4 sm:p-8 lg:p-10 text-white overflow-hidden shadow-xl`}>
                  <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/5" />
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                    <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-0.5 sm:px-3 sm:py-1">
                      <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-300" />
                      <span className="text-[10px] sm:text-xs font-bold">#1</span>
                    </div>
                  </div>
                  <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-3 sm:gap-5 lg:gap-8">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="w-16 h-16 sm:w-28 sm:h-28 lg:w-36 lg:h-36 rounded-2xl overflow-hidden ring-4 ring-white/30 shadow-xl flex-shrink-0"
                    >
                      {top1.profilePicture ? (
                        <img src={getProfileImageUrl(top1.profilePicture)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-white/20 flex items-center justify-center text-2xl sm:text-4xl lg:text-5xl font-black">{top1.name.charAt(0)}</div>
                      )}
                    </motion.div>
                    <div className="text-center sm:text-left flex-1">
                      <p className="text-white/70 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-0.5 sm:mb-1">{activeTabConfig.label}</p>
                      <h2 className="text-xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-0.5 sm:mb-1 drop-shadow-lg uppercase">{top1.name}</h2>
                      <p className="text-white/60 text-[10px] sm:text-base lg:text-lg font-medium uppercase">{top1.position || 'Player'}</p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-6 lg:gap-8 mt-2 sm:mt-4 lg:mt-6">
                        {activeTabConfig.statLabels.map((stat, si) => {
                          const val = getValue(top1, stat.field);
                          return (
                            <div key={stat.key} className="text-center">
                              <p className={`text-base sm:text-3xl md:text-4xl lg:text-5xl font-black ${si === 0 ? 'text-white drop-shadow-md' : 'text-white/90'}`}>{val}</p>
                              <p className="text-[8px] sm:text-xs lg:text-sm text-white/50 uppercase tracking-wider font-medium">{stat.label}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* #2-10 Leaderboard List */}
            {rest.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-50">
                  {rest.map((p, i) => {
                    const rank = i + 2;
                    const isTop3 = rank <= 3;
                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: 0.05 * (i + 1) }}
                        whileHover={{ backgroundColor: 'rgba(249, 250, 251, 0.8)' }}
                        className={`flex items-center gap-2 sm:gap-4 lg:gap-6 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-4 lg:py-5 cursor-default ${isTop3 ? accentBgSoft[activeTabConfig.accentColor] : ''}`}
                      >
                        {/* Rank */}
                        <span className={`w-6 h-6 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-[10px] sm:text-base lg:text-lg font-black flex-shrink-0 ${
                          rank === 2 ? 'bg-gray-200 text-gray-600' :
                          rank === 3 ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-50 text-gray-400'
                        }`}>{rank}</span>

                        {/* Avatar */}
                        <div className={`w-8 h-8 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-lg sm:rounded-xl bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden ring-2 ${accentRing[activeTabConfig.accentColor]} ring-offset-1`}>
                          {p.profilePicture ? (
                            <img src={getProfileImageUrl(p.profilePicture)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className={`text-sm font-bold ${accentText[activeTabConfig.accentColor]}`}>{p.name.charAt(0)}</span>
                          )}
                        </div>

                        {/* Name + Position */}
                        <div className="min-w-0 flex-1">
                          <p className={`font-bold text-gray-900 break-words uppercase ${isTop3 ? 'text-xs sm:text-lg lg:text-xl' : 'text-[11px] sm:text-base lg:text-lg'}`}>{p.name}</p>
                          <p className="text-[8px] sm:text-xs lg:text-sm text-gray-400 font-medium uppercase">{p.position || 'Player'}</p>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-1.5 sm:gap-4 lg:gap-6 flex-shrink-0">
                          {activeTabConfig.statLabels.map((stat, si) => {
                            const val = getValue(p, stat.field);
                            return (
                              <div key={stat.key} className="text-center min-w-[28px] sm:min-w-[40px] lg:min-w-[56px]">
                                <p className={`font-black ${si === 0 ? `text-sm sm:text-xl lg:text-2xl ${accentText[activeTabConfig.accentColor]}` : 'text-[11px] sm:text-base lg:text-lg text-gray-700'}`}>{val}</p>
                                <p className="text-[7px] sm:text-[10px] lg:text-xs text-gray-400 uppercase tracking-wider font-medium">{stat.label}</p>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TournamentStats;
