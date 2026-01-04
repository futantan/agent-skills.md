import { Workflow } from "lucide-react";
import Link from "next/link";

export function SiteLogo() {
  return (
    <Link className="group inline-flex items-center gap-3" href="/">
      <span className="bg-black rounded-full size-7 flex items-center justify-center">
        <Workflow className="relative h-4 w-4 text-white" />
      </span>

      <span className="flex flex-col leading-none">
        <span className="text-base font-semibold tracking-tight text-foreground">
          Agent-Skills.md
        </span>
      </span>
    </Link>
  );
}
