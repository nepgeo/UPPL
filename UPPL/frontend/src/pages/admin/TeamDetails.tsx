import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const dummyTeams = [
  {
    _id: '1',
    teamName: 'Kathmandu Warriors',
    captainName: 'Rajesh Thapa',
    contactNumber: '9801234567',
    teamLogo: '/images/teams/kathmandu.png',
    players: Array.from({ length: 15 }, (_, i) => ({
      _id: `p${i + 1}`,
      name: `Player ${i + 1}`,
      age: 20 + i,
      role: i % 2 === 0 ? 'Batsman' : 'Bowler',
      status: i % 3 === 0 ? 'verified' : i % 3 === 1 ? 'pending' : 'not_registered',
    })),
  },
];

const TeamDetails = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    const found = dummyTeams.find((t) => t._id === teamId);
    setTeam(found);
  }, [teamId]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'not_registered':
        return 'bg-gray-100 text-gray-600';
      default:
        return '';
    }
  };

  if (!team) {
    return <div className="p-6 text-center text-muted-foreground">Team not found.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <Button variant="outline" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{team.teamName}</CardTitle>
          <p className="text-sm text-muted-foreground">Captain: {team.captainName}</p>
        </CardHeader>
        <CardContent>
          <img
            src={team.teamLogo}
            alt={team.teamName}
            className="w-full max-w-xs object-cover rounded-md border mb-4"
          />
          <p className="text-sm">Contact: {team.contactNumber}</p>

          <h3 className="font-semibold mt-6 mb-2">Players</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {team.players.map((player) => (
              <li
                key={player._id}
                className="flex justify-between items-center border p-2 rounded-md cursor-pointer hover:bg-gray-50"
                onClick={() => setSelectedPlayer(player)}
              >
                <span>{player.name}</span>
                <span className={cn('text-xs font-medium px-2 py-1 rounded-full', getStatusColor(player.status))}>
                  {player.status.replace('_', ' ')}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Floating Player Card */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm relative">
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2"
              onClick={() => setSelectedPlayer(null)}
            >
              <X className="w-5 h-5" />
            </Button>
            <h2 className="text-xl font-bold mb-2">{selectedPlayer.name}</h2>
            <p className="text-sm">Role: {selectedPlayer.role}</p>
            <p className="text-sm">Age: {selectedPlayer.age}</p>
            <p className="text-sm">
              Status:{' '}
              <Badge className={getStatusColor(selectedPlayer.status)}>
                {selectedPlayer.status.replace('_', ' ')}
              </Badge>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDetails;
