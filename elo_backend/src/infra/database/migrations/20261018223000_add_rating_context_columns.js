/**
 * Columns the rating pipeline reads directly, so the full load fills them in one pass
 * instead of a backfill:
 *
 * - leagues: kind / tier / gender / age_group / in_scope (competition metadata, derived
 *   from the API-Football catalog with hand overrides; admin-editable).
 * - matches: is_neutral (venue differs from the home team's), plus coverage flags so
 *   "no stats recorded" is never read as zero.
 * - match_team_stats: expected_goals promoted out of the extras jsonb.
 * - player_match_stats: own_goals from Goal/"Own Goal" events.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.alterTable('leagues', function (table) {
        table.string('kind').nullable(); // league | cup | continental | international | friendly | super_cup
        table.integer('tier').nullable(); // 1 = top division, 2 = second, ... (leagues only)
        table.string('gender').nullable(); // men | women (filled by the catalog load)
        table.string('age_group').nullable(); // senior | youth (filled by the catalog load)
        table.boolean('in_scope').notNullable().defaultTo(true);
        table.index('kind');
        table.index(['gender', 'age_group']);
        table.index('in_scope');
    });

    await knex.schema.alterTable('matches', function (table) {
        table.boolean('is_neutral').nullable(); // null = unknown (no venue on either side)
        table.boolean('has_events').notNullable().defaultTo(false);
        table.boolean('has_lineups').notNullable().defaultTo(false);
        table.boolean('has_team_stats').notNullable().defaultTo(false);
        table.boolean('has_player_stats').notNullable().defaultTo(false);
        table.index(['league_id', 'season_year', 'has_player_stats']);
    });

    await knex.schema.alterTable('match_team_stats', function (table) {
        table.decimal('expected_goals', 6, 3).nullable();
    });

    await knex.schema.alterTable('player_match_stats', function (table) {
        table.integer('own_goals').nullable();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex.schema.alterTable('player_match_stats', function (table) {
        table.dropColumn('own_goals');
    });

    await knex.schema.alterTable('match_team_stats', function (table) {
        table.dropColumn('expected_goals');
    });

    await knex.schema.alterTable('matches', function (table) {
        table.dropIndex(['league_id', 'season_year', 'has_player_stats']);
        table.dropColumn('is_neutral');
        table.dropColumn('has_events');
        table.dropColumn('has_lineups');
        table.dropColumn('has_team_stats');
        table.dropColumn('has_player_stats');
    });

    await knex.schema.alterTable('leagues', function (table) {
        table.dropIndex('kind');
        table.dropIndex(['gender', 'age_group']);
        table.dropIndex('in_scope');
        table.dropColumn('kind');
        table.dropColumn('tier');
        table.dropColumn('gender');
        table.dropColumn('age_group');
        table.dropColumn('in_scope');
    });
};
