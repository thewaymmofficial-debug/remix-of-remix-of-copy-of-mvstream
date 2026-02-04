import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { FilterProvider } from "@/contexts/FilterContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import MovieDetails from "./pages/MovieDetails";
import Profile from "./pages/Profile";
import Watchlist from "./pages/Watchlist";
import History from "./pages/History";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import MoviesAdmin from "./pages/admin/MoviesAdmin";
import SeriesAdmin from "./pages/admin/SeriesAdmin";
import CategoriesAdmin from "./pages/admin/CategoriesAdmin";
import UsersAdmin from "./pages/admin/UsersAdmin";
import SettingsAdmin from "./pages/admin/SettingsAdmin";
import Analytics from "./pages/admin/Analytics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <FilterProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/movie/:id" element={<MovieDetails />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/watchlist" element={<Watchlist />} />
                <Route path="/history" element={<History />} />
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="movies" element={<MoviesAdmin />} />
                  <Route path="series/:movieId" element={<SeriesAdmin />} />
                  <Route path="categories" element={<CategoriesAdmin />} />
                  <Route path="users" element={<UsersAdmin />} />
                  <Route path="settings" element={<SettingsAdmin />} />
                  <Route path="analytics" element={<Analytics />} />
                </Route>
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </FilterProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
