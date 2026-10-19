import { api } from '../lib/api.js';

export function debateCounts(rows = []) {
  return {
    all: rows.length,
    pending: rows.filter((row) => row.status === 'pending').length,
    approved: rows.filter((row) => row.status === 'approved').length,
    spam: rows.filter((row) => row.status === 'spam').length,
    rejected: rows.filter((row) => row.status === 'rejected').length
  };
}

export function nestDebate(rows) {
  const byParent = new Map();

  rows.forEach((row) => {
    const key = row.parentId || 'root';
    const list = byParent.get(key) || [];
    list.push(row);
    byParent.set(key, list);
  });

  return (byParent.get('root') || []).map((row) => ({
    ...row,
    replies: byParent.get(row.id) || []
  }));
}

export async function loadDebate() {
  const { data } = await api('/admin/analysis/comments');
  return data.comments;
}

export async function loadDebateForEssay(essayId) {
  const rows = await loadDebate();
  return rows.filter((row) => row.essayId === essayId);
}

export async function setDebateStatus(id, status) {
  await api(`/admin/analysis/comments/${id}`, {
    method: 'PATCH',
    body: { status, flagged: status === 'spam' }
  });

  return loadDebate();
}

export async function removeDebate(id) {
  await api(`/admin/analysis/comments/${id}`, { method: 'DELETE' });
  return loadDebate();
}

export async function removeDebateForEssay() {
  return loadDebate();
}
