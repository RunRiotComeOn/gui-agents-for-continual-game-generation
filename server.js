import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const publicRoot = join(root, "public");
const host = "127.0.0.1";
const port = Number(process.env.PORT || 4321);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".ico": "image/x-icon"
};

const demos = [
  { slug: "block-blast" },
  { slug: "garden-guard" },
  { slug: "slide-painter" },
  { slug: "happy-harvest" },
  { slug: "klotsk" },
  { slug: "sudoku" },
  { slug: "super-squad" },
  { slug: "top-down-adventure" }
];

function safeJoin(base, requestPath) {
  const pathname = decodeURIComponent(requestPath.split("?")[0]);
  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const requested = resolve(base, `.${safePath}`);
  return requested.startsWith(resolve(base)) ? requested : null;
}

function serveFile(base, requestPath, response) {
  let filePath = safeJoin(base, requestPath);
  if (!filePath) return false;
  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, "index.html");
  }
  if (!existsSync(filePath) || !statSync(filePath).isFile()) return false;

  response.writeHead(200, {
    "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
    "Cache-Control": "no-store"
  });
  createReadStream(filePath).pipe(response);
  return true;
}

const server = createServer((request, response) => {
  const url = new URL(request.url || "/", `http://${host}:${port}`);

  if (url.pathname === "/api/demos") {
    const payload = demos.map((demo) => ({
      ...demo,
      type: "static",
      url: `demo/${demo.slug}/`
    }));
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify(payload));
    return;
  }

  if (serveFile(publicRoot, url.pathname, response)) return;
  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Not found");
});

server.listen(port, host, () => {
  console.log(`Play2Code gallery running at http://${host}:${port}`);
});
