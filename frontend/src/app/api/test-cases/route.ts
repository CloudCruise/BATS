import { readdir, readFile } from "fs/promises";
import path from "path";

export async function GET() {
  const testCases = await getTestCases();
  return new Response(JSON.stringify(testCases), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

async function getTestCases() {
  const dir = path.join(process.cwd(), "public", "generated_test_cases");
  const entries = await readdir(dir, { withFileTypes: true });
  const testCases = entries.filter(
    (entry) => entry.isFile() && entry.name.endsWith(".json")
  );
  return await Promise.all(
    testCases.map(async (file) => {
      const fullPath = path.join(dir, file.name);
      const fileContent = await readFile(fullPath, "utf8");
      return JSON.parse(fileContent);
    })
  );
}
