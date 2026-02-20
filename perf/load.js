import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://app:3000';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 25 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<900'],
  },
};

export default function () {
  const response = http.get(`${BASE_URL}/health`);
  check(response, {
    'load health status is 200': (r) => r.status === 200,
  });
  sleep(0.2);
}
