import React, { useState, useEffect } from 'react';
import { Trophy, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { API_BASE, BASE_URL } from '@/config';




/**
 * A small map of known teams — used only for aesthetics (short name + color).
 * You can expand this or load it from the backend in future.
 */
const teamsInfo = {
  'Lumbini Lions': { short: 'LL', color: '#ff9800' },
  'Pokhara Patriots': { short: 'PP', color: '#3f51b5' },
  'Kathmandu Kings': { short: 'KK', color: '#4caf50' },
  'Biratnagar Blasters': { short: 'BB', color: '#f44336' },
  'Janakpur Royals': { short: 'JR', color: '#9c27b0' },
  'Butwal Tigers': { short: 'BT', color: '#009688' }
};

// ✅ New function to handle team logo/profile image
function getProfileImageUrl(path) {
  if (!path) return `${BASE_URL}/favicon.png`;
  if (path.startsWith("http")) return path;

  let cleanPath = path
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .replace(/^\/uploads\/uploads\//, "/uploads/")
    .replace(/^uploads\//, "/uploads/");

  if (!cleanPath.startsWith("/")) cleanPath = "/" + cleanPath;
  return `${BASE_URL}${cleanPath}`;
}

// Types are loose here to keep the file as plain JS-friendly; but shape normalization is done below.
const PointsTable = () => {
  const [viewType, setViewType] = useState('current'); // 'current' | 'form'
  const [pointsTable, setPointsTable] = useState({ groups: {}, all: [] });
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    const fetchSeasonData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('pplt20_token') || '';
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // 1) Current season
        const seasonRes = await fetch('/api/seasons/current', { headers });
        const currentSeason = await seasonRes.json();
        const currentSeasonId = currentSeason?._id || currentSeason?.id || currentSeason?.seasonNumber;
        if (!currentSeasonId) {
          console.warn('No current season found from /api/seasons/current');
          setPointsTable({ groups: {}, all: [] });
          setTeams([]);
          setMatches([]);
          setLoading(false);
          return;
        }

        // 2) Points table
        const ptRes = await fetch(`/api/points-table/${encodeURIComponent(currentSeasonId)}`, {
          headers
        });
        let rawPointsData = {};
        try {
          rawPointsData = await ptRes.json();
        } catch (e) {
          console.error('Failed to parse points table response', e);
          rawPointsData = {};
        }

        const normalizePoints = (raw) => {
          const normalized = { groups: {}, all: [] };
          if (!raw) return normalized;
          if (typeof raw === 'object' && (raw.groups || raw.all)) {
            normalized.groups = raw.groups || {};
            normalized.all = Array.isArray(raw.all) ? raw.all : [];
            return normalized;
          }
          if (Array.isArray(raw)) {
            normalized.all = raw;
            return normalized;
          }
          if (Array.isArray(raw.teams)) {
            normalized.all = raw.teams;
            return normalized;
          }
          return normalized;
        };

        const normalizedPoints = normalizePoints(rawPointsData);

        const normalizeTeamRow = (row, idxInList = 0) => {
          const teamName =
            row.team ||
            row.teamName ||
            row.name ||
            (row.teamObj && (row.teamObj.teamName || row.teamObj.name)) ||
            '';

          const teamId = row.teamId || row._id || (row.teamObj && row.teamObj._id) || row.id || null;
          const teamCode = row.teamCode || row.code || (row.teamObj && row.teamObj.teamCode) || '';
          const matchesPlayed = row.matches ?? row.played ?? row.playedMatches ?? 0;
          const won = row.won ?? row.wins ?? 0;
          const lost = row.lost ?? row.losses ?? 0;
          const tied = row.tied ?? row.ties ?? 0;

          let nrr = row.nrr ?? row.nrrSum ?? row.netRunRate;
          if (nrr === undefined || nrr === null) {
            const maybe = row.nrrString || row.netRunRateString;
            if (typeof maybe === 'string') {
              const parsed = parseFloat(maybe);
              if (!isNaN(parsed)) nrr = parsed;
            }
            nrr = nrr ?? 0;
          }

          const points = row.points ?? row.pts ?? row.totalPoints ?? 0;

          let form = [];
          if (Array.isArray(row.form)) {
            form = row.form;
          } else if (typeof row.form === 'string') {
            if (row.form.includes(',')) {
              form = row.form.split(',').map((s) => s.trim()).filter(Boolean);
            } else {
              form = row.form.split('').map((s) => s.trim()).filter(Boolean);
            }
          } else if (row.lastResults && Array.isArray(row.lastResults)) {
            form = row.lastResults;
          }

          const groupName = row.groupName ?? row.group ?? row.group_label ?? row.groupLabel ?? 'Group';
          const position = row.groupPosition ?? row.group_pos ?? row.position ?? row.pos ?? idxInList + 1;
          const qualified = row.qualified ?? row.status ?? row.qualification ?? null;

          return {
            teamId,
            team: teamName,
            teamCode,
            teamLogo: getProfileImageUrl(row.teamLogo || row.logo || (row.teamObj && row.teamObj.teamLogo) || ''),
            matches: matchesPlayed,
            won,
            lost,
            tied,
            nrr: typeof nrr === 'number' ? nrr : parseFloat(nrr) || 0,
            points: typeof points === 'number' ? points : parseInt(points, 10) || 0,
            form,
            groupName,
            position,
            qualified
          };
        };

        const finalGroups = {};
        const finalAll = [];

        if (normalizedPoints.groups && Object.keys(normalizedPoints.groups).length) {
          Object.entries(normalizedPoints.groups).forEach(([gName, arr]) => {
            if (!Array.isArray(arr)) return;
            const norm = arr.map((r, idx) => normalizeTeamRow(r, idx));
            norm.sort((a, b) => {
              if ((a.position || 0) !== (b.position || 0)) return (a.position || 0) - (b.position || 0);
              if (b.points !== a.points) return b.points - a.points;
              return b.nrr - a.nrr;
            });
            norm.forEach((t, i) => (t.position = i + 1));
            finalGroups[gName] = norm;
            finalAll.push(...norm);
          });
        }

        if (finalAll.length === 0 && Array.isArray(normalizedPoints.all) && normalizedPoints.all.length) {
          const normAll = normalizedPoints.all.map((r, idx) => normalizeTeamRow(r, idx));
          const groupsFromAll = {};
          normAll.forEach((t) => {
            const g = t.groupName || 'Group';
            if (!groupsFromAll[g]) groupsFromAll[g] = [];
            groupsFromAll[g].push(t);
          });
          Object.keys(groupsFromAll).forEach((g) => {
            groupsFromAll[g].sort((a, b) => {
              if ((a.position || 0) !== (b.position || 0)) return (a.position || 0) - (b.position || 0);
              if (b.points !== a.points) return b.points - a.points;
              return b.nrr - a.nrr;
            });
            groupsFromAll[g].forEach((t, i) => (t.position = i + 1));
            finalGroups[g] = groupsFromAll[g];
          });
          finalAll.push(...normAll);
        }

        const finalNormalized = { groups: finalGroups, all: finalAll };
        setPointsTable(finalNormalized);

        try {
          const teamsRes = await fetch(`/api/teams?seasonId=${encodeURIComponent(currentSeasonId)}`, {
            headers
          });
          const teamsJson = await teamsRes.json();
          if (Array.isArray(teamsJson)) setTeams(teamsJson);
        } catch (e) {
          console.debug('teams fetch failed or not present', e);
        }

        try {
          const matchesRes = await fetch(`/api/matches?seasonId=${encodeURIComponent(currentSeasonId)}`, {
            headers
          });
          const matchesJson = await matchesRes.json();
          if (Array.isArray(matchesJson)) setMatches(matchesJson);
        } catch (e) {
          console.debug('matches fetch failed or not present', e);
        }

      } catch (err) {
        console.error('Error fetching season data:', err);
        setPointsTable({ groups: {}, all: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchSeasonData();
  }, []);

  const getQualificationBadge = (status) => {
    if (!status) return <Badge variant="outline">TBD</Badge>;
    const lower = String(status).toLowerCase();
    if (lower.includes('playoff') || lower.includes('qualified') || lower.includes('q')) {
      return <Badge className="bg-green-500 text-white">Qualified</Badge>;
    }
    if (lower.includes('elim') || lower.includes('eliminated') || lower.includes('out')) {
      return <Badge className="bg-red-500 text-white">Eliminated</Badge>;
    }
    return <Badge variant="outline">{String(status)}</Badge>;
  };

  const getFormBadge = (result) => (
    <span
      className={`inline-block w-5 h-5 rounded-full text-xs text-white font-bold flex items-center justify-center ${
        result === 'W' || result === 'w'
          ? 'bg-green-500'
          : result === 'L' || result === 'l'
          ? 'bg-red-500'
          : 'bg-gray-500'
      }`}
    >
      {String(result).toUpperCase()}
    </span>
  );

  const getNRRColor = (nrr) => {
    if (nrr > 0) return 'text-green-600';
    if (nrr < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading points table...</p>
      </div>
    );
  }

  const groupEntries = Object.entries(pointsTable.groups || {});

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12 md:py-16 mb-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 md:mb-4">Points Table</h1>
          <p className="text-lg md:text-xl opacity-90">Current standings by group</p>
        </div>
      </div>

      <div className="container mx-auto px-2 md:px-4 space-y-8 md:space-y-12">
        {/* Toggle Buttons */}
        <div className="flex justify-center mb-4 md:mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm border">
            <Button
              variant={viewType === 'current' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewType('current')}
            >
              Current Table
            </Button>
            <Button
              variant={viewType === 'form' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewType('form')}
            >
              Form Guide
            </Button>
          </div>
        </div>

        {/* Render tables */}
        {groupEntries.length === 0 && (
          <Card className="shadow-lg border border-gray-200">
            <CardHeader className="bg-gray-100 border-b">
              <CardTitle>No standings available</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Points table not found for the current season.</p>
            </CardContent>
          </Card>
        )}

        {groupEntries.map(([groupName, groupTeams]) => (
          <Card key={groupName} className="shadow-lg border border-gray-200">
            <CardHeader className="bg-gray-100 border-b">
              <CardTitle className="flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                Group {groupName} - Standings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm md:text-base">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-1 md:py-3 md:px-2">Pos</th>
                      <th className="text-left py-2 px-1 md:py-3 md:px-2">Team</th>
                      <th className="text-center py-2 px-1 md:py-3 md:px-2">M</th>
                      <th className="text-center py-2 px-1 md:py-3 md:px-2">W</th>
                      <th className="text-center py-2 px-1 md:py-3 md:px-2">L</th>
                      <th className="text-center py-2 px-1 md:py-3 md:px-2">T</th>
                      <th className="text-center py-2 px-1 md:py-3 md:px-2">NRR</th>
                      <th className="text-center py-2 px-1 md:py-3 md:px-2">Pts</th>
                      {viewType === 'form' && <th className="text-center py-2 px-1 md:py-3 md:px-2">Form</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(groupTeams) &&
                      groupTeams.map((team, index) => {
                        const safeTeam =
                          team && team.team ? team : {
                            team: team.teamName || team.name || 'Unknown',
                            matches: team.matches ?? team.played ?? 0,
                            won: team.won ?? 0,
                            lost: team.lost ?? 0,
                            tied: team.tied ?? 0,
                            nrr: team.nrr ?? 0,
                            points: team.points ?? team.pts ?? 0,
                            form: team.form ?? [],
                            qualified: team.qualified ?? team.status ?? null,
                            position: team.position ?? index + 1
                          };

                        const teamMeta =
                          teamsInfo[safeTeam.team] || {
                            short: safeTeam.teamCode || (safeTeam.team || '').slice(0, 2).toUpperCase(),
                            color: '#999'
                          };

                        const isTop = safeTeam.position === 1 || index === 0;
                        const isBottom = safeTeam.position === (groupTeams.length || 0) || index === groupTeams.length - 1;

                        return (
                          <tr
                            key={safeTeam.teamId || safeTeam.team || index}
                            className={`border-b hover:bg-gray-50 ${
                              (safeTeam.qualified || '').toString().toLowerCase().includes('playoff')
                                ? 'bg-green-50'
                                : (safeTeam.qualified || '').toString().toLowerCase().includes('elim') ? 'bg-red-50' : ''
                            }`}
                          >
                            <td className="py-2 md:py-4 px-1 md:px-2 font-bold text-sm md:text-lg">
                              {safeTeam.position ?? index + 1}
                              {isTop && <ArrowUpCircle className="h-3 w-3 md:h-4 md:w-4 ml-1 text-green-500 inline" />}
                              {isBottom && <ArrowDownCircle className="h-3 w-3 md:h-4 md:w-4 ml-1 text-red-500 inline" />}
                            </td>
                            <td className="py-2 md:py-4 px-1 md:px-2">
                              <div className="flex items-center space-x-2 md:space-x-3">
                                <img
                                  src={safeTeam.teamLogo || getProfileImageUrl(safeTeam.teamLogo)}
                                  alt={safeTeam.team}
                                  className="w-6 h-6 md:w-8 md:h-8 rounded-full object-cover"
                                />
                                <span className="font-medium text-sm md:text-base">{safeTeam.team}</span>
                              </div>
                            </td>
                            <td className="text-center py-2 md:py-4 px-1 md:px-2">{safeTeam.matches ?? 0}</td>
                            <td className="text-center py-2 md:py-4 px-1 md:px-2 text-green-600 font-medium">{safeTeam.won ?? 0}</td>
                            <td className="text-center py-2 md:py-4 px-1 md:px-2 text-red-600 font-medium">{safeTeam.lost ?? 0}</td>
                            <td className="text-center py-2 md:py-4 px-1 md:px-2">{safeTeam.tied ?? 0}</td>
                            <td className={`text-center py-2 md:py-4 px-1 md:px-2 font-medium ${getNRRColor(safeTeam.nrr ?? 0)}`}>
                              {(safeTeam.nrr ?? 0) > 0 ? `+${safeTeam.nrr}` : (safeTeam.nrr ?? 0)}
                            </td>
                            <td className="text-center py-2 md:py-4 px-1 md:px-2 font-bold text-sm md:text-lg">{safeTeam.points ?? 0}</td>
                            {viewType === 'form' && (
                              <td className="text-center py-2 md:py-4 px-1 md:px-2">
                                <div className="flex justify-center space-x-1">
                                  {Array.isArray(safeTeam.form) && safeTeam.form.length > 0 ? (
                                    safeTeam.form.slice(0, 6).map((r, i) => <div key={i}>{getFormBadge(r)}</div>)
                                  ) : (
                                    <span className="text-xs md:text-sm text-gray-400">—</span>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PointsTable;
