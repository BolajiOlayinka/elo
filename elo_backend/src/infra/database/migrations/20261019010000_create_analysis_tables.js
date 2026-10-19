/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.createTable('analysis_categories', (table) => {
        table.string('id').primary().defaultTo(knex.fn.uuid());
        table.string('slug').notNullable().unique();
        table.string('label').notNullable();
        table.text('description').nullable();
        table.integer('sort_order').notNullable().defaultTo(0);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });

    await knex.schema.createTable('analysis_tags', (table) => {
        table.string('id').primary().defaultTo(knex.fn.uuid());
        table.string('slug').notNullable().unique();
        table.string('name').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });

    await knex.schema.createTable('analysis_uploads', (table) => {
        table.string('id').primary();
        table.text('file_url').notNullable();
        table.string('original_name').nullable();
        table.string('mime').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });

    await knex.schema.createTable('analysis_posts', (table) => {
        table.string('id').primary().defaultTo(knex.fn.uuid());
        table.string('slug').notNullable().unique();
        table.string('category_id').notNullable().references('id').inTable('analysis_categories').onDelete('RESTRICT');
        table.string('title').notNullable();
        table.string('card_title').notNullable();
        table.text('excerpt').nullable();
        table.text('body').notNullable().defaultTo('');
        table.string('status').notNullable().defaultTo('draft');
        table.boolean('comparison').notNullable().defaultTo(false);
        table.integer('read_minutes').notNullable().defaultTo(6);
        table.integer('clips').notNullable().defaultTo(0);
        table.integer('arguments_count').notNullable().defaultTo(0);
        table.timestamp('published_at').nullable();
        table.string('author_name').notNullable();
        table.string('author_role').nullable();
        table.string('author_initials').nullable();
        table.string('thumbnail_upload_id').nullable();
        table.text('thumbnail_url').nullable();
        table.string('hero_upload_id').nullable();
        table.text('hero_url').nullable();
        table.string('metric_left_name').nullable();
        table.string('metric_right_name').nullable();
        table.jsonb('metrics').notNullable().defaultTo('[]');
        table.jsonb('translations').notNullable().defaultTo('{}');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });

    await knex.schema.createTable('analysis_post_tags', (table) => {
        table.string('post_id').notNullable().references('id').inTable('analysis_posts').onDelete('CASCADE');
        table.string('tag_id').notNullable().references('id').inTable('analysis_tags').onDelete('CASCADE');
        table.primary(['post_id', 'tag_id']);
    });

    await knex.schema.createTable('analysis_comments', (table) => {
        table.string('id').primary().defaultTo(knex.fn.uuid());
        table.string('post_id').notNullable().references('id').inTable('analysis_posts').onDelete('CASCADE');
        table.string('parent_id').nullable().references('id').inTable('analysis_comments').onDelete('CASCADE');
        table.string('user_id').nullable();
        table.string('name').notNullable();
        table.string('initials').nullable();
        table.string('email').nullable();
        table.string('stance').notNullable().defaultTo('challenge');
        table.text('body').notNullable();
        table.integer('upvotes').notNullable().defaultTo(0);
        table.integer('downvotes').notNullable().defaultTo(0);
        table.string('match_label').nullable();
        table.string('match_clock').nullable();
        table.string('status').notNullable().defaultTo('pending');
        table.boolean('flagged').notNullable().defaultTo(false);
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('analysis_comments');
    await knex.schema.dropTableIfExists('analysis_post_tags');
    await knex.schema.dropTableIfExists('analysis_posts');
    await knex.schema.dropTableIfExists('analysis_uploads');
    await knex.schema.dropTableIfExists('analysis_tags');
    await knex.schema.dropTableIfExists('analysis_categories');
};
