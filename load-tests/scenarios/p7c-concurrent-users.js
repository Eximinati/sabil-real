import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const errorRate = new Rate('errors');
const requestDuration = new Trend('request_duration');

export const options = {
  thresholds: {
    errors: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.01'],
  },
  stages: (() => {
    const s = __ENV.K6_STAGE || '10_5m';
    const parts = s.split('_');
    return [
      { duration: parts[1] || '5m', target: parseInt(parts[0]) || 10 },
      { duration: '2m', target: 0 },
    ];
  })(),
};

const ENDPOINTS = [
  { url: '/', group: 'Home', weight: 5 },
  { url: '/login', group: 'Login Page', weight: 3 },
  { url: '/register', group: 'Register Page', weight: 2 },
  { url: '/api/health', group: 'Health', weight: 1 },
  { url: '/api/chapters', group: 'Chapters API', weight: 10 },
  { url: '/api/verses?verse_keys=1:1-1:7', group: 'Verses API', weight: 8 },
  { url: '/api/verses/1', group: 'Chapter Verses', weight: 6 },
  { url: '/api/search?q=mercy&page=1&limit=20', group: 'Search API', weight: 4 },
  { url: '/api/translations', group: 'Translations', weight: 3 },
  { url: '/api/tafsirs', group: 'Tafsirs', weight: 3 },
  { url: '/api/audio/1/1', group: 'Audio API', weight: 2 },
];

const WEIGHTED = [];
for (const ep of ENDPOINTS) {
  for (let i = 0; i < ep.weight; i++) {
    WEIGHTED.push(ep);
  }
}

export default function () {
  const ep = WEIGHTED[Math.floor(Math.random() * WEIGHTED.length)];
  const url = `${BASE_URL}${ep.url}`;

  const resp = http.get(url, { timeout: '30s' });

  requestDuration.add(resp.timings.duration);
  errorRate.add(resp.status >= 400);

  check(resp, {
    'status is 2xx': (r) => r.status >= 200 && r.status < 300,
    'status is not 500': (r) => r.status !== 500,
  });

  if (resp.status >= 400) {
    console.log(`FAIL [${resp.status}] ${ep.group}: ${url}`);
  }

  sleep(Math.random() * 3 + 1);
}
