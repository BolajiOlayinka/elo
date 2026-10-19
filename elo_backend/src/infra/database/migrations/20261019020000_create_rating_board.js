/**
 * Cached, ranked rating rows so /ratings can page from disk instead of
 * walking every match on the request path.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.createTable('rating_board', (table) => {
        table.string('entity').notNullable();
        table.integer('entity_id').notNullable();
        table.integer('rank').notNullable();
        table.string('name').nullable();
        table.jsonb('payload').notNullable();
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.primary(['entity', 'entity_id']);
        table.index(['entity', 'rank']);
        table.index(['entity', 'name']);
    });

    await knex.schema.createTable('rating_board_meta', (table) => {
        table.string('id').primary();
        table.string('status').notNullable().defaultTo('empty');
        table.timestamp('built_at').nullable();
        table.integer('matches').notNullable().defaultTo(0);
        table.text('error').nullable();
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('rating_board');
    await knex.schema.dropTableIfExists('rating_board_meta');
};
