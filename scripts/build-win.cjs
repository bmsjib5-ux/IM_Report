/**
 * Build script for Windows - handles icon embedding via rcedit
 * since signAndEditExecutable is disabled (winCodeSign symlink issue on Windows)
 */
const { execSync } = require('child_process');
const { rcedit } = require('rcedit');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const EXE_PATH = path.join(ROOT, 'release/win-unpacked/IM Report Dashboard.exe');
const ICO_PATH = path.join(ROOT, 'public/icon.ico');

async function main() {
  // Step 1: Build web app + package with electron-builder
  console.log('=== Step 1: Building app and packaging ===');
  execSync('npm run build && electron-builder --win', {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, CSC_IDENTITY_AUTO_DISCOVERY: 'false' },
  });

  // Step 2: Embed icon via rcedit
  console.log('\n=== Step 2: Embedding icon via rcedit ===');
  if (!fs.existsSync(EXE_PATH)) {
    console.error('ERROR: exe not found at', EXE_PATH);
    process.exit(1);
  }
  await rcedit(EXE_PATH, { icon: ICO_PATH });
  console.log('Icon embedded successfully!');

  // Step 3: Rebuild NSIS installer with updated exe
  console.log('\n=== Step 3: Rebuilding NSIS installer ===');
  // Remove old installer
  const releaseDir = path.join(ROOT, 'release');
  for (const f of fs.readdirSync(releaseDir)) {
    if (f.endsWith('.exe') && f.includes('Setup')) {
      fs.unlinkSync(path.join(releaseDir, f));
    }
    if (f.endsWith('.blockmap')) {
      fs.unlinkSync(path.join(releaseDir, f));
    }
  }
  execSync('electron-builder --win --prepackaged "release/win-unpacked"', {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, CSC_IDENTITY_AUTO_DISCOVERY: 'false' },
  });

  console.log('\n=== Build complete! ===');
  const pkg = require(path.join(ROOT, 'package.json'));
  console.log('Installer:', path.join(releaseDir, 'IM Report Dashboard Setup ' + pkg.version + '.exe'));
}

main().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
