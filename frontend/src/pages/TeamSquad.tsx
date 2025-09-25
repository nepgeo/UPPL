
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Trophy, Users, Star, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const TeamSquad = () => {
  const { teamId } = useParams();

  // Mock team data with full squad
  const teamData = {
    'mumbai-mavericks': {
      name: 'Mumbai Mavericks',
      shortName: 'MM',
      logo: '/placeholder.svg',
      city: 'Mumbai',
      color: '#1E40AF',
      captain: 'Rohit Sharma',
      coach: 'Mahela Jayawardene',
      homeGround: 'Wankhede Stadium',
      founded: 2008,
      titles: 5,
      players: [
        { id: 1, name: 'Rohit Sharma', role: 'Captain', type: 'Batsman', age: 36, matches: 243, runs: 5611, wickets: 15, battingAvg: 31.17, bowlingAvg: 0, jerseyNumber: 45 },
        { id: 2, name: 'Jasprit Bumrah', role: 'Vice Captain', type: 'Bowler', age: 30, matches: 133, runs: 289, wickets: 165, battingAvg: 8.26, bowlingAvg: 24.43, jerseyNumber: 93 },
        { id: 3, name: 'Suryakumar Yadav', role: 'Player', type: 'Batsman', age: 33, matches: 142, runs: 3389, wickets: 0, battingAvg: 28.86, bowlingAvg: 0, jerseyNumber: 63 },
        { id: 4, name: 'Hardik Pandya', role: 'Player', type: 'All-rounder', age: 30, matches: 113, runs: 2556, wickets: 45, battingAvg: 27.33, bowlingAvg: 34.11, jerseyNumber: 33 },
        { id: 5, name: 'Ishan Kishan', role: 'Player', type: 'Wicket-keeper', age: 25, matches: 89, runs: 2644, wickets: 0, battingAvg: 30.27, bowlingAvg: 0, jerseyNumber: 23 },
        { id: 6, name: 'Kieron Pollard', role: 'Player', type: 'All-rounder', age: 36, matches: 189, runs: 3915, wickets: 69, battingAvg: 28.67, bowlingAvg: 33.26, jerseyNumber: 55 },
        { id: 7, name: 'Trent Boult', role: 'Player', type: 'Bowler', age: 34, matches: 64, runs: 83, wickets: 76, battingAvg: 6.38, bowlingAvg: 25.92, jerseyNumber: 18 },
        { id: 8, name: 'Krunal Pandya', role: 'Player', type: 'All-rounder', age: 32, matches: 106, runs: 1143, wickets: 51, battingAvg: 22.42, bowlingAvg: 34.90, jerseyNumber: 24 }
      ]
    }
  };

  const team = teamData[teamId as keyof typeof teamData];

  if (!team) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Team Not Found</h1>
          <Link to="/teams">
            <Button>Back to Teams</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Captain': return 'bg-yellow-100 text-yellow-800';
      case 'Vice Captain': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Batsman': return 'bg-green-100 text-green-800';
      case 'Bowler': return 'bg-red-100 text-red-800';
      case 'All-rounder': return 'bg-purple-100 text-purple-800';
      case 'Wicket-keeper': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="text-white py-16" style={{ backgroundColor: team.color }}>
        <div className="container mx-auto px-4">
          <Link to="/teams" className="inline-flex items-center text-white/80 hover:text-white mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Teams
          </Link>
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
              <img 
                src={team.logo} 
                alt={team.name}
                className="w-16 h-16 object-contain"
              />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">{team.name}</h1>
              <p className="text-xl opacity-90">{team.shortName}</p>
              <div className="flex items-center space-x-6 mt-4 text-sm">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{team.city}</span>
                </div>
                <div className="flex items-center">
                  <Trophy className="h-4 w-4 mr-1" />
                  <span>{team.titles} Titles</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Est. {team.founded}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Info */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-semibold">Captain</h3>
                <p className="text-gray-600">{team.captain}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Star className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-semibold">Coach</h3>
                <p className="text-gray-600">{team.coach}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <h3 className="font-semibold">Home Ground</h3>
                <p className="text-gray-600">{team.homeGround}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Squad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-6 w-6 mr-2" />
              Full Squad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {team.players.map((player) => (
                <Card key={player.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: team.color }}
                        >
                          {player.jerseyNumber}
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{player.name}</h3>
                          <p className="text-xs text-gray-500">Age: {player.age}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex space-x-1">
                        <Badge className={`text-xs px-2 py-1 ${getRoleColor(player.role)}`}>
                          {player.role}
                        </Badge>
                        <Badge className={`text-xs px-2 py-1 ${getTypeColor(player.type)}`}>
                          {player.type}
                        </Badge>
                      </div>
                      
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span>Matches:</span>
                          <span className="font-medium">{player.matches}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Runs:</span>
                          <span className="font-medium">{player.runs}</span>
                        </div>
                        {player.wickets > 0 && (
                          <div className="flex justify-between">
                            <span>Wickets:</span>
                            <span className="font-medium">{player.wickets}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Bat Avg:</span>
                          <span className="font-medium">{player.battingAvg}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeamSquad;
