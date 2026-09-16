import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  ComposedChart, Label,
} from 'recharts';

interface Props {
  events: any[];
  playerStats: { batting: any[]; bowling: any[] };
  score: { teamA: any; teamB: any };
  battingFirst: string;
  teamA: { teamName: string; teamLogo?: any };
  teamB: { teamName: string; teamLogo?: any };
  teamAResult?: { runs: number; wickets: number; overs: string };
  teamBResult?: { runs: number; wickets: number; overs: string };
  result: string;
  currentInnings?: number;
}

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

interface GraphDef {
  id: string;
  title: string;
  desc: string;
  type: 'single' | 'comparison' | 'chase';
  accent: string;
  render: (props: Props) => React.ReactNode;
}

function GraphCard({ graph, props }: { graph: GraphDef; props: Props }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-white">
      <div className="p-4">
        {graph.render(props)}
      </div>
      <div className={`px-4 py-3 border-t border-slate-100 bg-gradient-to-r ${graph.accent} text-center`}>
        <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">{graph.title}</h3>
        <p className="text-xs sm:text-sm font-bold text-white/70 mt-0.5 uppercase">{graph.desc}</p>
      </div>
    </div>
  );
}

export default function GraphsView(props: Props) {
  const [tab, setTab] = useState<'all' | 'batting' | 'bowling' | 'comparison'>('all');

  const currentInnings = props.currentInnings || 1;
  const isSecondInnings = currentInnings === 2;

  const graphs: GraphDef[] = [
    // ─── CORE MATCH FLOW (single innings) ───
    {
      id: 'worm',
      title: 'Worm Graph',
      desc: 'Cumulative runs over the innings',
      type: 'single',
      accent: 'from-indigo-600 to-blue-600',
      render: (p) => {
        let cum = 0;
        const data = (p.events || []).map((e, i) => {
          cum += (e.runs || 0) + (e.extras?.runs || 0);
          return { ball: i + 1, runs: cum };
        });
        return (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ball" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area type="monotone" dataKey="runs" stroke="#6366f1" fill="#6366f140" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'manhattan',
      title: 'Manhattan Graph',
      desc: 'Runs per over with wickets overlay',
      type: 'single',
      accent: 'from-amber-500 to-orange-500',
      render: (p) => {
        const overs: Record<number, { runs: number; wickets: number }> = {};
        (p.events || []).forEach(e => {
          const ov = e.over ?? 0;
          if (!overs[ov]) overs[ov] = { runs: 0, wickets: 0 };
          overs[ov].runs += (e.runs || 0) + (e.extras?.runs || 0);
          if (e.wicket) overs[ov].wickets += 1;
        });
        const data = Object.entries(overs).sort((a, b) => Number(a[0]) - Number(b[0])).map(([o, v]) => ({ over: `O${Number(o) + 1}`, runs: v.runs, wickets: v.wickets }));
        return (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="over" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="runs" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="wickets" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: '#ef4444' }} />
            </ComposedChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'over-by-over',
      title: 'Over-by-Over Run Rate',
      desc: 'Runs scored in each over',
      type: 'single',
      accent: 'from-emerald-500 to-teal-500',
      render: (p) => {
        const overs: Record<number, number> = {};
        (p.events || []).forEach(e => {
          const ov = e.over ?? 0;
          overs[ov] = (overs[ov] || 0) + (e.runs || 0) + (e.extras?.runs || 0);
        });
        const data = Object.entries(overs).sort((a, b) => Number(a[0]) - Number(b[0])).map(([o, r]) => ({ over: `O${Number(o) + 1}`, runs: r }));
        return (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="over" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="runs" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'momentum',
      title: 'Match Momentum',
      desc: 'Run scoring momentum per over',
      type: 'single',
      accent: 'from-purple-600 to-pink-500',
      render: (p) => {
        const overs: Record<number, number> = {};
        (p.events || []).forEach(e => {
          const ov = e.over ?? 0;
          overs[ov] = (overs[ov] || 0) + (e.runs || 0) + (e.extras?.runs || 0);
        });
        const data = Object.entries(overs).sort((a, b) => Number(a[0]) - Number(b[0])).map(([o, r]) => ({ over: `O${Number(o) + 1}`, momentum: r }));
        return (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="over" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area type="monotone" dataKey="momentum" stroke="#8b5cf6" fill="#8b5cf630" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'current-run-rate',
      title: 'Current Run Rate',
      desc: 'CRR progression through the innings',
      type: 'single',
      accent: 'from-cyan-500 to-blue-500',
      render: (p) => {
        let cumRuns = 0;
        const data = (p.events || []).map((e, i) => {
          cumRuns += (e.runs || 0) + (e.extras?.runs || 0);
          const balls = i + 1;
          return { ball: balls, crr: parseFloat(((cumRuns / balls) * 6).toFixed(2)) };
        });
        return (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ball" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="crr" stroke="#06b6d4" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        );
      },
    },
    // ─── TEAM COMPARISON (2nd innings only) ───
    {
      id: 'team-total-runs',
      title: 'Team Total Runs',
      desc: 'Total runs scored by each team',
      type: 'comparison',
      accent: 'from-indigo-600 to-violet-600',
      render: (p) => {
        const data = [
          { name: p.teamA?.teamName || 'Team A', runs: p.teamAResult?.runs ?? p.score?.teamA?.runs ?? 0 },
          { name: p.teamB?.teamName || 'Team B', runs: p.teamBResult?.runs ?? p.score?.teamB?.runs ?? 0 },
        ];
        return (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="runs" radius={[6, 6, 0, 0]}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'run-rate-analytics',
      title: 'Run Rate Analytics',
      desc: 'CRR comparison between teams',
      type: 'comparison',
      accent: 'from-emerald-600 to-green-600',
      render: (p) => {
        const data = [
          { name: p.teamA?.teamName || 'Team A', rate: p.score?.teamA?.runRate || 0 },
          { name: p.teamB?.teamName || 'Team B', rate: p.score?.teamB?.runRate || 0 },
        ];
        return (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
              <Tooltip />
              <Bar dataKey="rate" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'boundary-analysis',
      title: 'Boundary Analysis',
      desc: 'Fours and sixes by each team',
      type: 'comparison',
      accent: 'from-amber-500 to-yellow-500',
      render: (p) => {
        const data = [
          { name: p.teamA?.teamName || 'Team A', fours: p.score?.teamA?.fours || 0, sixes: p.score?.teamA?.sixes || 0 },
          { name: p.teamB?.teamName || 'Team B', fours: p.score?.teamB?.fours || 0, sixes: p.score?.teamB?.sixes || 0 },
        ];
        return (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="fours" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="sixes" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'sixes-comparison',
      title: 'Sixes Comparison',
      desc: 'Sixes hit by each team',
      type: 'comparison',
      accent: 'from-red-500 to-rose-500',
      render: (p) => {
        const data = [
          { name: p.teamA?.teamName || 'Team A', sixes: p.score?.teamA?.sixes || 0 },
          { name: p.teamB?.teamName || 'Team B', sixes: p.score?.teamB?.sixes || 0 },
        ];
        return (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="sixes" radius={[6, 6, 0, 0]}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'fours-comparison',
      title: 'Fours Comparison',
      desc: 'Fours hit by each team',
      type: 'comparison',
      accent: 'from-yellow-500 to-amber-500',
      render: (p) => {
        const data = [
          { name: p.teamA?.teamName || 'Team A', fours: p.score?.teamA?.fours || 0 },
          { name: p.teamB?.teamName || 'Team B', fours: p.score?.teamB?.fours || 0 },
        ];
        return (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="fours" radius={[6, 6, 0, 0]}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'runs-vs-wickets',
      title: 'Runs vs Wickets',
      desc: 'Runs scored vs wickets lost per team',
      type: 'comparison',
      accent: 'from-violet-600 to-purple-600',
      render: (p) => {
        const data = [
          { name: p.teamA?.teamName || 'Team A', runs: p.score?.teamA?.runs || 0, wickets: p.score?.teamA?.wickets || 0 },
          { name: p.teamB?.teamName || 'Team B', runs: p.score?.teamB?.runs || 0, wickets: p.score?.teamB?.wickets || 0 },
        ];
        return (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="runs" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="wickets" stroke="#ef4444" strokeWidth={2} dot={{ r: 5, fill: '#ef4444' }} />
            </ComposedChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'wickets-per-match',
      title: 'Wickets Per Innings',
      desc: 'Wickets taken by each team',
      type: 'comparison',
      accent: 'from-red-600 to-pink-600',
      render: (p) => {
        const data = [
          { name: p.teamA?.teamName || 'Team A', wickets: p.score?.teamA?.wickets || 0 },
          { name: p.teamB?.teamName || 'Team B', wickets: p.score?.teamB?.wickets || 0 },
        ];
        return (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="wickets" radius={[6, 6, 0, 0]}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'live-score-progression',
      title: 'Live Score Progression',
      desc: 'Ball-by-ball score progression for both teams',
      type: 'comparison',
      accent: 'from-blue-600 to-cyan-600',
      render: (p) => {
        const teamAData: { ball: number; runs: number }[] = [];
        const teamBData: { ball: number; runs: number }[] = [];
        let cumA = 0, cumB = 0;
        (p.events || []).forEach((e, i) => {
          if (e.battingTeam === p.battingFirst) {
            cumA += (e.runs || 0) + (e.extras?.runs || 0);
            teamAData.push({ ball: teamAData.length + 1, runs: cumA });
          } else {
            cumB += (e.runs || 0) + (e.extras?.runs || 0);
            teamBData.push({ ball: teamBData.length + 1, runs: cumB });
          }
        });
        const maxLen = Math.max(teamAData.length, teamBData.length);
        const data = Array.from({ length: maxLen }, (_, i) => ({
          ball: i + 1,
          [p.teamA?.teamName || 'Team A']: teamAData[i]?.runs ?? null,
          [p.teamB?.teamName || 'Team B']: teamBData[i]?.runs ?? null,
        }));
        return (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ball" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey={p.teamA?.teamName || 'Team A'} stroke="#6366f1" strokeWidth={2} dot={false} connectNulls />
              <Line type="monotone" dataKey={p.teamB?.teamName || 'Team B'} stroke="#ef4444" strokeWidth={2} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        );
      },
    },
    // ─── CHASE SPECIFIC (2nd innings) ───
    {
      id: 'chase-progress',
      title: 'Chase Progress',
      desc: 'Run chase progression vs required rate',
      type: 'chase',
      accent: 'from-teal-500 to-emerald-500',
      render: (p) => {
        const firstTeam = p.battingFirst;
        const target = (p.score?.[firstTeam]?.runs || 0) + 1;
        const secondTeam = firstTeam === 'teamA' ? 'teamB' : 'teamA';
        const teamEvents = (p.events || []).filter(e => e.battingTeam === secondTeam);
        let cum = 0;
        const data = teamEvents.map((e, i) => {
          cum += (e.runs || 0) + (e.extras?.runs || 0);
          const balls = i + 1;
          const overs = balls / 6;
          const required = overs > 0 ? ((target - cum) / ((20 - overs))).toFixed(2) : '0';
          return { ball: balls, runs: cum, required: parseFloat(required) };
        });
        return (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ball" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="runs" stroke="#10b981" strokeWidth={2} dot={false} name="Runs" />
              <Line type="monotone" dataKey="required" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="5 5" name="Req Rate" />
            </LineChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'required-run-rate',
      title: 'Required Run Rate',
      desc: 'Required run rate over the chase',
      type: 'chase',
      accent: 'from-orange-500 to-red-500',
      render: (p) => {
        const firstTeam = p.battingFirst;
        const target = (p.score?.[firstTeam]?.runs || 0) + 1;
        const secondTeam = firstTeam === 'teamA' ? 'teamB' : 'teamA';
        const teamEvents = (p.events || []).filter(e => e.battingTeam === secondTeam);
        let cum = 0;
        const data = teamEvents.map((e, i) => {
          cum += (e.runs || 0) + (e.extras?.runs || 0);
          const balls = i + 1;
          const overs = balls / 6;
          const rrr = overs > 0 ? parseFloat(((target - cum) / (20 - overs)).toFixed(2)) : 0;
          return { ball: balls, rrr };
        });
        return (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ball" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area type="monotone" dataKey="rrr" stroke="#f97316" fill="#f9731630" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        );
      },
    },
    // ─── BATTING ANALYSIS (single innings) ───
    {
      id: 'player-runs',
      title: 'Top Run Scorers',
      desc: 'Highest run-scorers in the match',
      type: 'single',
      accent: 'from-blue-600 to-indigo-600',
      render: (p) => {
        const batsmen = [...(p.playerStats?.batting || [])].filter(b => b.balls > 0).sort((a, b) => b.runs - a.runs).slice(0, 10);
        return (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={batsmen} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="playerName" type="category" tick={{ fontSize: 10 }} width={80} />
              <Tooltip />
              <Bar dataKey="runs" fill="#6366f1" radius={[0, 4, 4, 0]}>
                {batsmen.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'batting-strike-rate',
      title: 'Strike Rate Comparison',
      desc: 'Strike rates of top batsmen',
      type: 'single',
      accent: 'from-cyan-500 to-blue-500',
      render: (p) => {
        const batsmen = [...(p.playerStats?.batting || [])].filter(b => b.balls >= 5).sort((a, b) => (b.strikeRate || 0) - (a.strikeRate || 0)).slice(0, 10);
        return (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={batsmen} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="playerName" type="category" tick={{ fontSize: 10 }} width={80} />
              <Tooltip />
              <Bar dataKey="strikeRate" fill="#06b6d4" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'run-distribution',
      title: 'Run Distribution',
      desc: 'How runs are distributed (dots, 1s, 4s, 6s)',
      type: 'single',
      accent: 'from-pink-500 to-rose-500',
      render: (p) => {
        const dist: Record<string, number> = { 'Dots': 0, '1s': 0, '2s': 0, '3s': 0, '4s': 0, '6s': 0 };
        (p.events || []).forEach(e => {
          if (e.wicket) return;
          const r = (e.runs || 0) + (e.extras?.runs || 0);
          if (e.extras?.type) { dist['Extras'] = (dist['Extras'] || 0) + 1; return; }
          if (r === 0) dist['Dots']++;
          else if (r === 1) dist['1s']++;
          else if (r === 2) dist['2s']++;
          else if (r === 3) dist['3s']++;
          else if (r === 4) dist['4s']++;
          else if (r >= 6) dist['6s']++;
        });
        const data = Object.entries(dist).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
        return (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'dot-ball',
      title: 'Dot Ball Percentage',
      desc: 'Dot balls vs scoring balls',
      type: 'single',
      accent: 'from-slate-500 to-gray-500',
      render: (p) => {
        const dots = (p.events || []).filter(e => !e.wicket && (e.runs || 0) === 0 && !e.extras?.type).length;
        const scoring = (p.events || []).length - dots;
        const data = [
          { name: 'Dot Balls', value: dots },
          { name: 'Scoring Balls', value: scoring },
        ];
        return (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                <Cell fill="#94a3b8" />
                <Cell fill="#6366f1" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'extras-analysis',
      title: 'Extras Analysis',
      desc: 'Extras breakdown (wides, no-balls, byes)',
      type: 'single',
      accent: 'from-yellow-500 to-amber-500',
      render: (p) => {
        const extras: Record<string, number> = {};
        (p.events || []).forEach(e => {
          if (e.extras?.type) extras[e.extras.type] = (extras[e.extras.type] || 0) + 1;
        });
        const data = Object.entries(extras).map(([name, value]) => ({ name: name.replace('_', ' '), value }));
        if (data.length === 0) data.push({ name: 'No Extras', value: 0 });
        return (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'dismissal-type',
      title: 'Dismissal Types',
      desc: 'Types of dismissals in the match',
      type: 'single',
      accent: 'from-red-500 to-orange-500',
      render: (p) => {
        const types: Record<string, number> = {};
        (p.events || []).filter(e => e.wicket).forEach(e => {
          const t = e.wicketType || 'Other';
          types[t] = (types[t] || 0) + 1;
        });
        const data = Object.entries(types).map(([name, value]) => ({ name, value }));
        if (data.length === 0) data.push({ name: 'No Wickets', value: 0 });
        return (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'wicket-fall',
      title: 'Wicket Fall',
      desc: 'Score at each wicket',
      type: 'single',
      accent: 'from-red-600 to-rose-600',
      render: (p) => {
        let cum = 0; let wIdx = 0;
        const data: { label: string; runs: number }[] = [];
        (p.events || []).forEach(e => {
          cum += (e.runs || 0) + (e.extras?.runs || 0);
          if (e.wicket) {
            wIdx++;
            data.push({ label: `W${wIdx}`, runs: cum });
            cum = 0;
          }
        });
        if (data.length === 0) return <div className="flex items-center justify-center h-[280px] text-slate-400 text-sm">No wickets yet</div>;
        return (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="runs" fill="#ef4444" radius={[4, 4, 0, 0]}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'partnership',
      title: 'Partnerships',
      desc: 'Partnership contributions between batsmen',
      type: 'single',
      accent: 'from-violet-500 to-purple-500',
      render: (p) => {
        let cum = 0;
        const data: { label: string; runs: number }[] = [];
        let pIdx = 0;
        (p.events || []).forEach(e => {
          cum += (e.runs || 0) + (e.extras?.runs || 0);
          if (e.wicket) {
            pIdx++;
            data.push({ label: `P${pIdx}`, runs: cum });
            cum = 0;
          }
        });
        if (cum > 0) data.push({ label: `P${pIdx + 1}`, runs: cum });
        return (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="runs" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      },
    },
    // ─── BOWLING ANALYSIS (single innings) ───
    {
      id: 'bowling-performance',
      title: 'Bowling Performance',
      desc: 'Top wicket-takers with economy',
      type: 'single',
      accent: 'from-emerald-600 to-green-600',
      render: (p) => {
        const bowlers = [...(p.playerStats?.bowling || [])].filter(b => b.balls > 0).sort((a, b) => b.wickets - a.wickets || a.runs - b.runs).slice(0, 10);
        return (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={bowlers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="playerName" type="category" tick={{ fontSize: 10 }} width={80} />
              <Tooltip />
              <Bar dataKey="wickets" fill="#10b981" radius={[0, 4, 4, 0]} />
              <Line type="monotone" dataKey="economy" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'economy-comparison',
      title: 'Economy Rate',
      desc: 'Bowling economy rates comparison',
      type: 'single',
      accent: 'from-teal-500 to-cyan-500',
      render: (p) => {
        const bowlers = [...(p.playerStats?.bowling || [])].filter(b => b.balls > 0).sort((a, b) => (a.economy || 0) - (b.economy || 0)).slice(0, 10);
        return (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={bowlers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="playerName" type="category" tick={{ fontSize: 10 }} width={80} />
              <Tooltip />
              <Bar dataKey="economy" fill="#14b8a6" radius={[0, 4, 4, 0]}>
                {bowlers.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'orange-cap',
      title: 'Orange Cap',
      desc: 'Top run-scorer leaderboard',
      type: 'single',
      accent: 'from-orange-500 to-amber-500',
      render: (p) => {
        const batsmen = [...(p.playerStats?.batting || [])].filter(b => b.balls > 0).sort((a, b) => b.runs - a.runs).slice(0, 5);
        return (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={batsmen} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="playerName" type="category" tick={{ fontSize: 10 }} width={80} />
              <Tooltip />
              <Bar dataKey="runs" fill="#f97316" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'purple-cap',
      title: 'Purple Cap',
      desc: 'Top wicket-taker leaderboard',
      type: 'single',
      accent: 'from-purple-600 to-violet-600',
      render: (p) => {
        const bowlers = [...(p.playerStats?.bowling || [])].filter(b => b.balls > 0).sort((a, b) => b.wickets - a.wickets).slice(0, 5);
        return (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={bowlers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="playerName" type="category" tick={{ fontSize: 10 }} width={80} />
              <Tooltip />
              <Bar dataKey="wickets" fill="#7c3aed" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'boundary-percentage',
      title: 'Boundary Percentage',
      desc: 'Percentage of runs from boundaries',
      type: 'comparison',
      accent: 'from-yellow-600 to-orange-600',
      render: (p) => {
        const teamABoundaries = ((p.score?.teamA?.fours || 0) * 4 + (p.score?.teamA?.sixes || 0) * 6);
        const teamARuns = p.score?.teamA?.runs || 1;
        const teamBBoundaries = ((p.score?.teamB?.fours || 0) * 4 + (p.score?.teamB?.sixes || 0) * 6);
        const teamBRuns = p.score?.teamB?.runs || 1;
        const data = [
          { name: p.teamA?.teamName || 'Team A', boundary: teamABoundaries, other: teamARuns - teamABoundaries },
          { name: p.teamB?.teamName || 'Team B', boundary: teamBBoundaries, other: teamBRuns - teamBBoundaries },
        ];
        return (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="boundary" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
              <Bar dataKey="other" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      },
    },
  ];

  const filteredGraphs = graphs.filter(g => {
    if (tab === 'batting') return g.id.includes('player') || g.id.includes('batting') || g.id.includes('orange') || g.id.includes('run-dist') || g.id.includes('dot') || g.id.includes('boundary-pct');
    if (tab === 'bowling') return g.id.includes('bowling') || g.id.includes('economy') || g.id.includes('purple');
    if (tab === 'comparison') return g.type === 'comparison' || g.type === 'chase';
    if (isSecondInnings) return true;
    return g.type !== 'comparison' && g.type !== 'chase';
  });

  const tabs = [
    { key: 'all' as const, label: 'All' },
    { key: 'batting' as const, label: 'Batting' },
    { key: 'bowling' as const, label: 'Bowling' },
    { key: 'comparison' as const, label: 'Comparison' },
  ];

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all ${
              tab === t.key
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Graphs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {filteredGraphs.map(g => (
          <GraphCard key={g.id} graph={g} props={props} />
        ))}
      </div>

      {filteredGraphs.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <p className="text-sm font-bold">No graphs available for this filter</p>
        </div>
      )}
    </div>
  );
}
