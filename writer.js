const { writeFile } = require("fs/promises");
const process = require("process");

if (process.argv[2] === "supports" && process.argv[3] === "html") {
  process.exit(0);
}

// async function read(stream) {
//   const chunks = [];
//   for await (const chunk of stream) chunks.push(chunk);
//   return Buffer.concat(chunks).toString("utf8");
// }

async function readStdinUntilEof() {
  return Buffer.concat(await process.stdin.toArray()).toString("utf8");
}

function writeLargeDataToStdout(dataString) {
  const chunkSize = 1000;
  const chunks = [];
  for (let i = 0; i < dataString.length; i += chunkSize) {
    chunks.push(dataString.slice(i, i + chunkSize));
  }
  chunks.forEach((chunk) => process.stdout.write(chunk));
}

readStdinUntilEof()
  .then((jsonInput) => {
    const [context, book] = JSON.parse(jsonInput);
    return writeFile("./contextData.json", JSON.stringify(context))
      .then(() => writeFile("./bookData.json", JSON.stringify(book)))
      .then(() => {
        writeLargeDataToStdout(JSON.stringify(book));
        process.exit(0);
      });
  })
  .catch((error) => {
    process.exit(1);
  });

// process.stdin.pipe(process.stdout)
