import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const resiliencePass = new Rate('resilience_pass');

export const options = {
  thresholds: { resilience_pass: ['rate>0.90'] },
  iterations: 10, vus: 1,
};

export default function () {
  const t = __ENV.RESILIENCE_TEST || 'all';
  if (t === 'all' || t === 'reflection') testReflectionFailure();
  sleep(2);
  if (t === 'all' || t === 'progress') testReadingProgressFailure();
  sleep(2);
  if (t === 'all' || t === 'session') testSessionExpiry();
  sleep(2);
  if (t === 'all' || t === 'network') testNetworkLoss();
  sleep(3);
}

function testReflectionFailure() {
  group('Reflection Save Failure', function () {
    const resp = http.post(`${BASE_URL}/api/journey/reflection`,
      JSON.stringify({ lesson_id: '00000000-0000-0000-0000-000000099999', day_number: 99999, reflection_text: null }),
      { headers: { 'Content-Type': 'application/json' }, timeout: '10s' });
    const ok = resp.status !== 200;
    check(resp, { 'no silent 200': () => resp.status !== 200, 'error status': () => resp.status >= 400 });
    resiliencePass.add(ok);
    console.log(`${ok ? 'PASS' : 'FAIL'}: Reflection failure → ${resp.status}`);
  });
}

function testReadingProgressFailure() {
  group('Reading Progress Failure', function () {
    const resp = http.post(`${BASE_URL}/api/reading-progress`,
      JSON.stringify({ surah_id: -1, verse_number: -1, scroll_position: -999 }),
      { headers: { 'Content-Type': 'application/json' }, timeout: '10s' });
    const ok = resp.status !== 200;
    check(resp, { 'invalid data rejected': () => resp.status !== 200 });
    resiliencePass.add(ok);
    console.log(`${ok ? 'PASS' : 'FAIL'}: Progress failure → ${resp.status}`);
  });
}

function testSessionExpiry() {
  group('Session Expiry', function () {
    const resp = http.get(`${BASE_URL}/journey/1`, {
      headers: { 'Authorization': `Bearer expired_token_${Date.now()}`, 'Content-Type': 'application/json' },
      timeout: '15s',
    });
    const ok = resp.status < 500;
    check(resp, { 'no crash': () => resp.status < 500 });
    resiliencePass.add(ok);
    console.log(`${ok ? 'PASS' : 'FAIL'}: Expired session → ${resp.status}`);
  });
}

function testNetworkLoss() {
  group('Network Loss Simulation', function () {
    const resp = http.get(`${BASE_URL}/quran/1`, {
      headers: { 'Content-Type': 'application/json' },
      timeout: '1s',
    });
    const ok = resp.status < 500 || resp.status === 0;
    check(resp, { 'no crash on timeout': () => ok });
    resiliencePass.add(ok);
    console.log(`${ok ? 'PASS' : 'FAIL'}: Network timeout → ${resp.status}`);
  });
}
