'use strict';

const RESERVED_ID_FLOOR = 1000000000;

function stripRefs(value) {
    return String(value)
        .replace(/<ref\b[^>]*\/>/gi, '')
        .replace(/<ref\b[\s\S]*?<\/ref>/gi, '');
}

function stripTemplates(value) {
    let output = '';
    let depth = 0;

    for (let index = 0; index < value.length; index += 1) {
        if (value.startsWith('{{', index)) {
            depth += 1;
            index += 1;
            continue;
        }

        if (value.startsWith('}}', index)) {
            depth = Math.max(0, depth - 1);
            index += 1;
            continue;
        }

        if (depth === 0) {
            output += value[index];
        }
    }

    return output;
}

function visibleText(raw) {
    const withoutRefs = stripRefs(String(raw || ''));
    const unwrapped = withoutRefs
        .replace(/\{\{(?:nobr|nowrap)\s*\|/gi, '')
        .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
        .replace(/\[\[([^\]]+)\]\]/g, '$1');

    return stripTemplates(unwrapped)
        .replace(/<[^>]+>/g, '')
        .replace(/'''?/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function clubLabel(raw) {
    const futebol = String(raw || '').match(/\{\{Futebol\s+([^}|]+)/i);

    if (futebol) {
        return futebol[1].replace(/-[A-Z]{2,3}$/, '').replace(/-/g, ' ').trim();
    }

    return visibleText(raw);
}

function classify(raw) {
    const text = visibleText(raw);

    if (!text || /^[—–-]$/.test(text)) {
        return { kind: 'empty' };
    }

    const splitSeason = text.match(/^(\d{4})\s*[–-]\s*\d{2}\b/);

    if (splitSeason) {
        return { kind: 'season', year: Number(splitSeason[1]), text };
    }

    if (/^\d{4}$/.test(text) && Number(text) >= 1930 && Number(text) <= 2100) {
        return { kind: 'season', year: Number(text), text };
    }

    if (/^\d{1,4}$/.test(text)) {
        return { kind: 'num', value: Number(text) };
    }

    return { kind: 'text', text };
}

function expandPiece(piece) {
    const cleaned = String(piece).trim().replace(/^!+/, '');
    const match = cleaned.match(/^colspan\s*=\s*"?(\d+)"?\s*\|([\s\S]*)$/i);

    if (!match) {
        return [cleaned];
    }

    const value = match[2].trim();

    if (/\d{4}/.test(visibleText(value))) {
        return [value];
    }

    return Array.from({ length: Number(match[1]) }, () => value);
}

function rowPieces(chunk) {
    const pieces = [];

    for (const line of chunk.split('\n')) {
        const trimmed = line.trim();

        if (!trimmed.startsWith('|') || trimmed.startsWith('|-') || trimmed.startsWith('|}') || trimmed.startsWith('|+')) {
            continue;
        }

        let rest = trimmed.slice(1).trim();

        rest = rest.replace(/^(?:(?:rowspan|align|valign|scope)\s*=\s*(?:"[^"]*"|\S+)\s*\|)+/i, '');
        rest = rest.replace(/^(?:style\s*=\s*"[^"]*"\s*\|)+/i, '');

        for (const piece of rest.split('||')) {
            pieces.push(...expandPiece(piece));
        }
    }

    return pieces.filter((piece) => piece !== '');
}

function tableBodies(wikitext) {
    const bodies = [];
    let cursor = 0;

    while (cursor < wikitext.length) {
        const start = wikitext.indexOf('{|', cursor);
        const end = start < 0 ? -1 : wikitext.indexOf('|}', start);

        if (start < 0 || end < 0) {
            break;
        }

        bodies.push(wikitext.slice(start, end));
        cursor = end + 2;
    }

    return bodies;
}

function collectEfn(wikitext) {
    const dict = {};
    const pattern = /\{\{efn\|name=(?:"([^"]+)"|([^|}]+))\|([\s\S]*?)\}\}/gi;
    let match = pattern.exec(wikitext);

    while (match) {
        dict[(match[1] || match[2]).trim()] = match[3];
        match = pattern.exec(wikitext);
    }

    return dict;
}

function noteBody(raw, efn) {
    const named = String(raw || '').match(/\{\{efn\|name=(?:"([^"]+)"|([^|}]+))(?:\|([\s\S]*?))?\}\}/i);
    const key = named ? (named[1] || named[2] || '').trim() : '';
    const inline = named && named[3];

    if (inline) {
        return inline;
    }

    if (key && efn[key]) {
        return efn[key];
    }

    const plain = String(raw || '').match(/\{\{efn\|([\s\S]*?)\}\}/i);

    return plain ? plain[1] : String(raw || '');
}

function continentalName(raw, efn) {
    const text = noteBody(raw, efn).toLowerCase();
    const europa = text.includes('europa league') || text.includes('uefa cup');
    const champions = text.includes('champions league');

    if (text.includes('afc champions league two')) {
        return 'AFC Champions League Two';
    }

    if (text.includes('afc champions league')) {
        return 'AFC Champions League Elite';
    }

    if (text.includes('concacaf champions')) {
        return 'CONCACAF Champions League';
    }

    if (champions && !europa) {
        return 'UEFA Champions League';
    }

    if (europa && !champions) {
        return 'UEFA Europa League';
    }

    return null;
}

function cellCompetition(raw, efn, fallback) {
    if (/\{\{efn/i.test(String(raw || ''))) {
        return continentalName(raw, efn);
    }

    return fallback || null;
}

function englishLayout(header) {
    const cell = header.match(/continental(?:\{\{efn\|[\s\S]*?\}\})?/i);

    return {
        leagueCup: /league cup/i.test(header),
        continentalDefault: cell ? continentalName(cell[0], {}) : null
    };
}

function isTotalChunk(chunk) {
    return /^\s*!/m.test(chunk) && /total/i.test(chunk);
}

function isReserve(label) {
    return /(?:\s+[BC]|\s+II|\s+U-?\d{2}|reserves?|youth)$/i.test(String(label || '').trim());
}

function isYouthSide(label) {
    return /u-?\d{2}|under[-\s]?\d{2}|sub-?\d{2}|olymp/i.test(String(label || ''));
}

function pairAt(numbers, cells, index) {
    return {
        apps: numbers[index] ?? null,
        goals: numbers[index + 1] ?? null,
        raw: cells[index] ? cells[index].raw : ''
    };
}

function seasonRow(chunk, club) {
    if (isTotalChunk(chunk)) {
        return null;
    }

    const pieces = rowPieces(chunk);
    const classified = pieces.map((piece) => ({ ...classify(piece), raw: piece }));
    const seasonIndex = classified.findIndex((cell) => cell.kind === 'season');

    if (seasonIndex < 0) {
        return null;
    }

    const nextClub = seasonIndex > 0 ? (clubLabel(pieces[seasonIndex - 1]) || club) : club;

    if (!nextClub) {
        return null;
    }

    return {
        club: nextClub,
        year: classified[seasonIndex].year,
        after: classified.slice(seasonIndex + 1)
    };
}

function portugueseClubRow(chunk, club) {
    const season = seasonRow(chunk, club);

    if (!season) {
        return null;
    }

    const numbers = season.after.map((cell) => (cell.kind === 'num' ? cell.value : null));

    return {
        club: season.club,
        year: season.year,
        leagueApps: numbers[0] ?? null,
        leagueGoals: numbers[1] ?? null,
        leagueAssists: numbers[2] ?? null,
        cupApps: numbers[3] ?? null,
        cupGoals: numbers[4] ?? null,
        cupAssists: numbers[5] ?? null,
        continentalApps: numbers[6] ?? null,
        continentalGoals: numbers[7] ?? null,
        continentalAssists: numbers[8] ?? null,
        otherApps: numbers[9] ?? null,
        otherGoals: numbers[10] ?? null,
        otherAssists: numbers[11] ?? null
    };
}

function englishClubRow(chunk, club, layout, efn) {
    const season = seasonRow(chunk, club);

    if (!season || !season.after[0] || season.after[0].kind !== 'text') {
        return season ? { club: season.club, year: null } : null;
    }

    const statCells = season.after.slice(1);
    const numbers = statCells.map((cell) => (cell.kind === 'num' ? cell.value : null));
    let cursor = 0;
    const league = pairAt(numbers, statCells, cursor);

    cursor += 2;
    const cup = pairAt(numbers, statCells, cursor);

    cursor += 2;
    const leagueCup = layout.leagueCup ? pairAt(numbers, statCells, cursor) : { apps: null, goals: null, raw: '' };

    if (layout.leagueCup) {
        cursor += 2;
    }

    const continental = pairAt(numbers, statCells, cursor);

    cursor += 2;
    const other = pairAt(numbers, statCells, cursor);

    return {
        club: season.club,
        year: season.year,
        division: season.after[0].text,
        leagueApps: league.apps,
        leagueGoals: league.goals,
        cupApps: cup.apps,
        cupGoals: cup.goals,
        leagueCupApps: leagueCup.apps,
        leagueCupGoals: leagueCup.goals,
        continentalApps: continental.apps,
        continentalGoals: continental.goals,
        continental: cellCompetition(continental.raw, efn, layout.continentalDefault),
        otherApps: other.apps,
        otherGoals: other.goals,
        otherParts: describeOther(other.raw, efn, other.apps, other.goals)
    };
}

function parseClubTable(wikitext, lang) {
    const efn = collectEfn(wikitext);
    const rows = [];

    for (const body of tableBodies(wikitext)) {
        const parts = body.split(/\n\|-/);
        const layout = lang === 'en' ? englishLayout(parts[0]) : null;
        let club = null;

        for (const chunk of parts.slice(1)) {
            const row = lang === 'pt'
                ? portugueseClubRow(chunk, club)
                : englishClubRow(chunk, club, layout, efn);

            if (!row) {
                continue;
            }

            club = row.club;

            if (!row.year || isReserve(row.club)) {
                continue;
            }

            rows.push(row);
        }
    }

    return rows;
}

function clubKey(label) {
    const key = String(label || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');

    if (key === 'sporting' || key === 'sportingpor') {
        return 'sportingcp';
    }

    if (key === 'alnassr' || key === 'alnasr') {
        return 'alnassr';
    }

    if (key === 'psv') {
        return 'psveindhoven';
    }

    if (key === 'ufa') {
        return 'fcufa';
    }

    return key;
}

function addCount(left, right) {
    if (left == null && right == null) {
        return null;
    }

    return (left || 0) + (right || 0);
}

function sameGoals(left, right) {
    if (left == null && right == null) {
        return true;
    }

    if (left == null) {
        return right === 0;
    }

    if (right == null) {
        return left === 0;
    }

    return left === right;
}

function cupCompetition(division, kind) {
    const cups = {
        'premier league': { national: 'FA Cup', league: 'League Cup' },
        'la liga': { national: 'Copa del Rey' },
        'primeira liga': { national: 'Taça de Portugal' },
        'liga portugal': { national: 'Taça de Portugal' },
        'serie a': { national: 'Coppa Italia' },
        'ligue 1': { national: 'Coupe de France' },
        'saudi pro league': { national: 'King\'s Cup' },
        'saudi professional league': { national: 'King\'s Cup' },
        mls: { national: 'US Open Cup' },
        'major league soccer': { national: 'US Open Cup' }
    }[competitionKey(division)];

    if (!cups) {
        return null;
    }

    return kind === 'league' ? cups.league || null : cups.national;
}

const OTHER_COMPETITIONS = [
    [/afc champions league two/i, 'AFC Champions League Two'],
    [/afc champions league/i, 'AFC Champions League Elite'],
    [/arab club champions cup/i, 'Arab Club Champions Cup'],
    [/uefa super cup/i, 'UEFA Super Cup'],
    [/fifa club world cup/i, 'FIFA Club World Cup'],
    [/community shield/i, 'Community Shield'],
    [/supercopa de espa/i, 'Super Cup'],
    [/supercoppa italiana/i, 'Super Cup'],
    [/saudi super cup/i, 'Super Cup'],
    [/leagues cup/i, 'Leagues Cup'],
    [/troph[eé]e des champions/i, 'Trophée des Champions'],
    [/concacaf champions/i, 'CONCACAF Champions Cup'],
    [/uefa europa league|uefa cup/i, 'UEFA Europa League'],
    [/uefa champions league/i, 'UEFA Champions League']
];

function catalogName(text) {
    const clean = String(text || '').replace(/^the\s+/i, '');

    for (const [pattern, label] of OTHER_COMPETITIONS) {
        if (pattern.test(clean)) {
            return label;
        }
    }

    return null;
}

function countWord(value) {
    const words = {
        one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
        seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12
    };

    if (/^\d+$/.test(String(value || ''))) {
        return Number(value);
    }

    return words[String(value || '').toLowerCase()] ?? null;
}

function appearanceParts(text) {
    const number = '\\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve';
    const pattern = new RegExp(
        `(${number})\\s+appearances?(?:\\s+and\\s+(${number})\\s+goals?)?\\s+in\\s+(?:the\\s+)?([^,;]+)`,
        'gi'
    );
    const parts = [];
    let match = pattern.exec(text);

    while (match) {
        const competition = catalogName(match[3]);

        if (!competition || countWord(match[1]) == null) {
            return null;
        }

        parts.push({
            competition,
            appearances: countWord(match[1]),
            goals: match[2] ? countWord(match[2]) : 0
        });
        match = pattern.exec(text);
    }

    return parts.length ? parts : null;
}

function describeOther(raw, efn, apps, goals) {
    if (apps == null || goals == null) {
        return [];
    }

    const text = visibleText(noteBody(raw, efn));
    const parts = appearanceParts(text);
    const appsSum = parts ? parts.reduce((sum, part) => sum + part.appearances, 0) : null;
    const goalsSum = parts ? parts.reduce((sum, part) => sum + part.goals, 0) : null;

    if (parts && appsSum === apps && goalsSum === goals) {
        return parts;
    }

    const names = [];

    for (const [pattern, label] of OTHER_COMPETITIONS) {
        if (pattern.test(text) && !names.includes(label)) {
            names.push(label);
        }
    }

    if (names.length === 1) {
        return [{ competition: names[0], appearances: apps, goals }];
    }

    return [];
}

function statRow(en, competition, appearances, goals, assists, keptEnglish) {
    if (!competition || appearances == null || goals == null) {
        return null;
    }

    if (appearances === 0 && goals === 0) {
        return null;
    }

    return {
        club: en.club,
        year: en.year,
        competition,
        appearances,
        goals,
        assists: assists ?? null,
        keptEnglish: Boolean(keptEnglish)
    };
}

function settleBuckets(buckets) {
    const unmatched = buckets.filter((bucket) => !bucket.matched);

    if (unmatched.length === 1) {
        unmatched[0].matched = true;
        unmatched[0].keptEnglish = true;
    }

    return buckets.filter((bucket) => bucket.matched);
}

function clubBuckets(en, pt) {
    const enCupGoals = addCount(en.cupGoals, en.leagueCupGoals);
    const mergedOther = pt.otherGoals == null
        && en.otherGoals != null
        && en.continentalGoals != null
        && sameGoals(addCount(en.continentalGoals, en.otherGoals), pt.continentalGoals);
    const buckets = [
        {
            matched: sameGoals(en.leagueGoals, pt.leagueGoals),
            rows: [statRow(en, en.division, en.leagueApps, en.leagueGoals, pt.leagueAssists, false)]
        },
        {
            matched: sameGoals(enCupGoals, pt.cupGoals),
            rows: [
                statRow(en, cupCompetition(en.division, 'national'), en.cupApps, en.cupGoals, pt.cupAssists, false),
                statRow(en, cupCompetition(en.division, 'league'), en.leagueCupApps, en.leagueCupGoals, null, false)
            ]
        },
        {
            matched: mergedOther || sameGoals(en.continentalGoals, pt.continentalGoals),
            rows: [statRow(en, en.continental, en.continentalApps, en.continentalGoals, pt.continentalAssists, false)]
        }
    ];
    const otherRows = (en.otherParts || [])
        .map((part) => statRow(en, part.competition, part.appearances, part.goals, pt.otherAssists, false));

    buckets.push({
        matched: mergedOther || sameGoals(en.otherGoals, pt.otherGoals),
        rows: otherRows
    });

    return buckets;
}

function agreeSeasons(enRows, ptRows) {
    const agreed = [];

    for (const en of enRows) {
        const pt = ptRows.find((row) => row.year === en.year && clubKey(row.club) === clubKey(en.club));

        if (!pt) {
            continue;
        }

        for (const bucket of settleBuckets(clubBuckets(en, pt))) {
            for (const row of bucket.rows) {
                if (!row) {
                    continue;
                }

                row.keptEnglish = bucket.keptEnglish || false;
                agreed.push(row);
            }
        }
    }

    return agreed;
}

function leadingNumber(raw) {
    const text = visibleText(raw);

    if (!text || /^[—–-]$/.test(text)) {
        return null;
    }

    const match = text.match(/^(\d{1,3})\b/);

    return match ? Number(match[1]) : null;
}

function parseInternational(wikitext, lang) {
    const rows = [];

    for (const body of tableBodies(wikitext)) {
        const parts = body.split(/\n\|-/);
        const caption = visibleText((body.match(/\|\+\s*([^\n]+)/) || [])[1] || '');
        const youth = isYouthSide(caption);
        let team = lang === 'pt' ? 'senior' : null;

        for (const chunk of parts.slice(1)) {
            const season = seasonRow(chunk, team);

            if (!season) {
                continue;
            }

            team = season.club;
            const numbers = season.after.map((cell) => leadingNumber(cell.raw));

            if (lang === 'pt') {
                rows.push({
                    team,
                    year: season.year,
                    appearances: numbers[0] ?? null,
                    goals: numbers[1] ?? null,
                    assists: numbers[2] ?? null,
                    youth: youth || isYouthSide(team)
                });
                continue;
            }

            const totalApps = numbers[4];
            const totalGoals = numbers[5];

            rows.push({
                team,
                year: season.year,
                appearances: totalApps != null ? totalApps : addCount(numbers[0], numbers[2]),
                goals: totalGoals != null ? totalGoals : addCount(numbers[1], numbers[3]),
                youth: isYouthSide(team)
            });
        }
    }

    return rows;
}

function seniorName(label) {
    return String(label || '')
        .replace(/\s+national(?:\s+football)?\s+team$/i, '')
        .trim();
}

function agreeInternationals(enRows, ptRows) {
    const agreed = [];

    for (const en of enRows) {
        const pt = ptRows.find((row) => row.year === en.year && !row.youth);

        if (en.youth || !pt || en.goals == null || pt.goals == null || en.goals !== pt.goals) {
            continue;
        }

        agreed.push({
            club: seniorName(en.team),
            year: en.year,
            competition: 'Senior internationals',
            appearances: en.appearances,
            goals: en.goals,
            assists: pt.assists ?? null,
            international: true,
            keptEnglish: en.appearances !== pt.appearances
        });
    }

    return agreed;
}

function parseFbref(html) {
    const rows = [];

    for (const chunk of String(html || '').split('<tr').slice(1)) {
        const yearText = fbStat(chunk, 'year_id');
        const competition = fbStat(chunk, 'comp_name');
        const yearMatch = yearText && yearText.match(/(\d{4})/);

        if (!yearMatch || !competition) {
            continue;
        }

        rows.push({
            year: Number(yearMatch[1]),
            competition: competition.replace(/\s+/g, ' ').trim(),
            appearances: toCount(fbStat(chunk, 'games')),
            goals: toCount(fbStat(chunk, 'goals')),
            assists: toCount(fbStat(chunk, 'assists'))
        });
    }

    return rows;
}

function fbStat(chunk, stat) {
    const match = chunk.match(new RegExp(`data-stat="${stat}"[^>]*>([\\s\\S]*?)</t[dh]>`, 'i'));

    if (!match) {
        return null;
    }

    return match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function toCount(value) {
    if (!value || !/^\d+$/.test(value)) {
        return null;
    }

    return Number(value);
}

function competitionKey(label) {
    const key = String(label || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
    const aliases = {
        'champions lg': 'uefa champions league',
        'champions league': 'uefa champions league',
        'uefa champions league': 'uefa champions league',
        'europa lg': 'uefa europa league',
        'europa league': 'uefa europa league',
        'uefa europa league': 'uefa europa league',
        'liga portugal': 'primeira liga',
        'liga nos': 'primeira liga',
        'primeira liga': 'primeira liga',
        'saudi professional league': 'pro league',
        'saudi pro league': 'pro league',
        mls: 'major league soccer',
        'major league soccer': 'major league soccer',
        'league cup': 'league cup',
        'efl cup': 'league cup',
        'football league cup': 'league cup',
        'carabao cup': 'league cup',
        'u s open cup': 'us open cup',
        'us open cup': 'us open cup',
        'afc champions league': 'afc champions league elite',
        'afc champions league elite': 'afc champions league elite',
        'concacaf champions cup': 'concacaf champions league',
        'concacaf champions league': 'concacaf champions league',
        'club world cup': 'fifa club world cup',
        'fifa club world cup': 'fifa club world cup',
        'community shield': 'community shield',
        'fa community shield': 'community shield',
        'senior internationals': 'senior internationals'
    };

    return aliases[key] || key;
}

function confirmFbref(rows, fbrefRows) {
    if (!fbrefRows) {
        return rows;
    }

    return rows.filter((row) => fbrefRows.some((other) => (
        other.year === row.year
        && competitionKey(other.competition) === competitionKey(row.competition)
        && other.appearances === row.appearances
        && other.goals === row.goals
    )));
}

module.exports = {
    RESERVED_ID_FLOOR,
    parseClubTable,
    agreeSeasons,
    parseInternational,
    agreeInternationals,
    parseFbref,
    confirmFbref,
    clubKey,
    competitionKey
};
