import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import HeroMap from '@/components/HeroMap';
import CategoryBar from '@/components/CategoryBar';
import BusinessDirectory from '@/components/BusinessDirectory';
import ReviewsPanel from '@/components/ReviewsPanel';
import Footer from '@/components/Footer';
import { getBusinesses } from '@/services/api';
import type { Business } from '@/data/mockData';

const categoryMap: Record<string, string[]> = {
  'Gastronomía': ['Restaurante'],
  'Wellness': ['SPA & Wellness'],
  'Noche': ['Bar', 'Discoteca'],
  'Shopping': ['Tienda', 'Shopping'],
  'Montaña': ['Hotel', 'Actividades'],
  'Cultura': ['Museo', 'Cultura'],
};

export default function Index() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  useEffect(() => {
    getBusinesses().then(setBusinesses);
  }, []);

  const filtered = selectedCategory
    ? businesses.filter(b => {
        const cats = categoryMap[selectedCategory] || [];
        return cats.some(c => b.category.toLowerCase().includes(c.toLowerCase()));
      })
    : businesses;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroMap businesses={businesses} onBusinessClick={setSelectedBusiness} />
      <CategoryBar selected={selectedCategory} onSelect={setSelectedCategory} />
      <BusinessDirectory businesses={filtered} onBusinessClick={setSelectedBusiness} />
      <Footer />

      {selectedBusiness && (
        <ReviewsPanel
          business={selectedBusiness}
          onClose={() => setSelectedBusiness(null)}
        />
      )}
    </div>
  );
}
