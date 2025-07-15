const { createServer } = require("https");
const { parse } = require("url");
const fs = require("fs");
const path = require("path");
const next = require("next");

process.env.NODE_ENV = "production";

const app = next({ dev: false, hostname: "0.0.0.0" });
const handle = app.getRequestHandler();

const CERT_KEY_PATH = path.join(__dirname, "../backend/cert", "private.key");
const CERT_CRT_PATH = path.join(
  __dirname,
  "../backend/cert",
  "certificate.crt"
);

if (!fs.existsSync(CERT_KEY_PATH) || !fs.existsSync(CERT_CRT_PATH)) {
  console.error(
    "ERROR: Certificados SSL de producción no encontrados o rutas incorrectas."
  );
  console.error(`Buscando clave en: ${CERT_KEY_PATH}`);
  console.error(`Buscando certificado en: ${CERT_CRT_PATH}`);
  process.exit(1);
}

const httpsOptions = {
  key: fs.readFileSync(CERT_KEY_PATH),
  cert: fs.readFileSync(CERT_CRT_PATH),
};

const port = 3001;

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(
      `> Frontend Next.js (PRODUCTION) Ready on https://sv-d7yrkdaryv.cloud.elastika.pe:${port}`
    );
  });
});
