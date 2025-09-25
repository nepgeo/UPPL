import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/Layout/Navbar";
import Footer from "./components/Layout/Footer";

import Home from "./pages/Home";
import Teams from "./pages/Teams";
import TeamSquad from "./pages/TeamSquad";
import Schedule from "./pages/Schedule";
import MatchDetails from "./pages/MatchDetails";
import PointsTable from "./pages/PointsTable";
import News from "./pages/News";
import NewsArticle from "./pages/NewsArticle";
import Gallery from "./pages/gallery/Gallery";
import GalleryFullscreen from "@/pages/gallery/GalleryFullscreen";
import TournamentStats from "./pages/TournamentStats";
import LiveScores from "./pages/LiveScores";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import TournamentRegistration from "./pages/TournamentRegistration";
import NotFound from "./pages/NotFound";

import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersManagement from "./pages/admin/UsersManagement";
import MatchManagement from "./pages/admin/MatchManagement";
import GalleryManagement from "./pages/admin/GalleryManagement";
import AdminSettings from "./pages/admin/AdminSettings";
import NewsManagement from "./pages/admin/NewsManagement";
import Sponsors from "./pages/Sponsors";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import PlayersPage from "./pages/PlayersPage";


import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <ScrollToTop />
          <LayoutWrapper>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/teams/:teamId" element={<TeamSquad />} />
              <Route path="/players" element={<PlayersPage />} />
              <Route path="/match/:matchId" element={<MatchDetails />} />
              <Route path="/points-table" element={<PointsTable />} />
              <Route path="/news" element={<News />} />
              <Route path="/news/:articleId" element={<NewsArticle />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/gallery/view/:imageId" element={<GalleryFullscreen />} />
              <Route path="/tournament-stats" element={<TournamentStats />} />
              <Route path="/live-scores" element={<LiveScores />} />
              <Route path="/tournament-registration" element={<TournamentRegistration />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UsersManagement />} />
              <Route path="/admin/matches" element={<MatchManagement />} />
              <Route path="/admin/gallery" element={<GalleryManagement />} />
              <Route path="/admin/news" element={<NewsManagement />} />
              <Route path="/admin/settings" element={<AdminSettings />} />

              {/* Sponsors page (public) */}
              <Route path="/sponsors" element={<Sponsors />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-failed" element={<PaymentFailed />} />


              {/* Coming Soon / Fallback */}
              <Route
                path="/player-profile"
                element={
                  <div className="p-8 text-center">
                    <h1 className="text-2xl">Player Profile - Coming Soon</h1>
                  </div>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </LayoutWrapper>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
