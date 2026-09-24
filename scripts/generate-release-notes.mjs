import { execSync } from 'node:child_process';
import { writeFileSync, readFileSync } from 'node:fs';

// Dapatkan repository URL & nama
function getRepoName() {
  if (process.env.GITHUB_REPOSITORY) {
    return process.env.GITHUB_REPOSITORY;
  }
  try {
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    const match = remoteUrl.match(/github\.com[/:]([^/]+\/[^/.]+)/);
    if (match) return match[1];
  } catch {}
  return 'HeriEfendi/vue-capacitor-app';
}

const repo = getRepoName();
const today = new Date().toISOString().split('T')[0];

// Ambil tag saat ini
let currentTag = process.env.GITHUB_REF_NAME || process.argv[2];
if (!currentTag) {
  try {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    currentTag = pkg.version ? `v${pkg.version.replace(/^v/, '')}` : 'v1.0.0';
  } catch {
    currentTag = 'v1.0.0';
  }
}

console.log(`Generating Release Notes for ${currentTag} in repo ${repo}...`);

// Dapatkan tag sebelumnya
let prevTag = '';
try {
  const gitDescribe = execSync(`git describe --tags --abbrev=0 "${currentTag}^" 2>/dev/null || git describe --tags --abbrev=0 "HEAD^" 2>/dev/null`, { encoding: 'utf8' }).trim();
  if (gitDescribe && gitDescribe !== currentTag) {
    prevTag = gitDescribe;
  }
} catch {
  try {
    const tags = execSync(`git tag --sort=-creatordate`, { encoding: 'utf8' })
      .split('\n')
      .map(t => t.trim())
      .filter(Boolean);
    const currentIndex = tags.indexOf(currentTag);
    if (currentIndex >= 0 && currentIndex + 1 < tags.length) {
      prevTag = tags[currentIndex + 1];
    } else if (tags.length > 0 && tags[0] !== currentTag) {
      prevTag = tags[0];
    }
  } catch {}
}

console.log(`Current Tag: ${currentTag}, Previous Tag: ${prevTag || 'none'}`);

async function generate() {
  let releaseBody = '';

  // 1. Coba gunakan GitHub API (Official Automatic Release Notes Generator) jika GITHUB_TOKEN ada
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    try {
      console.log('Fetching official GitHub Release Notes via API...');
      const payload = { tag_name: currentTag };
      if (prevTag) payload.previous_tag_name = prevTag;

      const res = await fetch(`https://api.github.com/repos/${repo}/releases/generate-notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'ReleaseNotesGenerator/1.0',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.body) {
          console.log('Successfully fetched release notes from GitHub API!');
          releaseBody = data.body;
        }
      } else {
        console.warn(`GitHub API status: ${res.status} ${res.statusText}`);
      }
    } catch (err) {
      console.warn('GitHub API request failed, falling back to git log parser:', err.message);
    }
  }

  // 2. Fallback jika offline atau tanpa token: Parse langsung dari Git Log
  if (!releaseBody) {
    let commitLogs = '';
    try {
      if (prevTag) {
        commitLogs = execSync(`git log "${prevTag}"..HEAD --pretty=format:"%H|%h|%s|%an"`, { encoding: 'utf8' }).trim();
      } else {
        commitLogs = execSync(`git log -n 30 --pretty=format:"%H|%h|%s|%an"`, { encoding: 'utf8' }).trim();
      }
    } catch {
      try {
        commitLogs = execSync(`git log -n 20 --pretty=format:"%H|%h|%s|%an"`, { encoding: 'utf8' }).trim();
      } catch {}
    }

    const meaningfulCommits = [];
    const choreCommits = [];

    if (commitLogs) {
      const lines = commitLogs.split('\n');
      for (const line of lines) {
        const [fullHash, shortHash, subject, author] = line.split('|');
        if (!subject) continue;

        // Skip merge commits
        if (subject.startsWith('Merge ') || subject.startsWith('Release v')) continue;

        const commitUrl = `https://github.com/${repo}/commit/${fullHash}`;
        const entry = `* ${subject} ([${shortHash}](${commitUrl}))`;

        const lower = subject.toLowerCase();
        // Pisahkan jika sekadar bump version
        if (lower.startsWith('bump version')) {
          choreCommits.push(entry);
        } else {
          meaningfulCommits.push(entry);
        }
      }
    }

    const commitsToDisplay = meaningfulCommits.length > 0 ? meaningfulCommits : choreCommits;

    releaseBody = `## What's Changed\n`;
    if (commitsToDisplay.length > 0) {
      releaseBody += commitsToDisplay.join('\n') + '\n\n';
    } else {
      releaseBody += `* Pembaruan dan perbaikan stabilitas aplikasi pada rilis ${currentTag}.\n\n`;
    }

    if (prevTag) {
      releaseBody += `**Full Changelog**: https://github.com/${repo}/compare/${prevTag}...${currentTag}\n`;
    } else {
      releaseBody += `**Riwayat Komit**: https://github.com/${repo}/commits/${currentTag}\n`;
    }
  }

  // 3. Tambahkan Panduan Unduhan Paket Aplikasi di bagian bawah
  const downloadSection = `
---

### 📦 Panduan Unduhan Paket Aplikasi
| Platform | Ekstensi / Format | Rekomendasi Sistem |
|---|---|---|
| **Android** | \`.apk\` | Android 8.0 (Oreo) atau lebih baru |
| **Windows** | \`.msi\` / \`.exe\` | Windows 10 / 11 (64-bit) |
| **Ubuntu / Debian** | \`.deb\` | Ubuntu 20.04+, Debian 11+ |
| **Fedora / RHEL** | \`.rpm\` | Fedora 38+, Rocky Linux 9 |
| **Arch Linux** | \`.pkg.tar.zst\` | Arch Linux, Manjaro, EndeavourOS |
`;

  const finalMarkdown = releaseBody.trim() + '\n' + downloadSection;

  writeFileSync('release_notes.md', finalMarkdown, 'utf8');
  console.log('Generated release_notes.md:');
  console.log(finalMarkdown);
}

generate();
