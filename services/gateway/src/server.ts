import express from 'express';
import fs from 'fs';
import path from 'path';
import { Normalizer } from './middleware/normalize';
import { ContractRouter } from '@companion/router';
import { OfflineResolver } from '@companion/resolver-offline';
import { SafeCacheResolver } from '@companion/resolver-cache';
import { ExternalResolver } from '@companion/resolver-external';
import { ModelOrchestrator } from '@companion/orchestrator';
import { CircuitBreaker } from '@companion/shared/utils/circuit-breaker';
import { RateLimiter } from '@companion/shared/utils/rate-limiter';
import { FallbackRegistry } from '@companion/shared/fallbacks/registry';
import { isValidDevToken, DevModeRequest } from '@companion/shared/types/DevMode';
import { LanguageComposer, LanguageCode } from '@companion/shared/utils/nls';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
app.use(cors());
app.use(express.json());

const isProduction = process.env.NODE_ENV === 'production';
const frontendDevUrl = process.env.FRONTEND_DEV_URL;

if (!isProduction && frontendDevUrl) {
  const frontendProxy = createProxyMiddleware({
    target: frontendDevUrl,
    changeOrigin: true,
    ws: true,
    logLevel: 'silent',
  });

  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }
    return frontendProxy(req, res, next);
  });
}

// Initialize components
const contractRouter = new ContractRouter();
const offlineResolver = new OfflineResolver();
const cacheResolver = new SafeCacheResolver();
const externalResolver = new ExternalResolver();
const modelOrchestrator = new ModelOrchestrator(process.env.ANTHROPIC_API_KEY || '');

// Circuit breakers
const claudeBreaker = new CircuitBreaker(5, 60000);
const externalBreaker = new CircuitBreaker(3, 30000);

// Rate limiters
const userLimiter = new RateLimiter(60, 60000);
const modelLimiter = new RateLimiter(10, 60000);

// Session state
const sessions = new Map<string, { start: Date; lastTurn: Date | null }>();

// CHANGE: role-based access simulation (demo)
type DemoRole = 'Viewer' | 'Analyst' | 'Admin';
declare global {
  // CHANGE: express user typing for demo roles
  namespace Express {
    interface Request {
      user?: { role: DemoRole };
    }
  }
}
const roleFromRequest = (req: express.Request): DemoRole => {
  const headerRole = (req.header('x-demo-role') || '').toLowerCase();
  const cookieHeader = req.headers.cookie || '';
  const cookieMatch = cookieHeader.match(/sca_role=([^;]+)/i);
  const cookieRole = (cookieMatch?.[1] || '').toLowerCase();
  const value = headerRole || cookieRole;
  if (value === 'admin') return 'Admin';
  if (value === 'analyst') return 'Analyst';
  return 'Viewer';
};

const permissionsFor = (role: DemoRole) => ({
  role,
  can_review: role !== 'Viewer',
  can_export: role === 'Admin',
  can_view_audit: role !== 'Viewer',
});

const governancePayload = {
  audit_logged: true,
  data_boundary: 'm365-simulated',
  retention: 'no_document_storage',
  roles: ['Viewer', 'Analyst', 'Admin'],
};

const ethicsPayload = {
  human_in_loop: true,
  explainability: true,
};

const demoMetrics = {
  documents: 0,
  backlogScans: 0,
  backlogItemsFlagged: 0,
  riskFlags: 0,
  totalRiskScore: 0,
  riskScoreCount: 0,
  lastRun: '',
  lastExport: '',
};

const reviewStore = new Map<string, { reviewed: boolean; reviewer: string; reviewed_at: string }>();

type WeatherResponse = {
  latitude: number;
  longitude: number;
  temperature_c: number;
  weather_code: number;
  location: string;
  answer: string;
};

const getWeather = async (
  lat: number,
  lon: number,
  locationLabel: string,
  lang: LanguageCode,
  seed: string
): Promise<WeatherResponse> => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Weather API failed');
  const data = await response.json();
  const current = data.current || {};
  const temperature_c = Number(current.temperature_2m);
  const weather_code = Number(current.weather_code);
  const answer = LanguageComposer.composeWeather(
    { location: locationLabel, temperature_c, weather_code },
    lang,
    seed
  );
  return {
    latitude: lat,
    longitude: lon,
    temperature_c,
    weather_code,
    location: locationLabel,
    answer,
  };
};

const extractLocationQuery = (raw: string): string | null => {
  const match = raw.match(/\b(?:en|in)\s+(.+)$/i);
  if (!match) return null;
  let candidate = match[1]
    .replace(/[?!.]+$/g, '')
    .replace(/\b(right now|today|now|hoy|ahora)\b/gi, '')
    .trim();
  if (!candidate) return null;
  return candidate;
};

const geocodeLocation = async (query: string): Promise<{ lat: number; lon: number; label: string; timezone?: string } | null> => {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json();
  const result = data.results && data.results[0];
  if (!result) return null;
  const labelParts = [result.name, result.admin1, result.country].filter(Boolean);
  return { lat: result.latitude, lon: result.longitude, label: labelParts.join(', '), timezone: result.timezone };
};

const getTimeByTimezone = async (timezone: string) => {
  const response = await fetch(`https://worldtimeapi.org/api/timezone/${encodeURIComponent(timezone)}`);
  if (!response.ok) throw new Error('Time API failed');
  const data = await response.json();
  return {
    timezone: data.timezone as string,
    datetime_iso: data.datetime as string,
  };
};

const extractSimpleMath = (text: string): number | null => {
  const expr = text.replace(/[^0-9+\-*/().\s]/g, '').trim();
  if (!expr || /[a-z]/i.test(expr)) return null;
  if (!/^[0-9+\-*/().\s]+$/.test(expr)) return null;
  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${expr});`)();
    if (typeof result === 'number' && Number.isFinite(result)) return result;
  } catch {
    return null;
  }
  return null;
};

const getFactualAnswer = (text: string, lang: LanguageCode): string | null => {
  const lower = text.toLowerCase();
  const capitals: Record<string, string> = {
    france: 'Paris',
    spain: 'Madrid',
    mexico: 'Mexico City',
    japan: 'Tokyo',
    germany: 'Berlin',
    italy: 'Rome',
    portugal: 'Lisbon',
    canada: 'Ottawa',
    brazil: 'Brasilia',
    argentina: 'Buenos Aires',
  };
  const capitalMatch = lower.match(/capital of ([a-z\s]+)/i);
  if (capitalMatch) {
    const country = capitalMatch[1].trim();
    if (capitals[country]) return `Capital of ${country} is ${capitals[country]}`;
  }
  if (/\bwhere am i\b/i.test(lower) || /\bdonde estoy\b/i.test(lower)) {
    return lang === 'es'
      ? 'No tengo acceso a tu ubicacion exacta.'
      : 'I do not have access to your exact location.';
  }
  if (/\bwho are you\b/i.test(lower) || /\bque eres\b/i.test(lower)) {
    return 'Companion Core assistant';
  }
  return null;
};

app.get('/api/weather', async (req, res) => {
  const latParam = req.query.lat as string | undefined;
  const lonParam = req.query.lon as string | undefined;
  const query = req.query.query as string | undefined;

  try {
    let lat = latParam ? Number(latParam) : NaN;
    let lon = lonParam ? Number(lonParam) : NaN;
    let label = query || 'Ubicacion';
    const lang = (Normalizer.normalize(query || '').language || 'en') as LanguageCode;
    const seed = query || 'weather';

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      if (!query) {
        return res.json({
          latitude: 0,
          longitude: 0,
          temperature_c: 0,
          weather_code: -1,
          location: '',
          answer: 'Necesito una ciudad o ubicacion para darte el clima. Ejemplo: "¿Hace sol hoy en Madrid?"',
        });
      }
      const locationQuery = extractLocationQuery(query);
      if (!locationQuery) {
        return res.json({
          latitude: 0,
          longitude: 0,
          temperature_c: 0,
          weather_code: -1,
          location: '',
          answer: 'Necesito una ciudad o ubicacion para darte el clima. Ejemplo: "¿Hace sol hoy en Madrid?"',
        });
      }
      const geo = await geocodeLocation(locationQuery);
      if (!geo) {
        return res.json({
          latitude: 0,
          longitude: 0,
          temperature_c: 0,
          weather_code: -1,
          location: '',
          answer: 'No encontre esa ubicacion. Prueba con una ciudad como "Madrid" o "Mexico City".',
        });
      }
      lat = geo.lat;
      lon = geo.lon;
      label = geo.label;
    }

    const weather = await getWeather(lat, lon, label, lang, seed);
    return res.json(weather);
  } catch (error) {
    return res.status(500).json({ error: 'Weather lookup failed' });
  }
});

app.get('/api/time', async (req, res) => {
  const timezoneParam = req.query.timezone as string | undefined;
  const query = req.query.query as string | undefined;

  try {
    const lang = (Normalizer.normalize(query || '').language || 'en') as LanguageCode;
    let timezone = timezoneParam;
    let location = timezoneParam || 'UTC';

    if (!timezone && query) {
      const locationQuery = extractLocationQuery(query);
      if (locationQuery) {
        const geo = await geocodeLocation(locationQuery);
        if (geo && geo.label) {
          location = geo.label;
          timezone = geo.timezone;
        }
      }
    }

    if (!timezone) {
      const answer = LanguageComposer.composeFactual(
        { text: lang === 'es' ? 'Necesito una ciudad o zona horaria.' : 'I need a city or timezone.' },
        lang,
        query || 'time'
      );
      return res.json({ timezone: '', datetime_iso: '', location: '', answer });
    }

    const timeData = await getTimeByTimezone(timezone);
    const answer = LanguageComposer.composeTime(
      { location, timezone, datetime_iso: timeData.datetime_iso },
      lang,
      query || 'time'
    );
    return res.json({ ...timeData, location, answer });
  } catch (error) {
    return res.status(500).json({ error: 'Time lookup failed' });
  }
});

const scaRoleMiddleware = (req: express.Request, _res: express.Response, next: express.NextFunction) => {
  req.user = { role: roleFromRequest(req) } as any;
  return next();
};

// CHANGE: apply role middleware to SCA demo endpoints
app.use('/api/analyze-document', scaRoleMiddleware);
app.use('/api/scan-backlog', scaRoleMiddleware);
app.use('/api/risk-flag', scaRoleMiddleware);
app.use('/api/audit-log', scaRoleMiddleware);
app.use('/api/meeting-summary', scaRoleMiddleware);
app.use('/api/confirm-review', scaRoleMiddleware);
app.use('/api/metrics-summary', scaRoleMiddleware);
app.use('/api/export-csv', scaRoleMiddleware);
app.use('/api/export-json', scaRoleMiddleware);
app.use('/api/meeting-upload', scaRoleMiddleware);

// --- SCA Demo Endpoints (Structured JSON only) ---

type DocumentAnalysis = {
  analysis_id: string;
  generated_for: string;
  summary: string;
  deadlines: { label: string; date: string; urgency: 'low' | 'medium' | 'high' | 'critical' }[];
  stakeholders: { name: string; role: string }[];
  risks: { label: string; severity: 'low' | 'medium' | 'high' | 'critical'; rationale: string }[];
  needs_human_review: boolean;
  permissions: ReturnType<typeof permissionsFor>;
  governance: typeof governancePayload;
  ethics: typeof ethicsPayload;
  confidence: number;
};

const monthIndex: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

const toIsoDate = (raw: string): string | null => {
  const match = raw.match(/(\d{1,2})\s([A-Za-z]{3})[a-z]*\s(\d{4})/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = monthIndex[match[2].toLowerCase()];
  const year = Number(match[3]);
  if (Number.isNaN(day) || month === undefined || Number.isNaN(year)) return null;
  const d = new Date(Date.UTC(year, month, day));
  return d.toISOString().slice(0, 10);
};

const extractDeadlines = (text: string) => {
  const matches = text.match(/\b(\d{1,2}\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s\d{4})\b/gi) || [];
  return matches.slice(0, 3).map((m, idx) => ({
    label: idx === 0 ? 'Primary deadline' : 'Supporting deadline',
    date: toIsoDate(m) || m,
    urgency: idx === 0 ? 'high' as const : 'medium' as const,
  }));
};

const extractStakeholders = (text: string) => {
  const candidates = text.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)?\b/g) || [];
  const unique = Array.from(new Set(candidates)).slice(0, 4);
  return unique.map((name, idx) => ({
    name,
    role: idx === 0 ? 'Owner' : 'Contributor',
  }));
};

const buildDocumentAnalysis = (input: { text?: string; title?: string; purpose?: string }, role: DemoRole): DocumentAnalysis => {
  const text = input.text || '';
  const deadlines = extractDeadlines(text);
  const stakeholders = extractStakeholders(text);
  const risks = [
    {
      label: 'Evidence gap in service impact',
      severity: 'medium',
      rationale: 'Limited metrics linked to citizen outcomes.',
    },
    {
      label: 'Procurement timeline compression',
      severity: 'high',
      rationale: 'Milestones cluster in a short window.',
    },
  ];
  return {
    analysis_id: `ANL-${Date.now()}`,
    generated_for: input.purpose || 'planning',
    summary: input.title
      ? `Structured analysis for "${input.title}".`
      : 'Structured analysis generated from provided document content.',
    deadlines: deadlines.length ? deadlines : [
      { label: 'Policy sign-off', date: '2026-03-18', urgency: 'high' },
      { label: 'Vendor review', date: '2026-04-04', urgency: 'medium' },
    ],
    stakeholders: stakeholders.length ? stakeholders : [
      { name: 'Strategy Office', role: 'Owner' },
      { name: 'Digital Services', role: 'Contributor' },
      { name: 'Legal & Compliance', role: 'Reviewer' },
    ],
    risks,
    needs_human_review: true,
    permissions: permissionsFor(role),
    governance: governancePayload,
    ethics: ethicsPayload,
    confidence: 0.74,
  };
};

app.post('/api/analyze-document', (req, res) => {
  const role = (req.user?.role || 'Viewer') as DemoRole;
  const input = req.body || {};
  const payload = buildDocumentAnalysis({
    text: input.text,
    title: input.title,
    purpose: input.purpose,
  }, role);
  demoMetrics.documents += 1;
  demoMetrics.lastRun = new Date().toISOString();
  reviewStore.set(payload.analysis_id, { reviewed: false, reviewer: '', reviewed_at: '' });
  return res.json(payload);
});

app.post('/api/scan-backlog', (req, res) => {
  const role = (req.user?.role || 'Viewer') as DemoRole;
  const input = req.body || {};
  demoMetrics.backlogScans += 1;
  demoMetrics.backlogItemsFlagged += 3;
  demoMetrics.lastRun = new Date().toISOString();
  return res.json({
    backlog_count: 42,
    high_priority: 7,
    medium_priority: 18,
    low_priority: 17,
    queue_health: 'healthy',
    extracted_from: input.source || 'operations-queue',
    items: [
      { id: 'BK-0142', title: 'Housing benefit review', urgency: 'high', owner: 'Casework' },
      { id: 'BK-0134', title: 'Adult social care triage', urgency: 'high', owner: 'ASC' },
      { id: 'BK-0119', title: 'Waste services KPI audit', urgency: 'medium', owner: 'Operations' },
    ],
    permissions: permissionsFor(role),
    governance: governancePayload,
    ethics: ethicsPayload,
  });
});

app.post('/api/risk-flag', (req, res) => {
  const role = (req.user?.role || 'Viewer') as DemoRole;
  const input = req.body || {};
  const flags = [
    { id: 'RSK-08', label: 'SLA breach risk', urgency: 'critical', deadline: '2026-02-28' },
    { id: 'RSK-11', label: 'Evidence backlog exceeds threshold', urgency: 'high', deadline: '2026-03-05' },
    { id: 'RSK-14', label: 'Vendor DPIA pending', urgency: 'medium', deadline: '2026-03-22' },
  ];
  const urgencyOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const withScores = flags.map((flag, idx) => {
    const base = flag.urgency === 'critical' ? 0.92 : flag.urgency === 'high' ? 0.78 : 0.55;
    const score = Math.min(0.99, base - idx * 0.04);
    return {
      ...flag,
      risk_score: Number(score.toFixed(2)),
      rationale: 'Predictive signal derived from backlog velocity and SLA thresholds.',
    };
  }).sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
  demoMetrics.riskFlags += withScores.length;
  demoMetrics.totalRiskScore += withScores.reduce((sum, item) => sum + item.risk_score, 0);
  demoMetrics.riskScoreCount += withScores.length;
  demoMetrics.lastRun = new Date().toISOString();
  return res.json({
    generated_for: input.scope || 'portfolio',
    flags: withScores,
    permissions: permissionsFor(role),
    governance: governancePayload,
    ethics: ethicsPayload,
  });
});

app.get('/api/audit-log', (req, res) => {
  const role = (req.user?.role || 'Viewer') as DemoRole;
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const items = Array.from({ length: limit }).map((_, idx) => ({
    id: `AUD-${(page - 1) * limit + idx + 1}`,
    user: idx % 2 === 0 ? 'Analyst.Team' : 'Ops.Manager',
    action: idx % 2 === 0 ? 'Backlog scan' : 'Risk flag review',
    time: new Date(Date.now() - idx * 3600000).toISOString(),
    status: idx % 3 === 0 ? 'Failed' : idx % 2 === 0 ? 'Completed' : 'Reviewed',
  }));
  return res.json({
    page,
    limit,
    total: 120,
    items,
    permissions: permissionsFor(role),
    governance: governancePayload,
    ethics: ethicsPayload,
  });
});

app.post('/api/meeting-summary', (req, res) => {
  const role = (req.user?.role || 'Viewer') as DemoRole;
  const input = req.body || {};
  return res.json({
    meeting_title: input.title || 'Strategic AI Steering',
    summary: 'Consensus on phased automation with governance gates and evidence capture.',
    action_items: [
      { owner: 'Policy Lead', task: 'Finalize AI governance checklist', deadline: '2026-03-01' },
      { owner: 'Data Office', task: 'Deliver backlog prioritization rubric', deadline: '2026-03-08' },
      { owner: 'Service Ops', task: 'Validate triage workflow baseline', deadline: '2026-03-12' },
    ],
    stakeholders: ['Strategy Office', 'Data Office', 'Legal & Compliance'],
    permissions: permissionsFor(role),
    governance: governancePayload,
    ethics: ethicsPayload,
  });
});

app.post('/api/confirm-review', (req, res) => {
  const role = (req.user?.role || 'Viewer') as DemoRole;
  const input = req.body || {};
  const analysis_id = input.analysis_id || 'unknown';
  const reviewed_at = new Date().toISOString();
  reviewStore.set(analysis_id, {
    reviewed: true,
    reviewer: input.reviewer || role,
    reviewed_at,
  });
  return res.json({
    analysis_id,
    reviewed: true,
    reviewed_by: input.reviewer || role,
    reviewed_at,
    permissions: permissionsFor(role),
    governance: governancePayload,
    ethics: ethicsPayload,
  });
});

app.get('/api/metrics-summary', (req, res) => {
  const role = (req.user?.role || 'Viewer') as DemoRole;
  const avgRisk = demoMetrics.riskScoreCount
    ? Number((demoMetrics.totalRiskScore / demoMetrics.riskScoreCount).toFixed(2))
    : 0;
  return res.json({
    documents: demoMetrics.documents,
    backlogScans: demoMetrics.backlogScans,
    backlogItemsFlagged: demoMetrics.backlogItemsFlagged,
    riskFlags: demoMetrics.riskFlags,
    avgRiskScore: avgRisk,
    lastRun: demoMetrics.lastRun,
    lastExport: demoMetrics.lastExport,
    permissions: permissionsFor(role),
    governance: governancePayload,
    ethics: ethicsPayload,
  });
});

app.get('/api/export-csv', (req, res) => {
  const role = (req.user?.role || 'Viewer') as DemoRole;
  const module = (req.query.module as string) || 'document';
  const generated_at = new Date().toISOString();
  demoMetrics.lastExport = generated_at;
  const rows = [
    ['id', 'title', 'status'],
    ['DOC-001', 'AI Strategy Brief', 'Completed'],
    ['DOC-002', 'Governance Memo', 'Reviewed'],
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  return res.json({
    module,
    format: 'csv',
    generated_at,
    content: csv,
    permissions: permissionsFor(role),
    governance: governancePayload,
    ethics: ethicsPayload,
  });
});

app.get('/api/export-json', (req, res) => {
  const role = (req.user?.role || 'Viewer') as DemoRole;
  const module = (req.query.module as string) || 'risk';
  const generated_at = new Date().toISOString();
  demoMetrics.lastExport = generated_at;
  return res.json({
    module,
    format: 'json',
    generated_at,
    data: {
      items: [
        { id: 'RSK-08', label: 'SLA breach risk', risk_score: 0.92 },
        { id: 'RSK-11', label: 'Evidence backlog exceeds threshold', risk_score: 0.78 },
      ],
    },
    permissions: permissionsFor(role),
    governance: governancePayload,
    ethics: ethicsPayload,
  });
});

app.post('/api/meeting-upload', (req, res) => {
  const role = (req.user?.role || 'Viewer') as DemoRole;
  const input = req.body || {};
  return res.json({
    meeting_title: input.meetingTitle || 'Meeting Upload',
    summary: 'Transcript parsed into governance actions and compliance checkpoints.',
    action_items: [
      { owner: 'Policy Lead', task: 'Confirm oversight checkpoints', deadline: '2026-03-04' },
      { owner: 'Data Office', task: 'Validate KPI thresholds', deadline: '2026-03-06' },
    ],
    stakeholders: ['Strategy Office', 'Digital Services'],
    permissions: permissionsFor(role),
    governance: governancePayload,
    ethics: ethicsPayload,
  });
});

app.post('/api/query', async (req, res) => {
  const start_time = Date.now();
  const body: DevModeRequest = req.body;
  const session_id = body.session_id || 'default';

  try {
    // Rate limit check
    if (!userLimiter.isAllowed(session_id)) {
      return res.status(429).json({
        status: 'rate_limited',
        message: 'Too many requests',
      });
    }

    // Dev mode validation
    const devModeAllowed = body.dev_mode?.allow_external && 
                          isValidDevToken(body.dev_mode?.token);

    // Phase 1: Normalize
    const normalized = Normalizer.normalize(body.message || '');

    // Direct weather/time handling (NLS)
    if (normalized.intent_hints.includes('weather')) {
      const locationQuery = extractLocationQuery(normalized.text || '');
      if (!locationQuery) {
        const answer = LanguageComposer.composeFactual(
          {
            text: normalized.language === 'es'
              ? 'Necesito una ciudad o ubicacion para darte el clima.'
              : 'I need a city or location to provide the weather.',
          },
          normalized.language as LanguageCode,
          normalized.request_hash
        );
        return res.json({
          status: 'resolved',
          path: 'WEATHER',
          answer,
          latency_ms: Date.now() - start_time,
          trace_id: normalized.trace_id,
        });
      }
      const geo = await geocodeLocation(locationQuery);
      if (!geo) {
        const answer = LanguageComposer.composeFactual(
          {
            text: normalized.language === 'es'
              ? 'No encontre esa ubicacion. Prueba con una ciudad como "Madrid".'
              : 'Location not found. Try a city like "Madrid".',
          },
          normalized.language as LanguageCode,
          normalized.request_hash
        );
        return res.json({
          status: 'resolved',
          path: 'WEATHER',
          answer,
          latency_ms: Date.now() - start_time,
          trace_id: normalized.trace_id,
        });
      }
      const weather = await getWeather(geo.lat, geo.lon, geo.label, normalized.language as LanguageCode, normalized.request_hash);
      return res.json({
        status: 'resolved',
        path: 'WEATHER',
        answer: weather.answer,
        source: 'open-meteo',
        latency_ms: Date.now() - start_time,
        trace_id: normalized.trace_id,
      });
    }

    if (normalized.intent_hints.includes('time')) {
      const locationQuery = extractLocationQuery(normalized.text || '');
      if (!locationQuery) {
        const answer = LanguageComposer.composeFactual(
          {
            text: normalized.language === 'es'
              ? 'Necesito una ciudad o zona horaria para darte la hora.'
              : 'I need a city or timezone to provide the time.',
          },
          normalized.language as LanguageCode,
          normalized.request_hash
        );
        return res.json({
          status: 'resolved',
          path: 'TIME',
          answer,
          latency_ms: Date.now() - start_time,
          trace_id: normalized.trace_id,
        });
      }
      const geo = await geocodeLocation(locationQuery);
      if (!geo || !geo.timezone) {
        const answer = LanguageComposer.composeFactual(
          {
            text: normalized.language === 'es'
              ? 'No pude determinar la zona horaria para esa ubicacion.'
              : 'I could not determine the timezone for that location.',
          },
          normalized.language as LanguageCode,
          normalized.request_hash
        );
        return res.json({
          status: 'resolved',
          path: 'TIME',
          answer,
          latency_ms: Date.now() - start_time,
          trace_id: normalized.trace_id,
        });
      }
      const timeData = await getTimeByTimezone(geo.timezone);
      const answer = LanguageComposer.composeTime(
        { location: geo.label, timezone: geo.timezone, datetime_iso: timeData.datetime_iso },
        normalized.language as LanguageCode,
        normalized.request_hash
      );
      return res.json({
        status: 'resolved',
        path: 'TIME',
        answer,
        source: 'worldtimeapi',
        latency_ms: Date.now() - start_time,
        trace_id: normalized.trace_id,
      });
    }
    
    // Get/create session
    let session = sessions.get(session_id);
    if (!session) {
      session = { start: new Date(), lastTurn: null };
      sessions.set(session_id, session);
    }

    // Phase 2: Contract Router
    const contract = contractRouter.route(
      normalized,
      session.start,
      session.lastTurn,
      { devModeAllowed }
    );

    let result: any = null;

    // Phase 3: Fast Resolvers
    if (contract.path === 'OFFLINE') {
      result = await offlineResolver.resolve(normalized);
    } else if (contract.path === 'SAFE_CACHE') {
      result = await cacheResolver.resolve(normalized);
      
      // Escalate to external on cache miss
      if (result === 'MISS' && !externalBreaker.isOpen()) {
        try {
          result = await externalResolver.resolve(normalized);
          if (result !== 'MISS') {
            externalBreaker.recordSuccess();
            cacheResolver.set('weather:default', result.answer, result.confidence, 300000);
          }
        } catch (err) {
          externalBreaker.recordFailure();
        }
      }
    }

    // Phase 4: External API (dev mode only)
    if (contract.path === 'EXTERNAL_API' && !externalBreaker.isOpen()) {
      try {
        result = await externalResolver.resolve(normalized);
        if (result !== 'MISS') {
          externalBreaker.recordSuccess();
          // Cache for future non-dev requests
          cacheResolver.set('weather:default', result.answer, result.confidence, 300000);
        }
      } catch (err) {
        externalBreaker.recordFailure();
        result = 'MISS';
      }
    }

    // Phase 5: Model execution (disabled in dev mode for now)
    if (contract.path === 'MODEL' && !claudeBreaker.isOpen()) {
      if (!modelLimiter.isAllowed(session_id)) {
        contract.path = 'DENY';
        contract.fallback_id = 'FALLBACK_PUBLIC_SAFE';
      } else {
        const mathResult = extractSimpleMath(body.message || '');
        const factual = getFactualAnswer(body.message || '', normalized.language as LanguageCode);
        if (mathResult !== null) {
          result = {
            answer: LanguageComposer.composeFactual(
              { text: String(mathResult), value: mathResult },
              normalized.language as LanguageCode,
              normalized.request_hash
            ),
            confidence: 1,
            source: 'nls.math',
            timestamp_ms: Date.now(),
          };
        } else if (factual) {
          result = {
            answer: LanguageComposer.composeFactual(
              { text: factual },
              normalized.language as LanguageCode,
              normalized.request_hash
            ),
            confidence: 0.8,
            source: 'nls.factual',
            timestamp_ms: Date.now(),
          };
        } else {
          result = {
            answer: LanguageComposer.composeFactual(
              {
                text: normalized.language === 'es'
                  ? 'Puedo ayudar con clima, hora y hechos simples.'
                  : 'I can help with weather, time, and simple facts.',
              },
              normalized.language as LanguageCode,
              normalized.request_hash
            ),
            confidence: 0.5,
            source: 'nls.fallback',
            timestamp_ms: Date.now(),
          };
        }
      }
    }

    // Update session
    session.lastTurn = new Date();

    // Phase 6: Response delivery
    if (result && result !== 'MISS') {
      return res.json({
        status: 'resolved',
        path: contract.path,
        answer: result.answer,
        confidence: result.confidence,
        source: result.source,
        latency_ms: Date.now() - start_time,
        trace_id: normalized.trace_id,
        dev_mode: devModeAllowed,
      });
    }

    // Fallback
    const fallback = FallbackRegistry.get(contract.fallback_id);
    return res.json({
      status: 'fallback',
      path: contract.path,
      fallback_id: contract.fallback_id,
      answer: fallback.message,
      suggest_action: fallback.suggest_action,
      latency_ms: Date.now() - start_time,
      trace_id: normalized.trace_id,
    });

  } catch (error) {
    console.error('Query error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal error',
      latency_ms: Date.now() - start_time,
    });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    circuit_breakers: {
      claude: claudeBreaker.getState(),
      external: externalBreaker.getState(),
    },
  });
});

// CHANGE: system status endpoint for dashboard badge
app.get('/api/system-status', (_req, res) => {
  return res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
  });
});

const staticDir = path.resolve(__dirname, '..', '..', '..', 'apps', 'web', 'out');
const hasStaticWeb = fs.existsSync(staticDir);

if (hasStaticWeb && (isProduction || !frontendDevUrl)) {
  app.use(express.static(staticDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Gateway listening on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
});
