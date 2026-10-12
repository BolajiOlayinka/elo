/**
 * Identity graph sourced from API-Football /countries, /leagues, /teams, /venues,
 * /players (profile), /coachs — stored as our entities, not raw endpoint dumps.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema
        .createTable('countries', function (table) {
            table.increments('id').primary();
            table.string('name').notNullable().unique();
            table.string('code').nullable();
            table.string('flag_url').nullable();
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
        })
        .createTable('venues', function (table) {
            table.integer('id').primary();
            table.string('name').nullable();
            table.string('address').nullable();
            table.string('city').nullable();
            table.integer('country_id').nullable().references('id').inTable('countries').onDelete('SET NULL');
            table.integer('capacity').nullable();
            table.string('surface').nullable();
            table.string('image_url').nullable();
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
        })
        .createTable('leagues', function (table) {
            table.integer('id').primary();
            table.string('name').notNullable();
            table.string('type').nullable();
            table.string('logo_url').nullable();
            table.integer('country_id').nullable().references('id').inTable('countries').onDelete('SET NULL');
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
            table.index('type');
            table.index('country_id');
        })
        .createTable('competition_seasons', function (table) {
            table.uuid('id').primary().defaultTo(knex.fn.uuid());
            table.integer('league_id').notNullable().references('id').inTable('leagues').onDelete('CASCADE');
            table.integer('year').notNullable();
            table.date('start_date').nullable();
            table.date('end_date').nullable();
            table.boolean('is_current').notNullable().defaultTo(false);
            table.boolean('coverage_events').notNullable().defaultTo(false);
            table.boolean('coverage_lineups').notNullable().defaultTo(false);
            table.boolean('coverage_fixture_stats').notNullable().defaultTo(false);
            table.boolean('coverage_player_match_stats').notNullable().defaultTo(false);
            table.boolean('coverage_standings').notNullable().defaultTo(false);
            table.boolean('coverage_players').notNullable().defaultTo(false);
            table.boolean('coverage_top_scorers').notNullable().defaultTo(false);
            table.boolean('coverage_top_assists').notNullable().defaultTo(false);
            table.boolean('coverage_injuries').notNullable().defaultTo(false);
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
            table.unique(['league_id', 'year']);
            table.index('is_current');
        })
        .createTable('teams', function (table) {
            table.integer('id').primary();
            table.string('name').notNullable();
            table.string('code').nullable();
            table.integer('founded').nullable();
            table.boolean('is_national').notNullable().defaultTo(false);
            table.string('logo_url').nullable();
            table.integer('country_id').nullable().references('id').inTable('countries').onDelete('SET NULL');
            table.string('country_name').nullable();
            table.integer('venue_id').nullable().references('id').inTable('venues').onDelete('SET NULL');
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
            table.index('is_national');
            table.index('country_id');
        })
        .createTable('players', function (table) {
            table.integer('id').primary();
            table.string('name').notNullable();
            table.string('first_name').nullable();
            table.string('last_name').nullable();
            table.integer('age').nullable();
            table.date('birth_date').nullable();
            table.string('birth_place').nullable();
            table.string('birth_country').nullable();
            table.string('nationality').nullable();
            table.string('height').nullable();
            table.string('weight').nullable();
            table.boolean('injured').nullable();
            table.string('photo_url').nullable();
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
            table.index('name');
            table.index('nationality');
        })
        .createTable('coaches', function (table) {
            table.integer('id').primary();
            table.string('name').notNullable();
            table.string('first_name').nullable();
            table.string('last_name').nullable();
            table.integer('age').nullable();
            table.date('birth_date').nullable();
            table.string('birth_place').nullable();
            table.string('birth_country').nullable();
            table.string('nationality').nullable();
            table.string('height').nullable();
            table.string('weight').nullable();
            table.string('photo_url').nullable();
            table.integer('current_team_id').nullable().references('id').inTable('teams').onDelete('SET NULL');
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
            table.index('name');
        })
        .createTable('coach_tenures', function (table) {
            table.uuid('id').primary().defaultTo(knex.fn.uuid());
            table.integer('coach_id').notNullable().references('id').inTable('coaches').onDelete('CASCADE');
            table.integer('team_id').nullable().references('id').inTable('teams').onDelete('SET NULL');
            table.string('team_name').nullable();
            table.date('started_on').nullable();
            table.date('ended_on').nullable();
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
            table.index('coach_id');
            table.index(['team_id', 'started_on']);
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema
        .dropTableIfExists('coach_tenures')
        .dropTableIfExists('coaches')
        .dropTableIfExists('players')
        .dropTableIfExists('teams')
        .dropTableIfExists('competition_seasons')
        .dropTableIfExists('leagues')
        .dropTableIfExists('venues')
        .dropTableIfExists('countries');
};
