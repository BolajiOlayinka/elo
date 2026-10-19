const BASE = import.meta.env.VITE_API_URL || '';

async function getJson(path) {
  const response = await fetch(`${BASE}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  return response.json();
}

export function getRatings(entity, page = 1) {
  const params = new URLSearchParams({ entity, page: String(page), limit: '20' });

  return getJson(`/api/v1/ratings?${params}`);
}

export function getCoaches(page = 1) {
  const params = new URLSearchParams({ page: String(page), limit: '20' });

  return getJson(`/api/v1/coaches?${params}`);
}

export function getLeagues(page = 1) {
  const params = new URLSearchParams({ page: String(page), limit: '20' });

  return getJson(`/api/v1/leagues?${params}`);
}

export function getCompetitions(page = 1) {
  const params = new URLSearchParams({ page: String(page), limit: '20' });

  return getJson(`/api/v1/competitions?${params}`);
}
