const FILES = import.meta.glob('../assets/awards/*.{png,jpg,webp,svg}', {
  eager: true,
  import: 'default'
});

const IMAGES = Object.fromEntries(
  Object.entries(FILES).map(([path, src]) => {
    const file = path.split('/').pop().replace(/\.(png|jpg|webp|svg)$/i, '');

    return [file, src];
  })
);

const ALIASES = {
  ballon_d_or: 'ballon_dor',
  ballondor: 'ballon_dor',
  fifa_best: 'fifa_the_best_player',
  fifa_the_best: 'fifa_the_best_player',
  the_best: 'fifa_the_best_player',
  european_golden_boot: 'european_golden_shoe',
  golden_shoe: 'european_golden_shoe',
  puskas: 'goal_of_the_year_puskas',
  puskas_award: 'goal_of_the_year_puskas',
  yashin: 'yashin_trophy',
  assist_leader: 'playmaker_assist_leader',
  playmaker: 'playmaker_assist_leader'
};

export function awardKey(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’′`]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

export function getAwardImage(name) {
  const key = awardKey(name);
  const file = IMAGES[key] || IMAGES[ALIASES[key]];

  if (file) {
    return file;
  }

  const match = Object.keys(IMAGES).find((id) => key.includes(id) || id.includes(key));

  return match ? IMAGES[match] : null;
}

export const AWARD_NAMES = [
  'Ballon d’Or',
  'FIFA The Best Player',
  'Golden Boot',
  'European Golden Shoe',
  'Golden Ball',
  'Yashin Trophy',
  'Kopa Trophy',
  'FIFPRO World XI',
  'Player of the Season',
  'Golden Glove',
  'Best Young Player',
  'Puskas Award'
];
