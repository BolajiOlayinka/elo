const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const migrations = {
    directory: './migrations',
    tableName: 'knex_migrations'
};

function localConnection() {
    return {
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT) || 5447,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'elo_points'
    };
}

function urlConnection(databaseUrl) {
    return {
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false }
    };
}

const dbConfig = {
    development: {
        client: 'postgresql',
        connection: localConnection(),
        pool: {
            min: 0,
            max: 8,
            acquireTimeoutMillis: 30000,
            createTimeoutMillis: 30000,
            destroyTimeoutMillis: 5000,
            idleTimeoutMillis: 30000,
            reapIntervalMillis: 1000,
            createRetryIntervalMillis: 100,
            propagateCreateError: false
        },
        migrations,
        seeds: {
            directory: './seeds'
        }
    },
    production: {
        client: 'postgresql',
        connection: urlConnection(process.env.DATABASE_URL),
        pool: {
            min: 0,
            max: 8,
            acquireTimeoutMillis: 60000,
            createTimeoutMillis: 30000,
            destroyTimeoutMillis: 5000,
            idleTimeoutMillis: 30000,
            reapIntervalMillis: 1000,
            createRetryIntervalMillis: 200
        },
        migrations,
        seeds: {
            directory: './seeds'
        }
    }
};

module.exports = dbConfig;
