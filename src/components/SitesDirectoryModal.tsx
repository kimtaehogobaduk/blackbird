import React, { useState, useEffect } from 'react';
import { X, Search, Database, Globe, ExternalLink, Shield } from 'lucide-react';

interface SitesDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SitesDirectoryModal: React.FC<SitesDirectoryModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'username' | 'email'>('username');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [sites, setSites] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const params = new URLSearchParams({
      type: activeTab,
      category: selectedCat,
      q: searchTerm,
    });

    fetch(`/api/sites?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setSites(data.sites || []);
        setTotalCount(data.total || 0);
      })
      .catch((err) => console.error('Failed to load sites:', err))
      .finally(() => setLoading(false));
  }, [isOpen, activeTab, selectedCat, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-mono tracking-tight">
                SMARTLAB_EXPERIMENT PLATFORM CATALOG
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {totalCount} verified network nodes configured for automated probing & intelligence
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center gap-3">
          <div className="inline-flex bg-slate-200/80 p-1 rounded-xl border border-slate-300/60">
            <button
              onClick={() => setActiveTab('username')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                activeTab === 'username'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Username Platforms (717)
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                activeTab === 'email'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Email Signatures (40+)
            </button>
          </div>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search platform name or probe URL pattern..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
            />
          </div>
        </div>

        {/* Sites List Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white">
          {loading ? (
            <div className="py-12 text-center text-slate-400 font-mono text-xs">
              Loading platform verification definitions...
            </div>
          ) : sites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sites.map((site, index) => (
                <div
                  key={index}
                  className="bg-slate-50/80 border border-slate-200 hover:border-slate-300 p-3 rounded-xl flex items-center justify-between space-x-3 transition-colors text-xs font-mono"
                >
                  <div className="truncate">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-900 font-semibold truncate">{site.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                        {site.cat || 'general'}
                      </span>
                      {site.is_nsfw && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                          NSFW
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 truncate block mt-0.5">
                      {site.uri_check}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 font-mono text-xs">
              No platforms found matching "{searchTerm}".
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs font-mono text-slate-500 flex items-center justify-between">
          <span>SMARTLAB_EXPERIMENT Multi-Platform Detection Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SitesDirectoryModal;
