import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

// Only metadata is fetched. Source text and other translations are never imported.
const baseline = JSON.parse(await readFile(new URL('./baseline.json', import.meta.url)));
const args = process.argv.slice(2);
if (args.length && !(args.length === 2 && args[0] === '--source')) {
  throw new Error('Usage: node scripts/upstream/check.mjs [--source /path/to/upstream-checkout]');
}
let commit;
let tree;
if (args[0] === '--source') {
  const git = (...parameters) => execFileSync('git', ['-C', args[1], ...parameters], { encoding: 'utf8' }).trim();
  commit = git('rev-parse', baseline.branch);
  tree = new Map(git('ls-tree', '-r', commit).split('\n').map(line => {
    const [metadata, path] = line.split('\t');
    return [path, metadata.split(' ')[2]];
  }));
} else {
  async function github(path) {
    const response = await fetch(`https://api.github.com/repos/${baseline.repository}/${path}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
      },
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`GitHub returned ${response.status} for ${path}`);
    return response.json();
  }
  commit = (await github(`commits/${baseline.branch}`)).sha;
  const result = await github(`git/trees/${commit}?recursive=1`);
  if (result.truncated) throw new Error('GitHub returned an incomplete tree; use --source instead.');
  tree = new Map(result.tree.filter(item => item.type === 'blob').map(item => [item.path, item.sha]));
}
const changed = Object.entries(baseline.files).filter(([, entry]) => tree.get(entry.source) !== entry.blob);
console.log(`Upstream: https://github.com/${baseline.repository}/commit/${commit}`);
if (!changed.length) {
  console.log('No new upstream changes to tracked Ukrainian pages or shared CSS.');
} else {
  console.log(`${changed.length} file(s) need review; Ukrainian files have not been modified:`);
  for (const [local, entry] of changed) {
    console.log(`- ${local} (${tree.has(entry.source) ? 'changed' : 'removed or renamed'})`);
    console.log(`  https://github.com/${baseline.repository}/compare/${baseline.commit}...${commit}`);
  }
  process.exitCode = 1;
}
