/**
 * StatsBomb open-data ids and advanced counts. Frames / 360 are not stored.
 * Null on API-Football rows until a load patches the extra columns.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.alterTable('players', function (table) {
        table.integer('statsbomb_id').nullable().unique();
    });

    await knex.schema.alterTable('teams', function (table) {
        table.integer('statsbomb_id').nullable().unique();
    });

    await knex.schema.alterTable('leagues', function (table) {
        table.integer('statsbomb_id').nullable().unique();
    });

    await knex.schema.alterTable('matches', function (table) {
        table.integer('statsbomb_id').nullable().unique();
    });

    await knex.schema.alterTable('competition_seasons', function (table) {
        table.boolean('coverage_xg').notNullable().defaultTo(false);
        table.boolean('coverage_xg_faced').notNullable().defaultTo(false);
    });

    const advanced = function (table) {
        table.decimal('xg', 8, 3).nullable();
        table.decimal('npxg', 8, 3).nullable();
        table.decimal('xa', 8, 3).nullable();
        table.decimal('xg_faced', 8, 3).nullable();
        table.integer('pressures').nullable();
        table.integer('carries').nullable();
        table.integer('progressive_carries').nullable();
        table.integer('progressive_passes').nullable();
        table.integer('passes_into_box').nullable();
    };

    await knex.schema.alterTable('player_match_stats', advanced);
    await knex.schema.alterTable('player_season_stats', advanced);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    const dropAdvanced = function (table) {
        table.dropColumn('xg');
        table.dropColumn('npxg');
        table.dropColumn('xa');
        table.dropColumn('xg_faced');
        table.dropColumn('pressures');
        table.dropColumn('carries');
        table.dropColumn('progressive_carries');
        table.dropColumn('progressive_passes');
        table.dropColumn('passes_into_box');
    };

    await knex.schema.alterTable('player_season_stats', dropAdvanced);
    await knex.schema.alterTable('player_match_stats', dropAdvanced);

    await knex.schema.alterTable('competition_seasons', function (table) {
        table.dropColumn('coverage_xg');
        table.dropColumn('coverage_xg_faced');
    });

    await knex.schema.alterTable('matches', function (table) {
        table.dropUnique(['statsbomb_id']);
        table.dropColumn('statsbomb_id');
    });

    await knex.schema.alterTable('leagues', function (table) {
        table.dropUnique(['statsbomb_id']);
        table.dropColumn('statsbomb_id');
    });

    await knex.schema.alterTable('teams', function (table) {
        table.dropUnique(['statsbomb_id']);
        table.dropColumn('statsbomb_id');
    });

    await knex.schema.alterTable('players', function (table) {
        table.dropUnique(['statsbomb_id']);
        table.dropColumn('statsbomb_id');
    });
};
