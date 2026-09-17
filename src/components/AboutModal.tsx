import React from 'react';
import { X, Shield, Cpu, Lock, CheckCircle2 } from 'lucide-react';
import { SmartLabLogo } from './SmartLabLogo';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats?: {
    totalUsernameSites?: number;
    totalEmailSites?: number;
    totalFamousDomains?: number;
    splashQuote?: string;
  };
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center p-1.5 shadow-2xs">
              <SmartLabLogo size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-mono tracking-tight">
                SMARTLAB_EXPERIMENT PROTOCOL
              </h2>
              <p className="text-xs text-slate-500 font-mono">System Specification & Research Guidelines</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs font-mono text-slate-600 leading-relaxed">
          <p className="text-slate-800">
            <strong className="text-slate-950 font-bold">SMARTLAB_EXPERIMENT</strong> is an autonomous digital identity intelligence and OSINT verification research platform designed for multi-vector identity correlation, cross-network account verification, and automated behavioral profiling.
          </p>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900">High-Concurrency Scanning:</span>
                <span className="text-slate-600 ml-1">Simultaneous multi-threaded HTTP probing across 750+ digital platforms with zero head-of-line blocking.</span>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900">Email Reverse Trace Engine:</span>
                <span className="text-slate-600 ml-1">Comprehensive 40+ direct platform signatures plus automated handle pivot correlation.</span>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900">AI Intelligence Profiler:</span>
                <span className="text-slate-600 ml-1">Deep behavioral synthesis, cluster classification, and privacy risk indexing powered by server-side Gemini 2.5.</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-900">
            <span className="text-amber-950 font-bold block mb-1">Ethical Research & Compliance:</span>
            This experimental environment operates strictly via public HTTP lookups for legitimate cybersecurity research, personal privacy auditing, and verified identity validation.
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs rounded-xl font-semibold transition-colors shadow-2xs"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
