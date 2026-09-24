import React, { useState } from 'react';
import {
  CheckCircle2,
  ShieldCheck,
  Mail,
  Filter,
  Sparkles,
  Copy,
  Check,
  Search,
  Server,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { OctopusDomainNode } from '../types';

interface OctopusDomainPanelProps {
  handle: string;
  verifiedNodes: OctopusDomainNode[];
  totalDomains: number;
  checkedCount: number;
  isScanning: boolean;
  onFilterByPivot?: (email: string | null) => void;
  selectedFilterEmail?: string | null;
  onDeepPivotSearch?: (email: string) => void;
}

export const OctopusDomainPanel: React.FC<OctopusDomainPanelProps> = ({
  handle,
  verifiedNodes,
  totalDomains = 120,
  checkedCount,
  isScanning,
  onFilterByPivot,
  selectedFilterEmail,
  onDeepPivotSearch,
}) => {
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'verified' | 'routable' | 'korea' | 'global'>('all');

  const handleCopy = (email: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const domainCategories: Record<string, 'korea' | 'global' | 'privacy'> = {
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

  const verifiedCount = verifiedNodes.length;

  const filteredNodes = verifiedNodes.filter((node) => {
    if (activeTab === 'korea') {
      const cat = node.category?.toLowerCase() || '';
      return cat.includes('korea') || domainCategories[node.domain] === 'korea';
    }
    if (activeTab === 'global') {
      const cat = node.category?.toLowerCase() || '';
      return (
        cat.includes('global') ||
        cat.includes('privacy') ||
        domainCategories[node.domain] === 'global' ||
        domainCategories[node.domain] === 'privacy'
      );
    }
    return true;
  });

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-700 font-bold shrink-0 text-xl">
            🐙
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-mono text-sm font-bold text-slate-800 tracking-tight">
                OCTOPUS MULTI-DOMAIN EXPANSION
              </h3>
              <span className="bg-violet-50 text-violet-700 border border-violet-200/80 text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold">
                {totalDomains} Famous Networks
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Testing prefix <span className="text-violet-700 font-bold">"{handle}"</span> across Korea, Global, Privacy, and International mail infrastructure
            </p>
          </div>
        </div>

        {/* Probing Progress & Counts */}
        <div className="flex items-center space-x-2 text-xs font-mono shrink-0">
          <div className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-600">
            Probed: <span className="font-bold text-slate-800">{checkedCount}</span> / {totalDomains}
          </div>
          <div className="bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-emerald-800 font-semibold flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{verifiedCount} Confirmed Identities</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
        <div className="flex items-center space-x-1.5 overflow-x-auto text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-violet-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Confirmed ({verifiedNodes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('korea')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              activeTab === 'korea'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Korea Major
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('global')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              activeTab === 'global'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Global & Privacy
          </button>
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

      {/* Discovered Nodes List */}
      {filteredNodes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredNodes.map((node) => {
            const isSelected = selectedFilterEmail === node.email;
            const isTarget = Boolean(node.isTarget);
            const isVerified = node.status === 'VERIFIED';

            return (
              <div
                key={node.email}
                className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                  isTarget
                    ? 'bg-amber-50/40 border-amber-300 ring-2 ring-amber-200/80 shadow-xs'
                    : isSelected
                    ? 'bg-violet-50/70 border-violet-400 ring-2 ring-violet-200 shadow-xs'
                    : isVerified
                    ? 'bg-emerald-50/20 hover:bg-emerald-50/40 border-emerald-200/80'
                    : 'bg-slate-50/70 hover:bg-slate-100/70 border-slate-200/90'
                }`}
              >
                <div className="flex items-start space-x-2.5 min-w-0">
                  {node.avatarUrl ? (
                    <img
                      src={node.avatarUrl}
                      alt={node.providerName}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 bg-white"
                    />
                  ) : (
                    <div
                      className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${
                        isTarget
                          ? 'bg-amber-100 border-amber-300 text-amber-800'
                          : isVerified
                          ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                          : 'bg-sky-100 border-sky-300 text-sky-800'
                      }`}
                    >
                      <Mail className="w-5 h-5" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                      <span className="font-mono text-xs font-bold text-slate-900 truncate">
                        {node.email}
                      </span>
                      {isTarget && (
                        <span className="bg-amber-500 text-white text-[10px] font-mono px-1.5 py-0.2 rounded font-bold shadow-2xs">
                          ⭐ TARGET
                        </span>
                      )}
                      <span className="bg-white border border-slate-200 text-slate-600 text-[10px] font-mono px-1.5 py-0.2 rounded font-medium">
                        {node.providerName || node.domain}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded flex items-center space-x-1 font-semibold ${
                          isVerified
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-sky-50 text-sky-700 border border-sky-200'
                        }`}
                      >
                        {isVerified ? (
                          <>
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            <span>CONFIRMED IDENTITY</span>
                          </>
                        ) : (
                          <>
                            <Server className="w-2.5 h-2.5 text-sky-600" />
                            <span>MX ROUTABLE</span>
                          </>
                        )}
                      </span>

                      {(node.signals || []).map((sig, sIdx) => (
                        <span
                          key={sIdx}
                          className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-mono px-1.5 py-0.2 rounded flex items-center space-x-1"
                        >
                          <ShieldCheck className="w-2.5 h-2.5 text-slate-500" />
                          <span className="truncate max-w-[160px]">{sig}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs font-mono">
                  {/* Left: Quick Deep Pivot Button */}
                  {onDeepPivotSearch && (
                    <button
                      type="button"
                      onClick={() => onDeepPivotSearch(node.email)}
                      className="flex items-center space-x-1 text-violet-700 hover:text-violet-950 font-semibold bg-violet-100/70 hover:bg-violet-200/80 px-2 py-1 rounded-md transition-colors"
                      title="이 이메일 주소로 738개 전체 사이트 심층 피벗 검색 시작"
                    >
                      <Search className="w-3 h-3 text-violet-600" />
                      <span>심층 피벗 (738+ 사이트)</span>
                      <ArrowRight className="w-3 h-3 text-violet-600" />
                    </button>
                  )}

                  {/* Right: Copy and Filter */}
                  <div className="flex items-center space-x-1 ml-auto">
                    <button
                      type="button"
                      title="이메일 복사"
                      onClick={(e) => handleCopy(node.email, e)}
                      className="p-1 text-slate-500 hover:text-slate-800 rounded-md hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
                    >
                      {copiedEmail === node.email ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {onFilterByPivot && (
                      <button
                        type="button"
                        onClick={() => onFilterByPivot(isSelected ? null : node.email)}
                        title="결과 목록에서 이 이메일 브랜치만 필터"
                        className={`px-2 py-1 rounded-md text-[11px] font-mono font-medium transition-colors ${
                          isSelected
                            ? 'bg-violet-600 text-white shadow-2xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected ? 'Filtered' : 'Filter'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : isScanning ? (
        <div className="bg-slate-50/80 border border-dashed border-slate-200 rounded-xl p-6 text-center">
          <div className="flex flex-col items-center justify-center space-y-2 text-xs font-mono text-slate-600">
            <span className="w-3 h-3 rounded-full bg-violet-500 animate-ping"></span>
            <span>Evaluating candidate addresses across {totalDomains} major email networks...</span>
            <span className="text-[11px] text-slate-400">DNS MX routing, syntax verification & public identity anchoring in progress</span>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50/60 border border-slate-200/70 rounded-xl p-4 text-center">
          <p className="text-xs font-mono text-slate-500">
            No active nodes discovered for prefix "{handle}".
          </p>
        </div>
      )}
    </div>
  );
};

export default OctopusDomainPanel;
