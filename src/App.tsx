import React, { useState, useEffect } from 'react';
import { PackageItem, PackageCategory, InfinitePayConfig } from './types';
import { DEFAULT_PACKAGES } from './data/defaultPackages';
import { ToastProvider, useToast } from './components/Toast';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { PackageShowcase } from './components/PackageShowcase';
import { CheckoutModal } from './components/CheckoutModal';
import { SocialProofAndTrust } from './components/SocialProofAndTrust';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';
import { AdminPanel } from './components/AdminPanel';
import { Store, LayoutDashboard } from 'lucide-react';

const STORAGE_KEY = 'social_networks_packages_v3';
const INFINITEPAY_STORAGE_KEY = 'social_networks_infinitepay_v1';

const DEFAULT_INFINITEPAY_CONFIG: InfinitePayConfig = {
  merchantName: 'Social Networks',
  pixKey: '45.123.456/0001-90',
  pixKeyType: 'cnpj',
  apiKey: 'inf_live_89a72b14c3e809df',
  webhookSecret: 'whsec_98214fa76bc1209e',
  paymentLinkUrl: 'https://link.infinitepay.io/socialnetworks',
  checkoutMode: 'modal_qr',
  autoVerifyEnabled: true,
  autoVerifySeconds: 12,
  enabled: true,
};

function MainApp() {
  const { showToast } = useToast();

  // Initialize packages from LocalStorage or default fallback
  const [packages, setPackages] = useState<PackageItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return DEFAULT_PACKAGES;
  });

  // Save packages to LocalStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(packages));
    } catch {
      // Ignore storage errors
    }
  }, [packages]);

  // InfinitePay Gateway Config State
  const [infinitePayConfig, setInfinitePayConfig] = useState<InfinitePayConfig>(() => {
    try {
      const saved = localStorage.getItem(INFINITEPAY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...DEFAULT_INFINITEPAY_CONFIG, ...parsed };
        }
      }
    } catch {
      // Fallback
    }
    return DEFAULT_INFINITEPAY_CONFIG;
  });

  // Save InfinitePay config to LocalStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(INFINITEPAY_STORAGE_KEY, JSON.stringify(infinitePayConfig));
    } catch {
      // Ignore
    }
  }, [infinitePayConfig]);

  // View state: 'client' (Landing Page) or 'admin' (Painel ADM)
  const [currentView, setCurrentView] = useState<'client' | 'admin'>('client');

  // Client view category filter: 'all' | 'seguidores' | 'curtidas' | 'views'
  const [selectedCategory, setSelectedCategory] = useState<PackageCategory | 'all'>('all');

  // Checkout Modal State
  const [checkoutPackage, setCheckoutPackage] = useState<PackageItem | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Package handlers for Admin
  const handleSavePackage = (newOrUpdatedPkg: PackageItem) => {
    setPackages((prev) => {
      const exists = prev.some((p) => p.id === newOrUpdatedPkg.id);
      if (exists) {
        return prev.map((p) => (p.id === newOrUpdatedPkg.id ? newOrUpdatedPkg : p));
      }
      return [newOrUpdatedPkg, ...prev];
    });
  };

  const handleDeletePackage = (id: string) => {
    setPackages((prev) => prev.filter((p) => p.id !== id));
  };

  const handleToggleActive = (id: string) => {
    setPackages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p))
    );
  };

  const handleResetDefaults = () => {
    setPackages(DEFAULT_PACKAGES);
    showToast('Pacotes restaurados para os padrões de Seguidores, Curtidas e Views!', 'info');
  };

  // Checkout handlers
  const handleBuyPackage = (item: PackageItem) => {
    setCheckoutPackage(item);
    setIsCheckoutOpen(true);
  };

  const handleCloseCheckout = () => {
    setIsCheckoutOpen(false);
    setCheckoutPackage(null);
  };

  const activeCount = packages.filter((p) => p.active).length;

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans selection:bg-purple-500/30 selection:text-purple-200">
      
      {/* Global Header with view toggle */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        activePackagesCount={activeCount}
        totalPackagesCount={packages.length}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'client' ? (
          /* ================= VISÃO DO CLIENTE (LANDING PAGE) ================= */
          <div className="animate-in fade-in duration-300">
            {/* Hero Section with Seguidores, Curtidas and Views selectors */}
            <HeroSection
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            {/* Vitrine de Pacotes Dinâmicos */}
            <PackageShowcase
              packages={packages}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onBuyPackage={handleBuyPackage}
              onResetFilters={() => setSelectedCategory('all')}
              onGoToAdmin={() => setCurrentView('admin')}
            />

            {/* Prova Social, Estatísticas & Selos de Segurança */}
            <SocialProofAndTrust />

            {/* FAQ Accordion */}
            <FaqSection />
          </div>
        ) : (
          /* ================= PAINEL ADMINISTRATIVO (ADM) ================= */
          <div className="animate-in fade-in duration-300">
            <AdminPanel
              packages={packages}
              onSavePackage={handleSavePackage}
              onDeletePackage={handleDeletePackage}
              onToggleActive={handleToggleActive}
              onResetDefaults={handleResetDefaults}
              onGoToStore={() => setCurrentView('client')}
              infinitePayConfig={infinitePayConfig}
              onUpdateInfinitePayConfig={setInfinitePayConfig}
            />
          </div>
        )}
      </main>

      {/* Global Footer */}
      <Footer onGoToAdmin={() => setCurrentView('admin')} />

      {/* Checkout Modal with InfinitePay Pix */}
      <CheckoutModal
        packageItem={checkoutPackage}
        isOpen={isCheckoutOpen}
        onClose={handleCloseCheckout}
        infinitePayConfig={infinitePayConfig}
      />

      {/* Floating View Switcher Button on Mobile for Quick Testing */}
      <div className="md:hidden fixed bottom-4 left-4 z-40">
        <button
          onClick={() => setCurrentView(currentView === 'client' ? 'admin' : 'client')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold text-white bg-slate-900/90 border border-purple-500/50 shadow-lg shadow-purple-950/60 backdrop-blur-md cursor-pointer"
        >
          {currentView === 'client' ? (
            <>
              <LayoutDashboard className="w-3.5 h-3.5 text-purple-400" />
              <span>Ir para ADM ({activeCount})</span>
            </>
          ) : (
            <>
              <Store className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ver Loja</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
