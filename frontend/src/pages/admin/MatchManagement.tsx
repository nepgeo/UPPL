
import React, { useState } from 'react';
import { Calendar, Plus, Edit, Trash2, Play, Pause, Trophy, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

const MatchManagement = () => {
  const [matches, setMatches] = useState([
    {
      id: 1,
      homeTeam: 'Mumbai Mavericks',
      awayTeam: 'Chennai Challengers',
      date: '2024-01-25',
      time: '19:30',
      venue: 'Patan Stadium',
      status: 'upcoming',
      result: null
    },
    {
      id: 2,
      homeTeam: 'Delhi Daredevils',
      awayTeam: 'Kolkata Knights',
      date: '2024-01-22',
      time: '15:30',
      venue: 'Sports Complex',
      status: 'completed',
      result: 'Delhi Daredevils won by 6 wickets'
    },
    {
      id: 3,
      homeTeam: 'Bangalore Bulls',
      awayTeam: 'Hyderabad Heroes',
      date: '2024-01-28',
      time: '19:30',
      venue: 'Cricket Ground',
      status: 'live',
      result: null
    }
  ]);

  const [editingMatch, setEditingMatch] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const teams = ['Mumbai Mavericks', 'Chennai Challengers', 'Delhi Daredevils', 'Kolkata Knights', 'Bangalore Bulls', 'Hyderabad Heroes'];

  const handleDeleteMatch = (matchId) => {
    setMatches(matches.filter(match => match.id !== matchId));
    toast({
      title: "Match Deleted",
      description: "Match has been successfully removed.",
    });
  };

  const handleEditMatch = (match) => {
    setEditingMatch(match);
    setIsDialogOpen(true);
  };

  const handleSaveMatch = () => {
    if (editingMatch.id) {
      setMatches(matches.map(match => match.id === editingMatch.id ? editingMatch : match));
      toast({
        title: "Match Updated",
        description: "Match details have been successfully updated.",
      });
    } else {
      const newMatch = { ...editingMatch, id: Date.now() };
      setMatches([...matches, newMatch]);
      toast({
        title: "Match Created",
        description: "New match has been successfully scheduled.",
      });
    }
    setIsDialogOpen(false);
    setEditingMatch(null);
  };

  const handleStatusChange = (matchId, newStatus) => {
    setMatches(matches.map(match => 
      match.id === matchId ? { ...match, status: newStatus } : match
    ));
    toast({
      title: "Match Status Updated",
      description: `Match status changed to ${newStatus}.`,
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'live':
        return <Badge className="bg-red-500">Live</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-500">Upcoming</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Match Management</h1>
            <p className="text-gray-600">Create, edit, and manage all tournament matches</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingMatch({ 
                homeTeam: '', 
                awayTeam: '', 
                date: '', 
                time: '', 
                venue: '', 
                status: 'upcoming',
                result: null 
              })}>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Match
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingMatch?.id ? 'Edit Match' : 'Schedule New Match'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="homeTeam">Home Team</Label>
                    <Select value={editingMatch?.homeTeam} onValueChange={(value) => setEditingMatch({...editingMatch, homeTeam: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select home team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map(team => (
                          <SelectItem key={team} value={team}>{team}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="awayTeam">Away Team</Label>
                    <Select value={editingMatch?.awayTeam} onValueChange={(value) => setEditingMatch({...editingMatch, awayTeam: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select away team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map(team => (
                          <SelectItem key={team} value={team}>{team}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={editingMatch?.date || ''}
                      onChange={(e) => setEditingMatch({...editingMatch, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={editingMatch?.time || ''}
                      onChange={(e) => setEditingMatch({...editingMatch, time: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="venue">Venue</Label>
                  <Input
                    id="venue"
                    value={editingMatch?.venue || ''}
                    onChange={(e) => setEditingMatch({...editingMatch, venue: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={editingMatch?.status} onValueChange={(value) => setEditingMatch({...editingMatch, status: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editingMatch?.status === 'completed' && (
                  <div>
                    <Label htmlFor="result">Match Result</Label>
                    <Textarea
                      id="result"
                      placeholder="Enter match result..."
                      value={editingMatch?.result || ''}
                      onChange={(e) => setEditingMatch({...editingMatch, result: e.target.value})}
                    />
                  </div>
                )}
                <Button onClick={handleSaveMatch} className="w-full">
                  {editingMatch?.id ? 'Update Match' : 'Schedule Match'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {matches.map((match) => (
            <Card key={match.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="text-center">
                        <p className="font-semibold text-lg">{match.homeTeam}</p>
                        <p className="text-sm text-gray-500">Home</p>
                      </div>
                      <div className="text-center px-4">
                        <p className="text-2xl font-bold text-gray-400">VS</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-lg">{match.awayTeam}</p>
                        <p className="text-sm text-gray-500">Away</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{match.date}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{match.time}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>📍 {match.venue}</span>
                      </div>
                    </div>
                    {match.result && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-green-600">{match.result}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    {getStatusBadge(match.status)}
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditMatch(match)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {match.status === 'upcoming' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(match.id, 'live')}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      {match.status === 'live' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(match.id, 'completed')}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteMatch(match.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MatchManagement;
