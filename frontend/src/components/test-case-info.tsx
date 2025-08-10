import { TestCase } from "@/types/testcase";
import { Card, CardTitle, CardHeader, CardContent } from "./ui/card";
import { CodeBlock, CodeBlockCopyButton } from "./ai-elements/code-block";
import Link from "next/link";
import { ExternalLink, LinkIcon } from "lucide-react";

export function TestCaseInfo({ testCase }: { testCase: TestCase }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{testCase.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">Start URL</p>
          <Link
            href={testCase.startUrl}
            target="_blank"
            className="flex items-center gap-2 truncate hover:underline"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            {testCase.startUrl}
          </Link>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Description for Agent</p>
          <CodeBlock
            code={testCase.description}
            language="text"
            showLineNumbers={true}
          >
            <CodeBlockCopyButton
              onCopy={() => console.log("Copied code to clipboard")}
              onError={() => console.error("Failed to copy code to clipboard")}
            />
          </CodeBlock>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Summary</p>
          <p className="text-sm">{testCase.summary}</p>
        </div>
      </CardContent>
    </Card>
  );
}
