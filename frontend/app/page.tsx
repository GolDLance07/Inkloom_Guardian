'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Brand, HealthStatus, DemoFixture, Review } from '@/lib/types';
import { AppSidebar } from '@/components/AppSidebar';
import { AppHeader } from '@/components/AppHeader';
import { CreateBrandModal } from '@/components/CreateBrandModal';
import { BrandReviewWorkbench } from '@/components/views/BrandReviewWorkbench';
import { BrandKnowledgeRepository } from '@/components/views/BrandKnowledgeRepository';
import { ReviewHistoryView } from '@/components/views/ReviewHistoryView';
import { BrandSettingsView } from '@/components/views/BrandSettingsView';
import { InitialLoadingScreen } from '@/components/InitialLoadingScreen';

export default function Home() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [activeTab, setActiveTab] = useState<'review' | 'knowledge' | 'history' | 'settings'>('review');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [demoFixture, setDemoFixture] = useState<DemoFixture | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showBootScreen, setShowBootScreen] = useState(true);

  // Poll health & fetch initial brands
  const refreshSystemData = async () => {
    try {
      const h = await api.getHealth();
      setHealth(h);
    } catch {
      setHealth(null);
    }

    try {
      const bList = await api.getBrands(true);
      setBrands(bList);
      if (bList.length > 0 && !selectedBrand) {
        setSelectedBrand(bList[0]);
      }
    } catch (err) {
      console.error('Failed to load brands:', err);
    }

    try {
      const df = await api.getDemoFixture();
      setDemoFixture(df);
    } catch {
      setDemoFixture(null);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    refreshSystemData();
    const interval = setInterval(async () => {
      try {
        const h = await api.getHealth();
        setHealth(h);
      } catch {
        setHealth(null);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleBrandCreated = (newBrand: Brand) => {
    setBrands((prev) => [newBrand, ...prev]);
    setSelectedBrand(newBrand);
  };

  const handleBrandUpdated = (updatedBrand: Brand) => {
    setBrands((prev) => prev.map((b) => (b.id === updatedBrand.id ? updatedBrand : b)));
    setSelectedBrand(updatedBrand);
  };

  const handleSelectReviewFromHistory = (review: Review) => {
    setActiveTab('review');
  };

  return (
    <>
      {showBootScreen && (
        <InitialLoadingScreen
          onComplete={() => setShowBootScreen(false)}
        />
      )}

      <div className="min-h-screen bg-[#FDFBF7] text-[#18181B] flex">
        {/* Sidebar matching Stitch */}
        <AppSidebar
          brands={brands}
          selectedBrand={selectedBrand}
          onSelectBrand={(b) => setSelectedBrand(b)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenCreateBrand={() => setIsCreateModalOpen(true)}
          engineActive={health?.status === 'healthy'}
        />

        {/* Main Body Canvas */}
        <div className="pl-64 flex flex-col flex-1 min-h-screen">
          {/* Top Header */}
          <AppHeader
            health={health}
            selectedBrand={selectedBrand}
            onOpenCreateBrand={() => setIsCreateModalOpen(true)}
          />

          {/* Dynamic Views */}
          <main className="w-full pt-16 flex-1 flex flex-col">
            {initialLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3 text-slate-500">
                <span className="material-symbols-outlined text-[32px] text-crimson animate-spin">
                  progress_activity
                </span>
                <span className="font-sans text-[14px] font-medium text-slate-600">Connecting to Inkloom Governance Engine...</span>
              </div>
            ) : (
            <>
              {activeTab === 'review' && (
                <BrandReviewWorkbench
                  brand={selectedBrand}
                  demoFixture={demoFixture}
                  onNavigateToKnowledge={() => setActiveTab('knowledge')}
                />
              )}

              {activeTab === 'knowledge' && (
                <BrandKnowledgeRepository brand={selectedBrand} />
              )}

              {activeTab === 'history' && (
                <ReviewHistoryView
                  brand={selectedBrand}
                  onSelectReview={handleSelectReviewFromHistory}
                />
              )}

              {activeTab === 'settings' && (
                <BrandSettingsView
                  brand={selectedBrand}
                  onBrandUpdated={handleBrandUpdated}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Create Brand Modal */}
      <CreateBrandModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onBrandCreated={handleBrandCreated}
      />
      </div>
    </>
  );
}
