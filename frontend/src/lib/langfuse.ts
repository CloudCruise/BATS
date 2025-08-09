import { Langfuse } from "langfuse";

export class CcError extends Error {
  public readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = "CcError";
    this.code = code;
  }
}

export async function fetchAndCompilePrompt(
  promptId: string,
  options?: {
    args?: Record<string, unknown>;
    promptVersion?: string;
  }
): Promise<string> {
  const promptVersion = options?.promptVersion ?? "latest";

  const langfuse = new Langfuse();
  const fetched = await langfuse.getPrompt(promptId, undefined, { label: promptVersion });

  // If no args provided, return raw text prompt (Langfuse text prompt expected)
  if (!options?.args) {
    return (fetched as { prompt: string }).prompt;
  }

  const promptText = (fetched as { prompt: string }).prompt;
  const args = options.args;

  const templateVariables = promptText.match(/{{(\w+)}}/g);
  const missingVariables =
    templateVariables
      ?.map((variable) => variable.slice(2, -2))
      ?.filter((variable) => (args as Record<string, unknown>)[variable] === undefined) ?? [];

  if (missingVariables.length > 0) {
    throw new CcError(`Missing template variables: ${missingVariables.join(", ")}`, "SERVER-E0002");
  }

  const stringifiedArgs = Object.fromEntries(
    Object.entries(args).map(([key, value]) => [
      key,
      typeof value === "object" && value !== null ? JSON.stringify(value, null, 2) : (value as unknown),
    ])
  ) as Record<string, string>;

  return (fetched as { compile: (vars: Record<string, string>) => string }).compile(stringifiedArgs);
}
