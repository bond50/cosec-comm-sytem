"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MeetingPrintToolbar() {
  return (
    <div className="mx-auto flex max-w-4xl justify-end px-10 pb-4 pt-6 print:hidden">
      <Button
        type="button"
        onClick={() => window.print()}
        className="gap-2 rounded-xl"
      >
        <Printer className="h-4 w-4" />
        Print
      </Button>
    </div>
  );
}
