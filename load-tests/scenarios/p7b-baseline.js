import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const ttfb = new Trend('ttfb');
const serverResponse = new Trend('server_response');
const apiResponse = new Trend('api_response');
const pageSize = new Trend('page_size_kb');

export const options = {
  vus: 1,
  iterations: 1,
};

const PAGES = [
  { name: 'Home', url: '/' },
  { name: 'Login', url: '/login' },
  { name: 'Register', url: '/register' },
];

const API_ENDPOINTS = [
  { name: 'Health', url: '/api/health' },
  { name: 'Chapters', url: '/api/chapters' },
  { name: 'Verses (1:1-1:7)', url: '/api/verses?verse_keys=1:1-1:7' },
  { name: 'Chapter 1 Verses', url: '/api/verses/1' },
  { name: 'Search (mercy)', url: '/api/search?q=mercy&page=1&limit=20' },
  { name: 'Translations', url: '/api/translations' },
  { name: 'Tafsirs', url: '/api/tafsirs' },
  { name: 'Audio (1/1)', url: '/api/audio/1/1' },
];

export default function () {
  group('Page Baseline', function () {
    for (const page of PAGES) {
      group(page.name, function () {
        const resp = http.get(`${BASE_URL}${page.url}`, { timeout: '30s' });
        ttfb.add(resp.timings.waiting);
        serverResponse.add(resp.timings.duration);
        pageSize.add(resp.body.length / 1024);
        check(resp, {
          [`${page.name} status 200`]: (r) => r.status === 200,
          [`${page.name} TTFB < 1s`]: (r) => r.timings.waiting < 1000,
        });
        console.log(`${page.name}: status=${resp.status}, TTFB=${resp.timings.waiting}ms, duration=${resp.timings.duration}ms, size=${(resp.body.length / 1024).toFixed(1)}KB`);
        sleep(0.5);
      });
    }
  });

  group('API Baseline', function () {
    for (const ep of API_ENDPOINTS) {
      group(ep.name, function () {
        const resp = http.get(`${BASE_URL}${ep.url}`, { timeout: '30s' });
        apiResponse.add(resp.timings.duration);
        ttfb.add(resp.timings.waiting);
        check(resp, {
          [`${ep.name} status 200`]: (r) => r.status === 200,
          [`${ep.name} TTFB < 500ms`]: (r) => r.timings.waiting < 500,
        });
        console.log(`API ${ep.name}: status=${resp.status}, TTFB=${resp.timings.waiting}ms, duration=${resp.timings.duration}ms, size=${(resp.body.length / 1024).toFixed(1)}KB`);
        sleep(0.3);
      });
    }
  });
}
