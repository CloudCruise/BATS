import { cn } from "@/lib/utils";
import { TestCase } from "@/types/testcase";
import { useRouter } from "next/navigation";

export function TestCaseBubble({
  key,
  testCase,
  onOpenExisting,
  backgroundTransparent = true,
}: {
  key: string;
  testCase: TestCase;
  onOpenExisting?: (pageUrl: string) => void;
  backgroundTransparent?: boolean;
}) {
  const router = useRouter();

  return (
    <button
      key={key}
      onClick={() => {
        if (onOpenExisting) {
          onOpenExisting(testCase.pageUrl);
        } else {
          router.push(`/test-cases/${testCase.id}`);
        }
      }}
      className={cn(
        "cursor-pointer flex items-center justify-between p-4 rounded-xl transition-all duration-200 text-left  group w-full",
        backgroundTransparent &&
          "border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 ",
        !backgroundTransparent && "bg-white/5 border border-muted shadow"
      )}
    >
      <div className="w-full overflow-hidden">
        <div className="flex justify-between">
          <div>{testCase.name}</div>
          <div
            className={cn(
              "text-xs",
              backgroundTransparent && "text-white/50",
              !backgroundTransparent && "text-black/50"
            )}
          >
            {new Date(testCase.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div
          className={cn(
            "text-xs truncate",
            backgroundTransparent && "text-white/60",
            !backgroundTransparent && "text-black/60"
          )}
        >
          {testCase.description}
        </div>
      </div>
    </button>
  );
}
