import http from 'k6/http';
import { check, sleep } from 'k6';

// config
export const options = {
  stages: [
    { duration: '30s', target: 20 },  // speed up 20 VUs for 30 secund
    { duration: '1m',  target: 100 }, // hold and up to 100 VUs to 1 min (top peek)
    { duration: '30s', target: 0 },   // speed down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% req should run at least 500 мс
    http_req_failed: ['rate<0.01'],   // percent of error 1%
  },
};

export default function () {
  const BASE_URL = __ENV.TARGET_HOST || 'http://localhost:5000';
  const resShifts = http.get(`${BASE_URL}/api/shifts?page=1&limit=20`);
  check(resShifts, {
    'GET /api/shifts status 200': (r) => r.status === 200,
  });

  sleep(1); // pause
}