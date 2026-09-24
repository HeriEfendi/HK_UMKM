import { execSync } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';

// Ambil versi dari environment GitHub Actions atau argumen atau package.json
let currentTag = process.env.GITHUB_REF_NAME || process.argv[2];
if (!currentTag) {
  try {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    currentTag = pkg.version ? `v${pkg.version.replace(/^v/, '')}` : 'v1.0.0';
  } catch {
    currentTag = 'v1.0.0';
  }
}

const repo = process.env.GITHUB_REPOSITORY || 'HeriEfendi/HK_UMKM';
const today = new Date().toISOString().split('T')[0];

console.log(`Generating Release Notes for ${currentTag}...`);

let prevTag = '';
try {
  // Coba cari tag sebelumnya
  const gitDescribe = execSync(`git describe --tags --abbrev=0 "HEAD^" 2>/dev/null`, { encoding: 'utf8' }).trim();
  if (gitDescribe && gitDescribe !== currentTag) {
    prevTag = gitDescribe;
  }
} catch (e) {
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
  } catch (err) {
    prevTag = '';
  }
}

let commitLogs = '';
try {
  if (prevTag) {
    commitLogs = execSync(`git log "${prevTag}"..HEAD --pretty=format:"%h|%s|%an" --no-merges`, { encoding: 'utf8' }).trim();
  } else {
    commitLogs = execSync(`git log -n 30 --pretty=format:"%h|%s|%an" --no-merges`, { encoding: 'utf8' }).trim();
  }
} catch (e) {
  try {
    commitLogs = execSync(`git log -n 20 --pretty=format:"%h|%s|%an" --no-merges`, { encoding: 'utf8' }).trim();
  } catch (err) {
    commitLogs = '';
  }
}

const features = [];
const fixes = [];
const performance = [];
const uiChanges = [];
const refactor = [];
const others = [];

if (commitLogs) {
  const lines = commitLogs.split('\n');
  for (const line of lines) {
    const parts = line.split('|');
    const hash = parts[0];
    const subject = parts[1];
    const author = parts[2];
    if (!subject) continue;

    const entry = `- ${subject} (\`${hash}\` oleh @${author || 'contributor'})`;
    const lower = subject.toLowerCase();

    if (lower.startsWith('feat') || lower.includes('fitur') || lower.includes('tambah') || lower.includes('implement')) {
      features.push(entry);
    } else if (lower.startsWith('fix') || lower.includes('bug') || lower.includes('perbaiki') || lower.includes('resolve')) {
      fixes.push(entry);
    } else if (lower.startsWith('perf') || lower.includes('optimi') || lower.includes('cepat') || lower.includes('speed')) {
      performance.push(entry);
    } else if (lower.startsWith('style') || lower.startsWith('ui') || lower.includes('tampilan') || lower.includes('icon') || lower.includes('theme')) {
      uiChanges.push(entry);
    } else if (lower.startsWith('refactor') || lower.startsWith('clean')) {
      refactor.push(entry);
    } else {
      others.push(entry);
    }
  }
}

let markdown = `# 🚀 Rilis Aplikasi ${currentTag} (${today})\n\n`;

if (features.length > 0) {
  markdown += `### ✨ Fitur Baru (New Features)\n`;
  markdown += features.join('\n') + '\n\n';
}

if (fixes.length > 0) {
  markdown += `### 🐛 Perbaikan Bug (Bug Fixes)\n`;
  markdown += fixes.join('\n') + '\n\n';
}

if (performance.length > 0) {
  markdown += `### ⚡ Performa & Optimasi (Performance)\n`;
  markdown += performance.join('\n') + '\n\n';
}

if (uiChanges.length > 0) {
  markdown += `### 🎨 Tampilan & UI (UI/UX)\n`;
  markdown += uiChanges.join('\n') + '\n\n';
}

if (refactor.length > 0) {
  markdown += `### ♻️ Refactoring & Pembersihan Kode\n`;
  markdown += refactor.join('\n') + '\n\n';
}

if (others.length > 0) {
  markdown += `### 🔧 Pemeliharaan & Pembaruan Lainnya\n`;
  markdown += others.join('\n') + '\n\n';
}

if (!commitLogs || (features.length === 0 && fixes.length === 0 && performance.length === 0 && uiChanges.length === 0 && refactor.length === 0 && others.length === 0)) {
  markdown += `Pembaruan dan peningkatan stabilitas untuk versi **${currentTag}**.\n\n`;
}

markdown += `---

### 📦 Panduan Unduhan Paket Aplikasi
| Platform | Ekstensi / Format | Rekomendasi Sistem |
|---|---|---|
| **Android** | \`.apk\` | Android 8.0 (Oreo) atau lebih baru |
| **Windows** | \`.msi\` / \`.exe\` | Windows 10 / 11 (64-bit) |
| **Ubuntu / Debian** | \`.deb\` | Ubuntu 20.04+, Debian 11+ |
| **Fedora / RHEL** | \`.rpm\` | Fedora 38+, Rocky Linux 9 |
| **Arch Linux** | \`.pkg.tar.zst\` | Arch Linux, Manjaro, EndeavourOS |

---
`;

if (prevTag) {
  markdown += `🔍 **Full Changelog**: https://github.com/${repo}/compare/${prevTag}...${currentTag}\n`;
} else {
  markdown += `🔍 **Riwayat Komit**: https://github.com/${repo}/commits/${currentTag}\n`;
}

writeFileSync('release_notes.md', markdown, 'utf8');
console.log('Successfully generated release_notes.md');
