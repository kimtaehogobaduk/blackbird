import React, { useState } from 'react';
import { ExternalLink, Copy, Check, User, MapPin, FileText } from 'lucide-react';
import { FoundAccount } from '../types';

interface AccountCardProps {
  account: FoundAccount;
}

export const AccountCard: React.FC<AccountCardProps> = ({ account }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(account.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Find avatar in metadata if present
  const avatarMeta = account.metadata?.find(
    (m) => m.name.toLowerCase() === 'avatar' || m.type === 'Image'
  );
  const avatarUrl = typeof avatarMeta?.value === 'string' ? avatarMeta.value : null;

  const nameMeta = account.metadata?.find((m) => m.name.toLowerCase() === 'name');
  const bioMeta = account.metadata?.find((m) => m.name.toLowerCase() === 'bio');
  const locationMeta = account.metadata?.find((m) => m.name.toLowerCase() === 'location');

  const otherMeta = account.metadata?.filter(
    (m) => !['avatar', 'name', 'bio', 'location'].includes(m.name.toLowerCase())
  );

  const getCategoryBadgeClass = (cat: string) => {
    const c = (cat || '').toLowerCase();
    if (c.includes('coding') || c.includes('tech') || c.includes('dev')) {
      return 'bg-sky-50 text-sky-800 border-sky-200';
    }
    if (c.includes('social') || c.includes('chat') || c.includes('messaging')) {
      return 'bg-indigo-50 text-indigo-800 border-indigo-200';
    }
    if (c.includes('gaming')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    if (c.includes('images') || c.includes('art') || c.includes('design')) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    if (c.includes('video') || c.includes('music')) {
      return 'bg-purple-50 text-purple-800 border-purple-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 sm:p-5 transition-all shadow-xs hover:shadow-md group flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center space-x-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={account.name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover border border-slate-200 bg-slate-100 shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-600 font-mono font-bold text-sm">
                {account.name.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-semibold text-slate-900 font-mono group-hover:text-indigo-600 transition-colors">
                  {account.name}
                </h3>
              </div>

              <div className="flex items-center flex-wrap gap-1.5 mt-1">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getCategoryBadgeClass(account.category)}`}>
                  {account.category || 'general'}
                </span>
                {account.detectionType === 'email' && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-rose-50 text-rose-700 border-rose-200 font-medium">
                    Email Match
                  </span>
                )}
                {account.detectionType === 'username_pivot' && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-teal-50 text-teal-800 border-teal-200 font-medium">
                    Handle Pivot
                  </span>
                )}
                {account.responseTimeMs && (
                  <span className="text-[10px] font-mono text-slate-400">
                    {account.responseTimeMs}ms
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-1 shrink-0">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
              title="Copy Profile URL"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <a
              href={account.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-colors"
              title="Visit Verified Node"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Profile URL Preview */}
        <div className="mb-3">
          <a
            href={account.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-slate-600 hover:text-indigo-600 truncate block bg-slate-50 p-2 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
          >
            {account.url}
          </a>
        </div>

        {/* Extracted Metadata (Name, Bio, Location, etc.) */}
        {(nameMeta || bioMeta || locationMeta || (otherMeta && otherMeta.length > 0)) && (
          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            {nameMeta && (
              <div className="flex items-center space-x-1.5 text-slate-800">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-semibold font-mono">{String(nameMeta.value)}</span>
              </div>
            )}

            {locationMeta && (
              <div className="flex items-center space-x-1.5 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="font-mono text-[11px]">{String(locationMeta.value)}</span>
              </div>
            )}

            {bioMeta && (
              <div className="flex items-start space-x-1.5 text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-700 italic line-clamp-3 leading-relaxed">
                  "{String(bioMeta.value)}"
                </p>
              </div>
            )}

            {otherMeta && otherMeta.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {otherMeta.map((m, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200"
                  >
                    {m.name}: {Array.isArray(m.value) ? m.value.slice(0, 3).join(', ') : String(m.value)}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
        <span className="inline-flex items-center space-x-1 text-emerald-700 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>VERIFIED NODE</span>
        </span>
        <a
          href={account.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1"
        >
          <span>Open Node</span>
          <span>→</span>
        </a>
      </div>
    </div>
  );
};

export default AccountCard;
