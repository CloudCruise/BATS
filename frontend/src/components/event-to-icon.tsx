import {
  ChevronsUpDown,
  Keyboard,
  MouseIcon,
  MousePointer,
  Pointer,
  SendHorizonal,
} from "lucide-react";

export function EventToIcon({
  event,
}: {
  event: "click" | "input" | "change" | "submit";
}) {
  switch (event) {
    case "click":
      return <MousePointer className="size-4" strokeWidth={1.5} />;
    case "input":
      return <Keyboard className="size-4" strokeWidth={1.5} />;
    case "change":
      return <ChevronsUpDown className="size-4" strokeWidth={1.5} />;
    case "submit":
      return <SendHorizonal className="size-4" strokeWidth={1.5} />;
  }
}
