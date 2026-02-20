import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://app:3000';

export const options = {
  scenarios: {
    smoke_rps: {
      executor: 'constant-arrival-rate',
      rate: 7,
      timeUnit: '1s',
      duration: '45s',
      preAllocatedVUs: 10,
      maxVUs: 30,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

export default function () {
  const response = http.get(`${BASE_URL}/health`);
  check(response, {
    'health status is 200': (r) => r.status === 200,
    'health body has ok true': (r) => JSON.parse(r.body).ok === true,
  });
}
