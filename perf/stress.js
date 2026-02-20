import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://app:3000';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '30s', target: 60 },
    { duration: '30s', target: 100 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1500'],
  },
};

export default function () {
  const response = http.get(`${BASE_URL}/health`);
  check(response, {
    'stress health status is 200': (r) => r.status === 200,
  });
}
