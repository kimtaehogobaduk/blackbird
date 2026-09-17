import React from 'react';
import { Clock, CheckCircle2, Radio, Activity, Network } from 'lucide-react';

interface ScanProgressProps {
  completed: number;
  total: number;
  foundCount: number;
  currentSite: string;
  elapsedSec: number;
  isScanning: boolean;
  query: string;
  octopusActive?: boolean;
  octopusChecked?: number;
  octopusTotal?: number;
  octopusVerifiedCount?: number;
}

export const ScanProgress: React.FC<ScanProgressProps> = ({
  completed,
  total,
  foundCount,
  currentSite,
  elapsedSec,
  isScanning,
  query,
  octopusActive,
  octopusChecked = 0,
  octopusTotal = 120,
  octopusVerifiedCount = 0,
}) => {
  const percentage = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          {isScanning ? (
            <div className="relative flex items-center justify-center w-3 h-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
            </div>
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          )}
          <span className="font-mono text-xs font-semibold text-slate-700">
            {isScanning ? 'ACTIVE PROBE' : 'EXPERIMENT COMPLETED'}:
          </span>
          <span className="font-mono text-xs text-indigo-700 font-bold">"{query}"</span>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center space-x-1.5 text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{elapsedSec}s</span>
          </div>

          <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-0.5 rounded-full font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{foundCount} Verified Matches</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
        <div
          className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-500 h-full transition-all duration-200 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Details Bar */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-500">
        <div className="flex items-center space-x-2 truncate">
          <Radio className={`w-3.5 h-3.5 shrink-0 ${isScanning ? 'text-indigo-600 animate-pulse' : 'text-slate-400'}`} />
          <span className="text-slate-400">Target Node:</span>
          <span className="text-slate-800 font-medium truncate">{currentSite || 'Initializing verification queue...'}</span>
        </div>

        <div className="shrink-0 text-slate-600 font-medium">
          <span className="text-indigo-700 font-bold">{completed}</span> / {total} nodes ({percentage}%)
        </div>
      </div>

      {/* Octopus Expansion Mini-status if active */}
      {octopusActive && (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center space-x-2 text-violet-700">
            <span className="w-2 h-2 rounded-full bg-violet-600"></span>
            <span className="font-semibold">Octopus Multi-Domain:</span>
            <span className="text-slate-600">
              {octopusChecked}/{octopusTotal} famous email domains probed
            </span>
          </div>
          <div className="bg-violet-50 text-violet-800 border border-violet-200 px-2 py-0.5 rounded-full font-semibold">
            {octopusVerifiedCount} verified nodes discovered
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanProgress;
