import React from 'react';
import { Sparkles, Database, Activity, FileText } from 'lucide-react';
import { SmartLabLogo } from './SmartLabLogo';

interface HeaderProps {
  splashQuote: string;
  totalUsernameSites: number;
  totalEmailSites: number;
  totalFamousDomains?: number;
  hasGeminiKey: boolean;
  onOpenDirectory: () => void;
  onOpenAbout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  splashQuote,
  totalUsernameSites,
  totalEmailSites,
  totalFamousDomains = 50,
  hasGeminiKey,
  onOpenDirectory,
  onOpenAbout,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center p-1.5 shadow-sm border border-slate-800">
              <SmartLabLogo size={28} className="text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-black tracking-tight text-slate-950 font-mono">
                  SMARTLAB<span className="text-indigo-600">_EXPERIMENT</span>
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-mono font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  LAB v2.5
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Autonomous Digital Identity & Verification Laboratory
              </p>
            </div>
          </div>

          {/* Center Motto / Status Ticker */}
          <div className="hidden md:flex items-center justify-center flex-1 max-w-lg mx-4">
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-600 bg-slate-100/90 px-3.5 py-1.5 rounded-full border border-slate-200/80 truncate">
              <Activity className="w-3.5 h-3.5 text-indigo-600 shrink-0 animate-pulse" />
              <span className="truncate">{splashQuote || 'SMARTLAB_EXPERIMENT Protocol Online.'}</span>
            </div>
          </div>

          {/* Right Action Badges */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <div className="hidden xl:flex items-center space-x-1.5 text-xs font-mono text-violet-700 bg-violet-50 px-2.5 py-1.5 rounded-lg border border-violet-200">
              <span>🐙</span>
              <span>{totalFamousDomains} Major Domains</span>
            </div>

            <button
              onClick={onOpenDirectory}
              className="flex items-center space-x-1.5 text-xs font-mono text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors shadow-2xs"
              title="Explore verified platform catalog"
            >
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Nodes:</span>
              <span className="text-indigo-700 font-bold">{(totalUsernameSites || 717) + (totalEmailSites || 40)}+</span>
            </button>

            <div
              className={`flex items-center space-x-1.5 text-xs font-mono px-2.5 py-1.5 rounded-lg border ${
                hasGeminiKey
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
              title={hasGeminiKey ? 'Gemini 2.5 AI Profiling Engine Active' : 'Heuristic Profiling Engine'}
            >
              <Sparkles className={`w-3.5 h-3.5 ${hasGeminiKey ? 'text-emerald-600' : 'text-amber-500'}`} />
              <span className="hidden lg:inline">{hasGeminiKey ? 'AI Intelligence' : 'Profiler'}</span>
            </div>

            <button
              onClick={onOpenAbout}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200/70 transition-colors"
              title="Laboratory Experiment Protocol & Guidelines"
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
