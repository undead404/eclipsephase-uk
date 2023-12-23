import Preprocessor from "../preprocessor/index.mjs";
import { writeFile } from "fs/promises";

async function saveJson(book, context) {
  await writeFile("./contextData.json", JSON.stringify(context));
  await writeFile("./bookData.json", JSON.stringify(book));
  return book;
}

const preprocessor = new Preprocessor(saveJson);
preprocessor.run();
// process.stdin.pipe(process.stdout)
