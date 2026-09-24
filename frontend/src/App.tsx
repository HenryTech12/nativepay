import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProblemSection } from './components/ProblemSection';
import { TheBigIdea } from './components/TheBigIdea';
import { HowItWorks } from './components/HowItWorks';
import { AIPipeline } from './components/AIPipeline';
import { InteractiveVoiceDemo } from './components/InteractiveVoiceDemo';
import { TransactionTypes } from './components/TransactionTypes';
import { AgentSection } from './components/AgentSection';
import { BeforeAfter } from './components/BeforeAfter';
import { TrustSafety } from './components/TrustSafety';
import { ImpactSection } from './components/ImpactSection';
import { HackathonProof } from './components/HackathonProof';
import { ArchitectureDiagram } from './components/ArchitectureDiagram';
import { DemoCTA } from './components/DemoCTA';
import { Footer } from './components/Footer';

import { VirtualPosApp } from './pages/VirtualPosApp';
import { PosAgentView } from './pages/PosAgentView';
import { HistoryPage } from './pages/HistoryPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { ArchitecturePage } from './pages/ArchitecturePage';

import { Language } from './types';
import { setSoundEnabled } from './lib/audio';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>('/');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('yo');
  const [soundOn, setSoundOn] = useState<boolean>(true);

  // Sync route with URL hash on load and hashchange
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '') || '/';
      setCurrentRoute(hash);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (window.location.hash) {
      handleHash();
    }

    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navigateTo = (route: string) => {
    setCurrentRoute(route);
    window.location.hash = route === '/' ? '' : route;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  // Route Views
  if (currentRoute === '/app') {
    return (
      <div className="min-h-screen bg-[#FAF9F5] font-sans antialiased text-[#0F1713]">
        <Navbar
          activeRoute={currentRoute}
          onNavigate={navigateTo}
          soundEnabled={soundOn}
          onToggleSound={handleToggleSound}
          selectedLanguage={selectedLanguage}
          onSelectLanguage={setSelectedLanguage}
        />
        <VirtualPosApp onNavigate={navigateTo} />
      </div>
    );
  }

  if (currentRoute === '/pos') {
    return (
      <div className="min-h-screen bg-[#FAF9F5] font-sans antialiased text-[#0F1713]">
        <Navbar
          activeRoute={currentRoute}
          onNavigate={navigateTo}
          soundEnabled={soundOn}
          onToggleSound={handleToggleSound}
          selectedLanguage={selectedLanguage}
          onSelectLanguage={setSelectedLanguage}
        />
        <PosAgentView onNavigate={navigateTo} />
      </div>
    );
  }

  if (currentRoute === '/history') {
    return (
      <div className="min-h-screen bg-[#FAF9F5] font-sans antialiased text-[#0F1713]">
        <Navbar
          activeRoute={currentRoute}
          onNavigate={navigateTo}
          soundEnabled={soundOn}
          onToggleSound={handleToggleSound}
          selectedLanguage={selectedLanguage}
          onSelectLanguage={setSelectedLanguage}
        />
        <HistoryPage onNavigate={navigateTo} />
      </div>
    );
  }

  if (currentRoute === '/onboarding') {
    return (
      <div className="min-h-screen bg-[#FAF9F5] font-sans antialiased text-[#0F1713]">
        <Navbar
          activeRoute={currentRoute}
          onNavigate={navigateTo}
          soundEnabled={soundOn}
          onToggleSound={handleToggleSound}
          selectedLanguage={selectedLanguage}
          onSelectLanguage={setSelectedLanguage}
        />
        <OnboardingPage onNavigate={navigateTo} />
      </div>
    );
  }

  if (currentRoute === '/architecture') {
    return (
      <div className="min-h-screen bg-[#FAF9F5] font-sans antialiased text-[#0F1713]">
        <Navbar
          activeRoute={currentRoute}
          onNavigate={navigateTo}
          soundEnabled={soundOn}
          onToggleSound={handleToggleSound}
          selectedLanguage={selectedLanguage}
          onSelectLanguage={setSelectedLanguage}
        />
        <ArchitecturePage onNavigate={navigateTo} />
      </div>
    );
  }

  // Master Landing Page
  return (
    <div className="min-h-screen bg-[#FAF9F5] font-sans antialiased text-[#0F1713] selection:bg-[#0D8253] selection:text-white">
      {/* Universal Top Navigation */}
      <Navbar
        activeRoute={currentRoute}
        onNavigate={navigateTo}
        soundEnabled={soundOn}
        onToggleSound={handleToggleSound}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={setSelectedLanguage}
      />

      <main className="space-y-4">
        {/* Hero Section */}
        <Hero
          onLaunchDemo={() => navigateTo('/app')}
          onExplore={() => {
            const el = document.getElementById('the-big-idea');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* The Real Problem Section */}
        <ProblemSection />

        {/* The Big Idea & Philosophical Core */}
        <TheBigIdea />

        {/* How It Works (5-Step Voice Flow) */}
        <HowItWorks />

        {/* Interactive Voice Banking Simulator (Embedded Sandbox) */}
        <InteractiveVoiceDemo
          onOpenFullApp={() => navigateTo('/app')}
        />

        {/* AI & Voice Acoustic Pipeline */}
        <AIPipeline />

        {/* Versatile Transaction Types (Transfer, Cash-Out, Deposit, Balance) */}
        <TransactionTypes
          onSelectType={() => {
            const el = document.getElementById('demo');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* Built for Existing Agent Infrastructure */}
        <AgentSection
          onOpenAgentPos={() => navigateTo('/pos')}
        />

        {/* Interactive Before vs After Comparison */}
        <BeforeAfter />

        {/* Trust & Defense-In-Depth Security */}
        <TrustSafety />

        {/* Real-World Impact & Inclusion Statistics */}
        <ImpactSection />

        {/* Hackathon Proof (8 Stages Built For Real World) */}
        <HackathonProof />

        {/* Technical Architecture Topography */}
        <ArchitectureDiagram />

        {/* High-Impact CTA Banner */}
        <DemoCTA
          onLaunchDemo={() => navigateTo('/app')}
        />
      </main>

      {/* Footer with honest demo disclosures & links */}
      <Footer onNavigate={navigateTo} />
    </div>
  );
}
