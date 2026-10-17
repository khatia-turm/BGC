import { readFile, writeFile, rename } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { createMockApi } from "./api.js";
import { createMockApp } from "./app.js";

const port = Number(process.env.PORT ?? 5051);
const stateFile = process.env.MOCK_DATA_FILE
  ? resolve(process.env.MOCK_DATA_FILE)
  : fileURLToPath(new URL("./mock-state.json", import.meta.url));
let seed;
try {
  seed = JSON.parse(await readFile(stateFile, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  seed = JSON.parse(
    await readFile(new URL("./mock-data.json", import.meta.url), "utf8"),
  );
}
const api = createMockApi(seed);
const persist = async (state) => {
  const temporary = `${stateFile}.tmp`;
  await writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`);
  await rename(temporary, stateFile);
};
await persist(api.snapshot());
const app = createMockApp({ api, persist });
const server = app.listen(port, "127.0.0.1", () => {
  console.log(
    `MeepleHub mock API listening on http://localhost:${server.address().port}`,
  );
  console.log(`Mock state: ${stateFile}`);
});
export { app, server };
