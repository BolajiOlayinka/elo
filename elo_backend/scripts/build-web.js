'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BACKEND_ROOT = path.resolve(__dirname, '..');
const WEB_ROOT = path.resolve(BACKEND_ROOT, '../elo_web');
const DIST = path.join(WEB_ROOT, 'dist');
const PUBLIC_WEB = path.join(BACKEND_ROOT, 'public', 'web');

if (!fs.existsSync(path.join(WEB_ROOT, 'package.json'))) {
    if (fs.existsSync(path.join(PUBLIC_WEB, 'index.html'))) {
        console.log('elo_web source missing; using existing public/web');
        process.exit(0);
    }

    throw new Error('elo_web is missing and public/web has no index.html');
}

console.log('Installing elo_web (including devDependencies for Vite)…');
execSync('npm install --include=dev', { cwd: WEB_ROOT, stdio: 'inherit' });

console.log('Building elo_web…');
execSync('npm run build', { cwd: WEB_ROOT, stdio: 'inherit' });

fs.rmSync(PUBLIC_WEB, { recursive: true, force: true });
fs.mkdirSync(path.dirname(PUBLIC_WEB), { recursive: true });
fs.cpSync(DIST, PUBLIC_WEB, { recursive: true });

console.log(`Copied ${DIST} → ${PUBLIC_WEB}`);
