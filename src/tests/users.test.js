import http from 'k6/http';
import { check, group } from 'k6';
import { registerUser, loginUser, logoutUser } from '../api/users.client.js';

// Isolated test for the users resource.
// One virtual user, one iteration. Verifies success and expected error cases for each endpoint.

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3333';
const PASSWORD = 'Secreta123';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    checks: ['rate==1'],
    // Expected error responses (400, 401) are declared per request below,
    // so only unexpected failures count here.
    http_req_failed: ['rate==0'],
  },
};

// Unique per run, so repeated executions never collide with existing users.
function uniqueUsername() {
  return `qa_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6)}`;
}

export default function () {
  const username = uniqueUsername();
  let token;

  group('POST /api/users', () => {
    const created = registerUser(BASE_URL, username, PASSWORD);
    check(created, {
      'register returns 201': (r) => r.status === 201,
      'register returns the username': (r) => r.status === 201 && r.json('username') === username,
      'register returns an id': (r) => r.status === 201 && r.json('id') !== undefined,
    });

    // 400 is the expected response for a duplicate username.
    const duplicate = registerUser(BASE_URL, username, PASSWORD, {
      responseCallback: http.expectedStatuses(400),
    });
    check(duplicate, {
      'duplicate username returns 400': (r) => r.status === 400,
    });
  });

  group('POST /api/users/token/login', () => {
    const ok = loginUser(BASE_URL, username, PASSWORD);
    check(ok, {
      'login returns 200': (r) => r.status === 200,
      'login returns a token': (r) => r.status === 200 && typeof r.json('token') === 'string',
    });
    if (ok.status === 200) {
      token = ok.json('token');
    }

    // 401 is the expected response for a wrong password.
    const wrong = loginUser(BASE_URL, username, 'wrong-password', {
      responseCallback: http.expectedStatuses(401),
    });
    check(wrong, {
      'wrong password returns 401': (r) => r.status === 401,
    });
  });

  group('POST /api/users/token/logout', () => {
    const res = logoutUser(BASE_URL, token);
    check(res, {
      'logout returns 200': (r) => r.status === 200,
    });
  });
}