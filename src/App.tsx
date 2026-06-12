import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import Directory from "./pages/Directory.tsx";
import UserDashboard from "./pages/UserDashboard.tsx";
import Favorites from "./pages/Favorites.tsx";
import RateBusiness from "./pages/RateBusiness.tsx";
import RegisterBusiness from "./pages/RegisterBusiness.tsx";
import EditBusinessProfile from "./pages/EditBusinessProfile.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToTop />
        <AuthProvider>
          <FavoritesProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/directorio" element={<Directory />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/mi-cuenta" element={<UserDashboard />} />
              <Route path="/favoritos" element={<Favorites />} />
              <Route path="/valorar/:businessId" element={<RateBusiness />} />
              <Route path="/registrar-negocio" element={<RegisterBusiness />} />
              <Route path="/mi-cuenta/negocios/:businessId" element={<EditBusinessProfile />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </FavoritesProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
