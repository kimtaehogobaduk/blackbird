import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { FoundAccount, ExtractedMetadata, SearchSiteConfig, AiProfileAnalysis } from './src/types.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// Load data files safely
const dataDir = path.join(process.cwd(), 'data');
let usernameSites: SearchSiteConfig[] = [];
let emailSites: SearchSiteConfig[] = [];
let metadataRules: Record<string, any[]> = {};
let userAgents: string[] = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0',
];
let splashQuotes: string[] = [];

try {
  const wmnPath = path.join(dataDir, 'wmn-data.json');
  if (fs.existsSync(wmnPath)) {
    const raw = JSON.parse(fs.readFileSync(wmnPath, 'utf-8'));
    usernameSites = raw.sites || [];
  }
} catch (e) {
  console.warn('Failed to load wmn-data.json:', e);
}

try {
  const emailPath = path.join(dataDir, 'email-data.json');
  if (fs.existsSync(emailPath)) {
    const raw = JSON.parse(fs.readFileSync(emailPath, 'utf-8'));
    emailSites = raw.sites || [];
  }
} catch (e) {
  console.warn('Failed to load email-data.json:', e);
}

try {
  const metaPath = path.join(dataDir, 'wmn-metadata.json');
  if (fs.existsSync(metaPath)) {
    const raw = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    metadataRules = raw.sites || {};
  }
} catch (e) {
  console.warn('Failed to load wmn-metadata.json:', e);
}

try {
  const uaPath = path.join(dataDir, 'useragents.txt');
  if (fs.existsSync(uaPath)) {
    const lines = fs.readFileSync(uaPath, 'utf-8').split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length > 0) userAgents = lines;
  }
} catch (e) {
  console.warn('Failed to load useragents.txt:', e);
}

function getRandomUserAgent(): string {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

const labMottos = [
  'SMARTLAB_EXPERIMENT Protocol Online.',
  'Autonomous Digital Identity & OSINT Intelligence Laboratory.',
  'High-concurrency multi-vector verification engine.',
  'Real-time metadata enumeration & AI behavioral profiling.',
  'Precision digital footprint analysis across 750+ verified platform nodes.',
];

function getRandomSplash(): string {
  return labMottos[Math.floor(Math.random() * labMottos.length)];
}

function extractMetadata(rules: any[], htmlContent: string, jsonContent: any): ExtractedMetadata[] {
  const extracted: ExtractedMetadata[] = [];
  for (const rule of rules) {
    try {
      let rawVal: any = null;
      if (rule.schema === 'JSON' && jsonContent) {
        let curr = jsonContent;
        if (Array.isArray(rule.path)) {
          for (const key of rule.path) {
            if (curr && typeof curr === 'object' && key in curr) {
              curr = curr[key];
            } else {
              curr = null;
              break;
            }
          }
          rawVal = curr;
        }
      } else if (rule.schema === 'HTML' && htmlContent && typeof rule.path === 'string') {
        const regex = new RegExp(rule.path, 'i');
        const match = htmlContent.match(regex);
        if (match && match[1]) {
          rawVal = match[1].replace(/\n/g, '').trim();
        }
      }

      if (rawVal !== null && rawVal !== undefined && rawVal !== false) {
        let finalVal = rawVal;
        if (rule.prefix && typeof rawVal === 'string') {
          finalVal = rule.prefix + rawVal;
        }

        if (rule.type === 'Array' && Array.isArray(rawVal) && rule['item-path']) {
          const arr: string[] = [];
          for (const item of rawVal) {
            let sub = item;
            for (const k of rule['item-path']) {
              if (sub && typeof sub === 'object' && k in sub) sub = sub[k];
            }
            if (typeof sub === 'string') arr.push(sub);
          }
          extracted.push({
            name: rule.name,
            type: 'Array',
            value: arr,
          });
        } else if (typeof finalVal === 'string' || Array.isArray(finalVal)) {
          extracted.push({
            name: rule.name,
            type: rule.type || 'String',
            value: finalVal,
          });
        }
      }
    } catch {
      // Continue extraction for other rules
    }
  }
  return extracted;
}

// -------------------------------------------------------------
// API Routes
// -------------------------------------------------------------

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Stats and Overview
app.get('/api/stats', (req: Request, res: Response) => {
  const usernameCategories = new Set(usernameSites.map(s => s.cat).filter(Boolean));
  const emailCategories = new Set(emailSites.map(s => s.cat).filter(Boolean));

  res.json({
    totalUsernameSites: usernameSites.length,
    totalEmailSites: emailSites.length,
    usernameCategories: Array.from(usernameCategories).sort(),
    emailCategories: Array.from(emailCategories).sort(),
    splashQuote: getRandomSplash(),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Sites directory explorer
app.get('/api/sites', (req: Request, res: Response) => {
  const type = req.query.type === 'email' ? 'email' : 'username';
  const category = (req.query.category as string) || '';
  const search = ((req.query.q as string) || '').toLowerCase();

  const source = type === 'email' ? emailSites : usernameSites;
  let filtered = source;

  if (category && category !== 'all') {
    filtered = filtered.filter(s => s.cat.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    filtered = filtered.filter(s => s.name.toLowerCase().includes(search) || s.uri_check.toLowerCase().includes(search));
  }

  res.json({
    total: filtered.length,
    sites: filtered.map(s => ({
      name: s.name,
      cat: s.cat,
      uri_check: s.uri_check,
      is_nsfw: s.cat?.toLowerCase().includes('nsfw'),
    })),
  });
});

// Real-time SSE Search Endpoint
app.get('/api/search/stream', async (req: Request, res: Response) => {
  const query = ((req.query.query as string) || '').trim();
  const searchType = req.query.type === 'email' ? 'email' : 'username';
  const category = (req.query.category as string) || 'all';
  const noNsfw = req.query.no_nsfw === 'true';
  const pivotUsername = req.query.pivot === 'true';
  const maxConcurrency = Math.min(Math.max(parseInt(req.query.concurrency as string) || 20, 5), 40);
  const siteLimit = parseInt(req.query.limit as string) || 0;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  // Setup SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  let isClosed = false;
  req.on('close', () => {
    isClosed = true;
  });

  const sendEvent = (event: any) => {
    if (isClosed) return;
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  const startTime = Date.now();

  interface TargetItem {
    site: SearchSiteConfig;
    query: string;
    detectionType: 'email' | 'username_pivot';
  }

  let targets: TargetItem[] = [];

  const filterSite = (site: SearchSiteConfig) => {
    if (noNsfw && (site.cat?.toLowerCase().includes('nsfw') || site.name.toLowerCase().includes('porn') || site.name.toLowerCase().includes('xvideos'))) {
      return false;
    }
    if (category && category !== 'all' && site.cat?.toLowerCase() !== category.toLowerCase()) {
      return false;
    }
    return true;
  };

  if (searchType === 'email') {
    // 1. Direct Email Sites
    const filteredEmailSites = emailSites.filter(filterSite);
    targets = filteredEmailSites.map(site => ({
      site,
      query,
      detectionType: 'email' as const,
    }));

    // 2. If Smart Pivot requested, also search username part across 700+ username sites
    if (pivotUsername && query.includes('@')) {
      const usernamePrefix = query.split('@')[0];
      const filteredUsernameSites = usernameSites.filter(filterSite);
      const pivotTargets = filteredUsernameSites.map(site => ({
        site,
        query: usernamePrefix,
        detectionType: 'username_pivot' as const,
      }));
      targets = [...targets, ...pivotTargets];
    }
  } else {
    // Username search
    const filteredUsernameSites = usernameSites.filter(filterSite);
    targets = filteredUsernameSites.map(site => ({
      site,
      query,
      detectionType: 'username_pivot' as const,
    }));
  }

  if (siteLimit > 0 && targets.length > siteLimit) {
    targets = targets.slice(0, siteLimit);
  }

  sendEvent({
    type: 'init',
    query,
    searchType,
    totalSites: targets.length,
    pivotEnabled: pivotUsername && searchType === 'email',
  });

  let completedCount = 0;
  let foundCount = 0;

  // Check a single site safely
  const checkSingleSite = async (targetItem: TargetItem): Promise<FoundAccount | null> => {
    if (isClosed) return null;

    const { site, query: activeQuery, detectionType } = targetItem;
    let targetUrl = site.uri_check;
    let formattedAccount = activeQuery;

    // Apply input transformations
    if (site.input_operation === 'hash-sha256') {
      const hash = crypto.createHash('sha256').update(activeQuery.trim().toLowerCase()).digest('hex');
      targetUrl = targetUrl.replace(/\{account\}/g, hash);
      formattedAccount = hash;
    } else if (site.input_operation === 'hash-md5') {
      const hash = crypto.createHash('md5').update(activeQuery.trim().toLowerCase()).digest('hex');
      targetUrl = targetUrl.replace(/\{account\}/g, hash);
      formattedAccount = hash;
    } else if (site.input_operation === 'email-username') {
      const handle = activeQuery.includes('@') ? activeQuery.split('@')[0] : activeQuery;
      targetUrl = targetUrl.replace(/\{account\}/g, encodeURIComponent(handle));
      formattedAccount = handle;
    } else if (site.input_operation === 'raw-email') {
      targetUrl = targetUrl.replace(/\{account\}/g, encodeURIComponent(activeQuery.trim()));
    } else {
      targetUrl = targetUrl.replace(/\{account\}/g, encodeURIComponent(activeQuery.trim()));
    }

    // Build Request Body if POST
    let requestBody: string | undefined = undefined;
    if (site.method?.toUpperCase() === 'POST' && site.data) {
      requestBody = site.data.replace(/\{account\}/g, formattedAccount);
    }

    const headers: Record<string, string> = {
      'User-Agent': getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      ...(site.headers || {}),
    };

    if (requestBody && !headers['Content-Type'] && site.data?.startsWith('{')) {
      headers['Content-Type'] = 'application/json';
    }

    const tStart = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7500);

      const fetchRes = await fetch(targetUrl, {
        method: site.method || 'GET',
        headers,
        body: requestBody,
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeoutId);
      const responseTimeMs = Date.now() - tStart;

      const statusCode = fetchRes.status;
      const textContent = await fetchRes.text();

      let jsonContent: any = null;
      try {
        jsonContent = JSON.parse(textContent);
      } catch {
        jsonContent = null;
      }

      const eCode = site.e_code ?? 200;
      const mCode = site.m_code ?? 404;
      const eString = site.e_string;
      const mString = site.m_string;

      let isMatch = false;

      // Status code check
      if (statusCode === eCode) {
        const containsEString = !eString || textContent.includes(eString);
        const containsMString = mString && textContent.includes(mString);

        if (containsEString && !containsMString) {
          if (mCode === eCode || statusCode !== mCode) {
            isMatch = true;
          }
        }
      }

      if (isMatch) {
        // Extract metadata if available
        let metadataList: ExtractedMetadata[] = [];
        const siteRules = metadataRules[site.name] || site.metadata;
        if (siteRules && Array.isArray(siteRules)) {
          metadataList = extractMetadata(siteRules, textContent, jsonContent);
        }

        // Determine user-friendly profile URL
        let displayUrl = targetUrl;
        if (site.profile_url) {
          const userHandle = activeQuery.includes('@') ? activeQuery.split('@')[0] : activeQuery;
          displayUrl = site.profile_url
            .replace(/\{account\}/g, encodeURIComponent(activeQuery.trim()))
            .replace(/\{username\}/g, encodeURIComponent(userHandle));
        }

        return {
          name: site.name,
          url: displayUrl,
          category: site.cat,
          status: 'FOUND',
          metadata: metadataList,
          responseTimeMs,
          detectionType,
        };
      }
    } catch {
      // Fetch error or timeout
    }

    return null;
  };

  // Concurrency runner
  let index = 0;
  const workers = Array.from({ length: maxConcurrency }).map(async () => {
    while (index < targets.length && !isClosed) {
      const targetItem = targets[index++];
      const result = await checkSingleSite(targetItem);
      completedCount++;

      if (result) {
        foundCount++;
        sendEvent({
          type: 'found',
          account: result,
          completed: completedCount,
          total: targets.length,
          foundCount,
        });
      }

      if (completedCount % 5 === 0 || completedCount === targets.length) {
        sendEvent({
          type: 'progress',
          completed: completedCount,
          total: targets.length,
          currentSite: targetItem.site.name,
          foundCount,
        });
      }
    }
  });

  await Promise.all(workers);

  const elapsedSec = Number(((Date.now() - startTime) / 1000).toFixed(1));
  sendEvent({
    type: 'complete',
    totalScanned: targets.length,
    totalFound: foundCount,
    elapsedSec,
  });

  res.end();
});

// AI Profiling Analysis
app.post('/api/ai/analyze', async (req: Request, res: Response) => {
  try {
    const { username, email, foundAccounts } = req.body as {
      username?: string;
      email?: string;
      foundAccounts: FoundAccount[];
    };

    if (!foundAccounts || foundAccounts.length === 0) {
      return res.status(400).json({ error: 'At least one found account is required for analysis' });
    }

    const targetIdentifier = username || email || 'Target subject';
    const siteNames = foundAccounts.map(a => a.name);
    const categories = foundAccounts.map(a => a.category);
    const metadataValues = foundAccounts
      .flatMap(a => (a.metadata || []).map(m => `${a.name} ${m.name}: ${Array.isArray(m.value) ? m.value.join(', ') : m.value}`))
      .slice(0, 20);

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are the AI Behavioral & OSINT Intelligence Engine of Blackbird.
Perform a comprehensive profile and threat footprint analysis on this subject based on their discovered online presence.

Subject: ${targetIdentifier}
Discovered Platforms (${siteNames.length}): ${siteNames.join(', ')}
Categories Detected: ${Array.from(new Set(categories)).join(', ')}
Extracted Profile Metadata: ${metadataValues.length > 0 ? metadataValues.join(' | ') : 'None'}

Return ONLY a valid JSON object matching this schema:
{
  "summary": "2-3 sentences summarizing the digital persona and footprint scope",
  "behavioralProfile": "Detailed paragraph describing personality archetype, online habits, technical literacy, communication patterns, and primary interests",
  "categories": [
    { "category": "Category Name (e.g. Software Development, Gaming, Creative Arts, Social Networking, Cryptography/Finance)", "confidence": 0.95, "description": "Short explanation of signals" }
  ],
  "digitalFootprintScore": "Low" | "Moderate" | "High" | "Extensive",
  "exposureRisk": "Assessment of privacy leakage, handle reuse vulnerability, and OSINT risk level",
  "keyInsights": [
    "Actionable bullet point insight 1",
    "Actionable bullet point insight 2",
    "Actionable bullet point insight 3"
  ]
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text) as AiProfileAnalysis;
          return res.json({ success: true, profile: parsed });
        }
      } catch (geminiError) {
        console.warn('Gemini API call failed, falling back to heuristic engine:', geminiError);
      }
    }

    // High-quality local heuristic OSINT analysis fallback
    const uniqueCats = Array.from(new Set(categories));
    const isTech = categories.some(c => ['coding', 'tech', 'it'].includes(c.toLowerCase()));
    const isGaming = categories.some(c => ['gaming'].includes(c.toLowerCase()));
    const isSocial = categories.some(c => ['social', 'messaging'].includes(c.toLowerCase()));
    const isCreative = categories.some(c => ['art', 'images', 'music', 'design'].includes(c.toLowerCase()));

    const footprintScore: AiProfileAnalysis['digitalFootprintScore'] =
      siteNames.length > 15 ? 'Extensive' : siteNames.length > 7 ? 'High' : siteNames.length > 3 ? 'Moderate' : 'Low';

    const fallbackProfile: AiProfileAnalysis = {
      summary: `Discovered an active digital footprint across ${siteNames.length} services spanning ${uniqueCats.length} primary domains. The handle "${targetIdentifier}" exhibits consistent identifier reuse across distinct vertical platforms.`,
      behavioralProfile: `Analysis of platform distribution reveals an active presence in ${uniqueCats.slice(0, 3).join(', ')}. The presence across ${isTech ? 'developer and technical hubs' : 'communication networks'}${isGaming ? ' combined with gaming networks' : ''} indicates strong digital engagement with standardized identity across services.`,
      categories: [
        ...(isTech ? [{ category: 'Software & Technology', confidence: 0.92, description: 'Direct footprint on code hosting, repositories, and technical developer portals.' }] : []),
        ...(isSocial ? [{ category: 'Social & Communication', confidence: 0.88, description: 'Active identity markers on mainstream and specialized social ecosystems.' }] : []),
        ...(isGaming ? [{ category: 'Gaming & Entertainment', confidence: 0.85, description: 'Gaming profiles and community account registrations.' }] : []),
        ...(isCreative ? [{ category: 'Creative & Media', confidence: 0.80, description: 'Presence on art, photography, or content hosting services.' }] : []),
        { category: 'Identity Standardization', confidence: 0.94, description: 'Consistent username selection indicates calculated personal brand or persistent online persona.' },
      ],
      digitalFootprintScore: footprintScore,
      exposureRisk: footprintScore === 'Extensive' || footprintScore === 'High'
        ? 'High exposure risk: Widespread handle reuse enables trivial correlation across separate social and professional identities.'
        : 'Moderate exposure: Account existence confirms active email/handle registration, but metadata exposure is contained.',
      keyInsights: [
        `Identified ${siteNames.length} active registered accounts under identity "${targetIdentifier}".`,
        `Cross-domain presence detected in: ${uniqueCats.slice(0, 4).join(', ') || 'General'}.`,
        'Correlating extracted timestamps and usernames can further refine subject activity patterns.',
      ],
    };

    return res.json({ success: true, profile: fallbackProfile });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Failed to perform AI analysis' });
  }
});

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Blackbird] OSINT Server running on http://0.0.0.0:${PORT}`);
    console.log(`[Blackbird] Loaded ${usernameSites.length} username sites and ${emailSites.length} email sites.`);
  });
}

startServer();
