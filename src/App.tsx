import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { SiteContentProvider } from "@/contexts/SiteContentContext";
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
import News from "./pages/News.tsx";
import AdminRoute from "./components/admin/AdminRoute.tsx";
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import AdminUsers from "./pages/admin/AdminUsers.tsx";
import AdminPayments from "./pages/admin/AdminPayments.tsx";
import AdminContent from "./pages/admin/AdminContent.tsx";
import AdminLegal from "./pages/admin/AdminLegal.tsx";
import AdminCategories from "./pages/admin/AdminCategories.tsx";
import AdminBusinesses from "./pages/admin/AdminBusinesses.tsx";
import AdminReviews from "./pages/admin/AdminReviews.tsx";
import AdminPlans from "./pages/admin/AdminPlans.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import LegalNotice from "./pages/LegalNotice.tsx";
import TermsOfUse from "./pages/TermsOfUse.tsx";

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
          <SiteContentProvider>
          <FavoritesProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/directorio" element={<Directory />} />
              <Route path="/noticias" element={<News />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/mi-cuenta" element={<UserDashboard />} />
              <Route path="/favoritos" element={<Favorites />} />
              <Route path="/valorar/:businessId" element={<RateBusiness />} />
              <Route path="/registrar-negocio" element={<RegisterBusiness />} />
              <Route path="/mi-cuenta/negocios/:businessId" element={<EditBusinessProfile />} />
              <Route path="/politica-proteccion-datos" element={<PrivacyPolicy />} />
              <Route path="/aviso-legal" element={<LegalNotice />} />
              <Route path="/condiciones-de-uso" element={<TermsOfUse />} />
              <Route path="/admin" element={<AdminRoute />}>
                <Route index element={<AdminDashboard />} />
                <Route path="usuarios" element={<AdminUsers />} />
                <Route path="pagos" element={<AdminPayments />} />
                <Route path="planes" element={<AdminPlans />} />
                <Route path="resenas" element={<AdminReviews />} />
                <Route path="textos" element={<AdminContent />} />
                <Route path="legal" element={<AdminLegal />} />
                <Route path="categorias" element={<AdminCategories />} />
                <Route path="negocios" element={<AdminBusinesses />} />
              </Route>
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </FavoritesProvider>
          </SiteContentProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
