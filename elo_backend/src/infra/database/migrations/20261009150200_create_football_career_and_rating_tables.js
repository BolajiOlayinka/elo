/**
 * Season aggregates, transfers, trophies, standings from /players, /transfers,
 * /trophies, /standings — plus the proprietary points ledger (not from the API).
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema
        .createTable('player_season_stats', function (table) {
            table.uuid('id').primary().defaultTo(knex.fn.uuid());
            table.integer('player_id').notNullable().references('id').inTable('players').onDelete('CASCADE');
            table.integer('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE');
            table.integer('league_id').notNullable().references('id').inTable('leagues').onDelete('CASCADE');
            table.integer('season_year').notNullable();
            table.string('position').nullable();
            table.decimal('rating', 4, 2).nullable();
            table.boolean('captain').nullable();
            table.integer('appearances').nullable();
            table.integer('lineups').nullable();
            table.integer('minutes').nullable();
            table.integer('substitutes_in').nullable();
            table.integer('substitutes_out').nullable();
            table.integer('bench').nullable();
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
            table.integer('fouls_drawn').nullable();
            table.integer('fouls_committed').nullable();
            table.integer('yellow_cards').nullable();
            table.integer('yellow_red_cards').nullable();
            table.integer('red_cards').nullable();
            table.integer('penalties_scored').nullable();
            table.integer('penalties_missed').nullable();
            table.integer('penalties_saved').nullable();
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
            table.unique(['player_id', 'team_id', 'league_id', 'season_year']);
            table.index(['league_id', 'season_year']);
            table.index('team_id');
        })
        .createTable('player_transfers', function (table) {
            table.uuid('id').primary().defaultTo(knex.fn.uuid());
            table.integer('player_id').notNullable().references('id').inTable('players').onDelete('CASCADE');
            table.date('transferred_on').nullable();
            table.string('transfer_type').nullable();
            table.integer('team_out_id').nullable().references('id').inTable('teams').onDelete('SET NULL');
            table.integer('team_in_id').nullable().references('id').inTable('teams').onDelete('SET NULL');
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.index('player_id');
            table.index('transferred_on');
        })
        .createTable('trophies', function (table) {
            table.uuid('id').primary().defaultTo(knex.fn.uuid());
            table.integer('player_id').nullable().references('id').inTable('players').onDelete('CASCADE');
            table.integer('coach_id').nullable().references('id').inTable('coaches').onDelete('CASCADE');
            table.string('competition_name').notNullable();
            table.string('country').nullable();
            table.string('season').nullable();
            table.string('place').nullable();
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.index('player_id');
            table.index('coach_id');
        })
        .createTable('standings', function (table) {
            table.uuid('id').primary().defaultTo(knex.fn.uuid());
            table.integer('league_id').notNullable().references('id').inTable('leagues').onDelete('CASCADE');
            table.integer('season_year').notNullable();
            table.string('group_name').notNullable().defaultTo('');
            table.integer('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE');
            table.integer('rank').nullable();
            table.integer('points').nullable();
            table.integer('goal_diff').nullable();
            table.string('form').nullable();
            table.string('status').nullable();
            table.string('description').nullable();
            table.integer('played').nullable();
            table.integer('wins').nullable();
            table.integer('draws').nullable();
            table.integer('losses').nullable();
            table.integer('goals_for').nullable();
            table.integer('goals_against').nullable();
            table.integer('home_played').nullable();
            table.integer('home_wins').nullable();
            table.integer('home_draws').nullable();
            table.integer('home_losses').nullable();
            table.integer('home_goals_for').nullable();
            table.integer('home_goals_against').nullable();
            table.integer('away_played').nullable();
            table.integer('away_wins').nullable();
            table.integer('away_draws').nullable();
            table.integer('away_losses').nullable();
            table.integer('away_goals_for').nullable();
            table.integer('away_goals_against').nullable();
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
            table.unique(['league_id', 'season_year', 'team_id', 'group_name']);
            table.index(['league_id', 'season_year', 'rank']);
        })
        .createTable('rating_model_versions', function (table) {
            table.string('id').primary();
            table.string('entity_type').notNullable();
            table.text('description').nullable();
            table.jsonb('weights').nullable();
            table.timestamp('created_at').defaultTo(knex.fn.now());
        })
        .createTable('point_events', function (table) {
            table.uuid('id').primary().defaultTo(knex.fn.uuid());
            table.string('entity_type').notNullable();
            table.integer('entity_id').notNullable();
            table.string('event_type').notNullable();
            table.integer('match_id').nullable().references('id').inTable('matches').onDelete('SET NULL');
            table.string('source_id').nullable();
            table.integer('season_year').nullable();
            table.decimal('raw_value', 12, 4).nullable();
            table.decimal('context_multiplier', 8, 4).nullable();
            table.decimal('career_points_delta', 12, 4).notNullable();
            table.decimal('season_points_delta', 12, 4).notNullable();
            table.string('model_version').notNullable()
                .references('id').inTable('rating_model_versions').onDelete('RESTRICT');
            table.decimal('confidence', 4, 3).nullable();
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.index(['entity_type', 'entity_id']);
            table.index('match_id');
            table.index(['model_version', 'season_year']);
        })
        .createTable('season_points', function (table) {
            table.uuid('id').primary().defaultTo(knex.fn.uuid());
            table.string('entity_type').notNullable();
            table.integer('entity_id').notNullable();
            table.integer('season_year').notNullable();
            table.integer('league_id').nullable().references('id').inTable('leagues').onDelete('SET NULL');
            table.decimal('points', 14, 4).notNullable().defaultTo(0);
            table.decimal('normalized_score', 8, 4).nullable();
            table.decimal('peer_percentile', 6, 3).nullable();
            table.decimal('confidence', 4, 3).nullable();
            table.string('model_version').notNullable()
                .references('id').inTable('rating_model_versions').onDelete('RESTRICT');
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
            table.unique(['entity_type', 'entity_id', 'season_year', 'league_id', 'model_version']);
            table.index(['entity_type', 'season_year', 'points']);
        })
        .createTable('career_points', function (table) {
            table.uuid('id').primary().defaultTo(knex.fn.uuid());
            table.string('entity_type').notNullable();
            table.integer('entity_id').notNullable();
            table.decimal('points', 14, 4).notNullable().defaultTo(0);
            table.decimal('confidence', 4, 3).nullable();
            table.string('model_version').notNullable()
                .references('id').inTable('rating_model_versions').onDelete('RESTRICT');
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
            table.unique(['entity_type', 'entity_id', 'model_version']);
            table.index(['entity_type', 'points']);
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema
        .dropTableIfExists('career_points')
        .dropTableIfExists('season_points')
        .dropTableIfExists('point_events')
        .dropTableIfExists('rating_model_versions')
        .dropTableIfExists('standings')
        .dropTableIfExists('trophies')
        .dropTableIfExists('player_transfers')
        .dropTableIfExists('player_season_stats');
};
