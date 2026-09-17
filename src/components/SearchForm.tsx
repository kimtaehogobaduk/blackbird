import React, { useState } from 'react';
import { Search, Mail, User, SlidersHorizontal, Sparkles, Square, Play, X, Compass, Zap, GitBranch, Network } from 'lucide-react';

interface SearchFormProps {
  onSearch: (params: {
    query: string;
    type: 'username' | 'email';
    category: string;
    noNsfw: boolean;
    concurrency: number;
    autoAi: boolean;
    pivot?: boolean;
    octopus?: boolean;
  }) => void;
  onStop: () => void;
  isScanning: boolean;
  categories: string[];
}

export const SearchForm: React.FC<SearchFormProps> = ({
  onSearch,
  onStop,
  isScanning,
  categories,
}) => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'username' | 'email'>('username');
  const [category, setCategory] = useState('all');
  const [noNsfw, setNoNsfw] = useState(true);
  const [concurrency, setConcurrency] = useState(25);
  const [autoAi, setAutoAi] = useState(true);
  const [pivotUsername, setPivotUsername] = useState(true);
  const [octopusMode, setOctopusMode] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isScanning) return;

    onSearch({
      query: query.trim(),
      type: searchType,
      category,
      noNsfw,
      concurrency,
      autoAi,
      pivot: searchType === 'email' ? pivotUsername : false,
      octopus: octopusMode,
    });
  };

  const handleQuickPreset = (presetVal: string, type: 'username' | 'email') => {
    setQuery(presetVal);
    setSearchType(type);
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mode Switcher & Quick Targets */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-100">
          <div className="inline-flex bg-slate-100/90 p-1 rounded-xl border border-slate-200/60 w-fit">
            <button
              type="button"
              onClick={() => setSearchType('username')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                searchType === 'username'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Username Investigation</span>
            </button>
            <button
              type="button"
              onClick={() => setSearchType('email')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                searchType === 'email'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email Reverse Trace</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono">
            <span className="hidden sm:inline">Presets:</span>
            {searchType === 'username' ? (
              <>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('developer', 'username')}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
                >
                  developer
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('alex_tech', 'username')}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
                >
                  alex_tech
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('security_lead', 'username')}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
                >
                  security_lead
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('contact@naver.com', 'email')}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
                >
                  contact@naver.com
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('developer@gmail.com', 'email')}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
                >
                  developer@gmail.com
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('researcher@outlook.com', 'email')}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
                >
                  researcher@outlook.com
                </button>
              </>
            )}
          </div>
        </div>

        {/* Input Bar */}
        <div className="relative flex items-center">
          <div className="absolute left-4 pointer-events-none text-slate-400">
            {searchType === 'username' ? (
              <User className="w-5 h-5 text-indigo-600" />
            ) : (
              <Mail className="w-5 h-5 text-indigo-600" />
            )}
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isScanning}
            placeholder={
              searchType === 'username'
                ? 'Enter target username or handle (e.g., johndoe, dev_lead)...'
                : 'Enter target email address (e.g., user@domain.com) for reverse lookup...'
            }
            className="w-full pl-12 pr-28 sm:pr-36 py-3.5 bg-slate-50/70 border border-slate-200 focus:border-indigo-600 focus:bg-white rounded-xl text-slate-900 placeholder:text-slate-400 font-mono text-sm focus:outline-none transition-all shadow-xs"
          />

          {query && !isScanning && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-28 sm:right-36 mr-2 p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="absolute right-2">
            {isScanning ? (
              <button
                type="button"
                onClick={onStop}
                className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer font-semibold animate-pulse"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Abort Scan</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!query.trim()}
                className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:pointer-events-none text-white font-mono text-xs px-4 py-2.5 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer font-semibold"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Execute Scan</span>
              </button>
            )}
          </div>
        </div>

        {/* Feature Toggles Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 text-xs font-mono">
          <div className="flex items-center flex-wrap gap-4 text-slate-600">
            {/* Octopus Multi-Domain Toggle */}
            <label className="flex items-center space-x-1.5 cursor-pointer select-none bg-violet-50/80 hover:bg-violet-100/80 border border-violet-200/80 px-2.5 py-1 rounded-lg transition-colors">
              <input
                type="checkbox"
                checked={octopusMode}
                onChange={(e) => setOctopusMode(e.target.checked)}
                className="rounded border-violet-300 text-violet-600 focus:ring-violet-500"
              />
              <span className="text-violet-800 font-semibold flex items-center space-x-1">
                <span>🐙 문어발 도메인 확장 (120대 주요 메일)</span>
              </span>
            </label>

            {/* Smart Username Pivot Toggle (for email mode) */}
            {searchType === 'email' && (
              <label className="flex items-center space-x-1.5 cursor-pointer select-none bg-indigo-50/80 hover:bg-indigo-100/80 border border-indigo-200/80 px-2.5 py-1 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={pivotUsername}
                  onChange={(e) => setPivotUsername(e.target.checked)}
                  className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-indigo-800 font-semibold flex items-center space-x-1">
                  <GitBranch className="w-3 h-3 text-indigo-600" />
                  <span>@앞 아이디 700+ 사이트 피벗</span>
                </span>
              </label>
            )}

            <label className="flex items-center space-x-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoAi}
                onChange={(e) => setAutoAi(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="flex items-center space-x-1 text-slate-700">
                <Sparkles className="w-3 h-3 text-indigo-600" />
                <span>AI Profile</span>
              </span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={noNsfw}
                onChange={(e) => setNoNsfw(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-700">Filter NSFW</span>
            </label>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-1.5 text-slate-600 hover:text-slate-900 transition-colors self-start sm:self-auto"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
            <span>{showAdvanced ? 'Hide Options' : 'Options'}</span>
          </button>
        </div>

        {/* Collapsible Advanced Parameters */}
        {showAdvanced && (
          <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <label className="block text-slate-600 mb-1.5 font-medium">Domain / Category Filter:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-600 shadow-2xs"
              >
                <option value="all">All Available Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between text-slate-600 mb-1.5 font-medium">
                <span>Concurrency Workers:</span>
                <span className="text-indigo-600 font-bold">{concurrency} threads</span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                value={concurrency}
                onChange={(e) => setConcurrency(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>5 (Cautious)</span>
                <span>25 (Balanced)</span>
                <span>40 (High-Speed)</span>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <span className="text-slate-600 mb-1 font-medium">Octopus Multi-Vector:</span>
              <span className="text-slate-500 text-[11px] leading-relaxed">
                Evaluates 120 major email networks (naver.com, gmail.com, daum.net, outlook.com, proton.me, etc.) and branches out discovery across all verified nodes.
              </span>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default SearchForm;
