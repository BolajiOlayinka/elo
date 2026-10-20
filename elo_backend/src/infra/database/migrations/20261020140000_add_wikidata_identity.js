/**
 * Wikidata identity, club stints, and honour qids.
 * Stint goals are era context, not Career Points.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.alterTable('players', function (table) {
        table.string('wikidata_qid').nullable().unique();
        table.string('wikipedia_title').nullable();
        table.string('transfermarkt_id').nullable();
        table.string('worldfootball_id').nullable();
        table.string('footballdatabase_id').nullable();
        table.string('soccerbase_id').nullable();
        table.string('fifa_id').nullable();
        table.index('wikipedia_title');
    });

    await knex.schema.alterTable('coaches', function (table) {
        table.string('wikidata_qid').nullable().unique();
        table.string('wikipedia_title').nullable();
    });

    await knex.schema.createTable('player_stints', function (table) {
        table.uuid('id').primary().defaultTo(knex.fn.uuid());
        table.integer('player_id').notNullable().references('id').inTable('players').onDelete('CASCADE');
        table.integer('team_id').nullable().references('id').inTable('teams').onDelete('SET NULL');
        table.string('team_qid').nullable();
        table.string('team_label').nullable();
        table.date('started_on').nullable();
        table.date('ended_on').nullable();
        table.integer('appearances').nullable();
        table.integer('goals').nullable();
        table.string('source').notNullable().defaultTo('wikidata');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.index('player_id');
        table.index('team_qid');
        table.index('source');
    });

    await knex.schema.alterTable('coach_tenures', function (table) {
        table.string('source').nullable();
        table.string('team_qid').nullable();
        table.index('source');
    });

    await knex.schema.alterTable('trophies', function (table) {
        table.string('honour_qid').nullable();
        table.string('of_qid').nullable();
        table.string('of_label').nullable();
        table.index(['player_id', 'honour_qid']);
        table.index(['coach_id', 'honour_qid']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex.schema.alterTable('trophies', function (table) {
        table.dropIndex(['player_id', 'honour_qid']);
        table.dropIndex(['coach_id', 'honour_qid']);
        table.dropColumn('honour_qid');
        table.dropColumn('of_qid');
        table.dropColumn('of_label');
    });

    await knex.schema.alterTable('coach_tenures', function (table) {
        table.dropIndex('source');
        table.dropColumn('source');
        table.dropColumn('team_qid');
    });

    await knex.schema.dropTableIfExists('player_stints');

    await knex.schema.alterTable('coaches', function (table) {
        table.dropUnique(['wikidata_qid']);
        table.dropColumn('wikidata_qid');
        table.dropColumn('wikipedia_title');
    });

    await knex.schema.alterTable('players', function (table) {
        table.dropIndex('wikipedia_title');
        table.dropUnique(['wikidata_qid']);
        table.dropColumn('wikidata_qid');
        table.dropColumn('wikipedia_title');
        table.dropColumn('transfermarkt_id');
        table.dropColumn('worldfootball_id');
        table.dropColumn('footballdatabase_id');
        table.dropColumn('soccerbase_id');
        table.dropColumn('fifa_id');
    });
};
