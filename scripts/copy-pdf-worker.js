const { copyFileSync, existsSync, mkdirSync } = require("fs");
const { resolve, dirname } = require("path");

const pkgDir = dirname(require.resolve("pdfjs-dist/package.json"));
const src = resolve(pkgDir, "build/pdf.worker.min.mjs");
const dest = resolve(__dirname, "../public/pdf.worker.min.mjs");
const publicDir = resolve(__dirname, "../public");

if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
}

if (!existsSync(src)) {
  console.error("copy-pdf-worker: source not found at", src);
  process.exit(1);
}

copyFileSync(src, dest);
console.log("copy-pdf-worker: copied pdf.worker.min.mjs to public/");
