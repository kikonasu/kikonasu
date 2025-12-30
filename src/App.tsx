import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SignUp from "./pages/SignUp";
import TodaysLook from "./pages/TodaysLook";
import Favorites from "./pages/Favorites";
import History from "./pages/History";
import Suitcases from "./pages/Suitcases";
import SuitcaseDetail from "./pages/SuitcaseDetail";
import WishList from "./pages/WishList";
import Admin from "./pages/Admin";
import Waitlist from "./pages/Waitlist";
import NotFound from "./pages/NotFound";
import CapsuleWardrobe from "./pages/CapsuleWardrobe";
import StyleProfile from "./pages/StyleProfile";

const queryClient = new QueryClient();

// Root redirect component - always redirects to /home
const RootRedirect = () => {
  return <Navigate to="/home" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/home" element={<Home />} />
            <Route path="/wardrobe" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/todays-look" element={<TodaysLook />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/history" element={<History />} />
            <Route path="/suitcases" element={<Suitcases />} />
            <Route path="/suitcases/:id" element={<SuitcaseDetail />} />
            <Route path="/wishlist" element={<WishList />} />
            <Route path="/capsule" element={<CapsuleWardrobe />} />
            <Route path="/style" element={<StyleProfile />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/waitlist" element={<Waitlist />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
