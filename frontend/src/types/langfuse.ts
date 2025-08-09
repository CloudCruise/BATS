export interface LangfusePrompt {
  id: string;
  name: string;
  version: number;
  type: "text";
  prompt: string;
  config?: Record<string, unknown>;
  labels: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePromptRequest {
  name: string;
  prompt: string;
  labels?: string[];
  config?: Record<string, unknown>;
}

export interface CompilePromptRequest {
  name: string;
  variables: Record<string, string>;
} 