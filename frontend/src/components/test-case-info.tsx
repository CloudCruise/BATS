import { TestCase } from "@/types/testcase";
import { Card, CardTitle, CardHeader, CardContent } from "./ui/card";

export function TestCaseInfo({ testCase }: { testCase: TestCase }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{testCase.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">Description</p>
            <p className="text-sm">{testCase.description}</p>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Summary</p>
          <p className="text-sm">{testCase.summary}</p>
        </div>
      </CardContent>
    </Card>
  );
}
