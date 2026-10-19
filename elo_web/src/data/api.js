const BASE = import.meta.env.VITE_API_URL || '';

async function getJson(path) {
  const response = await fetch(`${BASE}${path}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  return response.json();
}

export function getCatalogStats() {
  return getJson('/api/v1/stats').then((body) => body?.data || body);
}

export function getRatings(entity, page = 1, q = '', limit = 10) {
  const params = new URLSearchParams({
    entity,
    page: String(page),
    limit: String(limit),
    q
  });

  return getJson(`/api/v1/ratings?${params}`);
}

export function getProfile(type, id) {
  return getJson(`/api/v1/profiles/${type}/${id}`).then((body) => body?.data || null);
}

export function getCoaches(page = 1, q = '') {
  const params = new URLSearchParams({ page: String(page), limit: '20', q });

  return getJson(`/api/v1/coaches?${params}`);
}

export function getLeagues(page = 1, q = '') {
  const params = new URLSearchParams({ page: String(page), limit: '20', q });

  return getJson(`/api/v1/leagues?${params}`);
}

export function getCompetitions(page = 1, q = '') {
  const params = new URLSearchParams({ page: String(page), limit: '20', q });

  return getJson(`/api/v1/competitions?${params}`);
}
