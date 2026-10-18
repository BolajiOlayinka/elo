import { STATS, VISITS_30 } from './demo.js';

export const PAGE_RANGES = {
  '7d': {
    label: 'Last 7 days',
    visits: 312840,
    pages: [
      { path: '/', label: 'Home', views: 64220, share: 20.5 },
      { path: '/ratings', label: 'Ratings', views: 58110, share: 18.6 },
      { path: '/compare', label: 'Compare', views: 49840, share: 15.9 },
      { path: '/analysis', label: 'Analysis', views: 37260, share: 11.9 },
      { path: '/profile/*', label: 'Player profiles', views: 33180, share: 10.6 },
      { path: '/account', label: 'Account', views: 12440, share: 4.0 }
    ]
  },
  '30d': {
    label: 'Last 30 days',
    visits: STATS.pageVisits,
    pages: [
      { path: '/', label: 'Home', views: 214680, share: 20.6 },
      { path: '/ratings', label: 'Ratings', views: 188420, share: 18.1 },
      { path: '/compare', label: 'Compare', views: 156110, share: 15.0 },
      { path: '/analysis', label: 'Analysis', views: 121840, share: 11.7 },
      { path: '/profile/*', label: 'Player profiles', views: 109330, share: 10.5 },
      { path: '/account', label: 'Account', views: 41220, share: 4.0 }
    ]
  },
  '90d': {
    label: 'Last 90 days',
    visits: 2718440,
    pages: [
      { path: '/', label: 'Home', views: 548220, share: 20.2 },
      { path: '/ratings', label: 'Ratings', views: 492110, share: 18.1 },
      { path: '/compare', label: 'Compare', views: 401840, share: 14.8 },
      { path: '/analysis', label: 'Analysis', views: 328660, share: 12.1 },
      { path: '/profile/*', label: 'Player profiles', views: 286440, share: 10.5 },
      { path: '/account', label: 'Account', views: 108220, share: 4.0 }
    ]
  }
};

export const USER_GROWTH = [980, 1040, 1110, 1190, 1280, 1360, 1440, 1520, 1590, 1670, 1750, 1842];
export const SIGNUPS_MONTH = [62, 58, 71, 80, 88, 76, 84, 91, 79, 88, 86, 79];

export const USER_RANGES = {
  '7d': { online: 118, loggedIn: 96, signups: 48, signedIn: 2, growth: [1798, 1814, 1831, 1842], signupsSeries: [6, 8, 7, 9, 5, 7, 6] },
  '30d': { online: 118, loggedIn: 327, signups: 214, signedIn: 3, growth: USER_GROWTH.slice(-6), signupsSeries: SIGNUPS_MONTH.slice(-3) },
  '90d': { online: 118, loggedIn: 890, signups: 612, signedIn: 3, growth: USER_GROWTH, signupsSeries: SIGNUPS_MONTH }
};

export const BLOG_RANGES = {
  '7d': { essays: 6, posts: 1, comments: 12, pending: 2 },
  '30d': { essays: 6, posts: 2, comments: 40, pending: 2 },
  '90d': { essays: 6, posts: 2, comments: 86, pending: 1 }
};

export const BLOG_STATS = {
  essays: 6,
  posts: 2,
  comments: 6,
  perPost: [
    { title: 'League strength is mean club Elo', comments: 4 },
    { title: 'What K-factor, quality scale, and era actually do', comments: 2 },
    { title: 'Henry 2003–04 vs Salah 2017–18', comments: 18, kind: 'analysis' },
    { title: 'Modrić’s 2017–18 progression', comments: 7, kind: 'analysis' },
    { title: 'De Bruyne 2019–20 creative season', comments: 9, kind: 'analysis' }
  ]
};

export const TRAFFIC = {
  visits30: STATS.pageVisits,
  visitsDelta: 12.4,
  liveNow: STATS.liveNow,
  loggedIn24h: STATS.usersLogin,
  signups30: STATS.signups30,
  series: VISITS_30,
  pages: [
    { path: '/', label: 'Home', views: 214680, share: 20.6 },
    { path: '/ratings', label: 'Ratings', views: 188420, share: 18.1 },
    { path: '/compare', label: 'Compare', views: 156110, share: 15.0 },
    { path: '/analysis', label: 'Analysis', views: 121840, share: 11.7 },
    { path: '/profile/*', label: 'Player profiles', views: 109330, share: 10.5 },
    { path: '/account', label: 'Account', views: 41220, share: 4.0 }
  ],
  sources: [
    { id: 'direct', label: 'Direct', views: 312400, share: 30.0 },
    { id: 'google', label: 'Google', views: 268110, share: 25.7 },
    { id: 'twitter', label: 'X / Twitter', views: 141220, share: 13.5 },
    { id: 'whatsapp', label: 'WhatsApp', views: 98440, share: 9.4 },
    { id: 'newsletter', label: 'Newsletter', views: 72180, share: 6.9 },
    { id: 'other', label: 'Other', views: 150330, share: 14.4 }
  ],
  devices: [
    { id: 'mobile', label: 'Mobile', share: 58 },
    { id: 'desktop', label: 'Desktop', share: 36 },
    { id: 'tablet', label: 'Tablet', share: 6 }
  ],
  countries: [
    { id: 'NG', label: 'Nigeria', views: 186440, x: 51.8, y: 48.2 },
    { id: 'GB', label: 'United Kingdom', views: 142210, x: 47.6, y: 28.4 },
    { id: 'US', label: 'United States', views: 118660, x: 22.4, y: 34.8 },
    { id: 'BR', label: 'Brazil', views: 86420, x: 32.2, y: 62.5 },
    { id: 'FR', label: 'France', views: 72110, x: 48.8, y: 32.6 },
    { id: 'DE', label: 'Germany', views: 61480, x: 50.2, y: 30.1 }
  ],
  languages: [
    { id: 'en', label: 'English', share: 61 },
    { id: 'fr', label: 'French', share: 14 },
    { id: 'es', label: 'Spanish', share: 12 },
    { id: 'pt', label: 'Portuguese', share: 8 },
    { id: 'de', label: 'German', share: 5 }
  ]
};

export function formatCount(value) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2).replace(/\.00$/, '')}M`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  }

  return value.toLocaleString('en-GB');
}
