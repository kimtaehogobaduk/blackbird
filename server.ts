import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dns from 'dns';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { FoundAccount, ExtractedMetadata, SearchSiteConfig, AiProfileAnalysis, OctopusDomainNode } from './src/types.js';

// Universal directory resolution compatible with both ESM (dev) and CJS (production bundle)
const safeDir = typeof __dirname !== 'undefined'
  ? __dirname
  : (typeof import.meta !== 'undefined' && (import.meta as any).url ? path.dirname(fileURLToPath((import.meta as any).url)) : process.cwd());

// Prioritize IPv4 DNS resolution to prevent container IPv6 timeouts
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // Ignored if older Node runtime
}

const args = process.argv.slice(2);
let portArg = 3000;
let hostArg = '0.0.0.0';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && args[i + 1]) {
    portArg = parseInt(args[i + 1], 10);
  }
  if (args[i] === '--host' && args[i + 1]) {
    hostArg = args[i + 1];
  }
}

const PORT = Number(process.env.PORT) || portArg || 3000;
const HOST = process.env.HOST || hostArg || '0.0.0.0';

const app = express();
app.use(express.json());

// Load data files safely
function findDataDir(): string {
  const candidates = [
    path.join(process.cwd(), 'data'),
    path.resolve('data'),
    path.join(safeDir, 'data'),
    path.join(safeDir, '../data'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 'wmn-data.json'))) {
      return c;
    }
  }
  return path.join(process.cwd(), 'data');
}
const dataDir = findDataDir();
let usernameSites: SearchSiteConfig[] = [];
let emailSites: SearchSiteConfig[] = [];
let metadataRules: Record<string, any[]> = {};
let userAgents: string[] = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0',
];

const additionalCoreSites: SearchSiteConfig[] = [
  {
    name: 'OP.GG (리그 오브 레전드)',
    uri_check: 'https://op.gg/lol/summoners/kr/{account}',
    e_code: 200,
    m_code: 404,
    cat: 'gaming',
    profile_url: 'https://op.gg/lol/summoners/kr/{account}',
  },
  {
    name: 'FOW.KR (포우 LOL 전적)',
    uri_check: 'https://www.fow.lol/find/kr/{account}',
    e_code: 200,
    m_code: 404,
    cat: 'gaming',
    profile_url: 'https://www.fow.lol/find/kr/{account}',
  },
  {
    name: 'Minecraft (마인크래프트 공식)',
    uri_check: 'https://api.mojang.com/users/profiles/minecraft/{account}',
    e_code: 200,
    m_code: 404,
    cat: 'gaming',
    profile_url: 'https://namemc.com/profile/{account}',
  },
  {
    name: 'Roblox (로블록스)',
    uri_check: 'https://users.roblox.com/v1/usernames/users',
    e_code: 200,
    m_code: 404,
    cat: 'gaming',
    profile_url: 'https://www.roblox.com/search/users?keyword={account}',
  },
  {
    name: 'Steam Community (스팀)',
    uri_check: 'https://steamcommunity.com/id/{account}',
    e_code: 200,
    m_string: 'The specified profile could not be found',
    cat: 'gaming',
    profile_url: 'https://steamcommunity.com/id/{account}',
  },
  {
    name: 'Chess.com',
    uri_check: 'https://api.chess.com/pub/player/{account}',
    e_code: 200,
    m_code: 404,
    cat: 'gaming',
    profile_url: 'https://www.chess.com/member/{account}',
  },
  {
    name: 'Playentry (엔트리)',
    uri_check: 'https://playentry.org/profile/{account}',
    e_code: 200,
    m_code: 404,
    cat: 'coding',
    profile_url: 'https://playentry.org/profile/{account}',
  },
  {
    name: 'Naver Blog (네이버 블로그)',
    uri_check: 'https://blog.naver.com/{account}',
    e_code: 200,
    m_string: '블로그를 찾을 수 없습니다',
    cat: 'blog',
    profile_url: 'https://blog.naver.com/{account}',
  },
  {
    name: 'Velog (벨로그)',
    uri_check: 'https://velog.io/@{account}',
    e_code: 200,
    m_code: 404,
    cat: 'blog',
    profile_url: 'https://velog.io/@{account}',
  },
  {
    name: 'Tistory (티스토리)',
    uri_check: 'https://{account}.tistory.com',
    e_code: 200,
    m_code: 404,
    cat: 'blog',
    profile_url: 'https://{account}.tistory.com',
  },
  {
    name: 'Kakao Brunch (브런치스토리)',
    uri_check: 'https://brunch.co.kr/@{account}',
    e_code: 200,
    m_code: 404,
    cat: 'blog',
    profile_url: 'https://brunch.co.kr/@{account}',
  },
  {
    name: 'Baekjoon Online Judge (백준 BOJ)',
    uri_check: 'https://www.acmicpc.net/user/{account}',
    e_code: 200,
    m_code: 404,
    cat: 'coding',
    profile_url: 'https://www.acmicpc.net/user/{account}',
  },
  {
    name: 'solved.ac (솔브드)',
    uri_check: 'https://solved.ac/profile/{account}',
    e_code: 200,
    m_code: 404,
    cat: 'coding',
    profile_url: 'https://solved.ac/profile/{account}',
  },
  {
    name: 'Programmers (프로그래머스)',
    uri_check: 'https://programmers.co.kr/users/{account}',
    e_code: 200,
    m_code: 404,
    cat: 'coding',
    profile_url: 'https://programmers.co.kr/users/{account}',
  },
  {
    name: 'Inflearn (인프런)',
    uri_check: 'https://www.inflearn.com/users/{account}',
    e_code: 200,
    m_code: 404,
    cat: 'coding',
    profile_url: 'https://www.inflearn.com/users/{account}',
  },
  {
    name: 'Wanted (원티드)',
    uri_check: 'https://www.wanted.co.kr/profile/{account}',
    e_code: 200,
    m_code: 404,
    cat: 'business',
    profile_url: 'https://www.wanted.co.kr/profile/{account}',
  },
  {
    name: 'Remember (리멤버)',
    uri_check: 'https://career.rememberapp.co.kr/profile/{account}',
    e_code: 200,
    m_code: 404,
    cat: 'business',
    profile_url: 'https://career.rememberapp.co.kr/profile/{account}',
  },
  {
    name: 'Watcha Pedia (왓챠피디아)',
    uri_check: 'https://pedia.watcha.com/ko-KR/users/{account}',
    e_code: 200,
    m_code: 404,
    cat: 'entertainment',
    profile_url: 'https://pedia.watcha.com/ko-KR/users/{account}',
  },
  {
    name: 'Maple.gg (메이플지지)',
    uri_check: 'https://maple.gg/u/{account}',
    e_code: 200,
    m_string: '검색결과가 없습니다',
    cat: 'gaming',
    profile_url: 'https://maple.gg/u/{account}',
  },
  {
    name: 'DAK.GG PUBG (배틀그라운드)',
    uri_check: 'https://dak.gg/pubg/profile/{account}',
    e_code: 200,
    m_code: 404,
    cat: 'gaming',
    profile_url: 'https://dak.gg/pubg/profile/{account}',
  },
  {
    name: 'Tracker.gg (Valorant)',
    uri_check: 'https://tracker.gg/valorant/profile/riot/{account}/overview',
    e_code: 200,
    m_code: 404,
    cat: 'gaming',
    profile_url: 'https://tracker.gg/valorant/profile/riot/{account}/overview',
  },
  {
    name: 'Battle.net (오버워치)',
    uri_check: 'https://overwatch.blizzard.com/ko-kr/career/{account}/',
    e_code: 200,
    m_code: 404,
    cat: 'gaming',
    profile_url: 'https://overwatch.blizzard.com/ko-kr/career/{account}/',
  },
  {
    name: 'Threads (스레드)',
    uri_check: 'https://www.threads.net/@{account}',
    e_code: 200,
    m_code: 404,
    cat: 'social',
    profile_url: 'https://www.threads.net/@{account}',
  },
  {
    name: 'Bluesky (블루스카이)',
    uri_check: 'https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor={account}.bsky.social',
    e_code: 200,
    m_code: 400,
    cat: 'social',
    profile_url: 'https://bsky.app/profile/{account}.bsky.social',
  },
  {
    name: 'TikTok (틱톡)',
    uri_check: 'https://www.tiktok.com/@{account}',
    e_code: 200,
    m_code: 404,
    cat: 'social',
    profile_url: 'https://www.tiktok.com/@{account}',
  },
  {
    name: 'Pinterest (핀터레스트)',
    uri_check: 'https://www.pinterest.com/{account}/',
    e_code: 200,
    m_code: 404,
    cat: 'social',
    profile_url: 'https://www.pinterest.com/{account}/',
  },
  {
    name: 'Notion (노션 퍼블릭)',
    uri_check: 'https://{account}.notion.site',
    e_code: 200,
    m_code: 404,
    cat: 'tech',
    profile_url: 'https://{account}.notion.site',
  },
  {
    name: 'Substack (서브스택)',
    uri_check: 'https://{account}.substack.com',
    e_code: 200,
    m_code: 404,
    cat: 'blog',
    profile_url: 'https://{account}.substack.com',
  },
  {
    name: 'Medium (미디엄)',
    uri_check: 'https://medium.com/@{account}',
    e_code: 200,
    m_code: 404,
    cat: 'blog',
    profile_url: 'https://medium.com/@{account}',
  },
  {
    name: 'Discord (디스코드)',
    uri_check: 'https://discord.com/users/{account}',
    e_code: 200,
    m_code: 404,
    cat: 'social',
    profile_url: 'https://discord.com/users/{account}',
  },
  {
    name: 'Telegram (텔레그램)',
    uri_check: 'https://t.me/{account}',
    e_code: 200,
    m_string: 'tgme_page_extra',
    cat: 'social',
    profile_url: 'https://t.me/{account}',
  },
  {
    name: 'Spotify (스포티파이)',
    uri_check: 'https://open.spotify.com/user/{account}',
    e_code: 200,
    m_code: 404,
    cat: 'music',
    profile_url: 'https://open.spotify.com/user/{account}',
  },
  {
    name: 'SoundCloud (사운드클라우드)',
    uri_check: 'https://soundcloud.com/{account}',
    e_code: 200,
    m_code: 404,
    cat: 'music',
    profile_url: 'https://soundcloud.com/{account}',
  },
  {
    name: 'GitLab (깃랩)',
    uri_check: 'https://gitlab.com/{account}',
    e_code: 200,
    m_code: 404,
    cat: 'coding',
    profile_url: 'https://gitlab.com/{account}',
  },
  {
    name: 'Docker Hub (도커허브)',
    uri_check: 'https://hub.docker.com/u/{account}',
    e_code: 200,
    m_code: 404,
    cat: 'coding',
    profile_url: 'https://hub.docker.com/u/{account}',
  },
  {
    name: 'NPM (엔피엠 개발자)',
    uri_check: 'https://www.npmjs.com/~{account}',
    e_code: 200,
    m_code: 404,
    cat: 'coding',
    profile_url: 'https://www.npmjs.com/~{account}',
  },
  {
    name: 'ProductHunt (프로덕트헌트)',
    uri_check: 'https://www.producthunt.com/@{account}',
    e_code: 200,
    m_code: 404,
    cat: 'tech',
    profile_url: 'https://www.producthunt.com/@{account}',
  },
  {
    name: 'BuyMeACoffee (후원 프로필)',
    uri_check: 'https://www.buymeacoffee.com/{account}',
    e_code: 200,
    m_code: 404,
    cat: 'business',
    profile_url: 'https://www.buymeacoffee.com/{account}',
  },
  {
    name: 'Kaggle (캐글)',
    uri_check: 'https://www.kaggle.com/{account}',
    e_code: 200,
    m_code: 404,
    cat: 'coding',
    profile_url: 'https://www.kaggle.com/{account}',
  },
  {
    name: 'Hugging Face (허깅페이스)',
    uri_check: 'https://huggingface.co/{account}',
    e_code: 200,
    m_code: 404,
    cat: 'coding',
    profile_url: 'https://huggingface.co/{account}',
  },
  {
    name: 'LeetCode (리트코드)',
    uri_check: 'https://leetcode.com/{account}/',
    e_code: 200,
    m_code: 404,
    cat: 'coding',
    profile_url: 'https://leetcode.com/{account}/',
  },
  {
    name: 'GeekNews (긱뉴스)',
    uri_check: 'https://news.hada.io/user?id={account}',
    e_code: 200,
    m_code: 404,
    cat: 'news',
    profile_url: 'https://news.hada.io/user?id={account}',
  },
  {
    name: 'YouTube Channel (유튜브)',
    uri_check: 'https://www.youtube.com/@{account}',
    e_code: 200,
    m_code: 404,
    cat: 'video',
    profile_url: 'https://www.youtube.com/@{account}',
  },
  {
    name: 'Twitch (트위치)',
    uri_check: 'https://www.twitch.tv/{account}',
    e_code: 200,
    m_code: 404,
    cat: 'video',
    profile_url: 'https://www.twitch.tv/{account}',
  },
  {
    name: 'Band (네이버 밴드)',
    uri_check: 'https://band.us/@{account}',
    e_code: 200,
    m_string: "bandNo: ''",
    cat: 'social',
    profile_url: 'https://band.us/@{account}',
  },
  {
    name: 'Linktree (링크트리)',
    uri_check: 'https://linktr.ee/{account}',
    e_code: 200,
    m_code: 404,
    cat: 'social',
    profile_url: 'https://linktr.ee/{account}',
  },
  {
    name: 'Carrd (카드 프로필)',
    uri_check: 'https://{account}.carrd.co',
    e_code: 200,
    m_code: 404,
    cat: 'tech',
    profile_url: 'https://{account}.carrd.co',
  },
];

try {
  const wmnPath = path.join(dataDir, 'wmn-data.json');
  if (fs.existsSync(wmnPath)) {
    const raw = JSON.parse(fs.readFileSync(wmnPath, 'utf-8'));
    usernameSites = raw.sites || [];
  }
} catch (e) {
  console.warn('Failed to load wmn-data.json:', e);
}

// Ensure additionalCoreSites are merged into usernameSites
for (const extra of additionalCoreSites) {
  if (!usernameSites.some(s => s.name.toLowerCase() === extra.name.toLowerCase())) {
    usernameSites.unshift(extra);
  }
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

// -------------------------------------------------------------
// Entry (엔트리 - playentry.org) Custom High-Precision Probe
// -------------------------------------------------------------
let cachedEntryCsrf: { secret: string; token: string; time: number } | null = null;

async function probeEntryCustom(query: string, isEmail: boolean): Promise<boolean> {
  try {
    if (!cachedEntryCsrf || Date.now() - cachedEntryCsrf.time > 300000) {
      const csrfRes = await fetch('https://playentry.org', {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
      });
      const cookie = csrfRes.headers.get('set-cookie');
      const secret = cookie?.match(/_csrf=([^;]+)/)?.[1];
      if (secret) {
        const salt = crypto.randomBytes(8).toString('base64url').slice(0, 8);
        const hash = crypto.createHash('sha1').update(`${salt}-${secret}`).digest('base64url');
        cachedEntryCsrf = { secret, token: `${salt}-${hash}`, time: Date.now() };
      }
    }

    if (!cachedEntryCsrf) return false;

    const bodyQuery = isEmail
      ? 'query CHECK_EXISTS_EMAIL($email: String) { existsUser(email: $email) { exists } }'
      : 'query CHECK_EXISTS_USERNAME($username: String) { existsUser(username: $username) { exists } }';

    const variables = isEmail ? { email: query } : { username: query };

    const res = await fetch('https://playentry.org/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Cookie: `_csrf=${cachedEntryCsrf.secret}`,
        'x-csrf-token': cachedEntryCsrf.token,
        'csrf-token': cachedEntryCsrf.token,
      },
      body: JSON.stringify({ query: bodyQuery, variables }),
    });

    const json: any = await res.json().catch(() => null);
    return Boolean(json?.data?.existsUser?.exists);
  } catch {
    return false;
  }
}

// -------------------------------------------------------------
// Roblox (로블록스) Official API Probe
// -------------------------------------------------------------
async function probeRoblox(username: string): Promise<{ exists: boolean; id?: number; displayName?: string } | null> {
  try {
    const res = await fetch('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
    });
    if (!res.ok) return null;
    const json: any = await res.json().catch(() => null);
    if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
      const u = json.data[0];
      return { exists: true, id: u.id, displayName: u.displayName };
    }
    return { exists: false };
  } catch {
    return null;
  }
}

// -------------------------------------------------------------
// GitHub Official REST API Custom Probe
// -------------------------------------------------------------
async function probeGitHubCustom(
  username: string
): Promise<{ exists: boolean; login?: string; avatarUrl?: string; name?: string; publicRepos?: number } | null> {
  try {
    const clean = username.trim();
    if (!clean) return null;
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(clean)}`, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (res.status === 200) {
      const data = await res.json().catch(() => null);
      if (data?.login) {
        return {
          exists: true,
          login: data.login,
          avatarUrl: data.avatar_url,
          name: data.name || data.login,
          publicRepos: data.public_repos,
        };
      }
    }
    return { exists: false };
  } catch {
    return null;
  }
}

// -------------------------------------------------------------
// GitLab Official REST API Custom Probe
// -------------------------------------------------------------
async function probeGitLabCustom(
  username: string
): Promise<{ exists: boolean; name?: string; webUrl?: string; avatarUrl?: string } | null> {
  try {
    const clean = username.trim();
    if (!clean) return null;
    const res = await fetch(`https://gitlab.com/api/v4/users?username=${encodeURIComponent(clean)}`, {
      headers: {
        'User-Agent': getRandomUserAgent(),
      },
    });
    if (res.status === 200) {
      const data = await res.json().catch(() => null);
      if (Array.isArray(data) && data.length > 0) {
        const u = data[0];
        return {
          exists: true,
          name: u.name || u.username,
          webUrl: u.web_url || `https://gitlab.com/${encodeURIComponent(clean)}`,
          avatarUrl: u.avatar_url,
        };
      }
    }
    return { exists: false };
  } catch {
    return null;
  }
}

// -------------------------------------------------------------
// League of Legends (LoL / Riot Games) OP.GG Probe
// -------------------------------------------------------------
async function probeLolOpgg(
  query: string
): Promise<{ exists: boolean; profileUrl: string; summoner?: string } | null> {
  try {
    const clean = query.trim();
    if (!clean) return null;
    let tagCandidate = clean;
    if (clean.includes('#')) {
      tagCandidate = clean.replace('#', '-');
    } else {
      tagCandidate = `${clean}-KR1`;
    }

    const testUrl = `https://op.gg/lol/summoners/kr/${encodeURIComponent(tagCandidate)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(testUrl, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeoutId);

    if (res.status === 200) {
      const text = await res.text();
      const titleMatch = text.match(/<title>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].replace(' - Summoner stats - League of Legends', '').trim() : tagCandidate;
      return {
        exists: true,
        profileUrl: `https://op.gg/lol/summoners/kr/${encodeURIComponent(tagCandidate)}`,
        summoner: title,
      };
    }

    if (!clean.includes('#')) {
      const directUrl = `https://op.gg/lol/summoners/kr/${encodeURIComponent(clean)}`;
      const c2 = new AbortController();
      const t2 = setTimeout(() => c2.abort(), 3500);
      const r2 = await fetch(directUrl, {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
        },
        signal: c2.signal,
        redirect: 'follow',
      });
      clearTimeout(t2);
      if (r2.status === 200) {
        return {
          exists: true,
          profileUrl: directUrl,
          summoner: clean,
        };
      }
    }

    return { exists: false, profileUrl: testUrl };
  } catch {
    return null;
  }
}

// -------------------------------------------------------------
// League of Legends FOW.KR / FOW.LOL Probe
// -------------------------------------------------------------
async function probeFowLol(
  query: string
): Promise<{ exists: boolean; profileUrl: string; tier?: string; summoner?: string } | null> {
  try {
    const clean = query.trim().replace('#', ' ');
    if (!clean) return null;
    const testUrl = `https://www.fow.lol/find/kr/${encodeURIComponent(clean)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(testUrl, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeoutId);

    if (res.status === 200) {
      const html = await res.text();
      if (html.includes('tier_rank_box')) {
        const match = html.match(/<DIV class='tier_rank_box[^']*'>([^<]+)<\/DIV>([^<]+)/i);
        const tier = match ? match[1].trim() : undefined;
        const summoner = match ? match[2].trim() : clean;
        return {
          exists: true,
          profileUrl: testUrl,
          tier,
          summoner,
        };
      }
    }
    return { exists: false, profileUrl: testUrl };
  } catch {
    return null;
  }
}

// -------------------------------------------------------------
// Minecraft Mojang Official API Probe
// -------------------------------------------------------------
async function probeMinecraft(
  username: string
): Promise<{ exists: boolean; id?: string; name?: string } | null> {
  try {
    const clean = username.trim();
    if (!clean || clean.length < 3 || clean.length > 16) return { exists: false };
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(clean)}`, {
      headers: {
        'User-Agent': getRandomUserAgent(),
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.status === 200) {
      const json: any = await res.json().catch(() => null);
      if (json && json.id && json.name) {
        return { exists: true, id: json.id, name: json.name };
      }
    }
    return { exists: false };
  } catch {
    return null;
  }
}

// -------------------------------------------------------------
// Steam Community Profile Probe
// -------------------------------------------------------------
async function probeSteam(
  account: string
): Promise<{ exists: boolean; profileUrl: string; displayName?: string } | null> {
  try {
    const clean = account.trim();
    if (!clean) return null;
    const url = `https://steamcommunity.com/id/${encodeURIComponent(clean)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const text = await res.text();
    if (text.includes('The specified profile could not be found.')) return { exists: false, profileUrl: url };
    const titleMatch = text.match(/<title>Steam Community :: ([^<]+)<\/title>/i);
    if (titleMatch) {
      return { exists: true, profileUrl: res.url, displayName: titleMatch[1].trim() };
    }
    return { exists: false, profileUrl: url };
  } catch {
    return null;
  }
}

// -------------------------------------------------------------
// 120 Famous Email Providers for Octopus Multi-Domain Expansion
// -------------------------------------------------------------
export interface FamousEmailDomain {
  domain: string;
  name: string;
  category: 'Korea Major' | 'Global Giant' | 'Secure & Privacy' | 'International' | 'ISP & Legacy';
}

let famousDomains: FamousEmailDomain[] = [];
try {
  const fdPath = path.join(dataDir, 'famous-domains.json');
  if (fs.existsSync(fdPath)) {
    famousDomains = JSON.parse(fs.readFileSync(fdPath, 'utf-8'));
  }
} catch (e) {
  console.warn('Failed to load famous-domains.json:', e);
}

if (famousDomains.length === 0) {
  famousDomains = [
    { domain: 'naver.com', name: 'Naver Mail', category: 'Korea Major' },
    { domain: 'gmail.com', name: 'Google Gmail', category: 'Global Giant' },
    { domain: 'daum.net', name: 'Daum Mail', category: 'Korea Major' },
    { domain: 'kakao.com', name: 'Kakao Mail', category: 'Korea Major' },
    { domain: 'hanmail.net', name: 'Hanmail (Daum)', category: 'Korea Major' },
    { domain: 'nate.com', name: 'Nate Mail', category: 'Korea Major' },
    { domain: 'outlook.com', name: 'Microsoft Outlook', category: 'Global Giant' },
    { domain: 'hotmail.com', name: 'Microsoft Hotmail', category: 'Global Giant' },
    { domain: 'yahoo.com', name: 'Yahoo Mail', category: 'Global Giant' },
    { domain: 'icloud.com', name: 'Apple iCloud', category: 'Global Giant' },
    { domain: 'proton.me', name: 'Proton Mail', category: 'Secure & Privacy' },
  ];
}

export const FAMOUS_EMAIL_DOMAINS: FamousEmailDomain[] = famousDomains;

/**
 * Provider-specific username syntax rules
 */
function validateProviderHandleSyntax(handle: string, domain: string): { valid: boolean; reason?: string } {
  const h = handle.trim().toLowerCase();
  if (!h || h.length < 1) return { valid: false, reason: 'Empty handle' };

  if (domain === 'naver.com') {
    if (h.length < 5 || h.length > 20) return { valid: false, reason: 'Naver requires 5-20 characters' };
    if (!/^[a-z0-9_-]+$/.test(h)) return { valid: false, reason: 'Naver permits only alphanumeric, _, -' };
    return { valid: true };
  }
  if (domain === 'gmail.com') {
    if (h.length < 6 || h.length > 30) return { valid: false, reason: 'Gmail requires 6-30 characters' };
    if (!/^[a-z0-9.]+$/.test(h)) return { valid: false, reason: 'Gmail permits only alphanumeric and .' };
    if (h.startsWith('.') || h.endsWith('.')) return { valid: false, reason: 'Gmail handle cannot start/end with dot' };
    return { valid: true };
  }
  if (domain === 'daum.net' || domain === 'hanmail.net') {
    if (h.length < 3 || h.length > 15) return { valid: false, reason: 'Daum requires 3-15 characters' };
    if (!/^[a-z0-9_-]+$/.test(h)) return { valid: false, reason: 'Daum permits only alphanumeric, _, -' };
    return { valid: true };
  }
  if (domain === 'kakao.com') {
    if (h.length < 4 || h.length > 20) return { valid: false, reason: 'Kakao requires 4-20 characters' };
    if (!/^[a-z0-9._-]+$/.test(h)) return { valid: false, reason: 'Kakao permits only alphanumeric, ., _, -' };
    return { valid: true };
  }
  if (domain === 'nate.com') {
    if (h.length < 4 || h.length > 15) return { valid: false, reason: 'Nate requires 4-15 characters' };
    if (!/^[a-z0-9]+$/.test(h)) return { valid: false, reason: 'Nate permits only alphanumeric characters' };
    return { valid: true };
  }
  if (domain === 'yahoo.com' || domain === 'yahoo.co.kr') {
    if (h.length < 4 || h.length > 32) return { valid: false, reason: 'Yahoo requires 4-32 characters' };
    if (!/^[a-z][a-z0-9._]+$/.test(h)) return { valid: false, reason: 'Yahoo must start with letter' };
    return { valid: true };
  }
  if (domain === 'proton.me' || domain === 'protonmail.com') {
    if (h.length < 1 || h.length > 40) return { valid: false, reason: 'Proton requires 1-40 characters' };
    if (!/^[a-z0-9._-]+$/.test(h)) return { valid: false, reason: 'Proton permits only alphanumeric, ., _, -' };
    return { valid: true };
  }
  if (domain === 'outlook.com' || domain === 'hotmail.com' || domain === 'live.com') {
    if (h.length < 1 || h.length > 64) return { valid: false, reason: 'Outlook requires 1-64 characters' };
    if (!/^[a-z0-9._-]+$/.test(h)) return { valid: false, reason: 'Outlook permits only alphanumeric, ., _, -' };
    return { valid: true };
  }
  if (domain === 'icloud.com') {
    if (h.length < 3 || h.length > 64) return { valid: false, reason: 'iCloud requires 3-64 characters' };
    if (!/^[a-z0-9._-]+$/.test(h)) return { valid: false, reason: 'iCloud syntax error' };
    return { valid: true };
  }

  // General RFC 5322 local-part
  if (h.length < 1 || h.length > 64) return { valid: false, reason: 'Length must be 1-64 characters' };
  if (!/^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+$/i.test(h)) return { valid: false, reason: 'Illegal characters in local-part' };
  return { valid: true };
}

// Global DNS MX resolution cache to accelerate multi-domain queries
const dnsMxCache = new Map<string, boolean>();
async function domainHasValidMx(domain: string): Promise<boolean> {
  if (dnsMxCache.has(domain)) return dnsMxCache.get(domain)!;
  try {
    const mxList = await dns.promises.resolveMx(domain);
    const hasMx = Boolean(mxList && mxList.length > 0);
    dnsMxCache.set(domain, hasMx);
    return hasMx;
  } catch {
    dnsMxCache.set(domain, false);
    return false;
  }
}

/**
 * Probe identity existence for a handle on a specific email domain
 * Combines real DNS MX routing, provider handle grammar validation, and strict public identity anchor proofs.
 */
async function probeEmailDomainIdentity(
  handle: string,
  d: FamousEmailDomain,
  targetEmailQuery?: string
): Promise<OctopusDomainNode | null> {
  const candidateEmail = `${handle.trim().toLowerCase()}@${d.domain.toLowerCase()}`;
  const t0 = Date.now();
  const identityProofs: string[] = [];
  let avatarUrl: string | undefined = undefined;

  const isExactTarget = Boolean(
    targetEmailQuery && targetEmailQuery.trim().toLowerCase() === candidateEmail.toLowerCase()
  );

  // 1. Verify Provider Username Grammar & Constraints (Always allow user-specified target email)
  const syntaxCheck = validateProviderHandleSyntax(handle, d.domain);
  if (!syntaxCheck.valid && !isExactTarget) {
    return null;
  }

  // 2. Real DNS MX Routing Verification (Cached)
  const hasMx = await domainHasValidMx(d.domain);
  if (!hasMx) {
    return null; // Domain has no active MX records
  }

  if (isExactTarget) {
    identityProofs.push('Target Specified Address (Confirmed User Query)');
    identityProofs.push('Active Mail Server (DNS MX Verified)');
  }

  // 3. Universal & Regional Strict Positive Identity Anchors (Concurrent execution)
  const sha256 = crypto.createHash('sha256').update(candidateEmail).digest('hex');
  const md5 = crypto.createHash('md5').update(candidateEmail).digest('hex');

  const ctrl = new AbortController();
  const probeTimeout = setTimeout(() => ctrl.abort(), 1800);

  // A. Naver (Korea #1): allocates blog PostList with var mylogURL for registered members
  const naverPromise = (d.domain === 'naver.com')
    ? fetch(`https://blog.naver.com/PostList.naver?blogId=${encodeURIComponent(handle)}`, {
        headers: { 'User-Agent': getRandomUserAgent() },
        signal: ctrl.signal,
      })
        .then(async (res) => {
          if (res.status === 200) {
            const body = await res.text();
            if (body.includes('var mylogURL') && !body.includes('블로그를 찾을 수 없습니다')) {
              return { signal: 'Naver Platform Registered User' };
            }
          }
          return null;
        })
        .catch(() => null)
    : Promise.resolve(null);

  // B. Kakao Brunch (Korea #1 Writer/Essay platform)
  const brunchPromise = (d.domain === 'kakao.com')
    ? fetch(`https://brunch.co.kr/@${encodeURIComponent(handle)}`, {
        headers: { 'User-Agent': getRandomUserAgent() },
        signal: ctrl.signal,
      })
        .then(async (res) => {
          if (res.status === 200) {
            const body = await res.text();
            if (body.includes('작가소개')) {
              return { signal: 'Kakao Brunch Registered Author' };
            }
          }
          return null;
        })
        .catch(() => null)
    : Promise.resolve(null);

  // C. Ubuntu OpenPGP Global Keyserver (Official Cryptographic Email Record for candidate email)
  const isGlobalOrTarget = Boolean(
    isExactTarget ||
    d.category === 'Global Giant' ||
    d.category === 'Secure & Privacy' ||
    d.domain === 'gmail.com' ||
    d.domain === 'outlook.com' ||
    d.domain === 'proton.me' ||
    d.domain === 'protonmail.com' ||
    d.domain === 'yahoo.com' ||
    d.domain === 'icloud.com' ||
    d.domain === 'tuta.com'
  );

  const openPgpPromise = isGlobalOrTarget
    ? fetch(
        `https://keyserver.ubuntu.com/pks/lookup?op=get&search=${encodeURIComponent(candidateEmail)}`,
        {
          headers: { 'User-Agent': getRandomUserAgent() },
          signal: ctrl.signal,
        }
      )
        .then(async (res) => {
          if (res.status === 200) {
            const txt = await res.text();
            if (txt.includes('BEGIN PGP PUBLIC KEY BLOCK')) {
              return { signal: 'OpenPGP Verified Public Key' };
            }
          }
          return null;
        })
        .catch(() => null)
    : Promise.resolve(null);

  // D. Gravatar Profile JSON (SHA256 hash of exact candidate email)
  const gravatarProfilePromise = fetch(`https://gravatar.com/${sha256}.json`, {
    headers: { 'User-Agent': getRandomUserAgent() },
    signal: ctrl.signal,
  })
    .then(async (res) => {
      if (res.status === 200) {
        const gData = await res.json().catch(() => null);
        if (gData?.entry?.[0]) {
          return {
            signal: 'Gravatar Verified Profile',
            avatar: gData.entry[0].thumbnailUrl as string | undefined,
          };
        }
      }
      return null;
    })
    .catch(() => null);

  // E. Gravatar Avatar HEAD (MD5 hash of exact candidate email)
  const gravatarAvatarPromise = fetch(`https://www.gravatar.com/avatar/${md5}?d=404`, {
    method: 'HEAD',
    headers: { 'User-Agent': getRandomUserAgent() },
    signal: ctrl.signal,
  })
    .then((res) => {
      if (res.status === 200) {
        return {
          signal: 'Gravatar Registered Avatar',
          avatar: `https://www.gravatar.com/avatar/${md5}`,
        };
      }
      return null;
    })
    .catch(() => null);

  // F. Google / YouTube Public Handle & Profile Photo
  const isGoogle = (d.domain === 'gmail.com' || d.domain === 'googlemail.com');
  const googlePromise = isGoogle
    ? Promise.allSettled([
        fetch(`https://www.youtube.com/@${encodeURIComponent(handle)}`, {
          headers: { 'User-Agent': getRandomUserAgent() },
          signal: ctrl.signal,
        }).then(async (res) => {
          if (res.status === 200) {
            const txt = await res.text();
            if (txt.includes('itemprop="name"') || txt.includes('channelId') || txt.includes('canonical')) {
              return { signal: 'Google Account / YouTube Handle Active' };
            }
          }
          return null;
        }),
        fetch(`https://profiles.google.com/s2/photos/profile/${encodeURIComponent(candidateEmail)}?sz=80`, {
          headers: { 'User-Agent': getRandomUserAgent() },
          signal: ctrl.signal,
        }).then((res) => {
          if (res.status === 200) {
            return {
              signal: 'Google Profile Photo Verified',
              avatar: `https://profiles.google.com/s2/photos/profile/${encodeURIComponent(candidateEmail)}?sz=80`,
            };
          }
          return null;
        }),
      ])
        .then((results) => {
          for (const r of results) {
            if (r.status === 'fulfilled' && r.value) return r.value;
          }
          return null;
        })
        .catch(() => null)
    : Promise.resolve(null);

  // G. Microsoft / Outlook / Hotmail Account Probe
  const isMicrosoft = (d.domain === 'outlook.com' || d.domain === 'hotmail.com' || d.domain === 'live.com' || d.domain === 'msn.com');
  const outlookPromise = isMicrosoft
    ? fetch(`https://odc.officeapps.live.com/live/account/getavatar?email=${encodeURIComponent(candidateEmail)}`, {
        headers: { 'User-Agent': getRandomUserAgent() },
        signal: ctrl.signal,
      })
        .then((res) => {
          if (res.status === 200) {
            return {
              signal: 'Microsoft / Outlook Registered Account',
              avatar: `https://odc.officeapps.live.com/live/account/getavatar?email=${encodeURIComponent(candidateEmail)}`,
            };
          }
          return null;
        })
        .catch(() => null)
    : Promise.resolve(null);

  // H. Kakao Daum / Tistory
  const isDaum = (d.domain === 'daum.net' || d.domain === 'hanmail.net');
  const daumPromise = isDaum
    ? fetch(`https://${encodeURIComponent(handle)}.tistory.com`, {
        headers: { 'User-Agent': getRandomUserAgent() },
        signal: ctrl.signal,
      })
        .then(async (res) => {
          if (res.status === 200) {
            return { signal: 'Kakao Daum / Tistory Registered User' };
          }
          return null;
        })
        .catch(() => null)
    : Promise.resolve(null);

  // I. GitHub Developer Check
  const githubPromise = (d.domain === 'github.com' || isExactTarget)
    ? fetch(`https://api.github.com/users/${encodeURIComponent(handle)}`, {
        headers: {
          'User-Agent': getRandomUserAgent(),
          Accept: 'application/vnd.github.v3+json',
        },
        signal: ctrl.signal,
      })
        .then(async (res) => {
          if (res.status === 200) {
            const data = await res.json().catch(() => null);
            if (data?.login) {
              return {
                signal: 'GitHub Developer Profile Registered',
                avatar: data.avatar_url as string | undefined,
              };
            }
          }
          return null;
        })
        .catch(() => null)
    : Promise.resolve(null);

  const [
    naverRes,
    brunchRes,
    openPgpRes,
    profileRes,
    avatarRes,
    googleRes,
    outlookRes,
    daumRes,
    githubRes,
  ] = await Promise.all([
    naverPromise,
    brunchPromise,
    openPgpPromise,
    gravatarProfilePromise,
    gravatarAvatarPromise,
    googlePromise,
    outlookPromise,
    daumPromise,
    githubPromise,
  ]);
  clearTimeout(probeTimeout);

  const candidateResults = [
    naverRes,
    brunchRes,
    openPgpRes,
    profileRes,
    avatarRes,
    googleRes,
    outlookRes,
    daumRes,
    githubRes,
  ];

  for (const r of candidateResults) {
    if (r) {
      identityProofs.push(r.signal);
      if (!avatarUrl && r.avatar) {
        avatarUrl = r.avatar;
      }
    }
  }

  // CRITICAL ANTI-HALLUCINATION / USER OPTION B:
  // If no positive identity anchor confirmed that this account exists and it is not the user's explicit target, return null!
  if (identityProofs.length === 0 && !isExactTarget) {
    return null;
  }

  const responseTimeMs = Date.now() - t0;

  return {
    domain: d.domain,
    email: candidateEmail,
    status: 'VERIFIED',
    providerName: d.name,
    category: d.category,
    avatarUrl,
    signals: identityProofs,
    responseTimeMs,
    isTarget: isExactTarget,
  };
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
            if (sub && typeof sub === 'string') arr.push(sub);
          }
          finalVal = arr;
        }

        if (finalVal) {
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
    totalFamousDomains: FAMOUS_EMAIL_DOMAINS.length,
    usernameCategories: Array.from(usernameCategories).sort(),
    emailCategories: Array.from(emailCategories).sort(),
    splashQuote: getRandomSplash(),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Famous Domains Catalog
app.get('/api/octopus/domains', (req: Request, res: Response) => {
  res.json({
    total: FAMOUS_EMAIL_DOMAINS.length,
    domains: FAMOUS_EMAIL_DOMAINS,
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

// Real-time SSE Search Endpoint (Unified Omnisearch Engine)
app.get('/api/search/stream', async (req: Request, res: Response) => {
  const rawQuery = ((req.query.query as string) || '').trim();
  const reqType = (req.query.type as string) || 'unified';
  const category = (req.query.category as string) || 'all';
  const noNsfw = req.query.no_nsfw === 'true';
  const pivotUsername = req.query.pivot !== 'false';
  const isEmailQuery = rawQuery.includes('@');
  const normalizedEmail = isEmailQuery ? rawQuery.toLowerCase() : rawQuery;
  const cleanHandle = isEmailQuery ? normalizedEmail.split('@')[0] : rawQuery;
  const octopusMode = req.query.octopus !== 'false';
  const maxConcurrency = Math.min(Math.max(parseInt(req.query.concurrency as string) || 25, 5), 40);
  const siteLimit = parseInt((req.query.limit || req.query.siteLimit) as string) || 0;

  if (!rawQuery) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  // Determine active search mode: 'unified' (default), 'email', or 'username'
  const searchType: 'unified' | 'email' | 'username' =
    reqType === 'email' ? 'email' : (reqType === 'username' ? 'username' : 'unified');

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
    try {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    } catch {
      isClosed = true;
    }
  };

  const startTime = Date.now();

  interface TargetItem {
    site: SearchSiteConfig;
    query: string;
    detectionType: 'email' | 'username_pivot' | 'octopus_pivot';
    pivotEmail?: string;
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

  if (searchType === 'unified') {
    if (isEmailQuery) {
      // 1. Direct Email Sites probed with normalizedEmail
      const filteredEmailSites = emailSites.filter(filterSite);
      const emailTargets = filteredEmailSites.map(site => ({
        site,
        query: normalizedEmail,
        detectionType: 'email' as const,
      }));

      // 2. All Username & Gaming Platforms probed with cleanHandle
      const filteredUsernameSites = usernameSites.filter(filterSite);
      const usernameTargets = filteredUsernameSites.map(site => ({
        site,
        query: cleanHandle,
        detectionType: 'username_pivot' as const,
      }));

      targets = [...emailTargets, ...usernameTargets];
    } else {
      // Input is username/gaming ID - probe across all username & gaming platforms
      const filteredUsernameSites = usernameSites.filter(filterSite);
      targets = filteredUsernameSites.map(site => ({
        site,
        query: cleanHandle,
        detectionType: 'username_pivot' as const,
      }));
    }
  } else if (searchType === 'email') {
    // Explicit Email only
    const filteredEmailSites = emailSites.filter(filterSite);
    targets = filteredEmailSites.map(site => ({
      site,
      query: normalizedEmail,
      detectionType: 'email' as const,
    }));

    if (pivotUsername && isEmailQuery) {
      const filteredUsernameSites = usernameSites.filter(filterSite);
      const pivotTargets = filteredUsernameSites.map(site => ({
        site,
        query: cleanHandle,
        detectionType: 'username_pivot' as const,
      }));
      targets = [...targets, ...pivotTargets];
    }
  } else {
    // Explicit username only
    const filteredUsernameSites = usernameSites.filter(filterSite);
    targets = filteredUsernameSites.map(site => ({
      site,
      query: cleanHandle,
      detectionType: 'username_pivot' as const,
    }));
  }

  // Deduplicate targets so identical platform domains are only probed once
  const seenTargets = new Set<string>();
  targets = targets.filter(t => {
    let key = t.site.name.toLowerCase();
    if (key.includes('minecraft')) key = 'minecraft';
    if (key.includes('roblox')) key = 'roblox';
    if (key.includes('op.gg') || key === 'opgg') key = 'opgg';
    if (key.includes('fow')) key = 'fow';
    if (key.includes('steam')) key = 'steam';
    if (seenTargets.has(key)) return false;
    seenTargets.add(key);
    return true;
  });

  // Prioritize high-value Korean & major global gaming/social platforms so they probe first and aren't cut off by site limits
  const priorityKeywords = [
    'fow',
    'op.gg',
    'pubg',
    'minecraft',
    'roblox',
    'brawl',
    'supercell',
    'clash',
    'steam',
    'entry',
    '엔트리',
    'velog',
    'naver',
    'tistory',
    'codeup',
    'geeknews',
    'soop',
    'chzzk',
    'kakao',
    'github',
  ];

  const getPriorityRank = (name: string): number => {
    const lower = name.toLowerCase();
    for (let i = 0; i < priorityKeywords.length; i++) {
      if (lower.includes(priorityKeywords[i])) {
        return priorityKeywords.length - i;
      }
    }
    return 0;
  };

  targets.sort((a, b) => {
    const aRank = getPriorityRank(a.site.name);
    const bRank = getPriorityRank(b.site.name);
    return bRank - aRank;
  });

  if (siteLimit > 0 && targets.length > siteLimit) {
    targets = targets.slice(0, siteLimit);
  }

  sendEvent({
    type: 'init',
    query: rawQuery,
    searchType,
    totalSites: targets.length,
    pivotEnabled: isEmailQuery,
    octopusEnabled: octopusMode,
  });

  let completedCount = 0;
  let foundCount = 0;

  // Check a single site safely
  const checkSingleSite = async (targetItem: TargetItem): Promise<FoundAccount | null> => {
    if (isClosed) return null;

    const { site, query: activeQuery, detectionType, pivotEmail } = targetItem;
    let targetUrl = site.uri_check;
    let formattedAccount = activeQuery;

    // Custom check for Entry (엔트리 - playentry.org)
    if (site.name.toLowerCase().includes('entry') || site.name.includes('엔트리')) {
      const isEmail = site.input_operation === 'raw-email' || activeQuery.includes('@');
      const cleanTarget = activeQuery.trim();
      const tStart = Date.now();
      const found = await probeEntryCustom(cleanTarget, isEmail);
      if (found) {
        const usernameOnly = cleanTarget.includes('@') ? cleanTarget.split('@')[0] : cleanTarget;
        const profileUrl = isEmail
          ? `https://playentry.org/search/user?query=${encodeURIComponent(cleanTarget)}`
          : `https://playentry.org/profile/${encodeURIComponent(usernameOnly)}`;
        return {
          name: site.name,
          url: profileUrl,
          category: site.cat || 'coding',
          status: 'FOUND',
          metadata: [
            {
              name: 'platform',
              type: 'String',
              value: isEmail
                ? 'Playentry (이메일로 등록된 엔트리 계정 인증)'
                : 'Playentry (엔트리 공식 프로필 계정 인증)',
            },
          ],
          responseTimeMs: Date.now() - tStart,
          detectionType,
          pivotEmail,
        };
      }
      return null;
    }

    // Custom check for GitHub (깃허브 공식 API)
    if (site.name.toLowerCase() === 'github' || site.name.toLowerCase().includes('github')) {
      const cleanTarget = activeQuery.includes('@') ? activeQuery.split('@')[0] : activeQuery.trim();
      const tStart = Date.now();
      const gh = await probeGitHubCustom(cleanTarget);
      if (gh && gh.exists) {
        return {
          name: 'GitHub (깃허브)',
          url: `https://github.com/${encodeURIComponent(gh.login || cleanTarget)}`,
          category: 'coding',
          status: 'FOUND',
          metadata: [
            { name: 'username', type: 'String', value: gh.login || cleanTarget },
            ...(gh.name ? [{ name: 'fullName', type: 'String' as const, value: gh.name }] : []),
            ...(gh.publicRepos !== undefined ? [{ name: 'publicRepos', type: 'String' as const, value: String(gh.publicRepos) }] : []),
            ...(gh.avatarUrl ? [{ name: 'avatar', type: 'Image' as const, value: gh.avatarUrl }] : []),
          ],
          responseTimeMs: Date.now() - tStart,
          detectionType,
          pivotEmail,
        };
      }
      return null;
    }

    // Custom check for GitLab (깃랩 공식 API)
    if (site.name.toLowerCase() === 'gitlab' || site.name.toLowerCase().includes('gitlab')) {
      const cleanTarget = activeQuery.includes('@') ? activeQuery.split('@')[0] : activeQuery.trim();
      const tStart = Date.now();
      const gl = await probeGitLabCustom(cleanTarget);
      if (gl && gl.exists) {
        return {
          name: 'GitLab (깃랩)',
          url: gl.webUrl || `https://gitlab.com/${encodeURIComponent(cleanTarget)}`,
          category: 'coding',
          status: 'FOUND',
          metadata: [
            { name: 'username', type: 'String', value: cleanTarget },
            ...(gl.name ? [{ name: 'name', type: 'String' as const, value: gl.name }] : []),
            ...(gl.avatarUrl ? [{ name: 'avatar', type: 'Image' as const, value: gl.avatarUrl }] : []),
          ],
          responseTimeMs: Date.now() - tStart,
          detectionType,
          pivotEmail,
        };
      }
      return null;
    }

    // Custom check for Roblox (로블록스 공식 User API)
    if (site.name.toLowerCase() === 'roblox') {
      const cleanTarget = activeQuery.trim();
      const tStart = Date.now();
      const rbx = await probeRoblox(cleanTarget);
      if (rbx && rbx.exists) {
        return {
          name: 'Roblox (로블록스)',
          url: rbx.id
            ? `https://www.roblox.com/users/${rbx.id}/profile`
            : `https://www.roblox.com/search/users?keyword=${encodeURIComponent(cleanTarget)}`,
          category: 'gaming',
          status: 'FOUND',
          metadata: [
            {
              name: 'displayName',
              type: 'String',
              value: rbx.displayName || cleanTarget,
            },
            ...(rbx.id
              ? [
                  {
                    name: 'userId',
                    type: 'String' as const,
                    value: String(rbx.id),
                  },
                ]
              : []),
          ],
          responseTimeMs: Date.now() - tStart,
          detectionType,
          pivotEmail,
        };
      }
      return null;
    }

    // Custom check for League of Legends (OP.GG)
    if (site.name.toLowerCase().includes('op.gg') || site.name.toLowerCase() === 'opgg') {
      const cleanTarget = activeQuery.trim();
      const tStart = Date.now();
      const lol = await probeLolOpgg(cleanTarget);
      if (lol && lol.exists) {
        return {
          name: 'OP.GG (리그 오브 레전드)',
          url: lol.profileUrl,
          category: 'gaming',
          status: 'FOUND',
          metadata: [
            {
              name: 'summoner',
              type: 'String',
              value: lol.summoner || cleanTarget,
            },
            {
              name: 'platform',
              type: 'String',
              value: 'Riot Games / League of Legends',
            },
          ],
          responseTimeMs: Date.now() - tStart,
          detectionType,
          pivotEmail,
        };
      }
      return null;
    }

    // Custom check for FOW.KR / FOW.LOL (포우 LOL 전적)
    if (site.name.toLowerCase().includes('fow')) {
      const cleanTarget = activeQuery.trim();
      const tStart = Date.now();
      const fow = await probeFowLol(cleanTarget);
      if (fow && fow.exists) {
        return {
          name: 'FOW.KR (포우 LOL 전적)',
          url: fow.profileUrl,
          category: 'gaming',
          status: 'FOUND',
          metadata: [
            {
              name: 'summoner',
              type: 'String',
              value: fow.summoner || cleanTarget,
            },
            ...(fow.tier
              ? [
                  {
                    name: 'tier',
                    type: 'String' as const,
                    value: fow.tier,
                  },
                ]
              : []),
          ],
          responseTimeMs: Date.now() - tStart,
          detectionType,
          pivotEmail,
        };
      }
      return null;
    }

    // Custom check for Minecraft (마인크래프트 공식 Mojang API)
    if (
      site.name.toLowerCase().includes('minecraft') ||
      site.name.toLowerCase() === 'mcuuid (minecraft)'
    ) {
      const cleanTarget = activeQuery.trim();
      const tStart = Date.now();
      const mc = await probeMinecraft(cleanTarget);
      if (mc && mc.exists) {
        return {
          name: 'Minecraft (마인크래프트 공식)',
          url: `https://namemc.com/profile/${encodeURIComponent(mc.name || cleanTarget)}`,
          category: 'gaming',
          status: 'FOUND',
          metadata: [
            {
              name: 'playerName',
              type: 'String',
              value: mc.name || cleanTarget,
            },
            ...(mc.id
              ? [
                  {
                    name: 'uuid',
                    type: 'String' as const,
                    value: mc.id,
                  },
                ]
              : []),
          ],
          responseTimeMs: Date.now() - tStart,
          detectionType,
          pivotEmail,
        };
      }
      return null;
    }

    // Custom check for Steam Community (스팀)
    if (site.name.toLowerCase() === 'steam' || site.name.toLowerCase() === 'steam community') {
      const cleanTarget = activeQuery.trim();
      const tStart = Date.now();
      const steamResult = await probeSteam(cleanTarget);
      if (steamResult && steamResult.exists) {
        return {
          name: 'Steam Community (스팀)',
          url: steamResult.profileUrl,
          category: 'gaming',
          status: 'FOUND',
          metadata: [
            {
              name: 'displayName',
              type: 'String',
              value: steamResult.displayName || cleanTarget,
            },
          ],
          responseTimeMs: Date.now() - tStart,
          detectionType,
          pivotEmail,
        };
      }
      return null;
    }

    // Supercell Tag Normalization (브롤스타즈, 클래시 오브 클랜 등 - '#' 접두사 처리)
    if (
      site.name.toLowerCase().includes('brawl') ||
      site.name.toLowerCase().includes('clash') ||
      site.name.toLowerCase().includes('supercell')
    ) {
      const cleanTag = activeQuery.trim().replace(/^#/, '');
      formattedAccount = cleanTag;
      targetUrl = targetUrl.replace(/\{account\}/g, encodeURIComponent(cleanTag));
    }

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
      const handle = activeQuery.includes('@') ? activeQuery.split('@')[0].toLowerCase() : activeQuery;
      targetUrl = targetUrl.replace(/\{account\}/g, encodeURIComponent(handle));
      formattedAccount = handle;
    } else if (site.input_operation === 'raw-email') {
      const emailLower = activeQuery.trim().toLowerCase();
      targetUrl = targetUrl.replace(/\{account\}/g, encodeURIComponent(emailLower));
      formattedAccount = emailLower;
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
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      ...(site.headers || {}),
    };

    if (requestBody && !headers['Content-Type'] && site.data?.startsWith('{')) {
      headers['Content-Type'] = 'application/json';
    }

    const tStart = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

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

      // Filter out rate-limits and server errors immediately (never a found profile)
      if (statusCode === 403 || statusCode === 429 || statusCode >= 500) {
        return null;
      }

      // Filter out empty responses
      if (textContent.trim().length < 5) {
        return null;
      }

      const lowerText = textContent.toLowerCase();

      // Filter out WAF / Cloudflare Challenge / Bot verification pages (Prevent False Positives)
      if (
        lowerText.includes('attention required! | cloudflare') ||
        lowerText.includes('just a moment...') ||
        lowerText.includes('cf-browser-verification') ||
        lowerText.includes('cloudflare ray id:') ||
        lowerText.includes('ray id:') ||
        lowerText.includes('challenges.cloudflare.com') ||
        lowerText.includes('cf-turnstile') ||
        lowerText.includes('checking your browser before accessing') ||
        lowerText.includes('please verify you are a human') ||
        lowerText.includes('verify you are human') ||
        lowerText.includes('verifying you are human') ||
        lowerText.includes('pardon our interruption') ||
        lowerText.includes('enable javascript and cookies to continue') ||
        lowerText.includes('protected by datadome') ||
        lowerText.includes('captcha-delivery.com') ||
        lowerText.includes('perimeterx') ||
        lowerText.includes('px-captcha') ||
        lowerText.includes('human security') ||
        lowerText.includes('incapsula_resource') ||
        lowerText.includes('access denied') ||
        lowerText.includes('security check to continue') ||
        lowerText.includes('unusual traffic from your computer network')
      ) {
        return null;
      }

      // Filter out soft 404 redirects (e.g. redirected to login, register, 404, or home)
      if (fetchRes.redirected) {
        try {
          const finalUrl = new URL(fetchRes.url);
          const p = finalUrl.pathname.toLowerCase();
          if (
            p === '/' ||
            p === '' ||
            p.includes('/login') ||
            p.includes('/signin') ||
            p.includes('/signup') ||
            p.includes('/register') ||
            p.includes('/auth') ||
            p.includes('/error') ||
            p.includes('/404') ||
            p.includes('/notfound') ||
            p.includes('/not_found')
          ) {
            return null;
          }
        } catch {}
      }

      let isFound = false;

      // Status Code Check
      if (site.e_code !== undefined && statusCode === eCode) {
        isFound = true;
      } else if (site.m_code !== undefined && statusCode === mCode) {
        isFound = false;
      } else if (statusCode === 200) {
        isFound = true;
      }

      // Exact/Regex String Matches
      if (site.e_string && !textContent.includes(site.e_string)) {
        isFound = false;
      }
      if (site.m_string && textContent.includes(site.m_string)) {
        isFound = false;
      }

      // If site does not have e_string, check generic 404 text in body
      if (isFound && !site.e_string) {
        if (
          lowerText.includes('page not found') ||
          lowerText.includes('user not found') ||
          lowerText.includes('profile not found') ||
          lowerText.includes("this account doesn't exist") ||
          lowerText.includes('account does not exist') ||
          lowerText.includes('this user does not exist') ||
          lowerText.includes('404 not found')
        ) {
          isFound = false;
        }
      }

      if (isFound) {
        // Extract metadata if available
        let metadataList: ExtractedMetadata[] = [];
        const rules = metadataRules[site.name] || site.metadata || [];
        if (rules.length > 0) {
          metadataList = extractMetadata(rules, textContent, jsonContent);
        }

        const profileUrl = site.profile_url
          ? site.profile_url.replace(/\{account\}/g, activeQuery)
          : (site.uri_pretty ? site.uri_pretty.replace(/\{account\}/g, activeQuery) : targetUrl);

        return {
          name: site.name,
          url: profileUrl,
          category: site.cat,
          status: 'FOUND',
          metadata: metadataList,
          responseTimeMs,
          detectionType,
          pivotEmail,
        };
      }
    } catch {
      // Fetch error or timeout
    }

    return null;
  };

  // Concurrency runner for platform targets
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

  // Octopus Multi-Domain Expansion Task (Probe 120 Famous Email Providers)
  const octopusTask = async () => {
    if (!octopusMode || isClosed) return;

    const handle = isEmailQuery ? normalizedEmail.split('@')[0].trim() : rawQuery.trim();
    if (!handle || handle.length < 2) return;

    const targetEmail = isEmailQuery ? normalizedEmail : undefined;
    const targetDomain = isEmailQuery ? normalizedEmail.split('@')[1]?.trim() : undefined;

    // Prioritize target domain so user's exact email is processed and emitted immediately
    const orderedDomains = [...famousDomains].sort((a, b) => {
      if (targetDomain) {
        if (a.domain.toLowerCase() === targetDomain) return -1;
        if (b.domain.toLowerCase() === targetDomain) return 1;
      }
      return 0;
    });

    sendEvent({
      type: 'octopus_init',
      octopusTotal: orderedDomains.length,
      message: `Probing ${orderedDomains.length} renowned email networks for handle "${handle}"...`,
    });

    let verifiedOctopusCount = 0;
    let checkedOctopusCount = 0;
    let dIndex = 0;

    // Concurrency pool for multi-domain probing (10 concurrent workers)
    const domainWorkers = Array.from({ length: 10 }).map(async () => {
      while (dIndex < orderedDomains.length && !isClosed) {
        const d = orderedDomains[dIndex++];
        const node = await probeEmailDomainIdentity(handle, d, targetEmail);
        checkedOctopusCount++;

        if (node) {
          if (node.status === 'VERIFIED') {
            verifiedOctopusCount++;
          }

          sendEvent({
            type: 'octopus_found',
            octopusNode: node,
            octopusVerifiedCount: verifiedOctopusCount,
          });

          // Emit a found account card for VERIFIED accounts (including the user-specified target email)
          if (node.status === 'VERIFIED') {
            foundCount++;
            const accountCard: FoundAccount = {
              name: `${d.name} (${d.domain})`,
              url: `mailto:${node.email}`,
              category: 'email',
              status: 'FOUND',
              detectionType: 'octopus_pivot',
              pivotEmail: node.email,
              responseTimeMs: node.responseTimeMs,
              metadata: [
                { name: 'Verified Mail Address', type: 'String', value: node.email },
                { name: 'Provider', type: 'String', value: d.name },
                { name: 'Provider Domain', type: 'String', value: d.domain },
                { name: 'Verification Signals', type: 'Array', value: node.signals || [] },
                ...(node.avatarUrl ? [{ name: 'avatar', type: 'Image' as const, value: node.avatarUrl }] : []),
              ],
            };

            sendEvent({
              type: 'found',
              account: accountCard,
              completed: completedCount,
              total: targets.length,
              foundCount,
            });

            // Branch out ("문어발"): dynamically check top email platforms concurrently without blocking domain scanning
            const branchSites = emailSites.slice(0, 4);
            Promise.allSettled(
              branchSites.map(async (bSite) => {
                if (isClosed) return;
                const branchRes = await checkSingleSite({
                  site: bSite,
                  query: node.email,
                  detectionType: 'octopus_pivot',
                  pivotEmail: node.email,
                });
                if (branchRes && !isClosed) {
                  branchRes.detectionType = 'octopus_pivot';
                  branchRes.pivotEmail = node.email;
                  foundCount++;
                  sendEvent({
                    type: 'found',
                    account: branchRes,
                    completed: completedCount,
                    total: targets.length,
                    foundCount,
                  });
                }
              })
            ).catch(() => {});
          }
        }

        sendEvent({
          type: 'octopus_progress',
          octopusChecked: checkedOctopusCount,
          octopusTotal: orderedDomains.length,
          currentSite: d.domain,
          octopusVerifiedCount: verifiedOctopusCount,
        });
      }
    });

    await Promise.all(domainWorkers);
  };

  // Run platform targets and octopus expansion concurrently
  await Promise.all([Promise.all(workers), octopusTask()]);

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
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const prompt = `You are an elite OSINT behavioral profiling and digital identity analyst.
Analyze the following digital footprint discovery results for target "${targetIdentifier}".

Discovered Platforms (${siteNames.length}):
${siteNames.join(', ')}

Platform Categories:
${categories.join(', ')}

Extracted Profile Metadata:
${metadataValues.join('\n') || 'None'}

Provide an objective intelligence assessment with the following JSON schema:
{
  "summary": "2-3 concise sentences summarizing the target's digital footprint, primary ecosystem, and identity consistency.",
  "behavioralProfile": "2-3 sentences detailing behavioral traits, digital habits, technical sophistication, or interests based on platform choices.",
  "categories": [
    {
      "category": "Category Name (e.g. Developer, Gaming, Social, Creative)",
      "confidence": 0.85,
      "description": "Brief 1-sentence explanation of this cluster"
    }
  ],
  "digitalFootprintScore": "Low" | "Moderate" | "High" | "Extensive",
  "exposureRisk": "Assessment of correlation risk, public exposure, and potential for deanonymization across platforms.",
  "keyInsights": [
    "Actionable bullet point insight 1",
    "Actionable bullet point insight 2",
    "Actionable bullet point insight 3"
  ]
}`;

        let resultText: string | undefined = undefined;

        // 1. Primary: Ultra high-speed gemini-3.1-flash-lite (fastest, lightweight, zero-thinking latency)
        try {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Primary AI timeout')), 12000)
          );
          const genPromise = ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          });
          const res = await Promise.race([genPromise, timeoutPromise]);
          if (res?.text) {
            resultText = res.text;
          }
        } catch {
          // 2. Fallback: gemini-2.5-flash
          try {
            const timeoutPromise2 = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Fallback AI timeout')), 12000)
            );
            const genPromise2 = ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
              config: {
                responseMimeType: 'application/json',
              },
            });
            const res2 = await Promise.race([genPromise2, timeoutPromise2]);
            if (res2?.text) {
              resultText = res2.text;
            }
          } catch {
            // Proceed to heuristic engine
          }
        }

        if (resultText) {
          let cleaned = resultText.trim();
          if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/, '').trim();
          }
          const parsed = JSON.parse(cleaned) as AiProfileAnalysis;
          return res.json({ success: true, profile: parsed, engine: 'gemini' });
        }
      } catch {
        // Proceed cleanly to heuristic OSINT engine
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
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(`[SMARTLAB_EXPERIMENT] OSINT Server running on http://${HOST}:${PORT}`);
    console.log(`[SMARTLAB_EXPERIMENT] Loaded ${usernameSites.length} username sites, ${emailSites.length} email sites, and ${FAMOUS_EMAIL_DOMAINS.length} famous email domains.`);
  });

  server.on('error', (err: any) => {
    console.error('[SMARTLAB_EXPERIMENT] Server error:', err?.message || err);
  });
}

process.on('uncaughtException', (err) => {
  console.error('[SMARTLAB_EXPERIMENT] Uncaught exception:', err?.message || err);
});

process.on('unhandledRejection', (reason: any) => {
  console.error('[SMARTLAB_EXPERIMENT] Unhandled rejection:', reason?.message || reason);
});

startServer().catch((err) => {
  console.error('[SMARTLAB_EXPERIMENT] Failed to start server:', err);
});
