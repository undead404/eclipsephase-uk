import { access, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// The writer preprocessor saves the current chapter tree on every mdBook build.
const book = JSON.parse(await readFile('bookData.json', 'utf8'));
const context = JSON.parse(await readFile('contextData.json', 'utf8'));
const base = new URL(context.config.output.html['site-url'], 'https://undead404.github.io');
const destination = resolve(context.root, context.config.build?.['build-dir'] ?? 'book');
const paths = new Set(['index.html']);

function collect(items) {
  for (const item of items) {
    const chapter = item.Chapter;
    if (!chapter) continue;
    if (chapter.path) {
      paths.add(chapter.path.replace(/\.md$/, '.html').replace(/(^|\/)README\.html$/, '$1index.html'));
    }
    collect(chapter.sub_items ?? []);
  }
}
collect(book.items);

const escapeXml = (value) => value.replace(/[<>&"']/g, (char) => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
})[char]);

const urls = [];
for (const path of paths) {
  await access(resolve(destination, path));
  urls.push(new URL(path === 'index.html' ? './' : path, base).href);
}
const xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  + [...new Set(urls)].map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join('\n')
  + '\n</urlset>\n';
await writeFile(resolve(destination, 'sitemap.xml'), xml);
console.log(`Generated sitemap.xml with ${new Set(urls).size} URLs`);
