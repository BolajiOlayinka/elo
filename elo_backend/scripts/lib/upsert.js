'use strict';

function uniqueBy(rows, keyFn) {
    const seen = new Map();

    for (const row of rows) {
        seen.set(keyFn(row), row);
    }

    return [...seen.values()];
}

async function batchUpsert(knex, tableName, rows, conflict, merge) {
    const size = 200;

    for (let index = 0; index < rows.length; index += size) {
        const chunk = rows.slice(index, index + size);

        if (chunk.length === 0) {
            continue;
        }

        await knex(tableName).insert(chunk).onConflict(conflict).merge(merge);
    }
}

async function batchInsert(knex, tableName, rows) {
    const size = 200;

    for (let index = 0; index < rows.length; index += size) {
        const chunk = rows.slice(index, index + size);

        if (chunk.length === 0) {
            continue;
        }

        await knex(tableName).insert(chunk);
    }
}

function toInt(value) {
    if (value == null || value === '') {
        return null;
    }

    if (typeof value === 'string' && value.endsWith('%')) {
        const parsed = Number(value.slice(0, -1));

        return Number.isFinite(parsed) ? Math.round(parsed) : null;
    }

    const parsed = Number(value);

    return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function toDecimal(value) {
    if (value == null || value === '') {
        return null;
    }

    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
}

function toDate(value) {
    if (!value) {
        return null;
    }

    return String(value).slice(0, 10);
}

module.exports = {
    uniqueBy,
    batchUpsert,
    batchInsert,
    toInt,
    toDecimal,
    toDate
};
