import process from "process";

import readStdinUntilEof from "./read-stdin-until-eof.mjs";
import writeLargeDataToStdout from "./write-large-data-to-stdout.mjs";

export default class Preprocessor {
  constructor(process) {
    this.process = process;
  }
  async run() {
    try {
      if (process.argv[2] === "supports" && process.argv[3] === "html") {
        process.exit(0);
      }
      const jsonInput = await readStdinUntilEof();
      const [context, book] = JSON.parse(jsonInput);
      const processedBook = await this.process(book, context);
      await writeLargeDataToStdout(JSON.stringify(processedBook));
      process.exit(0);
    } catch (error) {
      process.stderr.write(`${error}\n`, () => {
        process.exit(1);
      });
    }
  }
}
