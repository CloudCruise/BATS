// Helper file to write values to files
import path from "path";
import { mkdir, readdir, readFile, writeFile } from "fs/promises";

export async function persist<T>(domain: string, key: string, value: T) {
  const dir = path.join(process.cwd(), "public", domain);
  const filePath = path.join(dir, `${key}.json`);
  await mkdir(dir, { recursive: true });
  await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

export async function read<T>(domain: string, key: string): Promise<T | null> {
  const dir = path.join(process.cwd(), "public", domain);
  const filePath = path.join(dir, `${key}.json`);
  const text = await readFile(filePath, "utf8").catch(() => null);
  return text ? JSON.parse(text) : null;
}

export async function readAll<T>(domain: string): Promise<T[]> {
  const dir = path.join(process.cwd(), "public", domain);
  const entries = await readdir(dir, { withFileTypes: true });
  return await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map(async (entry) => {
        const fullPath = path.join(dir, entry.name);
        const fileContent = await readFile(fullPath, "utf8");
        return JSON.parse(fileContent) as T;
      })
  );
}
