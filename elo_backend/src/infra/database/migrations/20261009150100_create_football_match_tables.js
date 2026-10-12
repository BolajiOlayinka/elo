/**
 * Match graph sourced from /fixtures, /fixtures/events, /fixtures/lineups,
 * /fixtures/players, /fixtures/statistics.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema
        .createTable('matches', function (table) {
            table.integer('id').primary();
            table.integer('league_id').notNullable().references('id').inTable('leagues').onDelete('RESTRICT');
            table.integer('season_year').notNullable();
            table.string('round').nullable();
            table.integer('venue_id').nullable().references('id').inTable('venues').onDelete('SET NULL');
            table.string('venue_name').nullable();
            table.string('venue_city').nullable();
            table.string('referee').nullable();
            table.timestamp('kickoff_at').nullable();
            table.bigInteger('kickoff_unix').nullable();
            table.string('timezone').nullable();
            table.string('status_short').notNullable();
            table.string('status_long').nullable();
            table.integer('elapsed_minutes').nullable();
            table.integer('home_team_id').notNullable().references('id').inTable('teams').onDelete('RESTRICT');
            table.integer('away_team_id').notNullable().references('id').inTable('teams').onDelete('RESTRICT');
            table.integer('home_goals').nullable();
            table.integer('away_goals').nullable();
            table.integer('home_goals_ht').nullable();
            table.integer('away_goals_ht').nullable();
            table.integer('home_goals_et').nullable();
            table.integer('away_goals_et').nullable();
            table.integer('home_penalties').nullable();
            table.integer('away_penalties').nullable();
            table.boolean('home_winner').nullable();
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
            table.index(['league_id', 'season_year']);
            table.index('status_short');
            table.index('kickoff_at');
            table.index('home_team_id');
            table.index('away_team_id');
        })
        .createTable('match_events', function (table) {
            table.uuid('id').primary().defaultTo(knex.fn.uuid());
            table.integer('match_id').notNullable().references('id').inTable('matches').onDelete('CASCADE');
            table.integer('team_id').nullable().references('id').inTable('teams').onDelete('SET NULL');
            table.integer('player_id').nullable().references('id').inTable('players').onDelete('SET NULL');
            table.integer('assist_player_id').nullable().references('id').inTable('players').onDelete('SET NULL');
            table.integer('elapsed').nullable();
            table.integer('extra').nullable();
            table.string('type').notNullable();
            table.string('detail').nullable();
            table.string('comments').nullable();
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.index('match_id');
            table.index(['player_id', 'type']);
        })
        .createTable('match_coaches', function (table) {
            table.uuid('id').primary().defaultTo(knex.fn.uuid());
            table.integer('match_id').notNullable().references('id').inTable('matches').onDelete('CASCADE');
            table.integer('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE');
            table.integer('coach_id').nullable().references('id').inTable('coaches').onDelete('SET NULL');
            table.string('formation').nullable();
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
            table.unique(['match_id', 'team_id']);
        })
        .createTable('lineup_players', function (table) {
            table.uuid('id').primary().defaultTo(knex.fn.uuid());
            table.integer('match_id').notNullable().references('id').inTable('matches').onDelete('CASCADE');
            table.integer('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE');
            table.integer('player_id').nullable().references('id').inTable('players').onDelete('SET NULL');
            table.string('player_name').nullable();
            table.integer('shirt_number').nullable();
            table.string('position').nullable();
            table.string('grid').nullable();
            table.boolean('is_starter').notNullable().defaultTo(true);
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.index('match_id');
            table.index(['match_id', 'player_id']);
        })
        .createTable('player_match_stats', function (table) {
            table.uuid('id').primary().defaultTo(knex.fn.uuid());
            table.integer('match_id').notNullable().references('id').inTable('matches').onDelete('CASCADE');
            table.integer('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE');
            table.integer('player_id').notNullable().references('id').inTable('players').onDelete('CASCADE');
            table.integer('minutes').nullable();
            table.integer('shirt_number').nullable();
            table.string('position').nullable();
            table.decimal('rating', 4, 2).nullable();
            table.boolean('captain').notNullable().defaultTo(false);
            table.boolean('substitute').notNullable().defaultTo(false);
            table.integer('offsides').nullable();
            table.integer('shots_total').nullable();
            table.integer('shots_on').nullable();
            table.integer('goals').nullable();
            table.integer('goals_conceded').nullable();
            table.integer('assists').nullable();
            table.integer('saves').nullable();
            table.integer('passes_total').nullable();
            table.integer('passes_key').nullable();
            table.integer('passes_accuracy').nullable();
            table.integer('tackles_total').nullable();
            table.integer('blocks').nullable();
            table.integer('interceptions').nullable();
            table.integer('duels_total').nullable();
            table.integer('duels_won').nullable();
            table.integer('dribbles_attempts').nullable();
            table.integer('dribbles_success').nullable();
            table.integer('dribbles_past').nullable();
            table.integer('fouls_drawn').nullable();
            table.integer('fouls_committed').nullable();
            table.integer('yellow_cards').nullable();
            table.integer('red_cards').nullable();
            table.integer('penalties_won').nullable();
            table.integer('penalties_committed').nullable();
            table.integer('penalties_scored').nullable();
            table.integer('penalties_missed').nullable();
            table.integer('penalties_saved').nullable();
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
            table.unique(['match_id', 'player_id']);
            table.index(['player_id', 'match_id']);
            table.index('team_id');
        })
        .createTable('match_team_stats', function (table) {
            table.uuid('id').primary().defaultTo(knex.fn.uuid());
            table.integer('match_id').notNullable().references('id').inTable('matches').onDelete('CASCADE');
            table.integer('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE');
            table.integer('shots_on_goal').nullable();
            table.integer('shots_off_goal').nullable();
            table.integer('shots_total').nullable();
            table.integer('shots_blocked').nullable();
            table.integer('shots_inside_box').nullable();
            table.integer('shots_outside_box').nullable();
            table.integer('fouls').nullable();
            table.integer('corners').nullable();
            table.integer('offsides').nullable();
            table.integer('ball_possession').nullable();
            table.integer('yellow_cards').nullable();
            table.integer('red_cards').nullable();
            table.integer('goalkeeper_saves').nullable();
            table.integer('passes_total').nullable();
            table.integer('passes_accurate').nullable();
            table.integer('passes_accuracy').nullable();
            table.jsonb('extras').nullable();
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
            table.unique(['match_id', 'team_id']);
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema
        .dropTableIfExists('match_team_stats')
        .dropTableIfExists('player_match_stats')
        .dropTableIfExists('lineup_players')
        .dropTableIfExists('match_coaches')
        .dropTableIfExists('match_events')
        .dropTableIfExists('matches');
};
