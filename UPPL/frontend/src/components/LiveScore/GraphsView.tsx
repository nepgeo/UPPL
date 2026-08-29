import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend,
  ComposedChart, Label,
} from 'recharts';
import { X, TrendingUp, BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon, Activity } from 'lucide-react';

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
}

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

function FullscreenModal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function MiniBar({ data }: { data: { value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-0.5 w-full h-full px-0.5">
      {data.map((d, i) => (
        <div key={i} className="flex-1 rounded-t transition-all duration-300 min-h-[2px]" style={{ height: `${(d.value / max) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }} />
      ))}
    </div>
  );
}

function MiniLine({ data }: { data: { value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const h = 80; const w = 160;
  const pts = data.map((d, i) => `${(i / Math.max(data.length - 1, 1)) * w},${h - (d.value / max) * h}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
      <polyline fill="none" stroke={COLORS[0]} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={pts} />
      {data.map((d, i) => (
        <circle key={i} cx={(i / Math.max(data.length - 1, 1)) * w} cy={h - (d.value / max) * h} r="3" fill={COLORS[0]} />
      ))}
    </svg>
  );
}

function MiniPie({ data }: { data: { value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let cumulative = 0;
  const segments = data.map((d, i) => {
    const start = (cumulative / total) * 360;
    cumulative += d.value;
    const end = (cumulative / total) * 360;
    return { start, end, color: COLORS[i % COLORS.length], key: i };
  });
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full p-2">
      {segments.map(s => {
        const r = 40; const cx = 50; const cy = 50;
        const a1 = (s.start - 90) * Math.PI / 180;
        const a2 = (s.end - 90) * Math.PI / 180;
        const x1 = cx + r * Math.cos(a1); const y1 = cy + r * Math.sin(a1);
        const x2 = cx + r * Math.cos(a2); const y2 = cy + r * Math.sin(a2);
        const large = s.end - s.start > 180 ? 1 : 0;
        return <path key={s.key} d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`} fill={s.color} stroke="white" strokeWidth="0.5" />;
      })}
    </svg>
  );
}

interface GraphDef {
  id: string;
  title: string;
  icon: React.ReactNode;
  desc: string;
  chartType?: 'bar' | 'line' | 'pie' | 'none';
  getData?: (p: Props) => { value: number }[];
  render: (props: Props) => React.ReactNode;
  comingSoon?: boolean;
}



export default function GraphsView(props: Props) {
  const [fullscreen, setFullscreen] = useState<GraphDef | null>(null);

  const graphs: GraphDef[] = [
    {
      id: 'team-total-runs',
      title: 'Team Total Runs Comparison',
      icon: <BarChart3 className="w-5 h-5 text-indigo-600" />,
      desc: 'Total runs scored by each team',
      chartType: 'bar',
      getData: (p) => [
        { value: p.teamAResult?.runs ?? p.score?.teamA?.runs ?? 0 },
        { value: p.teamBResult?.runs ?? p.score?.teamB?.runs ?? 0 },
      ],
      render: (p) => {
        const data = [
          { name: p.teamA?.teamName || 'Team A', runs: p.teamAResult?.runs ?? p.score?.teamA?.runs ?? 0 },
          { name: p.teamB?.teamName || 'Team B', runs: p.teamBResult?.runs ?? p.score?.teamB?.runs ?? 0 },
        ];
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }}>
                <Label value="Teams" position="insideBottom" offset={-5} style={{ fontSize: 11, fill: '#64748b' }} />
              </XAxis>
              <YAxis>
                <Label value="Runs" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fontSize: 11, fill: '#64748b' }} />
              </YAxis>
              <Tooltip />
              <Bar dataKey="runs" fill="#6366f1" radius={[6, 6, 0, 0]}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'over-by-over',
      title: 'Over-by-Over Run Rate',
      icon: <TrendingUp className="w-5 h-5 text-emerald-600" />,
      desc: 'Runs scored in each over',
      chartType: 'line',
      getData: (p) => {
        const overs: Record<number, number> = {};
        (p.events || []).forEach(e => { const ov = e.over ?? 0; overs[ov] = (overs[ov] || 0) + (e.runs || 0) + (e.extras?.runs || 0); });
        return Object.entries(overs).sort((a, b) => Number(a[0]) - Number(b[0])).map(([, r]) => ({ value: r }));
      },
      render: (p) => {
        const overs: Record<number, number> = {};
        (p.events || []).forEach(e => {
          const ov = e.over ?? 0;
          overs[ov] = (overs[ov] || 0) + (e.runs || 0) + (e.extras?.runs || 0);
        });
        const data = Object.entries(overs).sort((a, b) => Number(a[0]) - Number(b[0])).map(([o, r]) => ({ over: `Over ${o}`, runs: r }));
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="over" tick={{ fontSize: 11 }}>
                <Label value="Overs" position="insideBottom" offset={-5} style={{ fontSize: 11, fill: '#64748b' }} />
              </XAxis>
              <YAxis>
                <Label value="Runs" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fontSize: 11, fill: '#64748b' }} />
              </YAxis>
              <Tooltip />
              <Bar dataKey="runs" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'manhattan',
      title: 'Manhattan Graph',
      icon: <BarChart3 className="w-5 h-5 text-amber-600" />,
      desc: 'Runs per over as vertical bars',
      chartType: 'bar',
      getData: (p) => {
        const overs: Record<number, number> = {};
        (p.events || []).forEach(e => { const ov = e.over ?? 0; overs[ov] = (overs[ov] || 0) + (e.runs || 0) + (e.extras?.runs || 0); });
        return Object.entries(overs).sort((a, b) => Number(a[0]) - Number(b[0])).map(([, r]) => ({ value: r }));
      },
      render: (p) => {
        const overs: Record<number, { runs: number; wickets: number }> = {};
        (p.events || []).forEach(e => {
          const ov = e.over ?? 0;
          if (!overs[ov]) overs[ov] = { runs: 0, wickets: 0 };
          overs[ov].runs += (e.runs || 0) + (e.extras?.runs || 0);
          if (e.wicket) overs[ov].wickets += 1;
        });
        const data = Object.entries(overs).sort((a, b) => Number(a[0]) - Number(b[0])).map(([o, v]) => ({ over: `O${o}`, runs: v.runs, wickets: v.wickets }));
        return (
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="over" tick={{ fontSize: 11 }}>
                <Label value="Overs" position="insideBottom" offset={-5} style={{ fontSize: 11, fill: '#64748b' }} />
              </XAxis>
              <YAxis>
                <Label value="Runs" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fontSize: 11, fill: '#64748b' }} />
              </YAxis>
              <Tooltip />
              <Bar dataKey="runs" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Line dataKey="wickets" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} />
            </ComposedChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'worm',
      title: 'Worm Graph',
      icon: <LineChartIcon className="w-5 h-5 text-blue-600" />,
      desc: 'Cumulative runs over the innings',
      chartType: 'line',
      getData: (p) => {
        let cum = 0;
        return (p.events || []).map(e => { cum += (e.runs || 0) + (e.extras?.runs || 0); return { value: cum }; });
      },
      render: (p) => {
        let cum = 0;
        const data = (p.events || []).map((e, i) => {
          cum += (e.runs || 0) + (e.extras?.runs || 0);
          return { ball: i + 1, runs: cum };
        });
        return (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ball" tick={{ fontSize: 10 }}>
                <Label value="Balls" position="insideBottom" offset={-5} style={{ fontSize: 11, fill: '#64748b' }} />
              </XAxis>
              <YAxis>
                <Label value="Cumulative Runs" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fontSize: 11, fill: '#64748b' }} />
              </YAxis>
              <Tooltip />
              <Area type="monotone" dataKey="runs" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'run-rate-analytics',
      title: 'Run Rate Analytics',
      icon: <Activity className="w-5 h-5 text-cyan-600" />,
      desc: 'CRR comparison between teams',
      chartType: 'bar',
      getData: (p) => [
        { value: parseFloat((p.score?.teamA?.runRate || 0).toFixed(2)) },
        { value: parseFloat((p.score?.teamB?.runRate || 0).toFixed(2)) },
      ],
      render: (p) => {
        const data = [
          { name: p.teamA?.teamName || 'Team A', value: parseFloat((p.score?.teamA?.runRate || 0).toFixed(2)) },
          { name: p.teamB?.teamName || 'Team B', value: parseFloat((p.score?.teamB?.runRate || 0).toFixed(2)) },
        ];
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number">
                <Label value="Run Rate" position="insideBottom" offset={-5} style={{ fontSize: 11, fill: '#64748b' }} />
              </XAxis>
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }}>
                <Label value="Teams" position="insideLeft" angle={-90} style={{ textAnchor: 'middle', fontSize: 11, fill: '#64748b' }} />
              </YAxis>
              <Tooltip />
              <Bar dataKey="value" fill="#06b6d4" radius={[0, 6, 6, 0]}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'boundary-analysis',
      title: 'Boundary Analysis',
      icon: <BarChart3 className="w-5 h-5 text-purple-600" />,
      desc: 'Fours and sixes hit by each team',
      chartType: 'bar',
      getData: (p) => [
        { value: p.score?.teamA?.fours || 0 },
        { value: p.score?.teamA?.sixes || 0 },
        { value: p.score?.teamB?.fours || 0 },
        { value: p.score?.teamB?.sixes || 0 },
      ],
      render: (p) => {
        const data = [
          { name: p.teamA?.teamName || 'Team A', Fours: p.score?.teamA?.fours || 0, Sixes: p.score?.teamA?.sixes || 0 },
          { name: p.teamB?.teamName || 'Team B', Fours: p.score?.teamB?.fours || 0, Sixes: p.score?.teamB?.sixes || 0 },
        ];
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }}>
                <Label value="Teams" position="insideBottom" offset={-5} style={{ fontSize: 11, fill: '#64748b' }} />
              </XAxis>
              <YAxis>
                <Label value="Count" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fontSize: 11, fill: '#64748b' }} />
              </YAxis>
              <Tooltip />
              <Legend />
              <Bar dataKey="Fours" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Sixes" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'player-runs',
      title: 'Player Runs Comparison',
      icon: <BarChart3 className="w-5 h-5 text-indigo-600" />,
      desc: 'Top run-scorers from both teams',
      chartType: 'bar',
      getData: (p) => [...(p.playerStats?.batting || [])].sort((a, b) => b.runs - a.runs).slice(0, 5).map(p => ({ value: p.runs })),
      render: (p) => {
        const batsmen = [...(p.playerStats?.batting || [])].sort((a, b) => b.runs - a.runs).slice(0, 10);
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={batsmen} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number">
                <Label value="Runs" position="insideBottom" offset={-5} style={{ fontSize: 11, fill: '#64748b' }} />
              </XAxis>
              <YAxis dataKey="playerName" type="category" tick={{ fontSize: 11 }} width={100}>
                <Label value="Batsmen" position="insideLeft" angle={-90} style={{ textAnchor: 'middle', fontSize: 11, fill: '#64748b' }} />
              </YAxis>
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
      id: 'wicket-fall',
      title: 'Wicket Fall Graph',
      icon: <LineChartIcon className="w-5 h-5 text-red-600" />,
      desc: 'Score at each wicket',
      chartType: 'line',
      getData: (p) => {
        let cum = 0; let wIdx = 0;
        const data: { value: number }[] = [];
        (p.events || []).forEach((e) => {
          cum += (e.runs || 0) + (e.extras?.runs || 0);
          if (e.wicket) {
            wIdx++;
            data.push({ value: cum });
          }
        });
        return data;
      },
      render: (p) => {
        let cum = 0; let wIdx = 0;
        const data: any[] = [];
        (p.events || []).forEach((e, i) => {
          cum += (e.runs || 0) + (e.extras?.runs || 0);
          if (e.wicket) {
            wIdx++;
            data.push({ wicket: `W${wIdx}`, score: cum, batsman: e.batsman });
          }
        });
        return (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="wicket" tick={{ fontSize: 11 }}>
                <Label value="Wickets" position="insideBottom" offset={-5} style={{ fontSize: 11, fill: '#64748b' }} />
              </XAxis>
              <YAxis>
                <Label value="Score" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fontSize: 11, fill: '#64748b' }} />
              </YAxis>
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'bowling-performance',
      title: 'Bowling Performance Graph',
      icon: <BarChart3 className="w-5 h-5 text-emerald-600" />,
      desc: 'Top wicket-takers comparison',
      chartType: 'bar',
      getData: (p) => [...(p.playerStats?.bowling || [])].sort((a, b) => b.wickets - a.wickets || a.runs - b.runs).slice(0, 5).map(p => ({ value: p.wickets })),
      render: (p) => {
        const bowlers = [...(p.playerStats?.bowling || [])].sort((a, b) => b.wickets - a.wickets || a.runs - b.runs).slice(0, 10);
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={bowlers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number">
                <Label value="Count" position="insideBottom" offset={-5} style={{ fontSize: 11, fill: '#64748b' }} />
              </XAxis>
              <YAxis dataKey="playerName" type="category" tick={{ fontSize: 11 }} width={100}>
                <Label value="Bowlers" position="insideLeft" angle={-90} style={{ textAnchor: 'middle', fontSize: 11, fill: '#64748b' }} />
              </YAxis>
              <Tooltip />
              <Bar dataKey="wickets" fill="#10b981" radius={[0, 4, 4, 0]} />
              <Line dataKey="economy" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} />
            </ComposedChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'economy-comparison',
      title: 'Economy Rate Comparison',
      icon: <Activity className="w-5 h-5 text-cyan-600" />,
      desc: 'Bowling economy rates side by side',
      chartType: 'bar',
      getData: (p) => [...(p.playerStats?.bowling || [])].filter(b => b.balls > 0).sort((a, b) => a.economy - b.economy).slice(0, 5).map(p => ({ value: p.economy })),
      render: (p) => {
        const bowlers = [...(p.playerStats?.bowling || [])].filter(b => b.balls > 0).sort((a, b) => a.economy - b.economy).slice(0, 10);
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={bowlers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number">
                <Label value="Economy" position="insideBottom" offset={-5} style={{ fontSize: 11, fill: '#64748b' }} />
              </XAxis>
              <YAxis dataKey="playerName" type="category" tick={{ fontSize: 11 }} width={100}>
                <Label value="Bowlers" position="insideLeft" angle={-90} style={{ textAnchor: 'middle', fontSize: 11, fill: '#64748b' }} />
              </YAxis>
              <Tooltip />
              <Bar dataKey="economy" fill="#06b6d4" radius={[0, 4, 4, 0]}>
                {bowlers.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'partnership',
      title: 'Partnership Graph',
      icon: <LineChartIcon className="w-5 h-5 text-purple-600" />,
      desc: 'Partnership contributions',
      chartType: 'bar',
      getData: (p) => {
        const parts: { value: number }[] = [];
        let partRuns = 0; let partBalls = 0;
        (p.events || []).forEach((e) => {
          partRuns += (e.runs || 0) + (e.extras?.runs || 0);
          partBalls += 1;
          if (e.wicket) {
            parts.push({ value: partRuns });
            partRuns = 0; partBalls = 0;
          }
        });
        if (partBalls > 0) {
          parts.push({ value: partRuns });
        }
        return parts;
      },
      render: (p) => {
        const wickets = (p.events || []).filter(e => e.wicket);
        const parts: { label: string; runs: number; balls: number }[] = [];
        let startIdx = 0; let partRuns = 0; let partBalls = 0;
        (p.events || []).forEach((e, i) => {
          partRuns += (e.runs || 0) + (e.extras?.runs || 0);
          partBalls += 1;
          if (e.wicket) {
            const wicketNum = wickets.indexOf(e) + 1;
            const pName = e.batsman || `Wicket ${wicketNum}`;
            parts.push({ label: `${wicketNum - 1}-${wicketNum}`, runs: partRuns, balls: partBalls });
            partRuns = 0; partBalls = 0;
            startIdx = i + 1;
          }
        });
        if (partBalls > 0) {
          parts.push({ label: `${parts.length}-${parts.length + 1}`, runs: partRuns, balls: partBalls });
        }
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={parts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }}>
                <Label value="Partnerships" position="insideBottom" offset={-5} style={{ fontSize: 11, fill: '#64748b' }} />
              </XAxis>
              <YAxis>
                <Label value="Runs" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fontSize: 11, fill: '#64748b' }} />
              </YAxis>
              <Tooltip />
              <Bar dataKey="runs" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                {parts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'run-distribution',
      title: 'Run Distribution Graph',
      icon: <PieChartIcon className="w-5 h-5 text-pink-600" />,
      desc: 'How runs are distributed (dots, 1s, 4s, 6s)',
      chartType: 'pie',
      getData: (p) => {
        const dist: Record<string, number> = { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '6': 0, 'W': 0 };
        (p.events || []).forEach(e => {
          const r = e.runs || 0;
          if (e.wicket) dist['W']++;
          else if (r <= 6) dist[String(r)]++;
        });
        return Object.entries(dist).filter(([, v]) => v > 0).map(([, v]) => ({ value: v }));
      },
      render: (p) => {
        const dist: Record<string, number> = { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '6': 0, 'W': 0 };
        (p.events || []).forEach(e => {
          const r = e.runs || 0;
          if (e.wicket) dist['W']++;
          else if (r <= 6) dist[String(r)]++;
        });
        const data = Object.entries(dist).filter(([, v]) => v > 0).map(([k, v]) => ({ name: k === 'W' ? 'Wicket' : `${k} run${k !== '1' ? 's' : ''}`, value: v }));
        return (
          <div className="flex justify-center">
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" outerRadius={130} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );
      },
    },
    {
      id: 'extras-analysis',
      title: 'Extras Analysis Graph',
      icon: <BarChart3 className="w-5 h-5 text-orange-600" />,
      desc: 'Extras breakdown (wides, no-balls, byes)',
      chartType: 'pie',
      getData: (p) => {
        const ext: Record<string, number> = {};
        (p.events || []).forEach(e => {
          if (e.extras?.type) {
            ext[e.extras.type] = (ext[e.extras.type] || 0) + (e.extras.runs || 0);
          }
        });
        return Object.entries(ext).map(([, v]) => ({ value: v }));
      },
      render: (p) => {
        const ext: Record<string, number> = {};
        (p.events || []).forEach(e => {
          if (e.extras?.type) {
            ext[e.extras.type] = (ext[e.extras.type] || 0) + (e.extras.runs || 0);
          }
        });
        const data = Object.entries(ext).map(([k, v]) => ({ name: k.replace('_', ' '), value: v }));
        return (
          <div className="flex justify-center">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" outerRadius={120} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );
      },
    },
    {
      id: 'dismissal-type',
      title: 'Dismissal Type Analysis',
      icon: <PieChartIcon className="w-5 h-5 text-red-600" />,
      desc: 'Types of dismissals in the match',
      chartType: 'pie',
      getData: (p) => {
        const types: Record<string, number> = {};
        (p.events || []).filter(e => e.wicket).forEach(e => {
          const t = e.wicketType || 'unknown';
          types[t] = (types[t] || 0) + 1;
        });
        return Object.entries(types).map(([, v]) => ({ value: v }));
      },
      render: (p) => {
        const types: Record<string, number> = {};
        (p.events || []).filter(e => e.wicket).forEach(e => {
          const t = e.wicketType || 'unknown';
          types[t] = (types[t] || 0) + 1;
        });
        const data = Object.entries(types).map(([k, v]) => ({ name: k.replace('_', ' '), value: v }));
        if (data.length === 0) return <div className="flex items-center justify-center h-[350px] text-gray-400">No wickets data available</div>;
        return (
          <div className="flex justify-center">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" outerRadius={120} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );
      },
    },
    {
      id: 'batting-strike-rate',
      title: 'Batting Strike Rate Comparison',
      icon: <Activity className="w-5 h-5 text-indigo-600" />,
      desc: 'Strike rates of top batsmen',
      chartType: 'bar',
      getData: (p) => [...(p.playerStats?.batting || [])].filter(b => b.balls > 0).sort((a, b) => b.strikeRate - a.strikeRate).slice(0, 5).map(p => ({ value: p.strikeRate })),
      render: (p) => {
        const batsmen = [...(p.playerStats?.batting || [])].filter(b => b.balls > 0).sort((a, b) => b.strikeRate - a.strikeRate).slice(0, 10);
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={batsmen} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number">
                <Label value="Strike Rate" position="insideBottom" offset={-5} style={{ fontSize: 11, fill: '#64748b' }} />
              </XAxis>
              <YAxis dataKey="playerName" type="category" tick={{ fontSize: 11 }} width={100}>
                <Label value="Batsmen" position="insideLeft" angle={-90} style={{ textAnchor: 'middle', fontSize: 11, fill: '#64748b' }} />
              </YAxis>
              <Tooltip />
              <Bar dataKey="strikeRate" fill="#6366f1" radius={[0, 4, 4, 0]}>
                {batsmen.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'dot-ball',
      title: 'Dot Ball Percentage Graph',
      icon: <PieChartIcon className="w-5 h-5 text-slate-600" />,
      desc: 'Dot balls vs scoring balls',
      chartType: 'pie',
      getData: (p) => {
        const total = (p.events || []).length;
        const dots = (p.events || []).filter(e => !e.wicket && (e.runs || 0) === 0 && !e.extras?.type).length;
        return [{ value: dots }, { value: total - dots }];
      },
      render: (p) => {
        const total = (p.events || []).length;
        const dots = (p.events || []).filter(e => !e.wicket && (e.runs || 0) === 0 && !e.extras?.type).length;
        const data = [
          { name: 'Dot Balls', value: dots },
          { name: 'Scoring Balls', value: total - dots },
        ];
        return (
          <div className="flex justify-center">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" outerRadius={120} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );
      },
    },
    {
      id: 'chase-progress',
      title: 'Chase Progress Graph',
      icon: <TrendingUp className="w-5 h-5 text-orange-600" />,
      desc: 'Run chase progression vs required rate',
      chartType: 'line',
      getData: (p) => {
        const secondTeam = p.battingFirst === 'teamA' ? 'teamB' : 'teamA';
        let cum = 0;
        return (p.events || []).filter(e => e.battingTeam === secondTeam).map((e) => {
          cum += (e.runs || 0) + (e.extras?.runs || 0);
          return { value: cum };
        });
      },
      render: (p) => {
        const secondTeam = p.battingFirst === 'teamA' ? 'teamB' : 'teamA';
        const target = (p.score?.[p.battingFirst]?.runs || 0) + 1;
        let cum = 0;
        const data = (p.events || []).filter(e => e.battingTeam === secondTeam).map((e, i) => {
          cum += (e.runs || 0) + (e.extras?.runs || 0);
          const ballsDone = i + 1;
          const reqRate = ((target - cum) / (Math.max(120 - ballsDone, 1) / 6));
          return { ball: i + 1, runs: cum, required: reqRate > 0 ? parseFloat(reqRate.toFixed(2)) : 0, target };
        });
        if (data.length === 0) return <div className="flex items-center justify-center h-[350px] text-gray-400">Chase data not available</div>;
        return (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ball" tick={{ fontSize: 10 }}>
                <Label value="Balls" position="insideBottom" offset={-5} style={{ fontSize: 11, fill: '#64748b' }} />
              </XAxis>
              <YAxis>
                <Label value="Runs" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fontSize: 11, fill: '#64748b' }} />
              </YAxis>
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="runs" stroke="#f59e0b" strokeWidth={2} name="Runs" dot={false} />
              <Line type="monotone" dataKey="required" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" name="Req RR" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'win-probability',
      title: 'Match Win Probability Graph',
      icon: <Activity className="w-5 h-5 text-blue-600" />,
      desc: 'Win probability over the course of the match',
      comingSoon: true,
      render: () => <div className="flex items-center justify-center h-[350px] text-gray-400">Requires ball-by-ball win probability model</div>,
    },
    {
      id: 'powerplay-analysis',
      title: 'Powerplay Analysis',
      icon: <BarChart3 className="w-5 h-5 text-blue-600" />,
      desc: 'Runs and wickets in powerplay overs',
      comingSoon: true,
      render: () => <div className="flex items-center justify-center h-[350px] text-gray-400">Requires over-phase tagging</div>,
    },
    {
      id: 'death-overs',
      title: 'Death Overs Analysis',
      icon: <BarChart3 className="w-5 h-5 text-red-600" />,
      desc: 'Performance in death overs (16-20)',
      comingSoon: true,
      render: () => <div className="flex items-center justify-center h-[350px] text-gray-400">Requires over-phase tagging</div>,
    },
    {
      id: 'middle-overs',
      title: 'Middle Overs Analysis',
      icon: <BarChart3 className="w-5 h-5 text-emerald-600" />,
      desc: 'Performance in middle overs (7-15)',
      comingSoon: true,
      render: () => <div className="flex items-center justify-center h-[350px] text-gray-400">Requires over-phase tagging</div>,
    },
    {
      id: 'boundary-percentage',
      title: 'Boundary Percentage Graph',
      icon: <PieChartIcon className="w-5 h-5 text-purple-600" />,
      desc: 'Percentage of runs from boundaries',
      chartType: 'bar',
      getData: (p) => {
        const tA = p.score?.teamA || { runs: 0, fours: 0, sixes: 0 };
        const tB = p.score?.teamB || { runs: 0, fours: 0, sixes: 0 };
        const boundaryRunsA = (tA.fours || 0) * 4 + (tA.sixes || 0) * 6;
        const boundaryRunsB = (tB.fours || 0) * 4 + (tB.sixes || 0) * 6;
        return [
          { value: boundaryRunsA },
          { value: Math.max((tA.runs || 0) - boundaryRunsA, 0) },
          { value: boundaryRunsB },
          { value: Math.max((tB.runs || 0) - boundaryRunsB, 0) },
        ];
      },
      render: (p) => {
        const tA = p.score?.teamA || { runs: 0, fours: 0, sixes: 0 };
        const tB = p.score?.teamB || { runs: 0, fours: 0, sixes: 0 };
        const boundaryRunsA = (tA.fours || 0) * 4 + (tA.sixes || 0) * 6;
        const boundaryRunsB = (tB.fours || 0) * 4 + (tB.sixes || 0) * 6;
        const data = [
          { name: p.teamA?.teamName || 'Team A', Boundaries: boundaryRunsA, Others: Math.max((tA.runs || 0) - boundaryRunsA, 0) },
          { name: p.teamB?.teamName || 'Team B', Boundaries: boundaryRunsB, Others: Math.max((tB.runs || 0) - boundaryRunsB, 0) },
        ];
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }}>
                <Label value="Teams" position="insideBottom" offset={-5} style={{ fontSize: 11, fill: '#64748b' }} />
              </XAxis>
              <YAxis>
                <Label value="Runs" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fontSize: 11, fill: '#64748b' }} />
              </YAxis>
              <Tooltip />
              <Legend />
              <Bar dataKey="Boundaries" fill="#8b5cf6" stackId="a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Others" fill="#e2e8f0" stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'runs-vs-wickets',
      title: 'Runs vs Wickets Graph',
      icon: <LineChartIcon className="w-5 h-5 text-indigo-600" />,
      desc: 'Runs scored vs wickets lost',
      chartType: 'bar',
      getData: (p) => [
        { value: p.score?.teamA?.runs || 0 },
        { value: p.score?.teamA?.wickets || 0 },
        { value: p.score?.teamB?.runs || 0 },
        { value: p.score?.teamB?.wickets || 0 },
      ],
      render: (p) => {
        const data = [
          { name: p.teamA?.teamName || 'Team A', runs: p.score?.teamA?.runs || 0, wickets: p.score?.teamA?.wickets || 0 },
          { name: p.teamB?.teamName || 'Team B', runs: p.score?.teamB?.runs || 0, wickets: p.score?.teamB?.wickets || 0 },
        ];
        return (
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }}>
                <Label value="Teams" position="insideBottom" offset={-5} style={{ fontSize: 11, fill: '#64748b' }} />
              </XAxis>
              <YAxis>
                <Label value="Runs / Wickets" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fontSize: 11, fill: '#64748b' }} />
              </YAxis>
              <Tooltip />
              <Legend />
              <Bar dataKey="runs" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="wickets" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 5 }} />
            </ComposedChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'sixes-comparison',
      title: 'Sixes Comparison',
      icon: <BarChart3 className="w-5 h-5 text-amber-600" />,
      desc: 'Sixes hit by each team',
      chartType: 'bar',
      getData: (p) => [
        { value: p.score?.teamA?.sixes || 0 },
        { value: p.score?.teamB?.sixes || 0 },
      ],
      render: (p) => {
        const data = [
          { name: p.teamA?.teamName || 'Team A', sixes: p.score?.teamA?.sixes || 0 },
          { name: p.teamB?.teamName || 'Team B', sixes: p.score?.teamB?.sixes || 0 },
        ];
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }}>
                <Label value="Teams" position="insideBottom" offset={-5} style={{ fontSize: 11, fill: '#64748b' }} />
              </XAxis>
              <YAxis>
                <Label value="Sixes" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fontSize: 11, fill: '#64748b' }} />
              </YAxis>
              <Tooltip />
              <Bar dataKey="sixes" fill="#f59e0b" radius={[4, 4, 0, 0]}>
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
      icon: <BarChart3 className="w-5 h-5 text-purple-600" />,
      desc: 'Fours hit by each team',
      chartType: 'bar',
      getData: (p) => [
        { value: p.score?.teamA?.fours || 0 },
        { value: p.score?.teamB?.fours || 0 },
      ],
      render: (p) => {
        const data = [
          { name: p.teamA?.teamName || 'Team A', fours: p.score?.teamA?.fours || 0 },
          { name: p.teamB?.teamName || 'Team B', fours: p.score?.teamB?.fours || 0 },
        ];
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }}>
                <Label value="Teams" position="insideBottom" offset={-5} style={{ fontSize: 11, fill: '#64748b' }} />
              </XAxis>
              <YAxis>
                <Label value="Fours" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fontSize: 11, fill: '#64748b' }} />
              </YAxis>
              <Tooltip />
              <Bar dataKey="fours" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'live-score-progression',
      title: 'Live Score Progression Graph',
      icon: <TrendingUp className="w-5 h-5 text-emerald-600" />,
      desc: 'Score progression ball-by-ball',
      chartType: 'line',
      getData: (p) => {
        const firstTeam = p.battingFirst;
        let cum = 0;
        return (p.events || []).map((e) => {
          if (e.battingTeam === firstTeam) cum += (e.runs || 0) + (e.extras?.runs || 0);
          return { value: cum };
        });
      },
      render: (p) => {
        const firstTeam = p.battingFirst;
        const secondTeam = firstTeam === 'teamA' ? 'teamB' : 'teamA';
        let cumA = 0; let cumB = 0;
        const data = (p.events || []).map((e, i) => {
          if (e.battingTeam === firstTeam) cumA += (e.runs || 0) + (e.extras?.runs || 0);
          else cumB += (e.runs || 0) + (e.extras?.runs || 0);
          return { ball: i + 1, [p.teamA?.teamName || 'Team A']: cumA, [p.teamB?.teamName || 'Team B']: cumB };
        });
        return (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ball" tick={{ fontSize: 10 }}>
                <Label value="Balls" position="insideBottom" offset={-5} style={{ fontSize: 11, fill: '#64748b' }} />
              </XAxis>
              <YAxis>
                <Label value="Runs" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fontSize: 11, fill: '#64748b' }} />
              </YAxis>
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={p.teamA?.teamName || 'Team A'} stroke="#6366f1" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey={p.teamB?.teamName || 'Team B'} stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'momentum',
      title: 'Match Momentum Graph',
      icon: <Activity className="w-5 h-5 text-orange-600" />,
      desc: 'Runs scored in each over as momentum indicator',
      chartType: 'line',
      getData: (p) => {
        const overs: Record<number, number> = {};
        (p.events || []).forEach(e => {
          const ov = e.over ?? 0;
          overs[ov] = (overs[ov] || 0) + (e.runs || 0) + (e.extras?.runs || 0);
        });
        return Object.entries(overs).sort((a, b) => Number(a[0]) - Number(b[0])).map(([, r]) => ({ value: r }));
      },
      render: (p) => {
        const overs: Record<number, number> = {};
        (p.events || []).forEach(e => {
          const ov = e.over ?? 0;
          overs[ov] = (overs[ov] || 0) + (e.runs || 0) + (e.extras?.runs || 0);
        });
        const data = Object.entries(overs).sort((a, b) => Number(a[0]) - Number(b[0])).map(([o, r]) => ({ over: `O${o}`, runs: r }));
        return (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="over" tick={{ fontSize: 11 }}>
                <Label value="Overs" position="insideBottom" offset={-5} style={{ fontSize: 11, fill: '#64748b' }} />
              </XAxis>
              <YAxis>
                <Label value="Runs" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fontSize: 11, fill: '#64748b' }} />
              </YAxis>
              <Tooltip />
              <Area type="monotone" dataKey="runs" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'player-contribution',
      title: 'Player Contribution Analysis',
      icon: <BarChart3 className="w-5 h-5 text-indigo-600" />,
      desc: 'Individual player contributions',
      comingSoon: true,
      render: () => <div className="flex items-center justify-center h-[350px] text-gray-400">Requires aggregated player data</div>,
    },
    {
      id: 'head-to-head',
      title: 'Head-to-Head Analytics',
      icon: <BarChart3 className="w-5 h-5 text-blue-600" />,
      desc: 'Historical head-to-head comparison',
      comingSoon: true,
      render: () => <div className="flex items-center justify-center h-[350px] text-gray-400">Requires historical match data</div>,
    },
    {
      id: 'toss-impact',
      title: 'Toss Impact Analysis',
      icon: <PieChartIcon className="w-5 h-5 text-amber-600" />,
      desc: 'Impact of toss on match outcome',
      comingSoon: true,
      render: () => <div className="flex items-center justify-center h-[350px] text-gray-400">Requires historical toss data</div>,
    },
    {
      id: 'required-run-rate',
      title: 'Required Run Rate Graph',
      icon: <TrendingUp className="w-5 h-5 text-red-600" />,
      desc: 'Required run rate over the chase',
      chartType: 'line',
      getData: (p) => {
        const secondTeam = p.battingFirst === 'teamA' ? 'teamB' : 'teamA';
        const target = (p.score?.[p.battingFirst]?.runs || 0) + 1;
        let cum = 0;
        return (p.events || []).filter(e => e.battingTeam === secondTeam).map((e, i) => {
          cum += (e.runs || 0) + (e.extras?.runs || 0);
          const ballsLeft = Math.max(120 - (i + 1), 1);
          const rrr = ((target - cum) / (ballsLeft / 6));
          return { value: rrr > 0 ? parseFloat(rrr.toFixed(2)) : 0 };
        });
      },
      render: (p) => {
        const secondTeam = p.battingFirst === 'teamA' ? 'teamB' : 'teamA';
        const target = (p.score?.[p.battingFirst]?.runs || 0) + 1;
        let cum = 0;
        const data = (p.events || []).filter(e => e.battingTeam === secondTeam).map((e, i) => {
          cum += (e.runs || 0) + (e.extras?.runs || 0);
          const ballsLeft = Math.max(120 - (i + 1), 1);
          const rrr = ((target - cum) / (ballsLeft / 6));
          return { ball: i + 1, rrr: rrr > 0 ? parseFloat(rrr.toFixed(2)) : 0 };
        });
        if (data.length === 0) return <div className="flex items-center justify-center h-[350px] text-gray-400">Not in chase innings</div>;
        return (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ball" tick={{ fontSize: 10 }}>
                <Label value="Balls" position="insideBottom" offset={-5} style={{ fontSize: 11, fill: '#64748b' }} />
              </XAxis>
              <YAxis>
                <Label value="Req RR" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fontSize: 11, fill: '#64748b' }} />
              </YAxis>
              <Tooltip />
              <Area type="monotone" dataKey="rrr" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'current-run-rate',
      title: 'Current Run Rate Graph',
      icon: <Activity className="w-5 h-5 text-cyan-600" />,
      desc: 'Current run rate progression',
      chartType: 'line',
      getData: (p) => {
        let cum = 0;
        return (p.events || []).map((e, i) => {
          cum += (e.runs || 0) + (e.extras?.runs || 0);
          const balls = i + 1;
          const crr = parseFloat(((cum / balls) * 6).toFixed(2));
          return { value: crr };
        });
      },
      render: (p) => {
        let cum = 0;
        const data = (p.events || []).map((e, i) => {
          cum += (e.runs || 0) + (e.extras?.runs || 0);
          const balls = i + 1;
          const crr = parseFloat(((cum / balls) * 6).toFixed(2));
          return { ball: balls, crr };
        });
        return (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ball" tick={{ fontSize: 10 }}>
                <Label value="Balls" position="insideBottom" offset={-5} style={{ fontSize: 11, fill: '#64748b' }} />
              </XAxis>
              <YAxis domain={[0, 'auto']}>
                <Label value="CRR" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fontSize: 11, fill: '#64748b' }} />
              </YAxis>
              <Tooltip />
              <Area type="monotone" dataKey="crr" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'batting-average',
      title: 'Batting Average Comparison',
      icon: <BarChart3 className="w-5 h-5 text-indigo-600" />,
      desc: 'Average runs per batsman',
      chartType: 'bar',
      getData: (p) => [...(p.playerStats?.batting || [])].sort((a, b) => b.runs - a.runs).slice(0, 5).map(p => ({ value: p.runs })),
      render: (p) => {
        const batsmen = [...(p.playerStats?.batting || [])].filter(b => b.balls > 0).map(b => ({
          ...b,
          avg: b.out ? (b.runs / (b.out ? 1 : 0)) : b.runs,
        })).sort((a, b) => b.runs - a.runs).slice(0, 10);
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={batsmen} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number">
                <Label value="Runs" position="insideBottom" offset={-5} style={{ fontSize: 11, fill: '#64748b' }} />
              </XAxis>
              <YAxis dataKey="playerName" type="category" tick={{ fontSize: 11 }} width={100}>
                <Label value="Batsmen" position="insideLeft" angle={-90} style={{ textAnchor: 'middle', fontSize: 11, fill: '#64748b' }} />
              </YAxis>
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
      id: 'bowling-average',
      title: 'Bowling Average Comparison',
      icon: <BarChart3 className="w-5 h-5 text-emerald-600" />,
      desc: 'Average runs per wicket for bowlers',
      chartType: 'bar',
      getData: (p) => [...(p.playerStats?.bowling || [])].filter(b => b.wickets > 0).map(b => ({
        value: parseFloat((b.runs / b.wickets).toFixed(2)),
      })).sort((a, b) => a.value - b.value).slice(0, 5),
      render: (p) => {
        const bwlrs = [...(p.playerStats?.bowling || [])].filter(b => b.wickets > 0).map(b => ({
          ...b,
          avg: parseFloat((b.runs / b.wickets).toFixed(2)),
        })).sort((a, b) => a.avg - b.avg).slice(0, 10);
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={bwlrs} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number">
                <Label value="Avg" position="insideBottom" offset={-5} style={{ fontSize: 11, fill: '#64748b' }} />
              </XAxis>
              <YAxis dataKey="playerName" type="category" tick={{ fontSize: 11 }} width={100}>
                <Label value="Bowlers" position="insideLeft" angle={-90} style={{ textAnchor: 'middle', fontSize: 11, fill: '#64748b' }} />
              </YAxis>
              <Tooltip />
              <Bar dataKey="avg" fill="#10b981" radius={[0, 4, 4, 0]}>
                {bwlrs.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'bowling-strike-rate',
      title: 'Bowling Strike Rate Comparison',
      icon: <Activity className="w-5 h-5 text-cyan-600" />,
      desc: 'Balls per wicket for bowlers',
      chartType: 'bar',
      getData: (p) => [...(p.playerStats?.bowling || [])].filter(b => b.wickets > 0).map(b => ({
        value: parseFloat((b.balls / b.wickets).toFixed(1)),
      })).sort((a, b) => a.value - b.value).slice(0, 5),
      render: (p) => {
        const bwlrs = [...(p.playerStats?.bowling || [])].filter(b => b.wickets > 0).map(b => ({
          ...b,
          sr: parseFloat((b.balls / b.wickets).toFixed(1)),
        })).sort((a, b) => a.sr - b.sr).slice(0, 10);
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={bwlrs} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number">
                <Label value="SR" position="insideBottom" offset={-5} style={{ fontSize: 11, fill: '#64748b' }} />
              </XAxis>
              <YAxis dataKey="playerName" type="category" tick={{ fontSize: 11 }} width={100}>
                <Label value="Bowlers" position="insideLeft" angle={-90} style={{ textAnchor: 'middle', fontSize: 11, fill: '#64748b' }} />
              </YAxis>
              <Tooltip />
              <Bar dataKey="sr" fill="#06b6d4" radius={[0, 4, 4, 0]}>
                {bwlrs.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'team-strength',
      title: 'Team Strength Comparison',
      icon: <BarChart3 className="w-5 h-5 text-purple-600" />,
      desc: 'Overall team performance comparison',
      comingSoon: true,
      render: () => <div className="flex items-center justify-center h-[350px] text-gray-400">Requires comprehensive team stats</div>,
    },
    {
      id: 'fantasy-points',
      title: 'Fantasy Points Leaderboard',
      icon: <BarChart3 className="w-5 h-5 text-yellow-600" />,
      desc: 'Top fantasy point scorers',
      comingSoon: true,
      render: () => <div className="flex items-center justify-center h-[350px] text-gray-400">Requires fantasy points calculation</div>,
    },
    {
      id: 'orange-cap',
      title: 'Orange Cap Leaderboard',
      icon: <BarChart3 className="w-5 h-5 text-amber-600" />,
      desc: 'Top run-scorers leaderboard',
      chartType: 'bar',
      getData: (p) => [...(p.playerStats?.batting || [])].sort((a, b) => b.runs - a.runs).slice(0, 5).map(p => ({ value: p.runs })),
      render: (p) => {
        const batsmen = [...(p.playerStats?.batting || [])].sort((a, b) => b.runs - a.runs).slice(0, 10);
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={batsmen} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number">
                <Label value="Runs" position="insideBottom" offset={-5} style={{ fontSize: 11, fill: '#64748b' }} />
              </XAxis>
              <YAxis dataKey="playerName" type="category" tick={{ fontSize: 11 }} width={100}>
                <Label value="Batsmen" position="insideLeft" angle={-90} style={{ textAnchor: 'middle', fontSize: 11, fill: '#64748b' }} />
              </YAxis>
              <Tooltip />
              <Bar dataKey="runs" fill="#f59e0b" radius={[0, 4, 4, 0]}>
                {batsmen.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'purple-cap',
      title: 'Purple Cap Leaderboard',
      icon: <BarChart3 className="w-5 h-5 text-purple-700" />,
      desc: 'Top wicket-takers leaderboard',
      chartType: 'bar',
      getData: (p) => [...(p.playerStats?.bowling || [])].sort((a, b) => b.wickets - a.wickets || a.runs - b.runs).slice(0, 5).map(p => ({ value: p.wickets })),
      render: (p) => {
        const bwlrs = [...(p.playerStats?.bowling || [])].sort((a, b) => b.wickets - a.wickets || a.runs - b.runs).slice(0, 10);
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={bwlrs} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number">
                <Label value="Wickets" position="insideBottom" offset={-5} style={{ fontSize: 11, fill: '#64748b' }} />
              </XAxis>
              <YAxis dataKey="playerName" type="category" tick={{ fontSize: 11 }} width={100}>
                <Label value="Bowlers" position="insideLeft" angle={-90} style={{ textAnchor: 'middle', fontSize: 11, fill: '#64748b' }} />
              </YAxis>
              <Tooltip />
              <Bar dataKey="wickets" fill="#7c3aed" radius={[0, 4, 4, 0]}>
                {bwlrs.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'mvp-ranking',
      title: 'MVP Ranking',
      icon: <BarChart3 className="w-5 h-5 text-blue-600" />,
      desc: 'Most valuable player rankings',
      comingSoon: true,
      render: () => <div className="flex items-center justify-center h-[350px] text-gray-400">Requires MVP calculation formula</div>,
    },
    {
      id: 'team-form',
      title: 'Team Form Trend Graph',
      icon: <LineChartIcon className="w-5 h-5 text-indigo-600" />,
      desc: 'Recent form of both teams',
      comingSoon: true,
      render: () => <div className="flex items-center justify-center h-[350px] text-gray-400">Requires historical match results</div>,
    },
    {
      id: 'player-form',
      title: 'Player Form Trend Graph',
      icon: <TrendingUp className="w-5 h-5 text-emerald-600" />,
      desc: 'Recent performance trends of players',
      comingSoon: true,
      render: () => <div className="flex items-center justify-center h-[350px] text-gray-400">Requires multi-match player data</div>,
    },
    {
      id: 'over-by-over-momentum',
      title: 'Over-by-Over Momentum Graph',
      icon: <Activity className="w-5 h-5 text-orange-600" />,
      desc: 'Momentum shifts over by over',
      chartType: 'line',
      getData: (p) => {
        const overs: Record<number, number> = {};
        (p.events || []).forEach(e => {
          const ov = e.over ?? 0;
          overs[ov] = (overs[ov] || 0) + (e.runs || 0) + (e.extras?.runs || 0);
        });
        const entries = Object.entries(overs).sort((a, b) => Number(a[0]) - Number(b[0]));
        const maxRuns = Math.max(...entries.map(([, r]) => r), 1);
        return entries.map(([, r]) => ({ value: parseFloat(((r / maxRuns) * 100).toFixed(0)) }));
      },
      render: (p) => {
        const overs: Record<number, number> = {};
        (p.events || []).forEach(e => {
          const ov = e.over ?? 0;
          overs[ov] = (overs[ov] || 0) + (e.runs || 0) + (e.extras?.runs || 0);
        });
        const entries = Object.entries(overs).sort((a, b) => Number(a[0]) - Number(b[0]));
        const maxRuns = Math.max(...entries.map(([, r]) => r), 1);
        const data = entries.map(([o, r]) => ({ over: `O${o}`, momentum: parseFloat(((r / maxRuns) * 100).toFixed(0)) }));
        return (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="over" tick={{ fontSize: 11 }}>
                <Label value="Overs" position="insideBottom" offset={-5} style={{ fontSize: 11, fill: '#64748b' }} />
              </XAxis>
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }}>
                <Label value="Momentum %" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fontSize: 11, fill: '#64748b' }} />
              </YAxis>
              <Tooltip />
              <Area type="monotone" dataKey="momentum" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'team-ranking-progression',
      title: 'Team Ranking Progression',
      icon: <LineChartIcon className="w-5 h-5 text-blue-600" />,
      desc: 'Team rankings over time',
      comingSoon: true,
      render: () => <div className="flex items-center justify-center h-[350px] text-gray-400">Requires ranking history data</div>,
    },
    {
      id: 'season-performance',
      title: 'Season Performance Trend',
      icon: <TrendingUp className="w-5 h-5 text-green-600" />,
      desc: 'Performance across the season',
      comingSoon: true,
      render: () => <div className="flex items-center justify-center h-[350px] text-gray-400">Requires season-wide match data</div>,
    },
    {
      id: 'fielding-performance',
      title: 'Fielding Performance Analysis',
      icon: <BarChart3 className="w-5 h-5 text-slate-600" />,
      desc: 'Catches, run outs, stumpings',
      comingSoon: true,
      render: () => <div className="flex items-center justify-center h-[350px] text-gray-400">Requires fielding event data</div>,
    },
    {
      id: 'catch-efficiency',
      title: 'Catch Efficiency Graph',
      icon: <BarChart3 className="w-5 h-5 text-emerald-600" />,
      desc: 'Catch conversion rates',
      comingSoon: true,
      render: () => <div className="flex items-center justify-center h-[350px] text-gray-400">Requires catch event data</div>,
    },
    {
      id: 'nrr-trend',
      title: 'Net Run Rate (NRR) Trend',
      icon: <LineChartIcon className="w-5 h-5 text-cyan-600" />,
      desc: 'NRR progression throughout the match',
      comingSoon: true,
      render: () => <div className="flex items-center justify-center h-[350px] text-gray-400">Requires NRR computation across matches</div>,
    },
    {
      id: 'tournament-points',
      title: 'Tournament Points Table Analytics',
      icon: <BarChart3 className="w-5 h-5 text-indigo-600" />,
      desc: 'Points table visualization',
      comingSoon: true,
      render: () => <div className="flex items-center justify-center h-[350px] text-gray-400">Requires tournament-wide data</div>,
    },
    {
      id: 'team-dashboard',
      title: 'Team Performance Dashboard',
      icon: <BarChart3 className="w-5 h-5 text-blue-600" />,
      desc: 'Comprehensive team performance metrics',
      comingSoon: true,
      render: () => <div className="flex items-center justify-center h-[350px] text-gray-400">Requires aggregated data</div>,
    },
    {
      id: 'player-leaderboards',
      title: 'Player Leaderboards',
      icon: <BarChart3 className="w-5 h-5 text-amber-600" />,
      desc: 'All player rankings in one view',
      comingSoon: true,
      render: () => <div className="flex items-center justify-center h-[350px] text-gray-400">Requires comprehensive stats</div>,
    },
    {
      id: 'scoring-zones',
      title: 'Scoring Zones Analysis',
      icon: <PieChartIcon className="w-5 h-5 text-purple-600" />,
      desc: 'Runs scored in different field zones',
      comingSoon: true,
      render: () => <div className="flex items-center justify-center h-[350px] text-gray-400">Requires shot direction data</div>,
    },
    {
      id: 'wagon-wheel',
      title: 'Wagon Wheel Analysis',
      icon: <PieChartIcon className="w-5 h-5 text-orange-600" />,
      desc: 'Shot placement visualization',
      comingSoon: true,
      render: () => <div className="flex items-center justify-center h-[350px] text-gray-400">Requires field position data</div>,
    },
    {
      id: 'bowling-length',
      title: 'Bowling Length Analysis',
      icon: <BarChart3 className="w-5 h-5 text-red-600" />,
      desc: 'Bowling length distribution',
      comingSoon: true,
      render: () => <div className="flex items-center justify-center h-[350px] text-gray-400">Requires ball tracking data</div>,
    },
    {
      id: 'bowling-line',
      title: 'Bowling Line Analysis',
      icon: <BarChart3 className="w-5 h-5 text-cyan-600" />,
      desc: 'Bowling line distribution',
      comingSoon: true,
      render: () => <div className="flex items-center justify-center h-[350px] text-gray-400">Requires ball tracking data</div>,
    },
    {
      id: 'dot-ball-heatmap',
      title: 'Dot Ball Heatmap',
      icon: <Activity className="w-5 h-5 text-slate-600" />,
      desc: 'Dot ball density per over',
      comingSoon: true,
      render: () => <div className="flex items-center justify-center h-[350px] text-gray-400">Requires over-by-over dot ball tracking</div>,
    },
    {
      id: 'partnership-timeline',
      title: 'Partnership Timeline Graph',
      icon: <LineChartIcon className="w-5 h-5 text-purple-600" />,
      desc: 'Partnership runs over time',
      chartType: 'bar',
      getData: (p) => {
        let cum = 0;
        const data: { value: number }[] = [];
        (p.events || []).forEach((e) => {
          cum += (e.runs || 0) + (e.extras?.runs || 0);
          if (e.wicket) {
            data.push({ value: cum });
            cum = 0;
          }
        });
        if (data.length === 0) data.push({ value: cum });
        return data;
      },
      render: (p) => {
        let cum = 0; let wIdx = 0;
        const data: any[] = [];
        (p.events || []).forEach((e, i) => {
          cum += (e.runs || 0) + (e.extras?.runs || 0);
          if (e.wicket) {
            wIdx++;
            data.push({ label: `W${wIdx}`, runs: cum });
            cum = 0;
          }
        });
        if (data.length === 0) data.push({ label: 'Ongoing', runs: cum });
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }}>
                <Label value="Partnerships" position="insideBottom" offset={-5} style={{ fontSize: 11, fill: '#64748b' }} />
              </XAxis>
              <YAxis>
                <Label value="Runs" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fontSize: 11, fill: '#64748b' }} />
              </YAxis>
              <Tooltip />
              <Bar dataKey="runs" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: 'venue-performance',
      title: 'Venue Performance Analysis',
      icon: <BarChart3 className="w-5 h-5 text-green-600" />,
      desc: 'Team performance at this venue',
      comingSoon: true,
      render: () => <div className="flex items-center justify-center h-[350px] text-gray-400">Requires venue history data</div>,
    },
    {
      id: 'home-away',
      title: 'Home vs Away Performance',
      icon: <BarChart3 className="w-5 h-5 text-blue-600" />,
      desc: 'Home and away match performance',
      comingSoon: true,
      render: () => <div className="flex items-center justify-center h-[350px] text-gray-400">Requires home/away data</div>,
    },
    {
      id: 'qualification-probability',
      title: 'Tournament Qualification Probability',
      icon: <Activity className="w-5 h-5 text-indigo-600" />,
      desc: 'Probability of qualifying for playoffs',
      comingSoon: true,
      render: () => <div className="flex items-center justify-center h-[350px] text-gray-400">Requires full tournament standings</div>,
    },
    {
      id: 'wickets-per-match',
      title: 'Wickets Per Match Graph',
      icon: <BarChart3 className="w-5 h-5 text-red-600" />,
      desc: 'Wickets taken per innings',
      chartType: 'bar',
      getData: (p) => [
        { value: p.score?.teamA?.wickets || 0 },
        { value: p.score?.teamB?.wickets || 0 },
      ],
      render: (p) => {
        const data = [
          { name: p.teamA?.teamName || 'Team A', wickets: p.score?.teamA?.wickets || 0 },
          { name: p.teamB?.teamName || 'Team B', wickets: p.score?.teamB?.wickets || 0 },
        ];
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }}>
                <Label value="Teams" position="insideBottom" offset={-5} style={{ fontSize: 11, fill: '#64748b' }} />
              </XAxis>
              <YAxis>
                <Label value="Wickets" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fontSize: 11, fill: '#64748b' }} />
              </YAxis>
              <Tooltip />
              <Bar dataKey="wickets" fill="#ef4444" radius={[4, 4, 0, 0]}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      },
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {graphs.map((g, idx) => (
          <button
            key={g.id}
            onClick={() => setFullscreen(g)}
            className="text-left bg-white rounded-xl border border-slate-200 hover:shadow-lg hover:border-indigo-300 transition-all group overflow-hidden min-h-[170px]"
          >
            <div className="flex h-full">
              <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 rounded-md px-1.5 py-0.5 leading-none">{idx + 1}</span>
                    {g.icon}
                    <h3 className="font-semibold text-sm text-slate-800 group-hover:text-indigo-700 transition-colors leading-tight">{g.title}</h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{g.desc}</p>
                </div>
                <div className="mt-3">
                  {g.comingSoon ? (
                    <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Coming Soon</span>
                  ) : (
                    <span className="text-xs text-indigo-600 group-hover:underline flex items-center gap-1">
                      View full chart <span className="inline-block group-hover:translate-x-0.5 transition-transform">→</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="w-36 h-28 flex-shrink-0 border-l border-slate-100 bg-slate-50/50 p-2 flex items-center justify-center">
                {!g.comingSoon && g.chartType && g.getData ? (
                  g.chartType === 'bar' ? <MiniBar data={g.getData(props)} />
                  : g.chartType === 'line' ? <MiniLine data={g.getData(props)} />
                  : g.chartType === 'pie' ? <MiniPie data={g.getData(props)} />
                  : <div className="text-3xl opacity-30">{g.icon}</div>
                ) : (
                  <div className="text-3xl opacity-30">{g.icon}</div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <FullscreenModal open={!!fullscreen} title={fullscreen?.title || ''} onClose={() => setFullscreen(null)}>
        {fullscreen?.render(props)}
      </FullscreenModal>
    </>
  );
}