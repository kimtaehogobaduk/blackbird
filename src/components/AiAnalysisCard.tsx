import React, { useState } from 'react';
import { Sparkles, ShieldAlert, Cpu, CheckCircle, Copy, Check, BarChart2, Lightbulb } from 'lucide-react';
import { AiProfileAnalysis } from '../types';

interface AiAnalysisCardProps {
  analysis: AiProfileAnalysis;
  isLoading: boolean;
  onRefresh: () => void;
  target: string;
}

export const AiAnalysisCard: React.FC<AiAnalysisCardProps> = ({
  analysis,
  isLoading,
  onRefresh,
  target,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyReport = () => {
    const reportText = `SMARTLAB_EXPERIMENT DIGITAL INTELLIGENCE DOSSIER
Target: ${target}
Digital Footprint: ${analysis.digitalFootprintScore}
Exposure Assessment: ${analysis.exposureRisk}

EXECUTIVE SUMMARY:
${analysis.summary}

BEHAVIORAL ARCHETYPE:
${analysis.behavioralProfile}

STRATEGIC INSIGHTS:
${analysis.keyInsights.map((i) => `- ${i}`).join('\n')}
`;
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getScoreBadge = (score: string) => {
    switch (score) {
      case 'Extensive':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'High':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Moderate':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      default:
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50/60 via-white to-slate-50 border border-indigo-200/90 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-200 mb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-2xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900 font-mono tracking-tight">
                AI BEHAVIORAL & FOOTPRINT INTELLIGENCE
              </h2>
              <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border uppercase font-bold ${getScoreBadge(analysis.digitalFootprintScore)}`}>
                {analysis.digitalFootprintScore} Footprint
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Synthesized behavioral archetype, cluster telemetry, and exposure metrics for "{target}"
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyReport}
            className="flex items-center space-x-1.5 text-xs font-mono text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-300 transition-colors shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Dossier'}</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center space-x-1.5 text-xs font-mono text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg shadow-2xs transition-all font-semibold disabled:opacity-50"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Synthesizing...' : 'Re-Analyze'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Summary & Behavioral Profile */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
            <h3 className="text-xs font-mono font-bold text-indigo-700 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <span>Persona Executive Summary</span>
            </h3>
            <p className="text-sm text-slate-800 leading-relaxed font-sans">
              {analysis.summary}
            </p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
            <h3 className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Behavioral Archetype & Digital Habits</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              {analysis.behavioralProfile}
            </p>
          </div>

          {/* Key Insights */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
            <h3 className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Actionable Intelligence & Findings</span>
            </h3>
            <ul className="space-y-2">
              {analysis.keyInsights.map((insight, idx) => (
                <li key={idx} className="flex items-start space-x-2 text-xs text-slate-700">
                  <CheckCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Category Clusters & Exposure Risk */}
        <div className="space-y-4">
          {/* Exposure Risk Box */}
          <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center space-x-2 text-rose-900 text-xs font-mono font-bold uppercase mb-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Exposure & Correlation Assessment</span>
            </div>
            <p className="text-xs text-rose-950/90 leading-relaxed font-sans">
              {analysis.exposureRisk}
            </p>
          </div>

          {/* Category Clusters */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
            <h3 className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-3">
              Vertical Clusters & Presence
            </h3>
            <div className="space-y-3">
              {analysis.categories.map((cat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-800 font-semibold">{cat.category}</span>
                    <span className="text-indigo-600 font-bold">
                      {Math.round(cat.confidence * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full"
                      style={{ width: `${Math.round(cat.confidence * 100)}%` }}
                    />
                  </div>
                  {cat.description && (
                    <p className="text-[11px] text-slate-500 font-sans">{cat.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiAnalysisCard;
