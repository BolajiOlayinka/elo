/**
 * Provenance for seasons and trophies that were curated, not loaded from API-Football.
 * Null on existing API rows. A missing counting stat stays null; coverage says
 * which columns were actually on the source page.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.alterTable('player_season_stats', function (table) {
        table.string('source').nullable();
        table.text('source_url').nullable();
        table.text('source_url_alt').nullable();
        table.string('coverage').nullable();
        table.index('source');
    });

    await knex.schema.alterTable('trophies', function (table) {
        table.string('source').nullable();
        table.text('source_url').nullable();
        table.string('kind').nullable();
        table.index('kind');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex.schema.alterTable('trophies', function (table) {
        table.dropIndex('kind');
        table.dropColumn('source');
        table.dropColumn('source_url');
        table.dropColumn('kind');
    });

    await knex.schema.alterTable('player_season_stats', function (table) {
        table.dropIndex('source');
        table.dropColumn('source');
        table.dropColumn('source_url');
        table.dropColumn('source_url_alt');
        table.dropColumn('coverage');
    });
};
