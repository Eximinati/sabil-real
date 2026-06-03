import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const endpointVulnerable = new Rate('endpoint_vulnerable');

export const options = { iterations: 1, vus: 1 };

export default function () {
  const t = __ENV.ABUSE_TEST || 'all';
  if (t === 'all' || t === 'search') testSearchSpam();
  sleep(2);
  if (t === 'all' || t === 'reflection') testReflectionSpam();
  sleep(2);
  if (t === 'all' || t === 'bookmark') testBookmarkSpam();
  sleep(2);
  if (t === 'all' || t === 'login') testLoginSpam();
}

function testSearchSpam() {
  const terms = ['mercy', 'light', 'guidance', 'truth', 'patience', 'Allah', 'knowledge', 'faith'];
  let rateLimited = false;
  console.log('\n=== Search Spam: 100 requests ===');
  for (let i = 0; i < 100; i++) {
    const resp = http.get(`${BASE_URL}/api/search?q=${terms[i % terms.length]}&page=1&limit=20`, { timeout: '10s' });
    if (resp.status === 429) { rateLimited = true; console.log(`  Rate limited at request ${i + 1}`); break; }
  }
  endpointVulnerable.add(!rateLimited);
  console.log(`  ${rateLimited ? 'RATE LIMITED (GOOD)' : 'NO RATE LIMITING (VULNERABLE)'}`);
}

function testReflectionSpam() {
  let rateLimited = false;
  console.log('\n=== Reflection Spam: 50 POSTs ===');
  for (let i = 0; i < 50; i++) {
    const resp = http.post(`${BASE_URL}/api/journey/reflection`,
      JSON.stringify({ lesson_id: `00000000-0000-0000-0000-0000000${String(i).padStart(7, '0')}`, day_number: i + 1, reflection_text: `X`.repeat(100) }),
      { headers: { 'Content-Type': 'application/json' }, timeout: '10s' });
    if (resp.status === 429) { rateLimited = true; console.log(`  Rate limited at request ${i + 1}`); break; }
  }
  endpointVulnerable.add(!rateLimited);
  console.log(`  ${rateLimited ? 'RATE LIMITED (GOOD)' : 'NO RATE LIMITING (VULNERABLE)'}`);
}

function testBookmarkSpam() {
  let rateLimited = false;
  console.log('\n=== Bookmark Spam: 50 POSTs ===');
  for (let i = 0; i < 50; i++) {
    const resp = http.post(`${BASE_URL}/api/bookmarks`,
      JSON.stringify({ surah_id: (i % 114) + 1, verse_number: (i % 286) + 1 }),
      { headers: { 'Content-Type': 'application/json' }, timeout: '10s' });
    if (resp.status === 429) { rateLimited = true; console.log(`  Rate limited at request ${i + 1}`); break; }
  }
  endpointVulnerable.add(!rateLimited);
  console.log(`  ${rateLimited ? 'RATE LIMITED (GOOD)' : 'NO RATE LIMITING (VULNERABLE)'}`);
}

function testLoginSpam() {
  let rateLimited = false;
  console.log('\n=== Login Spam: 30 attempts ===');
  for (let i = 0; i < 30; i++) {
    const resp = http.post(`${BASE_URL}/api/auth/callback`,
      JSON.stringify({ email: `spam${Date.now()}${i}@test.com`, password: 'wrong' }),
      { headers: { 'Content-Type': 'application/json' }, timeout: '10s' });
    if (resp.status === 429) { rateLimited = true; console.log(`  Rate limited at request ${i + 1}`); break; }
  }
  endpointVulnerable.add(!rateLimited);
  console.log(`  ${rateLimited ? 'RATE LIMITED (GOOD)' : 'NO RATE LIMITING (VULNERABLE)'}`);
}
