import React, { useState, useMemo } from 'react';
import { Download, FileJson, FileSpreadsheet, Copy, Check, Search, Filter } from 'lucide-react';
import { FoundAccount } from '../types';
import { AccountCard } from './AccountCard';

interface ResultsListProps {
  accounts: FoundAccount[];
  query: string;
  searchType: 'username' | 'email';
}

export const ResultsList: React.FC<ResultsListProps> = ({ accounts, query, searchType }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [detectionFilter, setDetectionFilter] = useState<'all' | 'direct' | 'octopus'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'speed'>('name');
  const [copiedAll, setCopiedAll] = useState(false);

  // Extract unique categories from found accounts
  const availableCategories = useMemo(() => {
    const cats = new Set(accounts.map((a) => a.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [accounts]);

  const octopusCount = useMemo(() => {
    return accounts.filter((a) => a.detectionType === 'octopus_pivot').length;
  }, [accounts]);

  const directCount = useMemo(() => {
    return accounts.filter((a) => a.detectionType !== 'octopus_pivot').length;
  }, [accounts]);

  // Filter & Sort
  const filteredAccounts = useMemo(() => {
    let list = accounts.filter((acc) => {
      const matchesSearch =
        acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (acc.pivotEmail && acc.pivotEmail.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCat =
        selectedCategory === 'all' || acc.category?.toLowerCase() === selectedCategory.toLowerCase();

      let matchesDetection = true;
      if (detectionFilter === 'octopus') {
        matchesDetection = acc.detectionType === 'octopus_pivot';
      } else if (detectionFilter === 'direct') {
        matchesDetection = acc.detectionType !== 'octopus_pivot';
      }

      return matchesSearch && matchesCat && matchesDetection;
    });

    if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'speed') {
      list.sort((a, b) => (a.responseTimeMs || 9999) - (b.responseTimeMs || 9999));
    }

    return list;
  }, [accounts, searchTerm, selectedCategory, detectionFilter, sortBy]);

  // Export JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(accounts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `smartlab_experiment_${query}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['Site', 'Category', 'URL', 'ResponseTimeMs', 'DetectionType', 'PivotEmail', 'Metadata'];
    const rows = accounts.map((acc) => {
      const metaString = (acc.metadata || [])
        .map((m) => `${m.name}: ${Array.isArray(m.value) ? m.value.join('|') : m.value}`)
        .join('; ');
      return [
        `"${acc.name}"`,
        `"${acc.category || ''}"`,
        `"${acc.url}"`,
        acc.responseTimeMs || '',
        `"${acc.detectionType || 'direct'}"`,
        `"${acc.pivotEmail || ''}"`,
        `"${metaString.replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers.join(','), ...rows].join('\n'));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', csvContent);
    downloadAnchor.setAttribute('download', `smartlab_experiment_${query}_${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Copy All URLs
  const handleCopyAllUrls = () => {
    const urls = accounts.map((a) => a.url).join('\n');
    navigator.clipboard.writeText(urls);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Control & Toolbar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        {/* Search & Category Filter */}
        <div className="flex items-center space-x-2 w-full sm:w-auto flex-1 max-w-lg flex-wrap gap-y-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter verified platforms..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-100"
            />
          </div>

          {octopusCount > 0 && (
            <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-mono">
              <button
                type="button"
                onClick={() => setDetectionFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                  detectionFilter === 'all' ? 'bg-white text-indigo-700 shadow-2xs font-semibold' : 'text-slate-600'
                }`}
              >
                All ({accounts.length})
              </button>
              <button
                type="button"
                onClick={() => setDetectionFilter('direct')}
                className={`px-2 py-1 rounded-md transition-all font-medium ${
                  detectionFilter === 'direct' ? 'bg-white text-indigo-700 shadow-2xs font-semibold' : 'text-slate-600'
                }`}
              >
                Direct ({directCount})
              </button>
              <button
                type="button"
                onClick={() => setDetectionFilter('octopus')}
                className={`px-2 py-1 rounded-md transition-all font-medium flex items-center space-x-1 ${
                  detectionFilter === 'octopus' ? 'bg-violet-600 text-white shadow-2xs font-semibold' : 'text-violet-700'
                }`}
              >
                <span>🐙</span>
                <span>Octopus ({octopusCount})</span>
              </button>
            </div>
          )}

          {availableCategories.length > 1 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-700 focus:outline-none focus:border-indigo-600 shrink-0"
            >
              <option value="all">Categories ({accounts.length})</option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'speed')}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-700 focus:outline-none focus:border-indigo-600 shrink-0 hidden md:block"
          >
            <option value="name">Sort A-Z</option>
            <option value="speed">Fastest</option>
          </select>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto justify-end">
          <button
            onClick={handleCopyAllUrls}
            className="flex items-center space-x-1.5 text-xs font-mono text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors shadow-2xs"
            title="Copy all URLs to clipboard"
          >
            {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{copiedAll ? 'Copied' : 'Copy All'}</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 text-xs font-mono text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors shadow-2xs"
            title="Export results to CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleExportJson}
            className="flex items-center space-x-1.5 text-xs font-mono text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors shadow-2xs"
            title="Export results to JSON"
          >
            <FileJson className="w-3.5 h-3.5 text-indigo-600" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Accounts Grid */}
      {filteredAccounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccounts.map((account, index) => (
            <AccountCard key={`${account.name}-${account.detectionType}-${index}`} account={account} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl p-8 shadow-xs">
          <p className="font-mono text-sm text-slate-500">
            No platforms match your filter criteria ({searchTerm || selectedCategory}).
          </p>
        </div>
      )}
    </div>
  );
};

export default ResultsList;
