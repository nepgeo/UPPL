# LiveScores Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the public LiveScores page with glassmorphism aesthetics, refreshed match card buttons, and full responsiveness.

**Architecture:** Single-file change to `LiveScores.tsx`. No new components, no backend changes. All styles applied via Tailwind utility classes inline. Framer Motion for animations.

**Tech Stack:** React 18 + TypeScript, Tailwind CSS, Framer Motion, Lucide React icons, shadcn/ui Card/Badge/Button/Tabs/Skeleton components

## Global Constraints

- All cards use glassmorphism: `bg-white/5 backdrop-blur-md border border-white/10 rounded-xl`
- All action buttons use ghost/outline base: `bg-white/10 border border-white/20 text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600`
- Watch Live button: `bg-gradient-to-r from-red-600 to-red-700 shadow-lg shadow-red-600/20`
- Responsive grids: 1 col mobile, 2 col md, 3 col lg for upcoming matches
- Framer Motion entrance animations on all cards
- Device logos use `getTeamLogo()` helper (already exists)

---

### Task 1: Update hero section

**Files:**
- Modify: `frontend/src/pages/LiveScores.tsx:176-219`

**Interfaces:**
- Consumes: existing `liveMatches` state, `navigate` function
- Produces: updated hero JSX with new gradient, centered layout, compact height

- [ ] **Step 1: Replace the hero gradient background and decorative elements**

Replace the current hero section (lines 176-219):

Old:
```tsx
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-10 md:py-16 relative">
```

New:
```tsx
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-purple-800 to-indigo-900">
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <div className="w-[600px] h-[600px] bg-blue-500 rounded-full blur-[120px]" />
        </div>
        <div className="container mx-auto px-4 py-8 md:py-12 relative">
```

- [ ] **Step 2: Update hero content — centered layout, live count badge**

Replace the inner hero content (current lines 184-217):

Old:
```tsx
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <Zap className="h-6 w-6 text-yellow-400" />
              <span className="text-yellow-400 font-semibold text-sm uppercase tracking-widest">
                {liveMatches.length > 0 ? `${liveMatches.length} Match${liveMatches.length > 1 ? 'es' : ''} Live` : 'Cricket Action'}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">
              {liveMatches.length > 0 ? '🏏 Live Scores' : 'UPPL Scores'}
            </h1>
            <p className="text-gray-300 text-lg max-w-xl">
              {liveMatches.length > 0
                ? 'Real-time ball-by-ball updates from the ongoing matches'
                : 'Follow all the action from the Udaydev Patan Premier League'}
            </p>
          </motion.div>

          {liveMatches.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 flex flex-wrap gap-3"
            >
              {liveMatches.map(m => (
                <Badge key={m._id} className="bg-white/10 text-white border border-white/20 px-4 py-2 text-sm cursor-pointer hover:bg-white/20"
                  onClick={() => navigate(`/match/${m._id}`)}
                >
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2 inline-block" />
                  {m.teamA?.teamName || 'TBD'} vs {m.teamB?.teamName || 'TBD'}
                </Badge>
              ))}
            </motion.div>
          )}
```

New:
```tsx
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            {/* Live count pill badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-4">
              {liveMatches.length > 0 ? (
                <>
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm font-semibold text-white">
                    {liveMatches.length} Match{liveMatches.length > 1 ? 'es' : ''} Live
                  </span>
                </>
              ) : (
                <span className="text-sm font-semibold text-gray-300">Cricket Action</span>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">
              {liveMatches.length > 0 ? 'Live Scores' : 'UPPL Scores'}
            </h1>
            <p className="text-gray-300 text-lg max-w-xl mx-auto">
              {liveMatches.length > 0
                ? 'Real-time ball-by-ball updates from the ongoing matches'
                : 'Follow all the action from the Udaydev Patan Premier League'}
            </p>
          </motion.div>
```

- [ ] **Step 3: Also clean up unused import**

The `Zap` icon import is no longer needed after removing the hero section glow. Keep the rest. (We'll handle import cleanup at the end.)

---

### Task 2: Update tab navigation

**Files:**
- Modify: `frontend/src/pages/LiveScores.tsx:223-241`

**Interfaces:**
- Consumes: `activeTab`, `setActiveTab`, `liveMatches.length`, `upcomingMatches.length`, `navigate`
- Produces: underline-style tabs with colored active indicators

- [ ] **Step 1: Replace the TabsList with underline-style tabs**

Old (lines 223-241):
```tsx
          <div className="flex justify-center mb-8">
            <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl">
              <TabsTrigger value="live" className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-lg px-6">
                🔴 Live {liveMatches.length > 0 && `(${liveMatches.length})`}
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg px-6">
                📅 Upcoming ({upcomingMatches.length})
              </TabsTrigger>
              <TabsTrigger value="recent" className="data-[state=active]:bg-green-600 data-[state=active]:text-white rounded-lg px-6">
                ✅ Recent
              </TabsTrigger>
              <Button
                onClick={() => navigate('/watch-live')}
                className="ml-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-0 rounded-lg px-4 h-9 text-sm font-semibold shadow-lg shadow-red-600/20"
              >
                <Play className="h-4 w-4 mr-1.5" /> Watch Live
              </Button>
            </TabsList>
          </div>
```

New:
```tsx
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2">
              <div className="flex items-center gap-1">
                <TabsTrigger value="live"
                  className="relative px-4 py-2 text-sm font-medium text-gray-400 data-[state=active]:text-red-400 transition-colors
                    after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-0.5 after:w-0 after:bg-red-500
                    data-[state=active]:after:w-full after:transition-all"
                >
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block mr-1.5" />
                  Live {liveMatches.length > 0 && `(${liveMatches.length})`}
                </TabsTrigger>
                <TabsTrigger value="upcoming"
                  className="relative px-4 py-2 text-sm font-medium text-gray-400 data-[state=active]:text-blue-400 transition-colors
                    after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-0.5 after:w-0 after:bg-blue-500
                    data-[state=active]:after:w-full after:transition-all"
                >
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block mr-1.5" />
                  Upcoming ({upcomingMatches.length})
                </TabsTrigger>
                <TabsTrigger value="recent"
                  className="relative px-4 py-2 text-sm font-medium text-gray-400 data-[state=active]:text-green-400 transition-colors
                    after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-0.5 after:w-0 after:bg-green-500
                    data-[state=active]:after:w-full after:transition-all"
                >
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block mr-1.5" />
                  Recent
                </TabsTrigger>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <Button
                onClick={() => navigate('/watch-live')}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-0 rounded-lg px-4 h-8 text-xs font-semibold shadow-lg shadow-red-600/20"
              >
                <Play className="h-3.5 w-3.5 mr-1" /> Watch Live
              </Button>
            </div>
          </div>
```

- [ ] **Step 2: Verify tabs still work**

The `TabsList` wrapper is removed — the tabs are now direct children of the `Tabs` container. The `Tabs` component from shadcn/ui should handle `TabsTrigger` correctly without `TabsList`. No runtime issues expected.

---

### Task 3: Redesign live match cards

**Files:**
- Modify: `frontend/src/pages/LiveScores.tsx:259-374`

**Interfaces:**
- Consumes: `liveMatches`, `navigate`, `formatOvers` helper
- Produces: glassmorphism live scorecards with ghost buttons

- [ ] **Step 1: Replace the live match card JSX**

Replace everything inside the `liveMatches.length === 0` else block (current lines 259-374):

Old (from `:259` to `:373`):
```tsx
              <div className="grid gap-6">
                {liveMatches.map((match, idx) => {
                  const teamAScore = match.score?.teamA || { runs: 0, wickets: 0, balls: 0, overs: 0, runRate: 0 };
                  const teamBScore = match.score?.teamB || { runs: 0, wickets: 0, balls: 0, overs: 0, runRate: 0 };
                  return (
                    <motion.div key={match._id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                      <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 text-white overflow-hidden hover:border-blue-500/50 transition-all group">
                        <CardContent className="p-0">
                          {/* Live Banner */}
                          <div className="bg-gradient-to-r from-red-600 to-red-800 px-4 py-1.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                              <span className="text-xs font-bold uppercase tracking-widest">Live</span>
                              <span className="text-xs text-red-200">| {match.stage || 'League'} Match</span>
                            </div>
                            <span className="text-xs text-red-200">
                              RR: {match.battingFirst === 'teamA' ? teamAScore.runRate?.toFixed(2) : teamBScore.runRate?.toFixed(2)}
                            </span>
                          </div>

                          <div className="p-5">
                            {/* Team A */}
                            ... (team rows + current over + button)
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
```

New:
```tsx
              <div className="grid gap-4">
                {liveMatches.map((match, idx) => {
                  const teamAScore = match.score?.teamA || { runs: 0, wickets: 0, balls: 0, overs: 0, runRate: 0 };
                  const teamBScore = match.score?.teamB || { runs: 0, wickets: 0, balls: 0, overs: 0, runRate: 0 };
                  return (
                    <motion.div
                      key={match._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Card className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-white hover:border-white/20 transition-all">
                        <CardContent className="p-4 sm:p-5">
                          {/* Top bar: stage + status + RR */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                              <span className="text-xs font-bold uppercase tracking-wider text-red-400">Live</span>
                              <span className="text-xs text-gray-400">| {match.stage || 'League'} Match</span>
                            </div>
                            <span className="text-xs text-gray-400">
                              RR: {match.battingFirst === 'teamA'
                                ? teamAScore.runRate?.toFixed(2)
                                : teamBScore.runRate?.toFixed(2)}
                            </span>
                          </div>

                          {/* Team A row */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {getTeamLogo(match.teamA?.teamLogo) ? (
                                  <img src={getTeamLogo(match.teamA?.teamLogo)} alt="" className="w-full h-full object-contain p-0.5" />
                                ) : (
                                  <span className="text-xs font-bold text-gray-400">
                                    {match.teamA?.teamName?.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                                  </span>
                                )}
                              </div>
                              <span className="font-semibold text-sm truncate">{match.teamA?.teamName || 'Team A'}</span>
                            </div>
                            <div className="text-right flex-shrink-0 ml-3">
                              <span className="text-2xl font-extrabold tracking-tight">
                                {teamAScore.runs}<span className="text-gray-500">/{teamAScore.wickets}</span>
                              </span>
                              <div className="text-xs text-gray-400">
                                {formatOvers(teamAScore.balls)} ov | RR: {teamAScore.runRate?.toFixed(2)}
                              </div>
                            </div>
                          </div>

                          {/* Team B row */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {getTeamLogo(match.teamB?.teamLogo) ? (
                                  <img src={getTeamLogo(match.teamB?.teamLogo)} alt="" className="w-full h-full object-contain p-0.5" />
                                ) : (
                                  <span className="text-xs font-bold text-gray-400">
                                    {match.teamB?.teamName?.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                                  </span>
                                )}
                              </div>
                              <span className="font-semibold text-sm truncate">{match.teamB?.teamName || 'Team B'}</span>
                            </div>
                            <div className="text-right flex-shrink-0 ml-3">
                              <span className="text-2xl font-extrabold tracking-tight">
                                {teamBScore.runs}<span className="text-gray-500">/{teamBScore.wickets}</span>
                              </span>
                              <div className="text-xs text-gray-400">
                                {formatOvers(teamBScore.balls)} ov | RR: {teamBScore.runRate?.toFixed(2)}
                              </div>
                            </div>
                          </div>

                          {/* Current Over */}
                          {match.currentOver && match.currentOver.length > 0 && (
                            <div className="mb-4">
                              <p className="text-xs text-gray-500 mb-1.5">Over {match.currentOverNumber}:</p>
                              <div className="flex gap-1.5">
                                {match.currentOver.map((ev: BallEvent, i: number) => (
                                  <span
                                    key={i}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold
                                      ${ev.wicket ? 'bg-red-600 text-white' :
                                        ev.isSix ? 'bg-purple-600 text-white' :
                                        ev.isFour ? 'bg-emerald-500 text-white' :
                                        ev.runs === 0 ? 'bg-gray-700 text-gray-300' :
                                        'bg-blue-600 text-white'}`}
                                  >
                                    {ev.wicket ? 'W' : ev.runs + (ev.extras?.runs || 0)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Button */}
                          <Button
                            onClick={() => navigate(`/match/${match._id}`)}
                            className="w-full bg-white/5 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 border border-white/20 text-white hover:text-white hover:border-transparent transition-all"
                          >
                            <Eye className="h-4 w-4 mr-2" /> View Live Score
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
```

---

### Task 4: Redesign upcoming match cards

**Files:**
- Modify: `frontend/src/pages/LiveScores.tsx:391-466`

**Interfaces:**
- Consumes: `upcomingMatches`, `navigate`, `formatDateTime`, `getTeamLogo`
- Produces: glassmorphism upcoming match cards with ghost buttons

- [ ] **Step 1: Replace the upcoming match cards**

Replace the upcoming matches grid and cards (current lines 391-466).

Old (from `:391` to `:463`):
```tsx
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingMatches.map((match, idx) => {
                  const dt = formatDateTime(match.matchTime);
                  return (
                    <motion.div key={match._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                      <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 text-white h-full hover:border-blue-500/30 transition-all group">
                        <CardContent className="p-5 flex flex-col h-full">
                          ...
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
```

New:
```tsx
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingMatches.map((match, idx) => {
                  const dt = formatDateTime(match.matchTime);
                  return (
                    <motion.div
                      key={match._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-white h-full hover:border-white/20 transition-all">
                        <CardContent className="p-5 flex flex-col h-full">
                          {/* Top row: stage badge + status */}
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-xs text-gray-400 font-medium">
                              {match.stage || 'League'} Match{match.matchNumber ? ` #${match.matchNumber}` : ''}
                            </span>
                            <span className="text-xs text-blue-300 bg-blue-600/20 border border-blue-500/30 rounded-full px-2.5 py-0.5 font-medium">
                              Upcoming
                            </span>
                          </div>

                          {/* Teams */}
                          <div className="flex items-center justify-between gap-3 mb-4">
                            <div className="text-center flex-1 min-w-0">
                              <div className="w-12 h-12 rounded-full bg-white/10 mx-auto mb-2 flex items-center justify-center overflow-hidden">
                                {getTeamLogo(match.teamA?.teamLogo) ? (
                                  <img src={getTeamLogo(match.teamA?.teamLogo)} alt="" className="w-full h-full object-contain p-1" />
                                ) : (
                                  <span className="text-lg font-bold text-gray-500">
                                    {match.teamA?.teamName?.charAt(0) || 'A'}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-semibold truncate">{match.teamA?.teamName || 'TBD'}</p>
                            </div>
                            <div className="flex-shrink-0">
                              <span className="text-lg font-extrabold text-yellow-400">VS</span>
                            </div>
                            <div className="text-center flex-1 min-w-0">
                              <div className="w-12 h-12 rounded-full bg-white/10 mx-auto mb-2 flex items-center justify-center overflow-hidden">
                                {getTeamLogo(match.teamB?.teamLogo) ? (
                                  <img src={getTeamLogo(match.teamB?.teamLogo)} alt="" className="w-full h-full object-contain p-1" />
                                ) : (
                                  <span className="text-lg font-bold text-gray-500">
                                    {match.teamB?.teamName?.charAt(0) || 'B'}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-semibold truncate">{match.teamB?.teamName || 'TBD'}</p>
                            </div>
                          </div>

                          {/* Date/Time */}
                          <div className="text-center mb-4 text-sm text-gray-400 space-y-1">
                            <div className="flex items-center justify-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{dt.day}, {dt.date}</span>
                            </div>
                            <div className="flex items-center justify-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{dt.time}</span>
                            </div>
                          </div>

                          {/* Spacer + Button */}
                          <div className="flex-1" />
                          <Button
                            onClick={() => navigate(`/match/${match._id}`)}
                            className="w-full bg-white/10 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 border border-white/20 text-white hover:text-white hover:border-transparent transition-all"
                          >
                            <Eye className="h-4 w-4 mr-2" /> Match Details
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
```

---

### Task 5: Redesign recent match cards

**Files:**
- Modify: `frontend/src/pages/LiveScores.tsx:482-546`

**Interfaces:**
- Consumes: `recentMatches`, `navigate`, `formatDateTime`, `getTeamLogo`
- Produces: glassmorphism recent match cards with scores, overs, RR, and "View Scorecard" button

- [ ] **Step 1: Replace the recent match cards**

Replace the recent matches section (current lines 482-546).

Old (from `:482` to `:545`):
```tsx
              <div className="grid gap-4">
                {recentMatches.map((match, idx) => {
                  ... (current implementation)
                })}
              </div>
```

New:
```tsx
              <div className="grid gap-4">
                {recentMatches.map((match, idx) => {
                  const dt = formatDateTime(match.matchTime);
                  const winnerName = match.winner === 'teamA'
                    ? match.teamA?.teamName
                    : match.winner === 'teamB'
                    ? match.teamB?.teamName
                    : match.winner === 'tie' ? 'Match Tied' : match.winner;
                  return (
                    <motion.div
                      key={match._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-white hover:border-white/20 transition-all">
                        <CardContent className="p-4 sm:p-5">
                          {/* Top row: date + status */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Trophy className="h-4 w-4 text-yellow-500" />
                              <span className="text-xs text-gray-400">{dt.date}</span>
                            </div>
                            <span className="text-xs text-green-300 bg-green-600/20 border border-green-500/30 rounded-full px-2.5 py-0.5 font-medium">
                              Completed
                            </span>
                          </div>

                          {/* Team A */}
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {getTeamLogo(match.teamA?.teamLogo) ? (
                                  <img src={getTeamLogo(match.teamA?.teamLogo)} alt="" className="w-full h-full object-contain p-0.5" />
                                ) : <span className="text-xs text-gray-500">A</span>}
                              </div>
                              <span className="font-semibold text-sm truncate">{match.teamA?.teamName}</span>
                            </div>
                            <div className="text-right flex-shrink-0 ml-3">
                              <span className="text-lg font-extrabold">
                                {match.teamA?.runs ?? 0}<span className="text-gray-500">/{match.teamA?.wickets ?? 0}</span>
                              </span>
                              <div className="text-xs text-gray-400">
                                {match.teamA?.overs ? `${match.teamA.overs} ov` : ''}
                              </div>
                            </div>
                          </div>

                          {/* Team B */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {getTeamLogo(match.teamB?.teamLogo) ? (
                                  <img src={getTeamLogo(match.teamB?.teamLogo)} alt="" className="w-full h-full object-contain p-0.5" />
                                ) : <span className="text-xs text-gray-500">B</span>}
                              </div>
                              <span className="font-semibold text-sm truncate">{match.teamB?.teamName}</span>
                            </div>
                            <div className="text-right flex-shrink-0 ml-3">
                              <span className="text-lg font-extrabold">
                                {match.teamB?.runs ?? 0}<span className="text-gray-500">/{match.teamB?.wickets ?? 0}</span>
                              </span>
                              <div className="text-xs text-gray-400">
                                {match.teamB?.overs ? `${match.teamB.overs} ov` : ''}
                              </div>
                            </div>
                          </div>

                          {/* Result + Button row */}
                          <div className="flex items-center justify-between pt-3 border-t border-white/10">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <Trophy className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                              {winnerName ? (
                                <span className="text-sm font-semibold text-green-400 truncate">
                                  {winnerName} won{ match.margin ? ` by ${match.margin}` : '' }
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">No result</span>
                              )}
                            </div>
                            <Button
                              onClick={() => navigate(`/match/${match._id}`)}
                              className="bg-white/10 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 border border-white/20 text-white hover:text-white hover:border-transparent transition-all text-xs flex-shrink-0 ml-3"
                              size="sm"
                            >
                              View Scorecard <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
```

---

### Task 6: Update empty states for all three tabs

**Files:**
- Modify: `frontend/src/pages/LiveScores.tsx:245-258` (live empty), `:380-390` (upcoming empty), `:471-480` (recent empty)

**Interfaces:**
- Consumes: `setActiveTab`
- Produces: glassmorphism empty state cards with matching CTA buttons

- [ ] **Step 1: Update live tab empty state**

Replace line 247-257:
```tsx
                <Card className="bg-white/5 border-white/10 backdrop-blur">
                  <CardContent className="p-16 text-center">
                    <Activity className="h-16 w-16 mx-auto mb-4 text-gray-500" />
                    <h3 className="text-2xl font-bold text-white mb-2">No Live Matches</h3>
                    <p className="text-gray-400 mb-6">There are no matches currently in progress. Check the upcoming matches.</p>
                    <Button onClick={() => setActiveTab('upcoming')} variant="outline" className="border-white/20 text-white">
                      View Upcoming Matches <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
```

Change the Card className to:
```tsx
<Card className="bg-white/5 backdrop-blur-md border-white/10 rounded-xl">
```

- [ ] **Step 2: Update upcoming tab empty state**

Change Card className to match: `bg-white/5 backdrop-blur-md border-white/10 rounded-xl`

- [ ] **Step 3: Update recent tab empty state**

Change Card className to match: `bg-white/5 backdrop-blur-md border-white/10 rounded-xl`

---

### Task 7: Final cleanup and verification

**Files:**
- Modify: `frontend/src/pages/LiveScores.tsx`

- [ ] **Step 1: Remove unused imports**

Check imports at top of file. `Zap` is no longer used (was in hero). Remove it from the import:
```tsx
import { Clock, MapPin, Activity, ArrowRight, Zap, Trophy, ChevronRight, Eye, Calendar, Play } from 'lucide-react';
```
Change to:
```tsx
import { Clock, Activity, ArrowRight, Trophy, ChevronRight, Eye, Calendar, Play } from 'lucide-react';
```
(`MapPin` was also unused — remove it too.)

- [ ] **Step 2: Verify the file builds**

Run: `cd frontend && npx tsc --noEmit` (or the project's typecheck command)

Expected: No TypeScript errors.

- [ ] **Step 3: Verify the app compiles**

Run: `cd frontend && npm run build`

Expected: Build succeeds with no errors.
