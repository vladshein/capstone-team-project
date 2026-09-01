import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    vps_5k_stress_test: {
      executor: 'ramping-arrival-rate', // Frequency Generator
      startRate: 50,                    // We start with 50 requests/sec
      timeUnit: '1s',                   // Unit of measurement — 1 second
      preAllocatedVUs: 200,             // Starting pool of virtual users
      maxVUs: 2500,                     // Maximum VU allowed to maintain a 5k RPS pace
      
      // RPS=100
      // stages: [
      //   { duration: '30s', target: 50 },  // Overclocking from 10 to 50 RPS
      //   { duration: '1m',  target: 150 }, // Peak Assault 150 RPS
      //   { duration: '30s', target: 0 },   // System cooling to 0
      // ],
      
      // RPS=1000
      // stages: [
      //   { duration: '1m', target: 300 },  // Overclocking 300 RPS
      //   { duration: '2m', target: 600 },  // Overclocking 600 RPS
      //   { duration: '2m', target: 1000 }, // Peak Assault 1000 RPS
      //   { duration: '1m', target: 1000 }, // Hold 1000 RPS 1 min
      //   { duration: '1m', target: 0 },    // System cooling to 0
      // ],

      // RPS=5000
      stages: [
        { duration: '1m', target: 500 },  // Stable overclocking (up to 500 RPS)
        { duration: '2m', target: 2000 }, // Serious stress test (up to 2,000 RPS)
        { duration: '1m', target: 2000 }, // Fixation at 2k RPS
        { duration: '2m', target: 5000 }, // Peak Assault, Smooth scaling up to 5,000 requests/sec
        { duration: '1m', target: 5000 }, // Peak hold for 1 minute
        { duration: '1m', target: 0 },    // System cooling, Load drop to zero
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'], // Diploma criterion: 95% of requests faster than 500 ms
    http_req_failed: ['rate<0.01'],   // Diploma criterion: errors less than 1%
  },
};

export default function () {
  const BASE_URL = __ENV.TARGET_HOST || 'http://localhost:5000';

  // shift GET
  
  const getParams = {
    headers: {
      'Content-Type': 'application/json',
    },
  };


 
  const resShifts = http.get(`${BASE_URL}/shifts?page=1&limit=20`, getParams);
 
  // Print response details if status is not 200
  if (resShifts.status !== 200) {
    console.log(`Status: ${resShifts.status} | Body: ${resShifts.body}`);
  }

 
  check(resShifts, {
    'GET /api/shifts status 200': (r) => r.status === 200,
  });
  
}
