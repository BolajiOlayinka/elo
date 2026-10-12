/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('users', function (table) {
        table.string('id').primary().defaultTo(knex.fn.uuid());
        table.string('first_name').notNullable();
        table.string('last_name').notNullable();
        table.string('email').unique().notNullable();
        table.string('password').nullable();
        table.string('phone').nullable();
        table.string('address').nullable();
        table.specificType('roles', 'varchar(10)[]').notNullable();
        table.boolean('is_verified').defaultTo(false);
        table.string('city').nullable();
        table.string('state').nullable();
        table.string('zip_code').nullable();
        table.string('country').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable('users');
};
