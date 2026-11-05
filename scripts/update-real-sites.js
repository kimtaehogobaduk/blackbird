import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'data', 'wmn-data.json');
const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
const existingSites = rawData.sites || [];

const existingNames = new Set(existingSites.map(s => s.name.toLowerCase()));
const existingUrls = new Set(existingSites.map(s => s.uri_check.toLowerCase()));

function addSite(site) {
  const nameKey = site.name.toLowerCase();
  const urlKey = site.uri_check.toLowerCase();
  if (!existingNames.has(nameKey) && !existingUrls.has(urlKey)) {
    existingNames.add(nameKey);
    existingUrls.add(urlKey);
    existingSites.push(site);
    return true;
  }
  return false;
}

const realUniqueSites = [
  // --- KOREAN MAJOR & COMMUNITY & LIFESTYLE PLATFORMS ---
  { name: 'Naver Blog (네이버 블로그)', uri_check: 'https://blog.naver.com/{account}', e_code: 200, m_code: 404, cat: 'blog', profile_url: 'https://blog.naver.com/{account}' },
  { name: 'Naver Post (네이버 포스트)', uri_check: 'https://post.naver.com/{account}', e_code: 200, m_code: 404, cat: 'blog', profile_url: 'https://post.naver.com/{account}' },
  { name: 'Tistory (티스토리 블로그)', uri_check: 'https://{account}.tistory.com', e_code: 200, m_code: 404, cat: 'blog', profile_url: 'https://{account}.tistory.com' },
  { name: 'Velog (벨로그 기술블로그)', uri_check: 'https://velog.io/@{account}', e_code: 200, m_code: 404, cat: 'coding', profile_url: 'https://velog.io/@{account}' },
  { name: 'DCInside Gallog (갤로그)', uri_check: 'https://gallog.dcinside.com/{account}', e_code: 200, m_code: 404, cat: 'social', profile_url: 'https://gallog.dcinside.com/{account}' },
  { name: 'ArcaLive (아카라이브)', uri_check: 'https://arca.live/u/@{account}', e_code: 200, m_code: 404, cat: 'social', profile_url: 'https://arca.live/u/@{account}' },
  { name: 'Ruliweb MyPi (루리웹 마이피)', uri_check: 'https://mypi.ruliweb.com/mypi.htm?nid={account}', e_code: 200, m_code: 404, cat: 'gaming', profile_url: 'https://mypi.ruliweb.com/mypi.htm?nid={account}' },
  { name: 'Inven Profile (인벤 유저)', uri_check: 'https://member.inven.co.kr/user/profile/{account}', e_code: 200, m_code: 404, cat: 'gaming', profile_url: 'https://member.inven.co.kr/user/profile/{account}' },
  { name: 'FMKorea (에펨코리아)', uri_check: 'https://www.fmkorea.com/member/{account}', e_code: 200, m_code: 404, cat: 'social', profile_url: 'https://www.fmkorea.com/member/{account}' },
  { name: 'Clien (클리앙 커뮤니티)', uri_check: 'https://www.clien.net/service/popup/userInfo/{account}', e_code: 200, m_code: 404, cat: 'tech', profile_url: 'https://www.clien.net/service/popup/userInfo/{account}' },
  { name: 'PPOMPPU (뽐뿌 유저)', uri_check: 'https://www.ppomppu.co.kr/zboard/view_info.php?member_id={account}', e_code: 200, m_code: 404, cat: 'shopping', profile_url: 'https://www.ppomppu.co.kr/zboard/view_info.php?member_id={account}' },
  { name: 'Brunch Story (브런치스토리)', uri_check: 'https://brunch.co.kr/@{account}', e_code: 200, m_code: 404, cat: 'blog', profile_url: 'https://brunch.co.kr/@{account}' },
  { name: 'SOOP Live (숲 라이브)', uri_check: 'https://bj.afreecatv.com/{account}', e_code: 200, m_code: 404, cat: 'video', profile_url: 'https://bj.afreecatv.com/{account}' },
  { name: 'CHZZK (치지직 스트리머)', uri_check: 'https://chzzk.naver.com/{account}', e_code: 200, m_code: 404, cat: 'video', profile_url: 'https://chzzk.naver.com/{account}' },
  { name: 'CodeUp (코드업 프로그래밍)', uri_check: 'https://codeup.kr/userinfo.php?user={account}', e_code: 200, m_code: 404, cat: 'coding', profile_url: 'https://codeup.kr/userinfo.php?user={account}' },
  { name: 'Solved.ac (솔브드 알고리즘)', uri_check: 'https://solved.ac/profile/{account}', e_code: 200, m_code: 404, cat: 'coding', profile_url: 'https://solved.ac/profile/{account}' },
  { name: 'Baekjoon BOJ (백준 온라인 저지)', uri_check: 'https://www.acmicpc.net/user/{account}', e_code: 200, m_code: 404, cat: 'coding', profile_url: 'https://www.acmicpc.net/user/{account}' },
  { name: 'Programmers (프로그래머스)', uri_check: 'https://programmers.co.kr/users/{account}', e_code: 200, m_code: 404, cat: 'coding', profile_url: 'https://programmers.co.kr/users/{account}' },
  { name: 'Inflearn (인프런)', uri_check: 'https://www.inflearn.com/users/{account}', e_code: 200, m_code: 404, cat: 'tech', profile_url: 'https://www.inflearn.com/users/{account}' },
  { name: 'Wanted (원티드)', uri_check: 'https://www.wanted.co.kr/user/{account}', e_code: 200, m_code: 404, cat: 'business', profile_url: 'https://www.wanted.co.kr/user/{account}' },
  { name: 'RocketPunch (로켓펀치)', uri_check: 'https://www.rocketpunch.com/@{account}', e_code: 200, m_code: 404, cat: 'business', profile_url: 'https://www.rocketpunch.com/@{account}' },
  { name: 'Disquiet (디스콰이엇)', uri_check: 'https://disquiet.io/@{account}', e_code: 200, m_code: 404, cat: 'tech', profile_url: 'https://disquiet.io/@{account}' },
  { name: 'GeekNews (긱뉴스)', uri_check: 'https://news.hada.io/user?id={account}', e_code: 200, m_code: 404, cat: 'tech', profile_url: 'https://news.hada.io/user?id={account}' },
  { name: 'Kream (크림 리셀)', uri_check: 'https://kream.co.kr/social/profile/{account}', e_code: 200, m_code: 404, cat: 'shopping', profile_url: 'https://kream.co.kr/social/profile/{account}' },
  { name: 'Wadiz (와디즈 펀딩)', uri_check: 'https://www.wadiz.kr/web/wmypage/profile/{account}', e_code: 200, m_code: 404, cat: 'shopping', profile_url: 'https://www.wadiz.kr/web/wmypage/profile/{account}' },
  { name: 'Tumblbug (텀블벅 펀딩)', uri_check: 'https://tumblbug.com/u/{account}', e_code: 200, m_code: 404, cat: 'shopping', profile_url: 'https://tumblbug.com/u/{account}' },
  { name: 'Class101 (클래스101)', uri_check: 'https://class101.net/user/{account}', e_code: 200, m_code: 404, cat: 'hobby', profile_url: 'https://class101.net/user/{account}' },

  // --- GLOBAL SOCIAL & MEDIA & CREATOR PLATFORMS ---
  { name: 'Threads', uri_check: 'https://www.threads.net/@{account}', e_code: 200, m_code: 404, cat: 'social', profile_url: 'https://www.threads.net/@{account}' },
  { name: 'Bluesky Social', uri_check: 'https://bsky.app/profile/{account}.bsky.social', e_code: 200, m_code: 404, cat: 'social', profile_url: 'https://bsky.app/profile/{account}.bsky.social' },
  { name: 'TikTok', uri_check: 'https://www.tiktok.com/@{account}', e_code: 200, m_code: 404, cat: 'social', profile_url: 'https://www.tiktok.com/@{account}' },
  { name: 'Pinterest', uri_check: 'https://www.pinterest.com/{account}/', e_code: 200, m_code: 404, cat: 'images', profile_url: 'https://www.pinterest.com/{account}/' },
  { name: 'Tumblr', uri_check: 'https://{account}.tumblr.com', e_code: 200, m_code: 404, cat: 'blog', profile_url: 'https://{account}.tumblr.com' },
  { name: 'Substack', uri_check: 'https://{account}.substack.com', e_code: 200, m_code: 404, cat: 'blog', profile_url: 'https://{account}.substack.com' },
  { name: 'Hashnode', uri_check: 'https://{account}.hashnode.dev', e_code: 200, m_code: 404, cat: 'blog', profile_url: 'https://{account}.hashnode.dev' },
  { name: 'Qiita', uri_check: 'https://qiita.com/{account}', e_code: 200, m_code: 404, cat: 'coding', profile_url: 'https://qiita.com/{account}' },
  { name: 'Note.com', uri_check: 'https://note.com/{account}', e_code: 200, m_code: 404, cat: 'blog', profile_url: 'https://note.com/{account}' },
  { name: 'Pixiv', uri_check: 'https://www.pixiv.net/users/{account}', e_code: 200, m_code: 404, cat: 'art', profile_url: 'https://www.pixiv.net/users/{account}' },
  { name: 'ArtStation', uri_check: 'https://www.artstation.com/{account}', e_code: 200, m_code: 404, cat: 'art', profile_url: 'https://www.artstation.com/{account}' },
  { name: 'Behance', uri_check: 'https://www.behance.net/{account}', e_code: 200, m_code: 404, cat: 'art', profile_url: 'https://www.behance.net/{account}' },
  { name: 'Dribbble', uri_check: 'https://dribbble.com/{account}', e_code: 200, m_code: 404, cat: 'art', profile_url: 'https://dribbble.com/{account}' },

  // --- LIFESTYLE & HOBBY & FITNESS ---
  { name: 'Strava', uri_check: 'https://www.strava.com/athletes/{account}', e_code: 200, m_code: 404, cat: 'health', profile_url: 'https://www.strava.com/athletes/{account}' },
  { name: 'Garmin Connect', uri_check: 'https://connect.garmin.com/modern/profile/{account}', e_code: 200, m_code: 404, cat: 'health', profile_url: 'https://connect.garmin.com/modern/profile/{account}' },
  { name: 'Duolingo', uri_check: 'https://www.duolingo.com/profile/{account}', e_code: 200, m_code: 404, cat: 'hobby', profile_url: 'https://www.duolingo.com/profile/{account}' },
  { name: 'Letterboxd', uri_check: 'https://letterboxd.com/{account}/', e_code: 200, m_code: 404, cat: 'hobby', profile_url: 'https://letterboxd.com/{account}/' },
  { name: 'Goodreads', uri_check: 'https://www.goodreads.com/{account}', e_code: 200, m_code: 404, cat: 'hobby', profile_url: 'https://www.goodreads.com/{account}' },
  { name: 'Spotify', uri_check: 'https://open.spotify.com/user/{account}', e_code: 200, m_code: 404, cat: 'music', profile_url: 'https://open.spotify.com/user/{account}' },
  { name: 'SoundCloud', uri_check: 'https://soundcloud.com/{account}', e_code: 200, m_code: 404, cat: 'music', profile_url: 'https://soundcloud.com/{account}' },
  { name: 'Bandcamp', uri_check: 'https://bandcamp.com/{account}', e_code: 200, m_code: 404, cat: 'music', profile_url: 'https://bandcamp.com/{account}' },
  { name: 'Last.fm', uri_check: 'https://www.last.fm/user/{account}', e_code: 200, m_code: 404, cat: 'music', profile_url: 'https://www.last.fm/user/{account}' },
  { name: 'MyAnimeList', uri_check: 'https://myanimelist.net/profile/{account}', e_code: 200, m_code: 404, cat: 'hobby', profile_url: 'https://myanimelist.net/profile/{account}' },
  { name: 'AniList', uri_check: 'https://anilist.co/user/{account}', e_code: 200, m_code: 404, cat: 'hobby', profile_url: 'https://anilist.co/user/{account}' },
  { name: 'MangaDex', uri_check: 'https://mangadex.org/user/{account}', e_code: 200, m_code: 404, cat: 'hobby', profile_url: 'https://mangadex.org/user/{account}' },

  // --- TECH & DEV & CLOUD HUBS ---
  { name: 'Kaggle', uri_check: 'https://www.kaggle.com/{account}', e_code: 200, m_code: 404, cat: 'tech', profile_url: 'https://www.kaggle.com/{account}' },
  { name: 'LeetCode', uri_check: 'https://leetcode.com/{account}', e_code: 200, m_code: 404, cat: 'coding', profile_url: 'https://leetcode.com/{account}' },
  { name: 'HackerRank', uri_check: 'https://www.hackerrank.com/{account}', e_code: 200, m_code: 404, cat: 'coding', profile_url: 'https://www.hackerrank.com/{account}' },
  { name: 'AtCoder', uri_check: 'https://atcoder.jp/users/{account}', e_code: 200, m_code: 404, cat: 'coding', profile_url: 'https://atcoder.jp/users/{account}' },
  { name: 'CodeChef', uri_check: 'https://www.codechef.com/users/{account}', e_code: 200, m_code: 404, cat: 'coding', profile_url: 'https://www.codechef.com/users/{account}' },
  { name: 'NPM Packages', uri_check: 'https://www.npmjs.com/~{account}', e_code: 200, m_code: 404, cat: 'tech', profile_url: 'https://www.npmjs.com/~{account}' },
  { name: 'PyPI Python Packages', uri_check: 'https://pypi.org/user/{account}', e_code: 200, m_code: 404, cat: 'tech', profile_url: 'https://pypi.org/user/{account}' },
  { name: 'RubyGems', uri_check: 'https://rubygems.org/profiles/{account}', e_code: 200, m_code: 404, cat: 'tech', profile_url: 'https://rubygems.org/profiles/{account}' },
  { name: 'Crates.io Rust', uri_check: 'https://crates.io/users/{account}', e_code: 200, m_code: 404, cat: 'tech', profile_url: 'https://crates.io/users/{account}' },
  { name: 'Docker Hub', uri_check: 'https://hub.docker.com/u/{account}', e_code: 200, m_code: 404, cat: 'tech', profile_url: 'https://hub.docker.com/u/{account}' },
  { name: 'Hugging Face AI', uri_check: 'https://huggingface.co/{account}', e_code: 200, m_code: 404, cat: 'tech', profile_url: 'https://huggingface.co/{account}' },
  { name: 'Observable HQ', uri_check: 'https://observablehq.com/@{account}', e_code: 200, m_code: 404, cat: 'tech', profile_url: 'https://observablehq.com/@{account}' },
  { name: 'Glitch Code', uri_check: 'https://glitch.com/@{account}', e_code: 200, m_code: 404, cat: 'coding', profile_url: 'https://glitch.com/@{account}' },
  { name: 'Figma Community', uri_check: 'https://www.figma.com/@{account}', e_code: 200, m_code: 404, cat: 'art', profile_url: 'https://www.figma.com/@{account}' },
  { name: 'Unsplash Photos', uri_check: 'https://unsplash.com/@{account}', e_code: 200, m_code: 404, cat: 'images', profile_url: 'https://unsplash.com/@{account}' },
  { name: 'Pexels Media', uri_check: 'https://www.pexels.com/@{account}', e_code: 200, m_code: 404, cat: 'images', profile_url: 'https://www.pexels.com/@{account}' },
  { name: '500px Photography', uri_check: 'https://500px.com/p/{account}', e_code: 200, m_code: 404, cat: 'images', profile_url: 'https://500px.com/p/{account}' },
  { name: 'Etsy Creator', uri_check: 'https://www.etsy.com/people/{account}', e_code: 200, m_code: 404, cat: 'shopping', profile_url: 'https://www.etsy.com/people/{account}' },
  { name: 'Tripadvisor Profile', uri_check: 'https://www.tripadvisor.com/Profile/{account}', e_code: 200, m_code: 404, cat: 'hobby', profile_url: 'https://www.tripadvisor.com/Profile/{account}' },
  { name: 'DeviantArt User', uri_check: 'https://www.deviantart.com/{account}', e_code: 200, m_code: 404, cat: 'art', profile_url: 'https://www.deviantart.com/{account}' },
  { name: 'CodePen Showcase', uri_check: 'https://codepen.io/{account}', e_code: 200, m_code: 404, cat: 'coding', profile_url: 'https://codepen.io/{account}' },
  { name: 'Replit Profile', uri_check: 'https://replit.com/@{account}', e_code: 200, m_code: 404, cat: 'coding', profile_url: 'https://replit.com/@{account}' },
  { name: 'Vimeo Channel', uri_check: 'https://vimeo.com/{account}', e_code: 200, m_code: 404, cat: 'video', profile_url: 'https://vimeo.com/{account}' },
  { name: 'Dailymotion Channel', uri_check: 'https://www.dailymotion.com/{account}', e_code: 200, m_code: 404, cat: 'video', profile_url: 'https://www.dailymotion.com/{account}' },
  { name: 'SlideShare Presentation', uri_check: 'https://www.slideshare.net/{account}', e_code: 200, m_code: 404, cat: 'business', profile_url: 'https://www.slideshare.net/{account}' },
  { name: 'Scribd Profile', uri_check: 'https://www.scribd.com/{account}', e_code: 200, m_code: 404, cat: 'misc', profile_url: 'https://www.scribd.com/{account}' },
  { name: 'Issuu Magazine', uri_check: 'https://issuu.com/{account}', e_code: 200, m_code: 404, cat: 'misc', profile_url: 'https://issuu.com/{account}' },
  { name: 'Ghost Blog Platform', uri_check: 'https://{account}.ghost.io', e_code: 200, m_code: 404, cat: 'blog', profile_url: 'https://{account}.ghost.io' },
  { name: 'WordPress Blog', uri_check: 'https://{account}.wordpress.com', e_code: 200, m_code: 404, cat: 'blog', profile_url: 'https://{account}.wordpress.com' },
  { name: 'Wix Site', uri_check: 'https://{account}.wixsite.com/website', e_code: 200, m_code: 404, cat: 'blog', profile_url: 'https://{account}.wixsite.com/website' },
  { name: 'Weebly Site', uri_check: 'https://{account}.weebly.com', e_code: 200, m_code: 404, cat: 'blog', profile_url: 'https://{account}.weebly.com' },
  { name: 'Jimdo Site', uri_check: 'https://{account}.jimdosite.com', e_code: 200, m_code: 404, cat: 'blog', profile_url: 'https://{account}.jimdosite.com' },
  { name: 'SquareSpace Site', uri_check: 'https://{account}.squarespace.com', e_code: 200, m_code: 404, cat: 'blog', profile_url: 'https://{account}.squarespace.com' },
  { name: 'Carrd Page', uri_check: 'https://{account}.carrd.co', e_code: 200, m_code: 404, cat: 'social', profile_url: 'https://{account}.carrd.co' },
  { name: 'Linktree Bio', uri_check: 'https://linktr.ee/{account}', e_code: 200, m_code: 404, cat: 'social', profile_url: 'https://linktr.ee/{account}' },
  { name: 'Beacons Page', uri_check: 'https://beacons.ai/{account}', e_code: 200, m_code: 404, cat: 'social', profile_url: 'https://beacons.ai/{account}' },
  { name: 'Bento.me', uri_check: 'https://bento.me/{account}', e_code: 200, m_code: 404, cat: 'social', profile_url: 'https://bento.me/{account}' },
  { name: 'Bio.link', uri_check: 'https://bio.link/{account}', e_code: 200, m_code: 404, cat: 'social', profile_url: 'https://bio.link/{account}' },
  { name: 'Solo.to', uri_check: 'https://solo.to/{account}', e_code: 200, m_code: 404, cat: 'social', profile_url: 'https://solo.to/{account}' },
  { name: 'Koji Profile', uri_check: 'https://koji.to/{account}', e_code: 200, m_code: 404, cat: 'social', profile_url: 'https://koji.to/{account}' },
  { name: 'Read.cv Resume', uri_check: 'https://read.cv/{account}', e_code: 200, m_code: 404, cat: 'business', profile_url: 'https://read.cv/{account}' },
  { name: 'Polywork', uri_check: 'https://www.polywork.com/{account}', e_code: 200, m_code: 404, cat: 'business', profile_url: 'https://www.polywork.com/{account}' },
  { name: 'Peerlist', uri_check: 'https://peerlist.io/{account}', e_code: 200, m_code: 404, cat: 'business', profile_url: 'https://peerlist.io/{account}' },
  { name: 'Contra Freelancer', uri_check: 'https://contra.com/{account}', e_code: 200, m_code: 404, cat: 'business', profile_url: 'https://contra.com/{account}' },
  { name: 'Upwork Freelancer', uri_check: 'https://www.upwork.com/freelancers/~{account}', e_code: 200, m_code: 404, cat: 'business', profile_url: 'https://www.upwork.com/freelancers/~{account}' },
  { name: 'Fiverr Seller Profile', uri_check: 'https://www.fiverr.com/{account}', e_code: 200, m_code: 404, cat: 'business', profile_url: 'https://www.fiverr.com/{account}' },
  { name: 'Freelancer Profile', uri_check: 'https://www.freelancer.com/u/{account}', e_code: 200, m_code: 404, cat: 'business', profile_url: 'https://www.freelancer.com/u/{account}' },
  { name: 'Guru Profile', uri_check: 'https://www.guru.com/freelancers/{account}', e_code: 200, m_code: 404, cat: 'business', profile_url: 'https://www.guru.com/freelancers/{account}' },
  { name: 'Toptal Profile', uri_check: 'https://www.toptal.com/resume/{account}', e_code: 200, m_code: 404, cat: 'business', profile_url: 'https://www.toptal.com/resume/{account}' },
  { name: 'Wellfound Profile', uri_check: 'https://wellfound.com/u/{account}', e_code: 200, m_code: 404, cat: 'business', profile_url: 'https://wellfound.com/u/{account}' },
  { name: 'Crunchbase Profile', uri_check: 'https://www.crunchbase.com/person/{account}', e_code: 200, m_code: 404, cat: 'business', profile_url: 'https://www.crunchbase.com/person/{account}' },
  { name: 'PitchBook Profile', uri_check: 'https://pitchbook.com/profiles/person/{account}', e_code: 200, m_code: 404, cat: 'business', profile_url: 'https://pitchbook.com/profiles/person/{account}' },
  { name: 'ProductHunt Maker', uri_check: 'https://www.producthunt.com/@{account}', e_code: 200, m_code: 404, cat: 'tech', profile_url: 'https://www.producthunt.com/@{account}' },
  { name: 'IndieHackers', uri_check: 'https://www.indiehackers.com/{account}', e_code: 200, m_code: 404, cat: 'tech', profile_url: 'https://www.indiehackers.com/{account}' },
  { name: 'HackerNews User Profile', uri_check: 'https://news.ycombinator.com/user?id={account}', e_code: 200, m_code: 404, cat: 'tech', profile_url: 'https://news.ycombinator.com/user?id={account}' },
  { name: 'Lobsters User', uri_check: 'https://lobste.rs/u/{account}', e_code: 200, m_code: 404, cat: 'tech', profile_url: 'https://lobste.rs/u/{account}' },
  { name: 'Slashdot User', uri_check: 'https://slashdot.org/~{account}', e_code: 200, m_code: 404, cat: 'tech', profile_url: 'https://slashdot.org/~{account}' },
  { name: 'StackOverflow User Profile', uri_check: 'https://stackoverflow.com/users/{account}', e_code: 200, m_code: 404, cat: 'tech', profile_url: 'https://stackoverflow.com/users/{account}' },
  { name: 'ServerFault User', uri_check: 'https://serverfault.com/users/{account}', e_code: 200, m_code: 404, cat: 'tech', profile_url: 'https://serverfault.com/users/{account}' },
  { name: 'SuperUser Profile', uri_check: 'https://superuser.com/users/{account}', e_code: 200, m_code: 404, cat: 'tech', profile_url: 'https://superuser.com/users/{account}' },
  { name: 'AskUbuntu User', uri_check: 'https://askubuntu.com/users/{account}', e_code: 200, m_code: 404, cat: 'tech', profile_url: 'https://askubuntu.com/users/{account}' },
  { name: 'MathOverflow User', uri_check: 'https://mathoverflow.net/users/{account}', e_code: 200, m_code: 404, cat: 'tech', profile_url: 'https://mathoverflow.net/users/{account}' },
  { name: 'StackExchange User', uri_check: 'https://stackexchange.com/users/{account}', e_code: 200, m_code: 404, cat: 'tech', profile_url: 'https://stackexchange.com/users/{account}' },
  { name: 'GitHub Gist Code', uri_check: 'https://gist.github.com/{account}', e_code: 200, m_code: 404, cat: 'coding', profile_url: 'https://gist.github.com/{account}' },
  { name: 'GitLab Snippets Code', uri_check: 'https://gitlab.com/users/{account}/snippets', e_code: 200, m_code: 404, cat: 'coding', profile_url: 'https://gitlab.com/users/{account}/snippets' },
  { name: 'Bitbucket Snippets', uri_check: 'https://bitbucket.org/{account}/snippets', e_code: 200, m_code: 404, cat: 'coding', profile_url: 'https://bitbucket.org/{account}/snippets' },
  { name: 'SourceForge User', uri_check: 'https://sourceforge.net/u/{account}/profile', e_code: 200, m_code: 404, cat: 'coding', profile_url: 'https://sourceforge.net/u/{account}/profile' },
  { name: 'Launchpad Developer', uri_check: 'https://launchpad.net/~{account}', e_code: 200, m_code: 404, cat: 'coding', profile_url: 'https://launchpad.net/~{account}' },
  { name: 'Codeberg Developer', uri_check: 'https://codeberg.org/{account}', e_code: 200, m_code: 404, cat: 'coding', profile_url: 'https://codeberg.org/{account}' },
  { name: 'Sourcehut Developer', uri_check: 'https://sr.ht/~{account}', e_code: 200, m_code: 404, cat: 'coding', profile_url: 'https://sr.ht/~{account}' },
  { name: 'Framagit Developer', uri_check: 'https://framagit.org/{account}', e_code: 200, m_code: 404, cat: 'coding', profile_url: 'https://framagit.org/{account}' },
  { name: 'Notabug Code', uri_check: 'https://notabug.org/{account}', e_code: 200, m_code: 404, cat: 'coding', profile_url: 'https://notabug.org/{account}' },
  { name: 'Discourse Meta Member', uri_check: 'https://meta.discourse.org/u/{account}', e_code: 200, m_code: 404, cat: 'tech', profile_url: 'https://meta.discourse.org/u/{account}' },
  { name: 'Flarum Forum User', uri_check: 'https://discuss.flarum.org/u/{account}', e_code: 200, m_code: 404, cat: 'tech', profile_url: 'https://discuss.flarum.org/u/{account}' },
  { name: 'NodeBB Forum Member', uri_check: 'https://community.nodebb.org/user/{account}', e_code: 200, m_code: 404, cat: 'tech', profile_url: 'https://community.nodebb.org/user/{account}' },
  { name: 'Disqus User Profile', uri_check: 'https://disqus.com/by/{account}/', e_code: 200, m_code: 404, cat: 'social', profile_url: 'https://disqus.com/by/{account}/' },
  { name: 'Gravatar Avatar Profile', uri_check: 'https://gravatar.com/{account}', e_code: 200, m_code: 404, cat: 'social', profile_url: 'https://gravatar.com/{account}' },
  { name: 'About.me Bio', uri_check: 'https://about.me/{account}', e_code: 200, m_code: 404, cat: 'social', profile_url: 'https://about.me/{account}' },
  { name: 'Keybase Proof Identity', uri_check: 'https://keybase.io/{account}', e_code: 200, m_code: 404, cat: 'tech', profile_url: 'https://keybase.io/{account}' },
  { name: 'Keyoxide Identity Proof', uri_check: 'https://keyoxide.org/{account}', e_code: 200, m_code: 404, cat: 'tech', profile_url: 'https://keyoxide.org/{account}' },
  { name: 'Telegram Channel', uri_check: 'https://t.me/{account}', e_code: 200, m_code: 404, cat: 'social', profile_url: 'https://t.me/{account}' },
  { name: 'Guilded Team', uri_check: 'https://www.guilded.gg/u/{account}', e_code: 200, m_code: 404, cat: 'gaming', profile_url: 'https://www.guilded.gg/u/{account}' },
  { name: 'Revolt Chat Member', uri_check: 'https://revolt.chat/user/{account}', e_code: 200, m_code: 404, cat: 'social', profile_url: 'https://revolt.chat/user/{account}' },
  { name: 'Twitch Live Streaming', uri_check: 'https://www.twitch.tv/{account}', e_code: 200, m_code: 404, cat: 'video', profile_url: 'https://www.twitch.tv/{account}' },
  { name: 'Kick Live Stream', uri_check: 'https://kick.com/{account}', e_code: 200, m_code: 404, cat: 'video', profile_url: 'https://kick.com/{account}' },
  { name: 'Rumble Video Channel', uri_check: 'https://rumble.com/c/{account}', e_code: 200, m_code: 404, cat: 'video', profile_url: 'https://rumble.com/c/{account}' },
  { name: 'Odysee Video Channel', uri_check: 'https://odysee.com/@{account}', e_code: 200, m_code: 404, cat: 'video', profile_url: 'https://odysee.com/@{account}' },
  { name: 'PeerTube Channel', uri_check: 'https://peertube.tv/c/{account}', e_code: 200, m_code: 404, cat: 'video', profile_url: 'https://peertube.tv/c/{account}' },
  { name: 'Bilibili Space Video', uri_check: 'https://space.bilibili.com/{account}', e_code: 200, m_code: 404, cat: 'video', profile_url: 'https://space.bilibili.com/{account}' },
  { name: 'Niconico User Video', uri_check: 'https://www.nicovideo.jp/user/{account}', e_code: 200, m_code: 404, cat: 'video', profile_url: 'https://www.nicovideo.jp/user/{account}' },
  { name: 'OpenSea NFT Gallery', uri_check: 'https://opensea.io/{account}', e_code: 200, m_code: 404, cat: 'finance', profile_url: 'https://opensea.io/{account}' },
  { name: 'Rarible Collection', uri_check: 'https://rarible.com/{account}', e_code: 200, m_code: 404, cat: 'finance', profile_url: 'https://rarible.com/{account}' },
  { name: 'Foundation Creator', uri_check: 'https://foundation.app/@{account}', e_code: 200, m_code: 404, cat: 'art', profile_url: 'https://foundation.app/@{account}' },
  { name: 'SuperRare Gallery', uri_check: 'https://superrare.com/{account}', e_code: 200, m_code: 404, cat: 'art', profile_url: 'https://superrare.com/{account}' },
  { name: 'CoinMarketCap Profile', uri_check: 'https://coinmarketcap.com/community/profile/{account}', e_code: 200, m_code: 404, cat: 'finance', profile_url: 'https://coinmarketcap.com/community/profile/{account}' },
  { name: 'TradingView Trader', uri_check: 'https://www.tradingview.com/u/{account}/', e_code: 200, m_code: 404, cat: 'finance', profile_url: 'https://www.tradingview.com/u/{account}/' },
  { name: 'Investing.com Member', uri_check: 'https://www.investing.com/members/{account}', e_code: 200, m_code: 404, cat: 'finance', profile_url: 'https://www.investing.com/members/{account}' },
  { name: 'SeekingAlpha Author', uri_check: 'https://seekingalpha.com/author/{account}', e_code: 200, m_code: 404, cat: 'finance', profile_url: 'https://seekingalpha.com/author/{account}' },
  { name: 'StockTwits Trader', uri_check: 'https://stocktwits.com/{account}', e_code: 200, m_code: 404, cat: 'finance', profile_url: 'https://stocktwits.com/{account}' },
  { name: 'Beehiiv Newsletter', uri_check: 'https://{account}.beehiiv.com', e_code: 200, m_code: 404, cat: 'blog', profile_url: 'https://{account}.beehiiv.com' },
  { name: 'ConvertKit Creator', uri_check: 'https://{account}.ck.page', e_code: 200, m_code: 404, cat: 'blog', profile_url: 'https://{account}.ck.page' },
  { name: 'Gumroad Digital Shop', uri_check: 'https://{account}.gumroad.com', e_code: 200, m_code: 404, cat: 'shopping', profile_url: 'https://{account}.gumroad.com' },
  { name: 'BuyMeACoffee Creator', uri_check: 'https://www.buymeacoffee.com/{account}', e_code: 200, m_code: 404, cat: 'finance', profile_url: 'https://www.buymeacoffee.com/{account}' },
  { name: 'Ko-fi Support Page', uri_check: 'https://ko-fi.com/{account}', e_code: 200, m_code: 404, cat: 'finance', profile_url: 'https://ko-fi.com/{account}' },
  { name: 'Patreon Creator', uri_check: 'https://www.patreon.com/{account}', e_code: 200, m_code: 404, cat: 'finance', profile_url: 'https://www.patreon.com/{account}' },
  { name: 'Fanbox Creator', uri_check: 'https://{account}.fanbox.cc', e_code: 200, m_code: 404, cat: 'art', profile_url: 'https://{account}.fanbox.cc' },
  { name: 'Fantia Creator', uri_check: 'https://fantia.jp/fanclubs/{account}', e_code: 200, m_code: 404, cat: 'art', profile_url: 'https://fantia.jp/fanclubs/{account}' },
  { name: 'Skeb Creator', uri_check: 'https://skeb.jp/@{account}', e_code: 200, m_code: 404, cat: 'art', profile_url: 'https://skeb.jp/@{account}' }
];

let addedCount = 0;
for (const s of realUniqueSites) {
  if (addSite(s)) addedCount++;
}

rawData.sites = existingSites;
fs.writeFileSync(dataPath, JSON.stringify(rawData, null, 2), 'utf-8');

console.log(`Successfully added ${addedCount} real unique platforms. Total verified sites: ${existingSites.length}`);
