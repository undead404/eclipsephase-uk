export default async function readStdinUntilEof() {
  return Buffer.concat(await process.stdin.toArray()).toString("utf8");
}
