import * as fs from 'fs';
import * as path from 'path';
import tokens from './tokens';
import { tokenKeyToCssVar, sidebarKeyToCssVar } from './utils';

const GLOBALS_CSS_PATH = path.resolve(__dirname, '../src/app/globals.css');
const TOKENS_START = '/* TOKENS:START */';
const TOKENS_END = '/* TOKENS:END */';

function generateRootBlock(): string {
  const lines: string[] = [];

  // Core colors
  lines.push(`  --color-primary: ${tokens.colors.primary};`);
  lines.push(`  --color-primary-hover: ${tokens.colors.primaryHover};`);
  lines.push(`  --color-primary-light: ${tokens.colors.primaryLight};`);
  lines.push(`  --color-background: ${tokens.colors.background};`);
  lines.push(`  --color-card: ${tokens.colors.card};`);
  lines.push(`  --color-border: ${tokens.colors.border};`);
  lines.push(`  --color-text: ${tokens.colors.text};`);
  lines.push(`  --color-text-secondary: ${tokens.colors.textSecondary};`);
  lines.push(`  --color-text-muted: ${tokens.colors.textMuted};`);

  // Severity classes
  lines.push(`  --color-classe1: ${tokens.colors.classe1};`);
  lines.push(`  --color-classe2: ${tokens.colors.classe2};`);
  lines.push(`  --color-classe3: ${tokens.colors.classe3};`);
  lines.push(`  --color-classe4: ${tokens.colors.classe4};`);
  lines.push(`  --color-classe5: ${tokens.colors.classe5};`);

  // Status colors
  for (const [key, value] of Object.entries(tokens.colors.status)) {
    const cssKey = key.toLowerCase().replace(/_/g, '-');
    lines.push(`  --color-status-${cssKey}: ${value};`);
  }

  // Sidebar
  for (const [key, value] of Object.entries(tokens.sidebar)) {
    lines.push(`  ${sidebarKeyToCssVar(key)}: ${value};`);
  }

  // Radius
  lines.push(`  --radius: ${tokens.radius};`);

  // Spacing
  for (const [key, value] of Object.entries(tokens.spacing)) {
    const cssKey = key.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`);
    lines.push(`  --spacing-${cssKey}: ${value};`);
  }

  // Typography
  lines.push(`  --font-sans: ${tokens.typography.fontFamily.sans};`);
  for (const [key, value] of Object.entries(tokens.typography.sizes)) {
    const cssKey = key.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`);
    lines.push(`  --font-size-${cssKey}: ${value};`);
  }
  for (const [key, value] of Object.entries(tokens.typography.weights)) {
    lines.push(`  --font-weight-${key}: ${value};`);
  }

  return `:root {\n${lines.join('\n')}\n}`;
}

function generateTokensBlock(): string {
  return `${TOKENS_START}\n${generateRootBlock()}\n${TOKENS_END}`;
}

function run(): void {
  const isCheck = process.argv.includes('--check');

  const newBlock = generateTokensBlock();

  if (!fs.existsSync(GLOBALS_CSS_PATH)) {
    if (isCheck) {
      console.error(`ERROR: ${GLOBALS_CSS_PATH} not found.`);
      process.exit(1);
    }
    fs.writeFileSync(GLOBALS_CSS_PATH, newBlock + '\n', 'utf-8');
    console.log('Created globals.css with token block.');
    return;
  }

  const current = fs.readFileSync(GLOBALS_CSS_PATH, 'utf-8');

  if (current.includes(TOKENS_START) && current.includes(TOKENS_END)) {
    const startIdx = current.indexOf(TOKENS_START);
    const endIdx = current.indexOf(TOKENS_END) + TOKENS_END.length;
    const existingBlock = current.slice(startIdx, endIdx);

    if (isCheck) {
      if (existingBlock === newBlock) {
        console.log('globals.css tokens are up to date.');
        process.exit(0);
      } else {
        console.error('globals.css tokens are OUT OF SYNC. Run `npm run tokens` to update.');
        process.exit(1);
      }
    }

    const updated = current.slice(0, startIdx) + newBlock + current.slice(endIdx);
    fs.writeFileSync(GLOBALS_CSS_PATH, updated, 'utf-8');
    console.log('Updated globals.css token block.');
  } else {
    // No markers found — insert after the last @import line
    if (isCheck) {
      console.error('globals.css is missing TOKENS markers. Run `npm run tokens` to insert them.');
      process.exit(1);
    }

    const lines = current.split('\n');
    let lastImportIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trimStart().startsWith('@import')) {
        lastImportIdx = i;
      }
    }

    if (lastImportIdx >= 0) {
      lines.splice(lastImportIdx + 1, 0, '', newBlock);
    } else {
      lines.unshift(newBlock, '');
    }

    fs.writeFileSync(GLOBALS_CSS_PATH, lines.join('\n'), 'utf-8');
    console.log('Inserted token block into globals.css.');
  }
}

run();
