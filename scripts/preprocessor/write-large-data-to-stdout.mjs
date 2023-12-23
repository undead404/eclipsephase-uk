export default function writeLargeDataToStdout(dataString) {
  const chunkSize = 1000;
  const chunks = [];
  for (let i = 0; i < dataString.length; i += chunkSize) {
    chunks.push(dataString.slice(i, i + chunkSize));
  }
  return Promise.all(
    chunks.map(
      (chunk) =>
        new Promise((resolve, reject) => {
          process.stdout.write(chunk, (error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        })
    )
  );
}
