import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend } from 'k6/metrics';

/**
 * Навантажувальний тест платформи «Зміна».
 *
 * Критерії дипломної роботи (НФВ, підрозділ 3.1.2):
 *   - p95 часу відповіді  < 500 мс
 *   - частка помилок      < 1 %
 *
 * Профіль навантаження вибирається змінною оточення PROFILE:
 *   PROFILE=smoke   — димовий прогін (1 VU, 30 с) для перевірки, що все живе;
 *   PROFILE=rps150  — цільовий профіль (за замовчуванням), пік 150 RPS;
 *   PROFILE=rps1000 — розширений стрес, пік 1000 RPS;
 *   PROFILE=rps5000 — граничний стрес, пік 5000 RPS.
 *
 * Ціль:  k6 run infra/test/load_test.js
 *        k6 run --env PROFILE=smoke infra/test/load_test.js
 *        pnpm test:load:vps        (проти https://zmina.pp.ua)
 *
 * Результат зводиться у infra/test/results/summary.json (handleSummary).
 */

const BASE_URL = __ENV.TARGET_HOST || 'http://localhost:5000';
const PROFILE = __ENV.PROFILE || 'rps150';

// Окремі Trend-метрики за ключовими ендпоінтами — щоб у звіті було видно
// внесок кожного, а не лише агрегований http_req_duration.
const shiftsListTrend = new Trend('ep_shifts_list', true);
const shiftsMapTrend = new Trend('ep_shifts_map', true);
const shiftDetailTrend = new Trend('ep_shift_detail', true);
const dictionariesTrend = new Trend('ep_dictionaries', true);
const authRefreshTrend = new Trend('ep_auth_refresh', true);

const RAMP_PROFILES = {
  smoke: [
    { duration: '10s', target: 5 },
    { duration: '20s', target: 5 },
    { duration: '5s', target: 0 },
  ],
  rps150: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 150 },
    { duration: '30s', target: 0 },
  ],
  rps1000: [
    { duration: '1m', target: 300 },
    { duration: '2m', target: 600 },
    { duration: '2m', target: 1000 },
    { duration: '1m', target: 1000 },
    { duration: '1m', target: 0 },
  ],
  rps5000: [
    { duration: '1m', target: 500 },
    { duration: '2m', target: 2000 },
    { duration: '1m', target: 2000 },
    { duration: '2m', target: 5000 },
    { duration: '1m', target: 5000 },
    { duration: '1m', target: 0 },
  ],
};

const stages = RAMP_PROFILES[PROFILE] || RAMP_PROFILES.rps150;

export const options = {
  scenarios: {
    // Основне навантаження — публічне читання (біржа змін, карта, довідники).
    public_read: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      maxVUs: 2500,
      stages,
      exec: 'publicRead',
    },
    // Окремий постійний потік ротації токена — імітує активні клієнтські сесії.
    // Вмикається лише коли setup() зумів отримати refresh-cookie.
    auth_refresh: {
      executor: 'constant-arrival-rate',
      rate: PROFILE === 'smoke' ? 2 : 20,
      timeUnit: '1s',
      duration: PROFILE === 'smoke' ? '35s' : '2m30s',
      preAllocatedVUs: 20,
      maxVUs: 200,
      exec: 'authRefresh',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
    ep_shifts_list: ['p(95)<500'],
    ep_auth_refresh: ['p(95)<500'],
  },
};

const JSON_HEADERS = { 'Content-Type': 'application/json' };

/**
 * Реєструє одноразового користувача й повертає його refresh-cookie,
 * щоб сценарій auth_refresh мав чим оновлювати сесію.
 * Якщо реєстрація недоступна (напр. прод без відкритого /register),
 * повертаємо null — сценарій ротації тоді фактично неактивний.
 */
export function setup() {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1e6)}`;
  const payload = JSON.stringify({
    email: `loadtest_${suffix}@example.com`,
    phone: `+38050${String(suffix).slice(-7)}`,
    password: 'LoadTest123!',
    role: 'worker',
  });

  const res = http.post(`${BASE_URL}/api/auth/register`, payload, {
    headers: JSON_HEADERS,
  });

  if (res.status !== 201 && res.status !== 200) {
    console.warn(`setup: register returned ${res.status}, auth_refresh disabled`);
    return { refreshCookie: null };
  }

  const cookie = res.cookies?.refreshToken?.[0]?.value || null;
  return { refreshCookie: cookie };
}

export function publicRead() {
  group('shifts list', () => {
    const res = http.get(`${BASE_URL}/api/shifts?page=1&limit=20`, {
      headers: JSON_HEADERS,
    });
    shiftsListTrend.add(res.timings.duration);
    check(res, { 'GET /api/shifts 200': (r) => r.status === 200 });
  });

  group('shifts map', () => {
    const res = http.get(`${BASE_URL}/api/shifts/map`, { headers: JSON_HEADERS });
    shiftsMapTrend.add(res.timings.duration);
    check(res, { 'GET /api/shifts/map 200': (r) => r.status === 200 });
  });

  group('dictionaries', () => {
    const res = http.batch([
      ['GET', `${BASE_URL}/api/categories`, null, { headers: JSON_HEADERS }],
      ['GET', `${BASE_URL}/api/areas`, null, { headers: JSON_HEADERS }],
      ['GET', `${BASE_URL}/api/positions`, null, { headers: JSON_HEADERS }],
    ]);
    res.forEach((r) => {
      dictionariesTrend.add(r.timings.duration);
      check(r, { 'dictionary 200': (x) => x.status === 200 });
    });
  });

  group('shift detail', () => {
    // Беремо id першої зміни зі списку; якщо список порожній — пропускаємо.
    const list = http.get(`${BASE_URL}/api/shifts?page=1&limit=1`, {
      headers: JSON_HEADERS,
    });
    let firstId = null;
    try {
      const body = list.json();
      firstId = body?.data?.[0]?.id ?? body?.[0]?.id ?? null;
    } catch (_e) {
      firstId = null;
    }
    if (firstId != null) {
      const res = http.get(`${BASE_URL}/api/shifts/${firstId}`, {
        headers: JSON_HEADERS,
      });
      shiftDetailTrend.add(res.timings.duration);
      check(res, { 'GET /api/shifts/:id 200': (r) => r.status === 200 });
    }
  });

  sleep(0.5);
}

export function authRefresh(data) {
  if (!data?.refreshCookie) return;

  const res = http.post(`${BASE_URL}/api/auth/refresh`, null, {
    headers: JSON_HEADERS,
    cookies: { refreshToken: data.refreshCookie },
  });
  authRefreshTrend.add(res.timings.duration);
  check(res, {
    'POST /api/auth/refresh 200': (r) => r.status === 200,
    'refresh returns a token': (r) => {
      try {
        return typeof r.json('token') === 'string' || typeof r.json('accessToken') === 'string';
      } catch (_e) {
        return false;
      }
    },
  });
  sleep(1);
}

export function handleSummary(data) {
  const pick = (metric) => {
    const m = data.metrics[metric];
    if (!m) return null;
    return {
      count: m.values.count,
      rate: m.values.rate,
      avg: m.values.avg,
      p95: m.values['p(95)'],
      p99: m.values['p(99)'],
      max: m.values.max,
    };
  };

  const report = {
    target: BASE_URL,
    profile: PROFILE,
    generatedAt: new Date().toISOString(),
    criteria: {
      p95_under_500ms: data.metrics.http_req_duration?.values['p(95)'] < 500,
      error_rate_under_1pct: (data.metrics.http_req_failed?.values.rate ?? 1) < 0.01,
    },
    http_req_duration: pick('http_req_duration'),
    http_req_failed: {
      rate: data.metrics.http_req_failed?.values.rate,
      passes: data.metrics.http_req_failed?.values.passes,
      fails: data.metrics.http_req_failed?.values.fails,
    },
    iterations: pick('iterations'),
    endpoints: {
      shifts_list: pick('ep_shifts_list'),
      shifts_map: pick('ep_shifts_map'),
      shift_detail: pick('ep_shift_detail'),
      dictionaries: pick('ep_dictionaries'),
      auth_refresh: pick('ep_auth_refresh'),
    },
  };

  const line = (label, s) =>
    s ? `  ${label.padEnd(16)} n=${String(s.count).padStart(7)}  avg=${s.avg?.toFixed(1)}ms  p95=${s.p95?.toFixed(1)}ms  p99=${s.p99?.toFixed(1)}ms` : `  ${label}: —`;

  const stdout = [
    '',
    `k6 load test — ${BASE_URL} (profile: ${PROFILE})`,
    `  p95 < 500ms ...... ${report.criteria.p95_under_500ms ? 'PASS' : 'FAIL'} (${report.http_req_duration?.p95?.toFixed(1)}ms)`,
    `  errors < 1% ...... ${report.criteria.error_rate_under_1pct ? 'PASS' : 'FAIL'} (${((report.http_req_failed.rate ?? 0) * 100).toFixed(2)}%)`,
    line('shifts_list', report.endpoints.shifts_list),
    line('shifts_map', report.endpoints.shifts_map),
    line('shift_detail', report.endpoints.shift_detail),
    line('dictionaries', report.endpoints.dictionaries),
    line('auth_refresh', report.endpoints.auth_refresh),
    '',
  ].join('\n');

  return {
    stdout,
    'infra/test/results/summary.json': JSON.stringify(report, null, 2),
  };
}
