

import React from "react";
import { motion } from "framer-motion";

const TournamentStats = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-purple-500 via-pink-500 to-red-500">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.8,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse",
        }}
        className="text-center text-white"
      >
        <h1 className="text-6xl font-extrabold mb-6 animate-pulse">
          Coming Soon
        </h1>
        <p className="text-xl opacity-90">
          Tournament statistics will be available here shortly.
        </p>
      </motion.div>
    </div>
  );
};

export default TournamentStats;


// import React from 'react';
// import { Link } from 'react-router-dom';
// import { ArrowLeft, Trophy, Users, Target, TrendingUp, Award, Crown, Zap } from 'lucide-react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';

// const TournamentStats = () => {
//   // Mock tournament statistics
//   const overallStats = [
//     { label: "Total Matches", value: "42", icon: Trophy, color: "text-blue-600" },
//     { label: "Total Players", value: "200+", icon: Users, color: "text-green-600" },
//     { label: "Total Runs", value: "12,450", icon: Target, color: "text-purple-600" },
//     { label: "Total Wickets", value: "450", icon: TrendingUp, color: "text-orange-600" },
//     { label: "Sixes Hit", value: "890", icon: Zap, color: "text-red-600" },
//     { label: "Centuries", value: "45", icon: Crown, color: "text-yellow-600" }
//   ];

//   const topBatsmen = [
//     { rank: 1, name: "Alex Johnson", team: "Chennai Champions", runs: 789, avg: 52.6, sr: 145.2, hundreds: 3, fifties: 4 },
//     { rank: 2, name: "Rohit Sharma", team: "Mumbai Mavericks", runs: 756, avg: 48.5, sr: 142.8, hundreds: 2, fifties: 6 },
//     { rank: 3, name: "Virat Kohli", team: "Bangalore Blasters", runs: 723, avg: 55.6, sr: 138.9, hundreds: 2, fifties: 5 },
//     { rank: 4, name: "David Warner", team: "Delhi Dragons", runs: 698, avg: 46.5, sr: 155.3, hundreds: 3, fifties: 2 },
//     { rank: 5, name: "Jos Buttler", team: "Rajasthan Warriors", runs: 654, avg: 43.6, sr: 162.4, hundreds: 2, fifties: 4 }
//   ];

//   const topBowlers = [
//     { rank: 1, name: "Jasprit Bumrah", team: "Mumbai Mavericks", wickets: 32, avg: 18.5, economy: 6.8, bestFigures: "4/12" },
//     { rank: 2, name: "Rashid Khan", team: "Hyderabad Heroes", wickets: 28, avg: 19.8, economy: 6.2, bestFigures: "5/18" },
//     { rank: 3, name: "Kagiso Rabada", team: "Delhi Dragons", wickets: 26, avg: 21.3, economy: 7.1, bestFigures: "4/25" },
//     { rank: 4, name: "Yuzvendra Chahal", team: "Rajasthan Warriors", wickets: 24, avg: 23.4, economy: 6.9, bestFigures: "4/15" },
//     { rank: 5, name: "Trent Boult", team: "Mumbai Mavericks", wickets: 23, avg: 22.1, economy: 7.3, bestFigures: "3/18" }
//   ];

//   const teamStats = [
//     { team: "Mumbai Mavericks", matches: 14, won: 10, lost: 4, nrr: "+1.23", points: 20, color: "#1E40AF" },
//     { team: "Chennai Champions", matches: 14, won: 9, lost: 5, nrr: "+0.87", points: 18, color: "#FBBF24" },
//     { team: "Delhi Dragons", matches: 14, won: 8, lost: 6, nrr: "+0.45", points: 16, color: "#3730A3" },
//     { team: "Rajasthan Warriors", matches: 14, won: 8, lost: 6, nrr: "+0.12", points: 16, color: "#EC4899" },
//     { team: "Bangalore Blasters", matches: 14, won: 7, lost: 7, nrr: "-0.23", points: 14, color: "#DC2626" },
//     { team: "Kolkata Knights", matches: 14, won: 6, lost: 8, nrr: "-0.45", points: 12, color: "#7C3AED" },
//     { team: "Punjab Panthers", matches: 14, won: 5, lost: 9, nrr: "-0.78", points: 10, color: "#DC2626" },
//     { team: "Hyderabad Heroes", matches: 14, won: 3, lost: 11, nrr: "-1.21", points: 6, color: "#FF6B35" }
//   ];

//   const records = [
//     { category: "Highest Individual Score", record: "127* by Alex Johnson vs Delhi Dragons", date: "Jan 12, 2024" },
//     { category: "Best Bowling Figures", record: "5/18 by Rashid Khan vs Punjab Panthers", date: "Jan 8, 2024" },
//     { category: "Highest Team Total", record: "245/3 by Chennai Champions vs Kolkata Knights", date: "Jan 15, 2024" },
//     { category: "Lowest Team Total", record: "89 all out by Punjab Panthers vs Mumbai Mavericks", date: "Jan 5, 2024" },
//     { category: "Most Sixes in an Innings", record: "18 sixes by Mumbai Mavericks vs Hyderabad Heroes", date: "Jan 10, 2024" },
//     { category: "Fastest Century", record: "45 balls by David Warner vs Bangalore Blasters", date: "Jan 7, 2024" }
//   ];

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
//         <div className="container mx-auto px-4">
//           <Link to="/" className="inline-flex items-center text-white/80 hover:text-white mb-4">
//             <ArrowLeft className="h-4 w-4 mr-2" />
//             Back to Home
//           </Link>
//           <div className="text-center">
//             <h1 className="text-4xl font-bold mb-4">Tournament Statistics</h1>
//             <p className="text-xl opacity-90">
//               Complete statistical breakdown of PPLT20 2024 season
//             </p>
//           </div>
//         </div>
//       </div>

//       <div className="container mx-auto px-4 py-8">
//         {/* Overall Stats */}
//         <div className="mb-12">
//           <h2 className="text-2xl font-bold text-gray-900 mb-6">Overall Tournament Stats</h2>
//           <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
//             {overallStats.map((stat, index) => (
//               <Card key={index}>
//                 <CardContent className="pt-6 text-center">
//                   <stat.icon className={`h-8 w-8 mx-auto mb-3 ${stat.color}`} />
//                   <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
//                   <p className="text-sm text-gray-600">{stat.label}</p>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>
//         </div>

//         {/* Top Batsmen */}
//         <div className="mb-12">
//           <h2 className="text-2xl font-bold text-gray-900 mb-6">Leading Run Scorers</h2>
//           <Card>
//             <CardContent className="p-0">
//               <div className="overflow-x-auto">
//                 <table className="w-full">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Runs</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Strike Rate</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">100s</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">50s</th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white divide-y divide-gray-200">
//                     {topBatsmen.map((player) => (
//                       <tr key={player.rank} className="hover:bg-gray-50">
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           {player.rank === 1 && <Trophy className="h-5 w-5 text-yellow-500 inline mr-2" />}
//                           <span className="font-medium">{player.rank}</span>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{player.name}</td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{player.team}</td>
//                         <td className="px-6 py-4 whitespace-nowrap font-bold text-blue-600">{player.runs}</td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{player.avg}</td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{player.sr}</td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{player.hundreds}</td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{player.fifties}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Top Bowlers */}
//         <div className="mb-12">
//           <h2 className="text-2xl font-bold text-gray-900 mb-6">Leading Wicket Takers</h2>
//           <Card>
//             <CardContent className="p-0">
//               <div className="overflow-x-auto">
//                 <table className="w-full">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wickets</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Economy</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Best</th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white divide-y divide-gray-200">
//                     {topBowlers.map((player) => (
//                       <tr key={player.rank} className="hover:bg-gray-50">
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           {player.rank === 1 && <Trophy className="h-5 w-5 text-yellow-500 inline mr-2" />}
//                           <span className="font-medium">{player.rank}</span>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{player.name}</td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{player.team}</td>
//                         <td className="px-6 py-4 whitespace-nowrap font-bold text-red-600">{player.wickets}</td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{player.avg}</td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{player.economy}</td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{player.bestFigures}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Team Standings */}
//         <div className="mb-12">
//           <h2 className="text-2xl font-bold text-gray-900 mb-6">Points Table</h2>
//           <Card>
//             <CardContent className="p-0">
//               <div className="overflow-x-auto">
//                 <table className="w-full">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matches</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Won</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lost</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NRR</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white divide-y divide-gray-200">
//                     {teamStats.map((team, index) => (
//                       <tr key={index} className={`hover:bg-gray-50 ${index < 4 ? 'bg-green-50' : ''}`}>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <span className="font-medium">{index + 1}</span>
//                           {index < 4 && <Badge className="ml-2 bg-green-100 text-green-800 text-xs">Qualified</Badge>}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <div className="flex items-center">
//                             <div 
//                               className="w-4 h-4 rounded-full mr-3"
//                               style={{ backgroundColor: team.color }}
//                             ></div>
//                             <span className="font-medium text-gray-900">{team.team}</span>
//                           </div>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.matches}</td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{team.won}</td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{team.lost}</td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.nrr}</td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">{team.points}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Records */}
//         <div>
//           <h2 className="text-2xl font-bold text-gray-900 mb-6">Tournament Records</h2>
//           <div className="grid md:grid-cols-2 gap-6">
//             {records.map((record, index) => (
//               <Card key={index}>
//                 <CardHeader>
//                   <CardTitle className="text-lg flex items-center">
//                     <Award className="h-5 w-5 mr-2 text-yellow-500" />
//                     {record.category}
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <p className="font-semibold text-gray-900 mb-1">{record.record}</p>
//                   <p className="text-sm text-gray-500">{record.date}</p>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TournamentStats;
