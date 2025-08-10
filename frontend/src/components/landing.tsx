"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUp } from "lucide-react";
import { TestCase } from "@/types/testcase";

type SavedSite = { id: string; title: string; url: string; createdAt: number };

type LandingProps = {
  onGenerate: (
    prompt: string,
    difficulty?: string,
    websiteType?: string
  ) => Promise<void>;
  onOpenExisting: (url: string) => void;
  isLoading: boolean;
};

const examplePrompts = [
  "Create a login flow that triggers an unexpected dismissible popup after submit.",
  "Add an unfamiliar custom input type (e.g., color or date-time-local) to a profile form.",
  "Build a booking form that rejects incorrectly formatted dates and shows inline errors.",
  "Design a checkout step where the credit card field lives inside an iframe {allow_iframes:true}.",
  "Render a page where all form controls use scrambled ids and class names each load (stable data-testids only).",
  "Use native selects for country and state pickers—no custom dropdowns.",
  "Implement a legacy Select2-style dropdown with unusual keyboard behavior and delayed initialization.",
  "Serve a page with unusual HTML (e.g., missing <body> tag) but functional inputs and buttons.",
  "Add a simple captcha-lite that must be solved before the final submit button enables.",
  "Hide crucial URLs in visually-hidden anchors; require the agent to read and use them.",
  "Include both file upload (PDF) and a generated file download (CSV receipt) in the flow.",
  "Use ambiguous menu naming (e.g., ‘Stuff’, ‘Things’, ‘More’) that still leads to correct sections.",
  "Add tab management with multiple content tabs and require switching to complete a task.",
  "List items in a paginated grid and require looping over each item to extract a field.",
  "Combine: after login, open a surprise survey modal, then require selecting a native country select.",
  "Combine: form with a date field (strict validation) and a legacy Select2 picker that loads late.",
  "Combine: details inside an iframe plus a hidden link URL that must be extracted to proceed {allow_iframes:true}.",
  "Combine: upload a file, process, then present a captcha-lite before allowing CSV download.",
];

export function Landing({
  onGenerate,
  onOpenExisting,
  isLoading,
}: LandingProps) {
  const [prompt, setPrompt] = useState("");
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [websiteType, setWebsiteType] = useState<string>("generic");
  const [savedTestCases, setSavedTestCases] = useState<TestCase[]>([]);

  const [placeholderPrompt, setPlaceholderPrompt] = useState("");
  const [currentExample, setCurrentExample] = useState(
    Math.floor(Math.random() * examplePrompts.length)
  );
  const [
    currentNumberOfExamplePromptCharactersShown,
    setCurrentNumberOfExamplePromptCharactersShown,
  ] = useState(0);

  useEffect(() => {
    async function loadTestCases() {
      const testCases = await fetch("/api/test-cases").then((res) =>
        res.json()
      );
      setSavedTestCases(testCases.slice(0, 3)); // Show only the 3 most recent
    }
    loadTestCases();
  }, []);

  const handleGenerate = async () => {
    await onGenerate(prompt, difficulty, websiteType);
  };

  const hasExistingTestCases = savedTestCases.length > 0;

  useEffect(() => {
    // Typing effect for the example prompt
    const examplePrompt = examplePrompts[currentExample];
    const typingSpeed = 20; // Characters per second
    const interval = setInterval(async () => {
      setPlaceholderPrompt(
        examplePrompt.slice(0, currentNumberOfExamplePromptCharactersShown)
      );
      setCurrentNumberOfExamplePromptCharactersShown((prev) => prev + 1);
      if (currentNumberOfExamplePromptCharactersShown >= examplePrompt.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setCurrentExample(Math.floor(Math.random() * examplePrompts.length));
        setCurrentNumberOfExamplePromptCharactersShown(0);
      }
    }, typingSpeed);
    return () => clearInterval(interval);
  }, [currentExample, currentNumberOfExamplePromptCharactersShown]);

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#0d1b2a] via-[#0f2742] to-[#1b1f3a]" />
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(800px 300px at 20% 0%, rgba(255,255,255,0.12), transparent 70%), radial-gradient(800px 300px at 80% 0%, rgba(255,255,255,0.08), transparent 70%)",
        }}
      />
      <div className="min-h-screen flex flex-col items-center justify-center gap-12 p-6 text-center text-white relative">
        {/* Flying bats animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="bat-animation bat-1">🦇</div>
          <div className="bat-animation bat-2">🦇</div>
          <div className="bat-animation bat-3">🦇</div>
          <div className="bat-animation bat-4">🦇</div>
          <div className="bat-animation bat-5">🦇</div>
        </div>

        <div className="space-y-6 z-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-6xl">🦇</span>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
              Introducing BATS
            </h1>
            <span className="text-6xl">🦇</span>
          </div>
          <p className="text-white/90 max-w-2xl text-lg leading-relaxed">
            Describe a website scenario to test your browser agents, and
            we&apos;ll generate it locally for you to iterate on.
          </p>
        </div>

        <div className="w-full max-w-3xl flex flex-col gap-6 z-10">
          <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-4 md:p-6 shadow-2xl">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!isLoading) handleGenerate();
                }
              }}
              rows={1}
              className="min-h-[48px] w-full resize-none bg-transparent px-1 py-2 text-base outline-none placeholder:text-white/70 text-white overflow-hidden"
              placeholder={placeholderPrompt}
              style={{ height: "auto" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = target.scrollHeight + "px";
              }}
            />

            {/* Bottom bar: two dropdowns on the left, send button on the right */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="h-9 rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/15">
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">🟢 Easy</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="hard">🔴 Hard</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={websiteType} onValueChange={setWebsiteType}>
                  <SelectTrigger className="h-9 rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/15">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="generic">🌐 Generic</SelectItem>
                    <SelectItem value="insurance">🛡️ Insurance</SelectItem>
                    <SelectItem value="healthcare">🏥 Healthcare</SelectItem>
                    <SelectItem value="ecommerce">🛒 E-commerce</SelectItem>
                    <SelectItem value="banking">🏦 Banking</SelectItem>
                    <SelectItem value="education">🎓 Education</SelectItem>
                    <SelectItem value="government">🏛️ Government</SelectItem>
                    <SelectItem value="travel">✈️ Travel</SelectItem>
                    <SelectItem value="real-estate">🏠 Real Estate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="button"
                size="icon"
                className="rounded-xl h-9 w-9 md:h-10 md:w-10 bg-white text-black hover:bg-white/90"
                aria-label="Send"
                disabled={isLoading || !prompt.trim()}
                onClick={handleGenerate}
              >
                <ArrowUp className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {hasExistingTestCases && (
          <div className="w-full max-w-3xl z-10">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 shadow-xl">
              <h3 className="text-xl font-semibold mb-6 text-white/95 flex items-center gap-2">
                <span>🧪</span>
                Recent test cases
              </h3>
              <div className="flex flex-col gap-2">
                {savedTestCases.map((testCase) => (
                  <button
                    key={testCase.id}
                    onClick={() => onOpenExisting(testCase.pageUrl)}
                    className="cursor-pointer flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 text-left border border-white/10 hover:border-white/20 group w-full"
                  >
                    <div className="w-full overflow-hidden">
                      <div className="flex justify-between">
                        <div>{testCase.name}</div>
                        <div className="text-xs text-white/50">
                          {new Date(testCase.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-xs text-white/60 mt-1 truncate">
                        {testCase.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {savedTestCases.length >= 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenExisting(savedTestCases[0].pageUrl)}
                  className="mt-4 text-white/70 hover:text-white hover:bg-white/10 w-full"
                >
                  View all websites →
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
