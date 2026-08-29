import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, Award, Zap, Target, Mic2, ChevronDown } from 'lucide-react';
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
  columns: {
    key: string;
    label: string;
    align?: 'left' | 'center' | 'right';
    render: (p: PlayerStat) => React.ReactNode;
  }[];
}

const NoDataAnimation = ({ seasonLabel }: { seasonLabel: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
  >
    <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
      {/* Header stripe */}
      <div className="h-2 bg-gradient-to-r from-orange-500 via-purple-500 to-indigo-500" />
      <div className="p-8 text-center">
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 mb-5 shadow-inner"
        >
          <TrendingUp className="h-7 w-7 text-gray-500" />
        </motion.div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">No Data Available</h3>
        <div className="w-10 h-0.5 bg-gradient-to-r from-orange-400 to-purple-500 mx-auto mb-4 rounded-full" />
        <p className="text-sm text-gray-500 leading-relaxed">
          {seasonLabel
            ? `No performance data found for ${seasonLabel}. Stats will appear once matches are played in this season.`
            : 'Select a season to view player stats and leaderboards.'}
        </p>
      </div>
    </div>
  </motion.div>
);

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
        if (defaultId) {
          await fetchData(defaultId);
        }
      } catch {}
    };
    init().finally(() => setLoading(false));
  }, []);

  const fetchData = async (seasonId: string) => {
    try {
      const r = await api.get(`/player/top-performers?limit=100&seasonId=${seasonId}`);
      const merged = [
        ...(r.data.topBatsmen || []),
        ...(r.data.topBowlers || []),
      ];
      const seen = new Set<string>();
      setAllPlayers(merged.filter(p => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      }));
    } catch {
      setAllPlayers([]);
    }
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
      columns: [
        { key: 'rank', label: '#', render: () => null },
        { key: 'player', label: 'Player', render: () => null },
        { key: 'matches', label: 'Mat', align: 'center', render: (p) => p.careerStats.matches },
        { key: 'runs', label: 'Runs', align: 'right', render: (p) => p.careerStats.runs },
        { key: 'hs', label: 'HS', align: 'right', render: (p) => p.careerStats.highestScore || '-' },
        { key: 'avg', label: 'Avg', align: 'right', render: (p) => p.careerStats.average > 0 ? p.careerStats.average.toFixed(1) : '-' },
        { key: 'sr', label: 'SR', align: 'right', render: (p) => p.careerStats.strikeRate > 0 ? p.careerStats.strikeRate.toFixed(1) : '-' },
      ],
    },
    {
      key: 'wickets', label: 'Most Wickets', icon: <Award className="h-4 w-4" />,
      sortField: 'wickets', accentColor: 'purple',
      columns: [
        { key: 'rank', label: '#', render: () => null },
        { key: 'player', label: 'Player', render: () => null },
        { key: 'matches', label: 'Mat', align: 'center', render: (p) => p.careerStats.matches },
        { key: 'wickets', label: 'Wkts', align: 'right', render: (p) => p.careerStats.wickets },
        { key: 'econ', label: 'Econ', align: 'right', render: (p) => p.careerStats.economy > 0 ? p.careerStats.economy.toFixed(1) : '-' },
        { key: 'avg', label: 'Avg', align: 'right', render: (p) => p.careerStats.average > 0 ? p.careerStats.average.toFixed(1) : '-' },
        { key: 'sr', label: 'SR', align: 'right', render: (p) => p.careerStats.strikeRate > 0 ? p.careerStats.strikeRate.toFixed(1) : '-' },
      ],
    },
    {
      key: 'sixes', label: 'Most Sixes', icon: <Zap className="h-4 w-4" />,
      sortField: 'sixes', accentColor: 'blue',
      columns: [
        { key: 'rank', label: '#', render: () => null },
        { key: 'player', label: 'Player', render: () => null },
        { key: 'matches', label: 'Mat', align: 'center', render: (p) => p.careerStats.matches },
        { key: 'runs', label: 'Runs', align: 'right', render: (p) => p.careerStats.runs },
        { key: 'sixes', label: '6s', align: 'right', render: (p) => p.careerStats.sixes },
        { key: 'sr', label: 'SR', align: 'right', render: (p) => p.careerStats.strikeRate > 0 ? p.careerStats.strikeRate.toFixed(1) : '-' },
      ],
    },
    {
      key: 'fours', label: 'Most Fours', icon: <Target className="h-4 w-4" />,
      sortField: 'fours', accentColor: 'emerald',
      columns: [
        { key: 'rank', label: '#', render: () => null },
        { key: 'player', label: 'Player', render: () => null },
        { key: 'matches', label: 'Mat', align: 'center', render: (p) => p.careerStats.matches },
        { key: 'runs', label: 'Runs', align: 'right', render: (p) => p.careerStats.runs },
        { key: 'fours', label: '4s', align: 'right', render: (p) => p.careerStats.fours },
        { key: 'sr', label: 'SR', align: 'right', render: (p) => p.careerStats.strikeRate > 0 ? p.careerStats.strikeRate.toFixed(1) : '-' },
      ],
    },
    {
      key: 'catches', label: 'Most Catches', icon: <Mic2 className="h-4 w-4" />,
      sortField: 'catches', accentColor: 'amber',
      columns: [
        { key: 'rank', label: '#', render: () => null },
        { key: 'player', label: 'Player', render: () => null },
        { key: 'matches', label: 'Mat', align: 'center', render: (p) => p.careerStats.matches },
        { key: 'catches', label: 'Ct', align: 'right', render: (p) => p.careerStats.catches },
        { key: 'stumpings', label: 'St', align: 'right', render: (p) => p.careerStats.stumpings || 0 },
        { key: 'total', label: 'Total', align: 'right', render: (p) => p.careerStats.catches + (p.careerStats.stumpings || 0) },
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

  const selectedSeason = allSeasons.find(s => s._id === selectedSeasonId);
  const seasonLabel = selectedSeason
    ? selectedSeason.seasonLabel || `Season ${selectedSeason.seasonNumber}`
    : '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 via-purple-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <Link to="/" className="inline-flex items-center text-white/70 hover:text-white mb-4 transition-colors text-sm">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Home
          </Link>
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2">LEADERBOARD</h1>
            <p className="text-white/80 text-sm md:text-base">Season stats and achievements</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Season + Tab Buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {/* Season selector button */}
          <div className="relative">
            <button
              onClick={() => setSeasonOpen(!seasonOpen)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-white text-gray-600 border border-gray-200 hover:text-gray-900 hover:border-gray-300 transition-all duration-200"
            >
              <span className="text-base">📅</span>
              Season {selectedSeason?.seasonNumber || ''}{selectedSeason?.isCurrent ? ' (Current)' : ''}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${seasonOpen ? 'rotate-180' : ''}`} />
            </button>
            {seasonOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSeasonOpen(false)} />
                <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px]">
                  {allSeasons.length === 0 ? (
                    <p className="px-4 py-2 text-sm text-gray-400">No seasons available</p>
                  ) : (
                    allSeasons.map(s => (
                      <button
                        key={s._id}
                        onClick={() => { handleSeasonChange(s._id); setSeasonOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          s._id === selectedSeasonId
                            ? 'bg-gray-100 text-gray-900 font-semibold'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        Season {s.seasonNumber}{s.isCurrent ? ' (Current)' : ''}
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === tab.key
                  ? `bg-gradient-to-r ${colorMap[tab.accentColor]} text-white shadow-md`
                  : 'bg-white text-gray-600 border border-gray-200 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Data freshness */}
        {!loading && allPlayers.length > 0 && (
          <p className="text-center text-xs text-gray-400 -mt-6 mb-8">
            {allPlayers.length} players • {sortedData.length} shown
          </p>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin w-10 h-10 border-4 border-gray-800 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-500 text-sm">Loading...</p>
            </div>
          </div>
        ) : sortedData.length === 0 ? (
          <div className="py-10">
            <NoDataAnimation seasonLabel={seasonLabel} />
          </div>
        ) : (
          <motion.div
            key={`${selectedSeasonId}-${activeTab}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-900 text-white">
                      {activeTabConfig.columns.map(col => (
                        <th
                          key={col.key}
                          className={`px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider ${
                            col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                          }`}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedData.map((p, i) => {
                      const rowAccent = activeTabConfig.accentColor;
                      const activeRowBg = rowAccent === 'orange' ? 'bg-orange-50/40' :
                        rowAccent === 'purple' ? 'bg-purple-50/40' :
                        rowAccent === 'blue' ? 'bg-blue-50/40' :
                        rowAccent === 'emerald' ? 'bg-emerald-50/40' :
                        'bg-amber-50/40';
                      const statColor = rowAccent === 'orange' ? 'text-orange-600' :
                        rowAccent === 'purple' ? 'text-purple-600' :
                        rowAccent === 'blue' ? 'text-blue-600' :
                        rowAccent === 'emerald' ? 'text-emerald-600' :
                        'text-amber-600';
                      return (
                      <tr key={p.id} className={`${i === 0 ? activeRowBg : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} hover:bg-gray-100/60 transition-colors`}>
                        {activeTabConfig.columns.map(col => {
                          if (col.key === 'rank') {
                            return (
                              <td key={col.key} className="px-5 py-3.5">
                                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                  i === 0 ? 'bg-gray-900 text-white shadow-sm' :
                                  i === 1 ? 'bg-gray-400 text-white' :
                                  i === 2 ? 'bg-amber-600 text-white' :
                                  'bg-gray-100 text-gray-500'
                                }`}>{i + 1}</span>
                              </td>
                            );
                          }
                          if (col.key === 'player') {
                            return (
                              <td key={col.key} className="px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                    {p.profilePicture ? (
                                      <img src={getProfileImageUrl(p.profilePicture)} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-xs font-bold text-gray-500">{p.name.charAt(0)}</span>
                                    )}
                                  </div>
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">{p.position || 'N/A'}</p>
                                    </div>
                                </div>
                              </td>
                            );
                          }
                          return (
                            <td
                              key={col.key}
                              className={`px-5 py-3.5 text-sm font-medium ${
                                col.key === 'runs' || col.key === 'wickets' || col.key === 'sixes' || col.key === 'fours' || col.key === 'catches' || col.key === 'total'
                                  ? `${statColor} font-black`
                                  : 'text-gray-700'
                              } ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}`}
                            >
                              {col.render(p)}
                            </td>
                          );
                        })}
                      </tr>);
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TournamentStats;
