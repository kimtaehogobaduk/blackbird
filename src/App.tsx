import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { SearchForm } from './components/SearchForm';
import { ScanProgress } from './components/ScanProgress';
import { ResultsList } from './components/ResultsList';
import { AiAnalysisCard } from './components/AiAnalysisCard';
import { SitesDirectoryModal } from './components/SitesDirectoryModal';
import { AboutModal } from './components/AboutModal';
import { OctopusDomainPanel } from './components/OctopusDomainPanel';
import { FoundAccount, AiProfileAnalysis, OctopusDomainNode } from './types';
import { Sparkles, Network, Zap, ShieldCheck } from 'lucide-react';
import { SmartLabLogo } from './components/SmartLabLogo';

export default function App() {
  // Stats & Config
  const [stats, setStats] = useState({
    totalUsernameSites: 0,
    totalEmailSites: 0,
    totalFamousDomains: 50,
    usernameCategories: [] as string[],
    emailCategories: [] as string[],
    splashQuote: '',
    hasGeminiKey: false,
  });

  // Search State
  const [activeQuery, setActiveQuery] = useState('');
  const [searchType, setSearchType] = useState<'username' | 'email'>('username');
  const [isScanning, setIsScanning] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [totalSites, setTotalSites] = useState(0);
  const [foundCount, setFoundCount] = useState(0);
  const [currentSite, setCurrentSite] = useState('');
  const [elapsedSec, setElapsedSec] = useState(0);
  const [foundAccounts, setFoundAccounts] = useState<FoundAccount[]>([]);
  const [autoAiAnalysis, setAutoAiAnalysis] = useState(true);

  // Octopus Multi-Domain Expansion State
  const [octopusActive, setOctopusActive] = useState(false);
  const [octopusNodes, setOctopusNodes] = useState<OctopusDomainNode[]>([]);
  const [octopusChecked, setOctopusChecked] = useState(0);
  const [octopusTotal, setOctopusTotal] = useState(120);
  const [octopusVerifiedCount, setOctopusVerifiedCount] = useState(0);
  const [selectedBranchEmail, setSelectedBranchEmail] = useState<string | null>(null);

  // AI Analysis State
  const [aiAnalysis, setAiAnalysis] = useState<AiProfileAnalysis | null>(null);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [aiAnalysisError, setAiAnalysisError] = useState<string | null>(null);

  // Modals
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // References
  const eventSourceRef = useRef<EventSource | null>(null);
  const foundAccountsRef = useRef<FoundAccount[]>([]);
  const timerRef = useRef<any>(null);

  // Fetch initial stats
  useEffect(() => {
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error('Stats error:', err));
  }, []);

  const stopSearch = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsScanning(false);
  };

  const triggerAiAnalysis = async (accounts: FoundAccount[], query: string, type: 'username' | 'email') => {
    if (accounts.length === 0) return;
    setIsAnalyzingAi(true);
    setAiAnalysisError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          [type]: query,
          foundAccounts: accounts,
        }),
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.profile) {
        setAiAnalysis(data.profile);
        setAiAnalysisError(null);
      } else {
        throw new Error(data.error || 'Failed to parse AI profile response');
      }
    } catch (err: any) {
      console.warn('AI Analysis notification:', err?.message || err);
      setAiAnalysisError(err?.name === 'AbortError' ? 'Analysis timed out. Click below to retry.' : (err?.message || 'Failed to complete AI analysis'));
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const handleStartSearch = (params: {
    query: string;
    type: 'username' | 'email';
    category: string;
    noNsfw: boolean;
    concurrency: number;
    autoAi: boolean;
    pivot?: boolean;
    octopus?: boolean;
  }) => {
    stopSearch();

    setActiveQuery(params.query);
    setSearchType(params.type);
    setAutoAiAnalysis(params.autoAi);
    setFoundAccounts([]);
    foundAccountsRef.current = [];
    setFoundCount(0);
    setCompleted(0);
    setElapsedSec(0);
    setAiAnalysis(null);
    setIsScanning(true);

    // Reset Octopus state
    setOctopusActive(Boolean(params.octopus || params.type === 'email'));
    setOctopusNodes([]);
    setOctopusChecked(0);
    setOctopusTotal(stats?.totalFamousDomains || 120);
    setOctopusVerifiedCount(0);
    setSelectedBranchEmail(null);

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedSec(Number(((Date.now() - startTime) / 1000).toFixed(1)));
    }, 200);

    const sseUrl = `/api/search/stream?type=${params.type}&query=${encodeURIComponent(
      params.query
    )}&category=${params.category}&no_nsfw=${params.noNsfw}&concurrency=${params.concurrency}&pivot=${
      params.pivot || false
    }&octopus=${params.octopus || false}`;

    const es = new EventSource(sseUrl);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'init') {
          setTotalSites(data.totalSites || 0);
          if (data.octopusEnabled !== undefined) {
            setOctopusActive(data.octopusEnabled);
          }
        } else if (data.type === 'octopus_init') {
          setOctopusActive(true);
          if (data.octopusTotal) setOctopusTotal(data.octopusTotal);
        } else if (data.type === 'octopus_found' && data.octopusNode) {
          setOctopusNodes((prev) => {
            if (prev.some((n) => n.email === data.octopusNode.email)) return prev;
            return [...prev, data.octopusNode];
          });
          if (data.octopusVerifiedCount !== undefined) {
            setOctopusVerifiedCount(data.octopusVerifiedCount);
          }
        } else if (data.type === 'octopus_progress') {
          if (data.octopusChecked !== undefined) setOctopusChecked(data.octopusChecked);
          if (data.octopusTotal !== undefined) setOctopusTotal(data.octopusTotal);
          if (data.octopusVerifiedCount !== undefined) setOctopusVerifiedCount(data.octopusVerifiedCount);
        } else if (data.type === 'found' && data.account) {
          foundAccountsRef.current = [data.account, ...foundAccountsRef.current];
          setFoundAccounts([...foundAccountsRef.current]);
          setFoundCount(data.foundCount || foundAccountsRef.current.length);
          if (data.completed !== undefined) setCompleted(data.completed);
        } else if (data.type === 'progress') {
          if (data.completed !== undefined) setCompleted(data.completed);
          if (data.currentSite) setCurrentSite(data.currentSite);
          if (data.foundCount !== undefined) setFoundCount(data.foundCount);
        } else if (data.type === 'complete') {
          stopSearch();
          setElapsedSec(data.elapsedSec);
          if (params.autoAi && foundAccountsRef.current.length > 0) {
            triggerAiAnalysis(foundAccountsRef.current, params.query, params.type);
          }
        }
      } catch (e) {
        console.error('Error parsing SSE event:', e);
      }
    };

    es.onerror = () => {
      stopSearch();
    };
  };

  const handlePrefix = activeQuery.includes('@') ? activeQuery.split('@')[0] : activeQuery;

  // Filter accounts when a specific branch is selected
  const displayedAccounts = selectedBranchEmail
    ? foundAccounts.filter((a) => a.pivotEmail === selectedBranchEmail)
    : foundAccounts;

  const handleDeepPivotSearch = (email: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    handleStartSearch({
      query: email,
      type: 'email',
      category: 'all',
      noNsfw: false,
      concurrency: 20,
      autoAi: autoAiAnalysis,
      pivot: true,
      octopus: true,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-600 selection:text-white">
      {/* Top Navigation */}
      <Header
        splashQuote={stats.splashQuote}
        totalUsernameSites={stats.totalUsernameSites}
        totalEmailSites={stats.totalEmailSites}
        totalFamousDomains={stats.totalFamousDomains || 120}
        hasGeminiKey={stats.hasGeminiKey}
        onOpenDirectory={() => setIsDirectoryOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Search Control Box */}
        <SearchForm
          onSearch={handleStartSearch}
          onStop={stopSearch}
          isScanning={isScanning}
          categories={
            searchType === 'username' ? stats.usernameCategories : stats.emailCategories
          }
        />

        {/* Live Progress Bar (when scanning or scanned) */}
        {(isScanning || completed > 0) && (
          <ScanProgress
            completed={completed}
            total={totalSites}
            foundCount={foundCount}
            currentSite={currentSite}
            elapsedSec={elapsedSec}
            isScanning={isScanning}
            query={activeQuery}
            octopusActive={octopusActive}
            octopusChecked={octopusChecked}
            octopusTotal={octopusTotal}
            octopusVerifiedCount={octopusVerifiedCount}
          />
        )}

        {/* Octopus Multi-Domain Expansion Panel */}
        {(octopusActive || octopusNodes.length > 0) && activeQuery && (
          <OctopusDomainPanel
            handle={handlePrefix}
            verifiedNodes={octopusNodes}
            totalDomains={octopusTotal}
            checkedCount={octopusChecked}
            isScanning={isScanning}
            onFilterByPivot={setSelectedBranchEmail}
            selectedFilterEmail={selectedBranchEmail}
            onDeepPivotSearch={handleDeepPivotSearch}
          />
        )}

        {/* AI Analysis Loading Card */}
        {isAnalyzingAi && !aiAnalysis && (
          <div className="bg-white border border-indigo-200 rounded-2xl p-8 text-center space-y-3 shadow-xs">
            <div className="inline-flex p-3 rounded-xl bg-indigo-50 border border-indigo-200 animate-pulse text-indigo-600">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-mono font-bold text-slate-900 tracking-tight">
              SYNTHESIZING DIGITAL IDENTITY DOSSIER...
            </h3>
            <p className="text-xs text-slate-500 font-mono max-w-md mx-auto">
              Analyzing verified footprint distribution, behavioral clusters, and exposure metrics with Gemini AI.
            </p>
          </div>
        )}

        {/* AI Analysis Error / Retry Card */}
        {aiAnalysisError && !aiAnalysis && !isAnalyzingAi && foundAccounts.length > 0 && (
          <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 text-left">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-mono font-semibold text-amber-900">
                  AI DOSSIER SYNTHESIS PAUSED
                </p>
                <p className="text-xs text-amber-700 font-mono mt-0.5">
                  {aiAnalysisError}
                </p>
              </div>
            </div>
            <button
              onClick={() => triggerAiAnalysis(foundAccounts, activeQuery, searchType)}
              className="shrink-0 px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-mono rounded-lg transition-colors cursor-pointer"
            >
              Retry Synthesis
            </button>
          </div>
        )}

        {/* AI Analysis Dossier */}
        {aiAnalysis && (
          <AiAnalysisCard
            analysis={aiAnalysis}
            isLoading={isAnalyzingAi}
            onRefresh={() => triggerAiAnalysis(foundAccounts, activeQuery, searchType)}
            target={activeQuery}
          />
        )}

        {/* Search Results List */}
        {displayedAccounts.length > 0 ? (
          <ResultsList
            accounts={displayedAccounts}
            query={activeQuery}
            searchType={searchType}
          />
        ) : !isScanning && completed > 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8 space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-mono font-bold text-slate-900">
              {selectedBranchEmail
                ? `NO ADDITIONAL PLATFORM MATCHES FOR BRANCH "${selectedBranchEmail}"`
                : `NO ACCOUNTS DETECTED FOR "${activeQuery}"`}
            </h3>
            <p className="text-xs text-slate-500 font-mono max-w-md mx-auto leading-relaxed">
              {selectedBranchEmail ? (
                <button
                  type="button"
                  onClick={() => setSelectedBranchEmail(null)}
                  className="text-indigo-600 hover:text-indigo-800 underline font-semibold"
                >
                  Clear branch filter to view all verified results
                </button>
              ) : (
                `Scanned ${totalSites} platform nodes and 50 major email networks with 0 matching signatures.`
              )}
            </p>
          </div>
        ) : !isScanning && (
          /* Laboratory Overview / Pillars */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-3 shadow-xs hover:border-slate-300 transition-all">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-mono font-bold text-xs shadow-2xs">
                <Network className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-mono font-bold text-slate-900">
                750+ Verified Platform Nodes
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Asynchronous enumeration across 717+ username services and 40+ direct email services with sub-second parallel HTTP probing.
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-3 shadow-xs hover:border-slate-300 transition-all">
              <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-700 font-mono font-bold text-xs shadow-2xs">
                <span className="text-lg">🐙</span>
              </div>
              <h3 className="text-sm font-mono font-bold text-slate-900">
                Octopus Multi-Domain Expansion
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Evaluates handle prefixes across 50 renowned mail providers (Naver, Gmail, Daum, Kakao, Outlook, Proton, etc.) and branches out multi-vector discovery.
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-3 shadow-xs hover:border-slate-300 transition-all">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-mono font-bold text-xs shadow-2xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-mono font-bold text-slate-900">
                Gemini 2.5 AI Profiling
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Synthesizes discovered account categories and metadata into behavioral dossiers, exposure risk scores, and digital footprint analysis.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div className="flex items-center space-x-2">
            <SmartLabLogo size={18} />
            <span className="font-semibold text-slate-800">SMARTLAB_EXPERIMENT</span>
            <span>•</span>
            <span>Digital Identity & OSINT Intelligence</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsDirectoryOpen(true)}
              className="hover:text-indigo-600 transition-colors"
            >
              Supported Platforms ({stats.totalUsernameSites + stats.totalEmailSites}+)
            </button>
            <span>•</span>
            <button
              onClick={() => setIsAboutOpen(true)}
              className="hover:text-indigo-600 transition-colors"
            >
              Experiment Protocol
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SitesDirectoryModal
        isOpen={isDirectoryOpen}
        onClose={() => setIsDirectoryOpen(false)}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        stats={stats}
      />
    </div>
  );
}
