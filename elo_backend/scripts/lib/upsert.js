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

    const text = String(value).slice(0, 10);

    // API-Football sometimes puts a label ("1x", "Winner") in a date field.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        return null;
    }

    const parsed = new Date(`${text}T00:00:00Z`);

    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== text) {
        return null;
    }

    return text;
}

module.exports = {
    uniqueBy,
    batchUpsert,
    batchInsert,
    toInt,
    toDecimal,
    toDate
};
