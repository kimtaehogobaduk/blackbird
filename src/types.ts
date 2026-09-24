export interface ExtractedMetadata {
  name: string;
  type: 'String' | 'Image' | 'Array';
  value: string | string[];
  schema?: string;
  prefix?: string;
}

export interface FoundAccount {
  name: string;
  url: string;
  category: string;
  status: 'FOUND' | 'NOT-FOUND' | 'ERROR';
  metadata?: ExtractedMetadata[];
  responseTimeMs?: number;
  detectionType?: 'email' | 'username_pivot' | 'octopus_pivot';
  pivotEmail?: string;
}

export interface OctopusDomainNode {
  domain: string;
  email: string;
  status: 'VERIFIED' | 'ROUTABLE' | 'DISCOVERED' | 'CHECKING' | 'NOT_FOUND';
  providerName?: string;
  category?: string;
  avatarUrl?: string;
  signals?: string[];
  responseTimeMs?: number;
  branchesCount?: number;
  isTarget?: boolean;
}

export interface SearchSiteConfig {
  name: string;
  uri_check: string;
  e_code?: number;
  e_string?: string;
  m_code?: number;
  m_string?: string;
  cat: string;
  strip_regex?: string | null;
  input_operation?: string;
  method?: string;
  data?: string | null;
  headers?: Record<string, string> | null;
  profile_url?: string;
  known?: string[];
  metadata?: any[];
}

export interface SearchProgressEvent {
  type: 'init' | 'progress' | 'found' | 'complete' | 'error' | 'octopus_init' | 'octopus_found' | 'octopus_progress';
  query?: string;
  searchType?: 'username' | 'email';
  totalSites?: number;
  completed?: number;
  currentSite?: string;
  foundCount?: number;
  account?: FoundAccount;
  elapsedSec?: number;
  message?: string;
  octopusNode?: OctopusDomainNode;
  octopusTotal?: number;
  octopusChecked?: number;
  octopusVerifiedCount?: number;
}

export interface AiProfileAnalysis {
  summary: string;
  behavioralProfile: string;
  categories: {
    category: string;
    confidence: number;
    description: string;
  }[];
  digitalFootprintScore: 'Low' | 'Moderate' | 'High' | 'Extensive';
  exposureRisk: string;
  keyInsights: string[];
}
