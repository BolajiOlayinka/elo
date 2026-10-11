export const RATING_TABS = [
  { id: 'players', label: 'Players', noun: 'Player', role: 'Forward' },
  { id: 'keepers', label: 'Goal Keepers', noun: 'Keeper', role: 'Goalkeeper' },
  { id: 'coaches', label: 'Coaches', noun: 'Coach', role: 'Manager' },
  { id: 'leagues', label: 'Leagues', noun: 'League', role: 'League' },
  { id: 'countries', label: 'Countries', noun: 'Country', role: 'National team' }
];

export const PAGE_SIZE = 10;

const FLAGS = ['AR', 'PT', 'BR', 'FR', 'ES', 'DE', 'IT', 'NL', 'EN', 'UY'];
const CLUBS = ['Club A', 'Club B', 'Club C', 'Club D', 'Club E'];

function jitter(index, salt) {
  return ((index * 47 + salt * 13) % 97) / 97;
}

export function getRankings(tabId) {
  const tab = RATING_TABS.find((item) => item.id === tabId) || RATING_TABS[0];

  return Array.from({ length: 50 }, (_, index) => {
    const rank = index + 1;
    const careerNum = Math.round(14800 - index * 172 - jitter(index, 1) * 36);
    const peakNum = Math.round(980 - index * 7 - jitter(index, 3) * 10);
    const elo = Math.round(2450 - index * 9 - jitter(index, 2) * 8);
    const peakElo = elo + 40 + Math.round(jitter(index, 4) * 20);
    const era = (3.42 - index * 0.038).toFixed(2);
    const club = CLUBS[index % CLUBS.length];
    const code = FLAGS[index % FLAGS.length];

    return {
      id: `${tab.id}-${rank}`,
      rank,
      name: `${tab.noun} ${String(rank).padStart(2, '0')}`,
      initials: `${tab.noun[0]}${String(rank).padStart(2, '0').slice(-1)}`,
      place: 'Country',
      flag: code,
      club,
      role: tab.role,
      type: tab.id,
      career: careerNum.toLocaleString(),
      careerNum,
      peak: String(peakNum),
      peakNum,
      era: `+${era} σ`,
      elo: elo.toLocaleString(),
      eloNum: elo,
      peakElo: peakElo.toLocaleString(),
      peakEloNum: peakElo,
      age: 24 + (index % 14),
      height: '1.70m',
      foot: index % 2 === 0 ? 'Left' : 'Right',
      since: 2004 + (index % 8),
      goals: 25 - (index % 8),
      assists: 14 - (index % 6),
      matches: 34 - (index % 5),
      dribble: `${25 - (index % 7)}%`,
      red: 0 + (index % 2),
      yellow: 2 + (index % 4),
      trophies: [
        { name: 'World Cup', count: index % 3 },
        { name: 'Champions League', count: 1 + (index % 2) },
        { name: 'Copa América', count: index % 2 },
        { name: 'Domestic Cup', count: 2 }
      ],
      accolades: [
        { name: 'Ballon d’Or', count: index % 4 },
        { name: 'FIFA Best', count: index % 3 },
        { name: 'Golden Boot', count: 1 + (index % 2) }
      ],
      seasons: [
        { year: '2004/05', club, note: 'First team debut' },
        { year: '2005/06', club, note: 'First full season' },
        { year: '2006/07', club, note: 'Breakthrough' },
        { year: '2007/08', club, note: 'Established starter' },
        { year: '2011/12', club, note: 'Record-breaking season' }
      ],
      timeline: [1800, 1980, 2140, 2280, elo - 40, elo]
    };
  });
}

export function getRankingItem(type, id) {
  return getRankings(type).find((row) => row.id === id) || null;
}
