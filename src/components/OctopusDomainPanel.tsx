import React, { useState } from 'react';
import { Network, CheckCircle2, ShieldCheck, Mail, Globe, ExternalLink, Filter, Sparkles, Copy, Check } from 'lucide-react';
import { OctopusDomainNode } from '../types';

interface OctopusDomainPanelProps {
  handle: string;
  verifiedNodes: OctopusDomainNode[];
  totalDomains: number;
  checkedCount: number;
  isScanning: boolean;
  onFilterByPivot?: (email: string | null) => void;
  selectedFilterEmail?: string | null;
}

export const OctopusDomainPanel: React.FC<OctopusDomainPanelProps> = ({
  handle,
  verifiedNodes,
  totalDomains,
  checkedCount,
  isScanning,
  onFilterByPivot,
  selectedFilterEmail,
}) => {
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'verified' | 'korea' | 'global' | 'privacy'>('verified');

  const handleCopy = (email: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const domainCategories: Record<string, 'korea' | 'global' | 'privacy' | 'other'> = {
    'naver.com': 'korea',
    'daum.net': 'korea',
    'kakao.com': 'korea',
    'hanmail.net': 'korea',
    'nate.com': 'korea',
    'gmail.com': 'global',
    'outlook.com': 'global',
    'hotmail.com': 'global',
    'yahoo.com': 'global',
    'icloud.com': 'global',
    'live.com': 'global',
    'msn.com': 'global',
    'me.com': 'global',
    'mac.com': 'global',
    'proton.me': 'privacy',
    'protonmail.com': 'privacy',
    'tutanota.com': 'privacy',
    'tuta.io': 'privacy',
    'posteo.de': 'privacy',
    'fastmail.com': 'privacy',
    'skiff.com': 'privacy',
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-700 font-bold shrink-0">
            🐙
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-mono text-sm font-bold text-slate-800 tracking-tight">
                OCTOPUS MULTI-DOMAIN EXPANSION
              </h3>
              <span className="bg-violet-50 text-violet-700 border border-violet-200/80 text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold">
                50 Famous Domains
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Target Prefix: <span className="font-semibold text-slate-700">"{handle}"</span> across major providers (Naver, Gmail, Daum, Kakao, Outlook, etc.)
            </p>
          </div>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-600">
            <span className="text-slate-400">Probed:</span>{' '}
            <span className="font-bold text-slate-800">{checkedCount}</span>/{totalDomains || 50}
          </div>
          <div className="bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-emerald-800 font-semibold flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{verifiedNodes.length} Verified</span>
          </div>
        </div>
      </div>

      {/* Verified Nodes List */}
      {verifiedNodes.length > 0 ? (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono text-slate-600 font-semibold flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Confirmed Identity Nodes ({verifiedNodes.length})</span>
            </div>
            {selectedFilterEmail && (
              <button
                type="button"
                onClick={() => onFilterByPivot && onFilterByPivot(null)}
                className="text-xs font-mono text-indigo-600 hover:text-indigo-800 underline flex items-center space-x-1"
              >
                <span>Reset Branch Filter</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {verifiedNodes.map((node) => {
              const isSelected = selectedFilterEmail === node.email;
              return (
                <div
                  key={node.email}
                  onClick={() => onFilterByPivot && onFilterByPivot(isSelected ? null : node.email)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'bg-violet-50/70 border-violet-400 ring-2 ring-violet-200'
                      : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/90'
                  }`}
                >
                  <div className="flex items-start space-x-2.5 min-w-0">
                    {node.avatarUrl ? (
                      <img
                        src={node.avatarUrl}
                        alt={node.providerName}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0 bg-white"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-800 truncate">
                          {node.email}
                        </span>
                        <span className="bg-white border border-slate-200 text-slate-600 text-[10px] font-mono px-1.5 py-0.2 rounded font-medium">
                          {node.providerName || node.domain}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {(node.signals || ['Active Record']).map((sig, sIdx) => (
                          <span
                            key={sIdx}
                            className="bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[10px] font-mono px-1.5 py-0.2 rounded flex items-center space-x-1"
                          >
                            <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                            <span>{sig}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      type="button"
                      title="Copy Email Address"
                      onClick={(e) => handleCopy(node.email, e)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
                    >
                      {copiedEmail === node.email ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      title="Filter results by this branch"
                      className={`px-2 py-1 rounded-md text-[11px] font-mono font-medium transition-colors ${
                        isSelected
                          ? 'bg-violet-600 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected ? 'Filtered' : 'Filter'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : isScanning ? (
        <div className="bg-slate-50/80 border border-dashed border-slate-200 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center space-x-2 text-xs font-mono text-slate-500">
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-ping"></span>
            <span>Evaluating candidate addresses across 50 major email providers...</span>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50/60 border border-slate-200/70 rounded-xl p-3.5 text-center">
          <p className="text-xs font-mono text-slate-500">
            No public identity anchors discovered on candidate domains for prefix "{handle}".
          </p>
        </div>
      )}
    </div>
  );
};

export default OctopusDomainPanel;
