import axios from 'axios';

const TOKEN_KEY = 'sl_token';

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage may be unavailable in private mode */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* no-op */
    }
  },
};

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Broadcast so AuthContext can react to a session that the server rejected. */
const notifySessionExpired = () => window.dispatchEvent(new CustomEvent('sl:session-expired'));

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new ApiClientError('The request took too long. Please try again.', 408));
    }
    if (!error.response) {
      return Promise.reject(
        new ApiClientError('We could not reach the server. Please check your connection.', 0),
      );
    }

    const { status, data } = error.response;

    // An expired or revoked token: clear it once, then let the UI redirect.
    if (status === 401 && tokenStore.get()) {
      tokenStore.clear();
      notifySessionExpired();
    }

    return Promise.reject(
      new ApiClientError(data?.message || 'Something went wrong. Please try again.', status, data?.errors),
    );
  },
);

/** Normalised error the whole UI can rely on. */
export class ApiClientError extends Error {
  constructor(message, status, fieldErrors) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.fieldErrors = fieldErrors || [];
  }

  /** Maps server field errors onto a form state object. */
  toFieldMap() {
    return this.fieldErrors.reduce((accumulator, item) => {
      accumulator[item.field] = item.message;
      return accumulator;
    }, {});
  }
}

export default apiClient;
