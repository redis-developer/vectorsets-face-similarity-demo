//this file runs before all tests
import { config as dotenvConfig } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import { afterAll } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenvConfig({ path: path.resolve(__dirname, ".env.test") });

const setupGlobalVars = () => {
  (globalThis as any).VARIABLE = "test";
};

//----------- Before all tests ------------

setupGlobalVars();

//----------- After all tests ------------
afterAll(async () => {});
