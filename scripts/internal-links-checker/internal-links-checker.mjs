import warn from "../helpers/warn.mjs";
import Preprocessor from "../preprocessor/preprocessor.mjs";

const INTERNAL_MARKDOWN_LINK_REGEXP = /\[(?:[^\]]+)\]\(([^)]+)\)/g;
/**
 * @typedef {Object} Chapter
 * @property {string} path
 * @property {(string | Section)[]} sub_items
 */

/**
 * @typedef {Object} Section
 * @property {Chapter} Chapter
 * 
 */

/**
 * 
 * @param {string | Section} section 
 * @returns {string[]}
 */
function getPathsFromSection(section) {
  if (typeof section !== 'object') {
    return []
  }
  warn(`Getting paths from ${section?.Chapter?.path}`)
  return [
    section.Chapter.path,
    ...section.Chapter.sub_items.map(getPathsFromSection),
  ];
}

/**
 * 
 * @param {string[]} linkParts 
 * @returns {string[]}
 */
function simplifyLinkParts(linkParts) {
  warn(`Simplifying ${linkParts.join("/")}`)
  const simplifiedLinkParts = [];
  for (const linkPart of linkParts) {
    if (linkPart === ".") {
      continue;
    }
    if (linkPart === "..") {
      if (simplifiedLinkParts.length === 0) {
        throw new Error(`Broken link: ${linkParts.join("/")}`);
      }
      simplifiedLinkParts.pop();
      continue;
    }
    simplifiedLinkParts.push(linkPart);
  }
  return simplifiedLinkParts;
}

/**
 * 
 * @param {Section} section 
 * @param {string[]} paths 
 */
function checkSection(section, paths) {
  const content = section.Chapter.content;
  const linkMatches = content.matchAll(INTERNAL_MARKDOWN_LINK_REGEXP);
  // const depth = section.Chapter.number.length;
  warn(`Checking ${section?.Chapter?.path}`)
  const folderParts = section.Chapter.path
    .split("/")
    .filter((part, index, collection) => index !== collection.length - 1);
  for (const linkMatch of linkMatches) {
    let [, link] = linkMatch;
    warn(`Checking ${link} in ${section.Chapter.path}`)
    const fullLinkParts = [...folderParts, ...link.split("/")];
    link = simplifyLinkParts(fullLinkParts).join("/");
    if (!paths.includes(link)) {
      throw new Error(`Broken link: ${link} in ${section.Chapter.path}`);
    }
  }
}

/**
 * 
 * @param {{sections: (string | Section)[]}} book 
 * @param {*} context 
 * @returns {{sections: (string | Section)[]} }
 */
function checkInternalLinks(book, context) {
  warn("Checking internal links");
  const paths = book.sections.map(getPathsFromSection).flat();
  paths.forEach(warn);
  warn(`Found ${paths.length} paths`);
  for (const section of book.sections) {
    if (typeof section === 'string') {
      continue;
    }
    checkSection(section, paths);
  }
  return book;
}

new Preprocessor(checkInternalLinks).run();