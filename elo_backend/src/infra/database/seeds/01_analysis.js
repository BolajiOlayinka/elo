const bcrypt = require('bcrypt');

function markdown(blocks) {
    return blocks
        .map((block) => [`## ${block.heading}`, block.text].filter(Boolean).join('\n\n'))
        .join('\n\n');
}

const CATEGORIES = [
    { id: 'peak', slug: 'peak', label: 'Peak Seasons', description: 'One season, one peak claim.', sort_order: 1 },
    { id: 'compare', slug: 'compare', label: 'Player Comparisons', description: 'Head-to-head essays.', sort_order: 2 },
    { id: 'roles', slug: 'roles', label: 'Tactical roles', description: 'Position-fair arguments.', sort_order: 3 },
    { id: 'notes', slug: 'notes', label: 'Ranking Notes', description: 'Method and board notes.', sort_order: 4 }
];

const TAGS = [
    { id: 'tag-peak', slug: 'peak', name: 'peak' },
    { id: 'tag-comparison', slug: 'comparison', name: 'comparison' },
    { id: 'tag-methodology', slug: 'methodology', name: 'methodology' },
    { id: 'tag-keepers', slug: 'keepers', name: 'keepers' },
    { id: 'tag-midfield', slug: 'midfield', name: 'midfield' }
];

const AUTHOR = {
    author_name: 'Mayaya Cheneh',
    author_role: 'Analyst',
    author_initials: 'MC'
};

const MEDIA = {
    thumbnail_upload_id: 'upl_demo_thumb',
    thumbnail_url: '/media/analysis-thumb.svg',
    hero_upload_id: 'upl_demo_hero',
    hero_url: '/media/analysis-hero.svg'
};

function post(row) {
    const next = {
        ...AUTHOR,
        ...MEDIA,
        comparison: true,
        clips: 0,
        arguments_count: 0,
        status: 'published',
        metrics: [],
        translations: {},
        ...row
    };

    return {
        ...next,
        metrics: JSON.stringify(next.metrics || []),
        translations: JSON.stringify(next.translations || {})
    };
}

const POSTS = [
    post({
        id: 'henry-salah-peak',
        slug: 'henry-2003-04-peak-vs-salah-2017-18',
        category_id: 'peak',
        title: 'Henry’s 2003–04 peak was more complete; Salah’s 2017–18 was the higher-volume scoring season.',
        card_title: 'Henry’s 2003–04 peak vs Salah’s 2017–18 scoring season',
        excerpt: 'The all-round argument, the finishing argument, and the evidence that separated them.',
        read_minutes: 8,
        arguments_count: 38,
        clips: 12864,
        published_at: '2026-10-04',
        metric_left_name: 'Henry',
        metric_right_name: 'Salah',
        metrics: [
            { id: 'peak', label: 'Peak Elo score', left: '14.88', right: '13.10', winner: 'left' },
            { id: 'npg', label: 'NPG / 90', left: '0.94', right: '0.97', winner: 'right' },
            { id: 'xa', label: 'Chance creation', left: '0.41', right: '0.33', winner: 'left', unit: 'xA/90' }
        ],
        body: markdown([
            {
                heading: 'The verdict is close, but the shape of dominance is different.',
                text: 'Salah’s 2017–18 is the more relentless scoring campaign. Henry’s 2003–04 asks more of a forward and delivers a broader pitch total. League strength, chance creation, ball progression, and finishing all sit in the same model — not a volume table with a league multiplier taped on.'
            },
            {
                heading: 'The argument for Henry',
                text: 'Henry carried more of the creative burden in a lower-scoring league environment. He headed the ball into danger, created for teammates, and still produced elite finishing. Era normalization raises his attacking impact by about 8% against a 2.7 goals-per-game reference. The chance-creation gap is not a footnote: 0.41 xA/90 is a creative hub still delivering an elite scoring season.'
            },
            {
                heading: 'The counterpoint',
                text: 'Scoring volume is not a footnote. Salah’s shot generation forced teams to defend a different Liverpool attack, and 0.94–0.97 NPG/90 is historically rare. The model does not erase that. It asks whether the rest of the pitch — progression, chance share, opponent Elo — still leaves 2003–04 ahead on peak completeness.'
            }
        ])
    }),
    post({
        id: 'modric-2018',
        slug: 'modric-2017-18-progression',
        category_id: 'roles',
        title: 'The midfielder who turned pressure into progression: Modrić’s 2017–18',
        card_title: 'The midfielder who turned pressure into progression: Modrić’s 2017–18',
        excerpt: 'The all-round argument, the finishing argument, and the evidence that separated them.',
        read_minutes: 6,
        arguments_count: 62,
        clips: 4201,
        published_at: '2026-10-03',
        metric_left_name: 'Modrić',
        metric_right_name: 'Peer CM',
        metrics: [
            { id: 'peak', label: 'Peak Elo score', left: '12.40', right: '11.10', winner: 'left' },
            { id: 'prog', label: 'Progressive actions / 90', left: '8.2', right: '6.4', winner: 'left' },
            { id: 'press', label: 'Pressure received', left: '24', right: '19', winner: 'left' }
        ],
        body: markdown([
            {
                heading: 'A 10 who still did the 8’s job',
                text: 'Modrić’s 2017–18 is the case for an attacking-mid peer group of its own. Compared with box-to-box eights, the chance-creation weights finally match the job. Compared with pure 10s, the pressure he received still shows up in progressive actions, not in a tackle volume contest.'
            },
            {
                heading: 'Why the role split matters',
                text: 'A single “midfield” z-score would put him in Rodri’s peer group. The model does not. Minutes in AM use AM weights. That is the whole point of position-fair Elo.'
            }
        ])
    }),
    post({
        id: 'kdb-2019',
        slug: 'de-bruyne-2019-20-creative-season',
        category_id: 'compare',
        title: 'De Bruyne’s 2019–20 is still the best creative league season in the record.',
        card_title: 'De Bruyne’s 2019–20 is still the best creative league season in the record',
        excerpt: 'The all-round argument, the finishing argument, and the evidence that separated them.',
        read_minutes: 7,
        arguments_count: 62,
        clips: 6102,
        published_at: '2026-10-02',
        metric_left_name: 'De Bruyne',
        metric_right_name: 'League AM',
        metrics: [
            { id: 'kp', label: 'Key passes / 90', left: '3.4', right: '2.1', winner: 'left' },
            { id: 'ast', label: 'Assists', left: '20', right: '12', winner: 'left' },
            { id: 'q', label: 'Mean opponent Elo', left: '1760', right: '1740', winner: 'left' }
        ],
        body: markdown([
            {
                heading: 'Volume that survives Q',
                text: 'Twenty assists in a 1760 opponent pool is not the same as twenty in a 1500 pool. The essay walks the quality multiplier and the share-of-team dampener so a City creator is not credited for the whole attack.'
            }
        ])
    }),
    post({
        id: 'bergkamp-connective',
        slug: 'bergkamp-connective-genius',
        category_id: 'notes',
        title: 'The case for Bergkamp as Arsenal’s connective genius',
        card_title: 'The case for Bergkamp as Arsenal’s connective genius',
        excerpt: 'The all-round argument, the finishing argument, and the evidence that separated them.',
        read_minutes: 5,
        arguments_count: 41,
        clips: 2904,
        published_at: '2026-09-28',
        metric_left_name: 'Bergkamp',
        metric_right_name: 'Henry',
        metrics: [
            { id: 'peak', label: 'Peak Elo score', left: '13.20', right: '12.80', winner: 'left' },
            { id: 'link', label: 'Key passes / 90', left: '2.6', right: '1.9', winner: 'left' },
            { id: 'goals', label: 'NP goals', left: '16', right: '22', winner: 'right' }
        ],
        body: markdown([
            {
                heading: 'Not the volume king',
                text: 'Bergkamp’s case is connective. The ranking note is here so a second-highest scorer can still win a peak argument on chance share and opponent quality.'
            }
        ])
    }),
    post({
        id: 'npfl-championship',
        slug: 'npfl-and-championship-are-not-the-same-1500',
        category_id: 'notes',
        title: 'NPFL and the Championship are not the same 1500.',
        card_title: 'NPFL and the Championship are not the same 1500',
        excerpt: 'The all-round argument, the finishing argument, and the evidence that separated them.',
        read_minutes: 9,
        arguments_count: 28,
        clips: 8011,
        published_at: '2026-09-22',
        metric_left_name: 'NPFL',
        metric_right_name: 'Championship',
        metrics: [
            { id: 'q', label: 'Typical Q', left: '1.00', right: '1.00', winner: 'none' },
            { id: 'bridge', label: 'Club bridges', left: 'CAF only', right: 'Cups + promotion', winner: 'right' },
            { id: 'offset', label: 'Transfer prior', left: 'Needed', right: 'Weakly identified', winner: 'right' }
        ],
        body: markdown([
            {
                heading: 'The graph does not save the headline on its own',
                text: 'Cups and promotion identify PL versus Championship, noisily. CAF does not touch UEFA. Until transfer offsets are fitted, both means can sit near 1500. That is a data problem, not a ×6 table.'
            }
        ])
    }),
    post({
        id: 'keeper-psxg',
        slug: 'keepers-without-psxg-are-another-board',
        category_id: 'roles',
        title: 'Keepers without PSxG are another board.',
        card_title: 'Keepers without PSxG are another board',
        excerpt: 'The all-round argument, the finishing argument, and the evidence that separated them.',
        read_minutes: 4,
        arguments_count: 19,
        clips: 1560,
        published_at: null,
        status: 'draft',
        metric_left_name: 'Holm',
        metric_right_name: 'Nwosu',
        metrics: [
            { id: 'psxg', label: 'PSxG+', left: '+7.1', right: '—', winner: 'left' },
            { id: 'saves', label: 'Saves', left: '72', right: '148', winner: 'right' },
            { id: 'cs', label: 'Clean sheets', left: '16', right: '4', winner: 'left' }
        ],
        body: markdown([
            {
                heading: 'Save volume is not the spine',
                text: 'Open StatsBomb covers a sliver. Keepers without PSxG stay on a basic stratum: penalties, clean sheets, cards. They are not dropped into the same z as PSxG keepers.'
            }
        ])
    })
];

const POST_TAGS = [
    { post_id: 'henry-salah-peak', tag_id: 'tag-peak' },
    { post_id: 'henry-salah-peak', tag_id: 'tag-comparison' },
    { post_id: 'modric-2018', tag_id: 'tag-midfield' },
    { post_id: 'kdb-2019', tag_id: 'tag-comparison' },
    { post_id: 'bergkamp-connective', tag_id: 'tag-methodology' },
    { post_id: 'npfl-championship', tag_id: 'tag-methodology' },
    { post_id: 'keeper-psxg', tag_id: 'tag-keepers' }
];

const COMMENTS = [
    {
        id: 'd1',
        post_id: 'henry-salah-peak',
        parent_id: null,
        user_id: 'u2',
        name: 'Rory Patel',
        initials: 'RP',
        email: 'james.whitaker@example.com',
        stance: 'challenge',
        body: 'The model underrates Salah’s off-ball gravity. Liverpool’s right-sided overload was designed around the space he created by receiving, which the chance-creation score does not capture.',
        upvotes: 12,
        downvotes: 2,
        match_label: 'Liverpool 5–0 Watford',
        match_clock: '18:42',
        status: 'approved',
        flagged: false,
        created_at: '2026-10-18 10:12'
    },
    {
        id: 'd1r1',
        post_id: 'henry-salah-peak',
        parent_id: 'd1',
        user_id: 'u4',
        name: 'Kenji Sato',
        initials: 'KS',
        email: 'kenji.sato@example.com',
        stance: 'support',
        body: 'Gravity is real, but it still has to show up in chance share. The essay is asking for a measurable proxy, not a vibe.',
        upvotes: 4,
        downvotes: 0,
        status: 'approved',
        flagged: false,
        created_at: '2026-10-18 10:20'
    },
    {
        id: 'd2',
        post_id: 'henry-salah-peak',
        parent_id: null,
        user_id: 'u5',
        name: 'Aisha Bell',
        initials: 'AB',
        email: 'aisha.bell@example.com',
        stance: 'support',
        body: 'Henry’s 0.41 xA/90 is decisive for me. The gap is not only about output; he was the creative hub while still delivering an elite scoring season.',
        upvotes: 9,
        downvotes: 1,
        status: 'approved',
        flagged: false,
        created_at: '2026-10-18 09:48'
    },
    {
        id: 'd3',
        post_id: 'henry-salah-peak',
        parent_id: null,
        user_id: 'u3',
        name: 'Luis Moreira',
        initials: 'LM',
        email: 'sofia.almeida@example.com',
        stance: 'challenge',
        body: 'If you hold finishing constant, Salah’s volume still moves the series. Completeness is doing too much work in the verdict.',
        upvotes: 6,
        downvotes: 3,
        status: 'pending',
        flagged: false,
        created_at: '2026-10-18 09:20'
    },
    {
        id: 'd4',
        post_id: 'henry-salah-peak',
        parent_id: null,
        user_id: 'u1',
        name: 'Nora Adeyemi',
        initials: 'NA',
        email: 'amaka.okonkwo@example.com',
        stance: 'support',
        body: 'The Q adjustment is the point. Raw NPG/90 without opponent Elo is how this comparison used to get shouted, not tested.',
        upvotes: 11,
        downvotes: 0,
        status: 'approved',
        flagged: false,
        created_at: '2026-10-18 07:40'
    },
    {
        id: 'd5',
        post_id: 'modric-2018',
        parent_id: null,
        user_id: 'u4',
        name: 'Kenji Sato',
        initials: 'KS',
        email: 'kenji.sato@example.com',
        stance: 'support',
        body: 'This is why CM and AM cannot share μ and σ. The essay is the product copy for the rating spec.',
        upvotes: 7,
        downvotes: 0,
        match_label: 'Real Madrid 1–2 Juventus',
        match_clock: '63:11',
        status: 'approved',
        flagged: false,
        created_at: '2026-10-17 16:02'
    },
    {
        id: 'd6',
        post_id: 'kdb-2019',
        parent_id: null,
        user_id: 'u8',
        name: 'Marcus Berg',
        initials: 'MB',
        email: 'marcus.berg@example.com',
        stance: 'challenge',
        body: 'Twenty assists is still City’s attack. The share-of-team dampener needs the actual number on the public card.',
        upvotes: 3,
        downvotes: 1,
        status: 'pending',
        flagged: false,
        created_at: '2026-10-16 21:14'
    },
    {
        id: 'd7',
        post_id: 'npfl-championship',
        parent_id: null,
        name: 'odds-bot',
        initials: 'OB',
        email: 'tips@spam.example',
        stance: 'challenge',
        body: 'Best NPFL accas today, click for guaranteed odds!!!',
        upvotes: 0,
        downvotes: 4,
        status: 'spam',
        flagged: true,
        created_at: '2026-10-16 22:40'
    },
    {
        id: 'd8',
        post_id: 'bergkamp-connective',
        parent_id: null,
        user_id: 'u6',
        name: 'Camila Rojas',
        initials: 'CR',
        email: 'camila.rojas@example.com',
        stance: 'challenge',
        body: 'If Henry’s volume wins the same board, say why Bergkamp still sits above him on this note.',
        upvotes: 2,
        downvotes: 0,
        status: 'rejected',
        flagged: false,
        created_at: '2026-10-15 19:08'
    }
];

/**
 * @param { import("knex").Knex } knex
 */
exports.seed = async function seed(knex) {
    await knex('analysis_comments').del();
    await knex('analysis_post_tags').del();
    await knex('analysis_posts').del();
    await knex('analysis_tags').del();
    await knex('analysis_categories').del();
    await knex('analysis_uploads').del();

    const staffEmail = 'bolaji@elostats.football';
    const existingStaff = await knex('users').where({ email: staffEmail }).first();

    if (!existingStaff) {
        await knex('users').insert({
            first_name: 'Bolaji',
            last_name: 'Ade',
            email: staffEmail,
            password: await bcrypt.hash('elostats', 8),
            roles: ['admin'],
            is_verified: true
        });
    }

    await knex('analysis_uploads').insert([
        { id: 'upl_demo_thumb', file_url: '/media/analysis-thumb.svg', original_name: 'analysis-thumb.svg', mime: 'image/svg+xml' },
        { id: 'upl_demo_hero', file_url: '/media/analysis-hero.svg', original_name: 'analysis-hero.svg', mime: 'image/svg+xml' }
    ]);
    await knex('analysis_categories').insert(CATEGORIES);
    await knex('analysis_tags').insert(TAGS);
    await knex('analysis_posts').insert(POSTS);
    await knex('analysis_post_tags').insert(POST_TAGS);
    await knex('analysis_comments').insert(COMMENTS);
};
