import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const tracePath = path.join(".next", "server", "app", "api", "generate", "route.js.nft.json");
const requiredFile = "../../../chunks/css/preflight.css";

const trace = JSON.parse(await readFile(tracePath, "utf8"));
trace.files = Array.from(new Set([...trace.files, requiredFile]));
await writeFile(tracePath, `${JSON.stringify(trace)}\n`);
