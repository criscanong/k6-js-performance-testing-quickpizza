import http from 'k6/http';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

/**
 * Registers a new user.
 * Returns the raw response. Checks belong to the test or journey that calls this.
 * `params` accepts extra k6 request options, such as responseCallback for expected errors.
 */
export function registerUser(baseUrl, username, password, params = {}) {
  return http.post(`${baseUrl}/api/users`, JSON.stringify({ username, password }), {
    headers: JSON_HEADERS,
    tags: { name: 'POST /api/users' },
    ...params,
  });
}

/**
 * Logs in and returns the raw response. On success the body contains { token }.
 */
export function loginUser(baseUrl, username, password, params = {}) {
  return http.post(`${baseUrl}/api/users/token/login`, JSON.stringify({ username, password }), {
    headers: JSON_HEADERS,
    tags: { name: 'POST /api/users/token/login' },
    ...params,
  });
}

/**
 * Invalidates the given token.
 */
export function logoutUser(baseUrl, token, params = {}) {
  return http.post(`${baseUrl}/api/users/token/logout`, null, {
    headers: { Authorization: `Token ${token}` },
    tags: { name: 'POST /api/users/token/logout' },
    ...params,
  });
}