import { access, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

// The writer preprocessor saves the current chapter tree on every mdBook build.
const book = JSON.parse(await readFile('bookData.json', 'utf8'));
const context = JSON.parse(await readFile('contextData.json', 'utf8'));
const base = new URL(context.config.output.html['site-url'], 'https://undead404.github.io');
const destination = resolve(context.root, context.config.build?.['build-dir'] ?? 'book');
const paths = new Map();
const git = (...args) => execFileSync('git', args, { cwd: context.root, encoding: 'utf8' }).trim();
if (git('rev-parse', '--is-shallow-repository') === 'true') {
  throw new Error('Sitemap lastmod requires full Git history. Fetch with git fetch --unshallow.');
}

function collect(items) {
  for (const item of items) {
    const chapter = item.Chapter;
    if (!chapter) continue;
    if (chapter.path) {
      const path = chapter.path.replace(/\.md$/, '.html').replace(/(^|\/)README\.html$/, '$1index.html');
      const source = resolve(context.root, context.config.book.src ?? 'src', chapter.source_path ?? chapter.path);
      // mdBook uses the first chapter as the home page as well.
      if (paths.size === 0) paths.set('index.html', source);
      paths.set(path, source);
    }
    collect(chapter.sub_items ?? []);
  }
}
collect(book.items);

const escapeXml = (value) => value.replace(/[<>&"']/g, (char) => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
})[char]);

const urls = new Map();
for (const [path, source] of paths) {
  await access(resolve(destination, path));
  const lastmod = git('log', '-1', '--format=%cI', '--', source);
  if (!lastmod) throw new Error(`No Git history found for sitemap source: ${source}`);
  urls.set(new URL(path === 'index.html' ? './' : path, base).href, lastmod);
}
const xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  + [...urls].map(([url, lastmod]) => `  <url><loc>${escapeXml(url)}</loc><lastmod>${escapeXml(lastmod)}</lastmod></url>`).join('\n')
  + '\n</urlset>\n';
await writeFile(resolve(destination, 'sitemap.xml'), xml);
console.log(`Generated sitemap.xml with ${urls.size} URLs`);
