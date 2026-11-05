# 1,000+ Platform Node Database Expansion & OSINT Engine Scaling

Scaling the SMARTLAB_EXPERIMENT OSINT engine to 1,000+ verified platform nodes across Korean major communities, global social & media networks, developer hubs, and lifestyle commerce platforms.

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your selections, all 4 requested platform expansion categories will be integrated into the dataset, supported by priority streaming and category preset filters.

- **Confirmed Scope**: 1,000+ Platform Node Expansion covering:
  1. *Korea Major & Communities*: Naver Blog, Tistory, Velog, DCInside, ArcaLive, Ruliweb, Inven, Blind, FMKorea, Clien, etc.
  2. *Global Social & Media*: Instagram, TikTok, Threads, Pinterest, Tumblr, Reddit, X/Twitter, Bluesky, Mastodon nodes, etc.
  3. *Tech & Dev Hubs*: Medium, Substack, Hashnode, Dev.to, Qiita, Kaggle, LeetCode, Codeforces, HackerNews, etc.
  4. *Lifestyle & Commerce*: Shopping, Fitness (Strava, Garmin), Hobby, Travel, and Niche Networks.
- **Confirmed Performance Model**: Smart Category Filtering with Fast Priority Streaming (probing high-value domestic & major global nodes first, yielding zero-latency results while streaming background scans).

---

## 1. Overview & Core Concept

SMARTLAB_EXPERIMENT will expand from ~750 sites to **1,000+ verified digital identity nodes**. The core search architecture will be upgraded to support high-throughput asynchronous probing with category presets, instant priority matches (LoL, Naver, Steam, Roblox, GitHub, Minecraft, Tistory), and real-time Server-Sent Events (SSE) streaming without browser UI latency.

---

## 2. User Experience & Visual Design

- **Category Presets & Quick Filters**:
  - Segmented filter controls allowing users to scope scans instantly: `All 1,000+ Nodes`, `Korea Major & Community`, `Global Social & Media`, `Tech & Developer`, and `Lifestyle & Commerce`.
  - Live progress counter displaying real-time scanned nodes vs total active category count (`e.g., 142 / 1,048 Nodes Scanned`).
- **High-Density Results Presentation**:
  - Clear, unboxed platform cards with category indicators, response time metrics, and direct profile links.
  - Enhanced AI Behavioral Profiler powered by `gemini-3.1-flash-lite` that aggregates 1,000+ node discovery results into a structured OSINT intelligence dossier.
- **Visual Restraint & Anti-Slop Discipline**:
  - Clean typographic hierarchy using `Plus Jakarta Sans` and `JetBrains Mono` for tabular metrics.
  - Strict 60-30-10 color discipline: 60% slate canvas, 30% structural surfaces, 10% indigo/violet accent budget.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Modular Dataset Structure & Dynamic Fallback**
  - *Approach*: Store expanded site configurations in structured `wmn-data.json` with dynamic runtime fallback and category indexing.
  - *Why*: Enables sub-millisecond category filtering and zero-overhead memory lookups without database queries.
- **Decision 2: Priority-Ranked Concurrency Worker Pool**
  - *Approach*: High-value Korean and global nodes (OP.GG, FOW, Naver, Tistory, Velog, Steam, Roblox, GitHub) are prioritized at the front of the queue.
  - *Why*: Users get immediate matches within <1 second while background workers scan remaining niche sites up to 1,000+ nodes.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        User Search Interface                           │
│  [ Username / Email Input ] ── [ Category Presets ] ── [ Start Scan ]  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ SSE GET /api/search/stream
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Express High-Speed SSE Proxy                      │
│                                                                        │
│  ┌───────────────────────┐   ┌──────────────────────────────────────┐  │
│  │ Priority Site Router  │ ──│ 1,000+ Node Dataset (wmn-data.json)   │  │
│  │ (LoL, Naver, Steam...)│   │ Categories: Korea, Social, Tech, etc │  │
│  └───────────┬───────────┘   └──────────────────────────────────────┘  │
│              │                                                         │
│              ▼                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Priority Concurrency Worker Pool (25 Concurrent Async Probes)    │  │
│  └───────────────────────────────────┬──────────────────────────────┘  │
└──────────────────────────────────────┼─────────────────────────────────┘
                                       │ Real-time Events (data: json)
                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    Client EventSource & UI Engine                      │
│  • Account Cards Grid    • Live Progress Meter   • AI Profiler Dossier │
└────────────────────────────────────────────────────────────────────────┘
```

### Component & State Mapping

1. **Category Preset Controls**: Filter active target items before streaming begins; updating preset resets progress meter and updates `siteLimit` / category params.
2. **SSE Streaming Consumer (`EventSource`)**: Listens to `init`, `progress`, `found`, `octopus_found`, and `complete` events, appending accounts incrementally with deduplication.
3. **AI Profiler Integrator**: Triggers `gemini-3.1-flash-lite` automatically upon scan completion to generate an aggregated OSINT behavioral analysis.
