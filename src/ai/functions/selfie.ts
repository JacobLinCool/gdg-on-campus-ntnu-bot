import { Type } from "@google/genai";
import fs from "node:fs/promises";
import path from "node:path";
import pMemoize from "p-memoize";
import type { CallableFunction } from "../agent.js";

export const getSelfieFunction = {
  name: "get_selfie",
  description: "Reads the bot's own compiled code from dist/index.js",
  parameters: {
    type: Type.OBJECT,
    properties: {},
    required: [],
  },
  call: pMemoize(async () => {
    try {
      const distPath = path.resolve(process.cwd(), "dist/index.js");
      const code = await fs.readFile(distPath, "utf-8");
      return { code };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        error: `Failed to read bot code: ${errorMessage}`,
      };
    }
  }),
};

export const selfieFunctions: CallableFunction[] = [getSelfieFunction];
