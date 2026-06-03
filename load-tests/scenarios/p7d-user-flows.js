import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';
const CSRF_TOKEN = __ENV.CSRF_TOKEN || '';

const flowSuccess = new Rate('flow_success');
const flowDuration = new Trend('flow_duration');

export const options = {
  thresholds: { flow_success: ['rate>0.99'], http_req_duration: ['p(95)<3000'] },
  vus: 5,
  iterations: 20,
};

export default function () {
  const flows = [journeyFlow, quranFlow, searchFlow];
  const flow = flows[Math.floor(Math.random() * flows.length)];
  const start = Date.now();

  try {
    flow();
    flowSuccess.add(1);
  } catch (e) {
    flowSuccess.add(0);
    console.log(`Flow FAILED: ${e}`);
  }

  flowDuration.add(Date.now() - start);
  sleep(Math.random() * 3 + 1);
}

function journeyFlow() {
  group('Journey A: Lesson → Reflection → Complete', function () {
    const lessonResp = http.get(`${BASE_URL}/journey/1`, {
      headers: authHeaders(), timeout: '30s',
    });
    check(lessonResp, { 'lesson loaded': (r) => r.status < 500 });
    sleep(1);

    const reflectResp = http.post(`${BASE_URL}/api/journey/reflection`,
      JSON.stringify({ lesson_id: '00000000-0000-0000-0000-000000000001', day_number: 1, reflection_text: `Test ${Date.now()}` }),
      { headers: mutationHeaders(), timeout: '15s' });
    check(reflectResp, { 'reflection saved': (r) => r.status < 500 });
    sleep(0.5);

    const completeResp = http.post(`${BASE_URL}/api/journey/progress`,
      JSON.stringify({ lesson_id: '00000000-0000-0000-0000-000000000001', day_number: 1, action: 'complete' }),
      { headers: mutationHeaders(), timeout: '15s' });
    check(completeResp, { 'lesson completed': (r) => r.status < 500 });
  });
}

function quranFlow() {
  group('Journey B: Quran → Tafsir → Bookmark', function () {
    const surahResp = http.get(`${BASE_URL}/quran/1`, {
      headers: authHeaders(), timeout: '30s',
    });
    check(surahResp, { 'quran loaded': (r) => r.status < 500 });
    sleep(1);

    http.get(`${BASE_URL}/api/translations`, { headers: authHeaders(), timeout: '15s' });
    sleep(0.5);

    http.get(`${BASE_URL}/api/tafsirs/169/1`, { headers: authHeaders(), timeout: '15s' });
    sleep(0.5);

    const vk = `${Math.floor(Math.random() * 114) + 1}:${Math.floor(Math.random() * 10) + 1}`;
    const bookmarkResp = http.post(`${BASE_URL}/api/bookmarks`,
      JSON.stringify({ surah_id: parseInt(vk.split(':')[0]), verse_number: parseInt(vk.split(':')[1]) }),
      { headers: mutationHeaders(), timeout: '15s' });
    check(bookmarkResp, { 'bookmark added': (r) => r.status < 500 });
  });
}

function searchFlow() {
  group('Journey C: Search → Open Result', function () {
    const terms = ['mercy', 'light', 'guidance', 'truth', 'patience'];
    const resp = http.get(`${BASE_URL}/api/search?q=${terms[Math.floor(Math.random() * terms.length)]}&page=1&limit=20`, {
      headers: authHeaders(), timeout: '30s',
    });
    check(resp, { 'search completed': (r) => r.status < 500 });
    sleep(1);

    const readerResp = http.get(`${BASE_URL}/quran/1`, {
      headers: authHeaders(), timeout: '30s',
    });
    check(readerResp, { 'reader opened': (r) => r.status < 500 });
  });
}

function authHeaders() {
  const h = { 'Content-Type': 'application/json' };
  if (AUTH_TOKEN) h['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  return h;
}
function mutationHeaders() {
  const h = authHeaders();
  if (CSRF_TOKEN) h['x-csrf-token'] = CSRF_TOKEN;
  return h;
}
