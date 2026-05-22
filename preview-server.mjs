import { createReadStream } from "node:fs";
import { extname, join } from "node:path";
import { createServer } from "node:http";

const mimeTypes = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".png": "image/png"
};

createServer((request, response) => {
  const fileName = request.url.endsWith("/") ? `${request.url.slice(1)}index.html` : request.url.slice(1);
  const file = join(import.meta.dirname, fileName);

  response.setHeader("Content-Type", mimeTypes[extname(file)] || "application/octet-stream");
  createReadStream(file)
    .on("error", () => {
      response.statusCode = 404;
      response.end("Not found");
    })
    .pipe(response);
}).listen(4173, () => {
  console.log("Preview server ready at http://localhost:4173");
});
