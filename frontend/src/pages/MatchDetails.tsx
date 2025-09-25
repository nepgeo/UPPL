
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, Calendar, Users, Trophy, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const MatchDetails = () => {
  const { matchId } = useParams();

  // Mock match data
  const matchData = {
    '1': {
      id: 1,
      matchNumber: 1,
      teamA: { name: 'Mumbai Mavericks', short: 'MM', color: '#1E40AF' },
      teamB: { name: 'Chennai Champions', short: 'CC', color: '#FBBF24' },
      date: '2024-01-20',
      time: '19:30',
      venue: 'Wankhede Stadium, Mumbai',
      status: 'upcoming',
      type: 'League Match',
      weather: 'Clear, 28°C',
      pitch: 'Good batting surface, expected to assist spinners later',
      headToHead: {
        totalMatches: 32,
        teamAWins: 20,
        teamBWins: 12,
        lastFiveMeetings: [
          { winner: 'MM', margin: '5 wickets', venue: 'Wankhede' },
          { winner: 'CC', margin: '23 runs', venue: 'Chepauk' },
          { winner: 'MM', margin: '37 runs', venue: 'Wankhede' },
          { winner: 'CC', margin: '6 wickets', venue: 'Chepauk' },
          { winner: 'MM', margin: '15 runs', venue: 'Neutral' }
        ]
      },
      keyPlayers: {
        teamA: [
          { name: 'Rohit Sharma', role: 'Captain', recentForm: '45, 23, 67, 34, 89' },
          { name: 'Jasprit Bumrah', role: 'Bowler', recentForm: '2/23, 1/34, 3/18, 0/45, 2/28' }
        ],
        teamB: [
          { name: 'MS Dhoni', role: 'Captain', recentForm: '34, 67, 23, 45, 12' },
          { name: 'Ravindra Jadeja', role: 'All-rounder', recentForm: '23 & 1/23, 45 & 2/34, 12 & 0/56' }
        ]
      },
      predictions: {
        winProbability: { teamA: 55, teamB: 45 },
        tossAdvantage: 'Bat first',
        keyFactors: [
          'Mumbai\'s home advantage',
          'Chennai\'s experience in big matches',
          'Weather conditions favoring batting'
        ]
      }
    }
  };

  const match = matchData[matchId as keyof typeof matchData];

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Match Not Found</h1>
          <Link to="/schedule">
            <Button>Back to Schedule</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4">
          <Link to="/schedule" className="inline-flex items-center text-white/80 hover:text-white mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Schedule
          </Link>
          
          <div className="text-center">
            <Badge className="mb-4 bg-white/20 text-white">{match.type}</Badge>
            <h1 className="text-3xl font-bold mb-4">Match {match.matchNumber}</h1>
            
            {/* Teams vs */}
            <div className="flex items-center justify-center space-x-8 mb-6">
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-2"
                  style={{ backgroundColor: match.teamA.color }}
                >
                  {match.teamA.short}
                </div>
                <h2 className="text-xl font-semibold">{match.teamA.name}</h2>
              </div>
              
              <div className="text-4xl font-bold">VS</div>
              
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-2"
                  style={{ backgroundColor: match.teamB.color }}
                >
                  {match.teamB.short}
                </div>
                <h2 className="text-xl font-semibold">{match.teamB.name}</h2>
              </div>
            </div>
            
            {/* Match Info */}
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {match.date}
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                {match.time}
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                {match.venue}
              </div>
              <Badge variant="outline" className="border-white text-white">
                {match.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Match Conditions */}
            <Card>
              <CardHeader>
                <CardTitle>Match Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Weather</h4>
                    <p className="text-gray-600">{match.weather}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Pitch Report</h4>
                    <p className="text-gray-600">{match.pitch}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Head to Head */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2" />
                  Head to Head
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{match.headToHead.teamAWins}</div>
                    <p className="text-sm text-gray-600">{match.teamA.short} Wins</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{match.headToHead.totalMatches}</div>
                    <p className="text-sm text-gray-600">Total Matches</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{match.headToHead.teamBWins}</div>
                    <p className="text-sm text-gray-600">{match.teamB.short} Wins</p>
                  </div>
                </div>
                
                <h4 className="font-semibold mb-3">Last 5 Meetings</h4>
                <div className="space-y-2">
                  {match.headToHead.lastFiveMeetings.map((meeting, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">{meeting.winner}</span>
                      <span className="text-sm text-gray-600">{meeting.margin}</span>
                      <span className="text-xs text-gray-500">{meeting.venue}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Key Players */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Key Players to Watch
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-2"
                        style={{ backgroundColor: match.teamA.color }}
                      ></div>
                      {match.teamA.name}
                    </h4>
                    {match.keyPlayers.teamA.map((player, index) => (
                      <div key={index} className="mb-3 p-3 bg-gray-50 rounded">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">{player.name}</span>
                          <Badge variant="outline" className="text-xs">{player.role}</Badge>
                        </div>
                        <p className="text-xs text-gray-600">Recent: {player.recentForm}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-2"
                        style={{ backgroundColor: match.teamB.color }}
                      ></div>
                      {match.teamB.name}
                    </h4>
                    {match.keyPlayers.teamB.map((player, index) => (
                      <div key={index} className="mb-3 p-3 bg-gray-50 rounded">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">{player.name}</span>
                          <Badge variant="outline" className="text-xs">{player.role}</Badge>
                        </div>
                        <p className="text-xs text-gray-600">Recent: {player.recentForm}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Win Probability */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Win Probability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{match.teamA.short}</span>
                      <span className="text-sm font-medium">{match.predictions.winProbability.teamA}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full"
                        style={{ 
                          width: `${match.predictions.winProbability.teamA}%`,
                          backgroundColor: match.teamA.color 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{match.teamB.short}</span>
                      <span className="text-sm font-medium">{match.predictions.winProbability.teamB}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full"
                        style={{ 
                          width: `${match.predictions.winProbability.teamB}%`,
                          backgroundColor: match.teamB.color 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Match Factors */}
            <Card>
              <CardHeader>
                <CardTitle>Key Factors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="p-2 bg-blue-50 rounded">
                    <span className="text-sm font-medium">Toss: </span>
                    <span className="text-sm">{match.predictions.tossAdvantage}</span>
                  </div>
                  {match.predictions.keyFactors.map((factor, index) => (
                    <div key={index} className="p-2 bg-gray-50 rounded">
                      <span className="text-sm">{factor}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchDetails;
