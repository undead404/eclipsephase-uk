export default function warn(message) {
  return new Promise((resolve, reject) => {
    process.stderr.write(`${message}\n`, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}
