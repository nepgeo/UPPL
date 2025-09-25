
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Clock, Play, Pause, Calendar, MapPin, Users, Target, TrendingUp, Activity } from 'lucide-react';

interface LiveMatch {
  id: number;
  teamA: string;
  teamB: string;
  teamALogo: string;
  teamBLogo: string;
  status: 'live' | 'upcoming' | 'completed';
  venue: string;
  date: string;
  time: string;
  format: string;
  scoreA: {
    runs: number;
    wickets: number;
    overs: number;
    balls: number;
  };
  scoreB: {
    runs: number;
    wickets: number;
    overs: number;
    balls: number;
  };
  currentBatting: 'A' | 'B';
  target?: number;
  currentOver: string[];
  recentOvers: string[][];
  commentary: {
    time: string;
    text: string;
    type: 'wicket' | 'boundary' | 'dot' | 'run';
  }[];
  keyPlayers: {
    batsmen: { name: string; runs: number; balls: number; fours: number; sixes: number; }[];
    bowlers: { name: string; overs: number; runs: number; wickets: number; economy: number; }[];
  };
}

const LiveScores = () => {
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<LiveMatch | null>(null);
  const [activeTab, setActiveTab] = useState('live');

  // Mock data for live matches
  useEffect(() => {
    const mockMatches: LiveMatch[] = [
      {
        id: 1,
        teamA: "Mumbai Mavericks",
        teamB: "Delhi Dragons",
        teamALogo: "/placeholder.svg",
        teamBLogo: "/placeholder.svg",
        status: 'live',
        venue: "Wankhede Stadium",
        date: "2024-01-20",
        time: "19:30",
        format: "T20",
        scoreA: { runs: 178, wickets: 6, overs: 20, balls: 0 },
        scoreB: { runs: 145, wickets: 4, overs: 16, balls: 3 },
        currentBatting: 'B',
        target: 179,
        currentOver: ['4', '1', '6', '.', '2'],
        recentOvers: [
          ['1', '4', '.', '2', '1', '6'],
          ['4', '.', '1', '.', '2', '4'],
          ['.', '6', '1', '4', '.', '1']
        ],
        commentary: [
          { time: '16.3', text: 'FOUR! Beautiful cover drive by Sharma', type: 'boundary' },
          { time: '16.2', text: 'Dot ball, good bowling by Patel', type: 'dot' },
          { time: '16.1', text: 'SIX! What a shot! Goes over long-on', type: 'boundary' },
          { time: '15.6', text: 'Single taken, easy run', type: 'run' },
          { time: '15.5', text: 'WICKET! Caught behind! What a delivery!', type: 'wicket' }
        ],
        keyPlayers: {
          batsmen: [
            { name: 'R. Sharma', runs: 45, balls: 28, fours: 6, sixes: 2 },
            { name: 'V. Kohli', runs: 32, balls: 21, fours: 4, sixes: 1 }
          ],
          bowlers: [
            { name: 'J. Bumrah', overs: 3.3, runs: 28, wickets: 2, economy: 8.0 },
            { name: 'R. Ashwin', overs: 4, runs: 35, wickets: 1, economy: 8.75 }
          ]
        }
      },
      {
        id: 2,
        teamA: "Chennai Champions",
        teamB: "Bangalore Blasters",
        teamALogo: "/placeholder.svg",
        teamBLogo: "/placeholder.svg",
        status: 'upcoming',
        venue: "M. A. Chidambaram Stadium",
        date: "2024-01-21",
        time: "15:30",
        format: "T20",
        scoreA: { runs: 0, wickets: 0, overs: 0, balls: 0 },
        scoreB: { runs: 0, wickets: 0, overs: 0, balls: 0 },
        currentBatting: 'A',
        currentOver: [],
        recentOvers: [],
        commentary: [],
        keyPlayers: { batsmen: [], bowlers: [] }
      },
      {
        id: 3,
        teamA: "Kolkata Kings",
        teamB: "Hyderabad Hawks",
        teamALogo: "/placeholder.svg",
        teamBLogo: "/placeholder.svg",
        status: 'completed',
        venue: "Eden Gardens",
        date: "2024-01-19",
        time: "19:30",
        format: "T20",
        scoreA: { runs: 165, wickets: 8, overs: 20, balls: 0 },
        scoreB: { runs: 168, wickets: 6, overs: 19, balls: 4 },
        currentBatting: 'B',
        currentOver: [],
        recentOvers: [],
        commentary: [
          { time: '19.4', text: 'MATCH WON! Hyderabad Hawks win by 4 wickets', type: 'boundary' }
        ],
        keyPlayers: {
          batsmen: [
            { name: 'D. Warner', runs: 68, balls: 45, fours: 8, sixes: 3 },
            { name: 'K. Williamson', runs: 42, balls: 31, fours: 5, sixes: 1 }
          ],
          bowlers: [
            { name: 'P. Cummins', overs: 4, runs: 32, wickets: 3, economy: 8.0 },
            { name: 'S. Narine', overs: 4, runs: 28, wickets: 2, economy: 7.0 }
          ]
        }
      }
    ];
    setMatches(mockMatches);
    setSelectedMatch(mockMatches[0]);
  }, []);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedMatch && selectedMatch.status === 'live') {
        setSelectedMatch(prev => {
          if (!prev) return null;
          const newRuns = Math.floor(Math.random() * 7);
          const newBalls = prev.currentBatting === 'B' ? prev.scoreB.balls + 1 : prev.scoreA.balls + 1;
          
          if (prev.currentBatting === 'B') {
            return {
              ...prev,
              scoreB: {
                ...prev.scoreB,
                runs: prev.scoreB.runs + newRuns,
                balls: newBalls > 5 ? 0 : newBalls,
                overs: newBalls > 5 ? prev.scoreB.overs + 1 : prev.scoreB.overs
              },
              currentOver: [...prev.currentOver, newRuns.toString()].slice(-6)
            };
          }
          return prev;
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedMatch]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <Badge className="bg-red-500 animate-pulse">● LIVE</Badge>;
      case 'upcoming':
        return <Badge variant="outline">Upcoming</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return null;
    }
  };

  const formatScore = (score: LiveMatch['scoreA']) => {
    if (score.runs === 0 && score.wickets === 0) return 'Yet to bat';
    return `${score.runs}/${score.wickets} (${score.overs}.${score.balls})`;
  };

  const liveMatches = matches.filter(m => m.status === 'live');
  const upcomingMatches = matches.filter(m => m.status === 'upcoming');
  const completedMatches = matches.filter(m => m.status === 'completed');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Scores</h1>
        <p className="text-gray-600">Real-time updates from PPLT20 matches</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Match List */}
        <div className="lg:col-span-1">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="live">Live ({liveMatches.length})</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="completed">Recent</TabsTrigger>
            </TabsList>

            <TabsContent value="live" className="space-y-4">
              {liveMatches.map((match) => (
                <Card 
                  key={match.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${selectedMatch?.id === match.id ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => setSelectedMatch(match)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      {getStatusBadge(match.status)}
                      <span className="text-sm text-gray-500">{match.format}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{match.teamA}</span>
                        <span className="font-mono">{formatScore(match.scoreA)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{match.teamB}</span>
                        <span className="font-mono">{formatScore(match.scoreB)}</span>
                      </div>
                    </div>
                    {match.target && (
                      <div className="mt-2 text-sm text-gray-600">
                        Target: {match.target} | Need: {match.target - (match.currentBatting === 'B' ? match.scoreB.runs : match.scoreA.runs)} runs
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingMatches.map((match) => (
                <Card key={match.id} className="cursor-pointer hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      {getStatusBadge(match.status)}
                      <span className="text-sm text-gray-500">{match.time}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium">{match.teamA}</div>
                      <div className="text-sm text-gray-500">vs</div>
                      <div className="font-medium">{match.teamB}</div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {match.venue}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedMatches.map((match) => (
                <Card key={match.id} className="cursor-pointer hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      {getStatusBadge(match.status)}
                      <span className="text-sm text-gray-500">{match.date}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{match.teamA}</span>
                        <span className="font-mono">{formatScore(match.scoreA)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{match.teamB}</span>
                        <span className="font-mono">{formatScore(match.scoreB)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Match Details */}
        <div className="lg:col-span-2">
          {selectedMatch ? (
            <div className="space-y-6">
              {/* Match Header */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      {getStatusBadge(selectedMatch.status)}
                      <span>{selectedMatch.format} Match</span>
                    </CardTitle>
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="h-4 w-4 mr-1" />
                      {selectedMatch.venue}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <h3 className="font-semibold text-lg mb-2">{selectedMatch.teamA}</h3>
                      <div className="text-3xl font-bold text-blue-600">
                        {formatScore(selectedMatch.scoreA)}
                      </div>
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold text-lg mb-2">{selectedMatch.teamB}</h3>
                      <div className="text-3xl font-bold text-blue-600">
                        {formatScore(selectedMatch.scoreB)}
                      </div>
                    </div>
                  </div>
                  
                  {selectedMatch.target && selectedMatch.status === 'live' && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Target: {selectedMatch.target}</span>
                        <span>Required Rate: {((selectedMatch.target - (selectedMatch.currentBatting === 'B' ? selectedMatch.scoreB.runs : selectedMatch.scoreA.runs)) / ((20 - (selectedMatch.currentBatting === 'B' ? selectedMatch.scoreB.overs : selectedMatch.scoreA.overs)))).toFixed(2)}</span>
                      </div>
                      <Progress 
                        value={((selectedMatch.currentBatting === 'B' ? selectedMatch.scoreB.runs : selectedMatch.scoreA.runs) / selectedMatch.target) * 100} 
                        className="h-2"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Live Updates */}
              {selectedMatch.status === 'live' && (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Current Over */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Activity className="h-5 w-5 mr-2" />
                        Current Over
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2 mb-4">
                        {selectedMatch.currentOver.map((ball, index) => (
                          <div 
                            key={index}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              ball === '4' || ball === '6' ? 'bg-green-500 text-white' : 
                              ball === 'W' ? 'bg-red-500 text-white' : 
                              'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {ball}
                          </div>
                        ))}
                      </div>
                      <div className="text-sm text-gray-600">
                        Over {selectedMatch.currentBatting === 'B' ? selectedMatch.scoreB.overs : selectedMatch.scoreA.overs}.{selectedMatch.currentBatting === 'B' ? selectedMatch.scoreB.balls : selectedMatch.scoreA.balls}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Overs */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recent Overs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedMatch.recentOvers.map((over, overIndex) => (
                          <div key={overIndex} className="flex items-center gap-2">
                            <span className="text-sm font-medium w-12">Over {20 - selectedMatch.recentOvers.length + overIndex}:</span>
                            <div className="flex gap-1">
                              {over.map((ball, ballIndex) => (
                                <span 
                                  key={ballIndex}
                                  className={`w-6 h-6 rounded text-xs flex items-center justify-center ${
                                    ball === '4' || ball === '6' ? 'bg-green-100 text-green-700' : 
                                    ball === 'W' ? 'bg-red-100 text-red-700' : 
                                    'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  {ball}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Key Players */}
              {selectedMatch.keyPlayers.batsmen.length > 0 && (
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Key Batsmen</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedMatch.keyPlayers.batsmen.map((batsman, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <div>
                              <div className="font-medium">{batsman.name}</div>
                              <div className="text-sm text-gray-500">
                                {batsman.runs} ({batsman.balls}) - {batsman.fours}x4s, {batsman.sixes}x6s
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg">{batsman.runs}</div>
                              <div className="text-sm text-gray-500">SR: {((batsman.runs / batsman.balls) * 100).toFixed(1)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Key Bowlers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedMatch.keyPlayers.bowlers.map((bowler, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <div>
                              <div className="font-medium">{bowler.name}</div>
                              <div className="text-sm text-gray-500">
                                {bowler.overs} overs, {bowler.runs} runs
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg">{bowler.wickets}W</div>
                              <div className="text-sm text-gray-500">Eco: {bowler.economy}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Commentary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Live Commentary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {selectedMatch.commentary.map((comment, index) => (
                      <div 
                        key={index} 
                        className={`p-3 rounded-lg border-l-4 ${
                          comment.type === 'wicket' ? 'border-red-500 bg-red-50' :
                          comment.type === 'boundary' ? 'border-green-500 bg-green-50' :
                          'border-gray-300 bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <span className="font-medium text-sm">{comment.time}</span>
                            <p className="mt-1">{comment.text}</p>
                          </div>
                          {comment.type === 'wicket' && <span className="text-red-500 font-bold">W</span>}
                          {comment.type === 'boundary' && <span className="text-green-500 font-bold">●</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Match</h3>
                <p className="text-gray-500">Choose a match from the list to view live scores and details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveScores;
