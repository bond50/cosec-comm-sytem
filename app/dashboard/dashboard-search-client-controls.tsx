"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck } from "lucide-react";
import {
  recordWorkspaceSearchAction,
  saveWorkspaceSearchAction,
} from "@/features/application/lib/workspace-search-history-actions";

type DashboardSearchClientControlsProps = {
  query: string;
  initiallySaved: boolean;
  resultHrefs: string[];
};

export function DashboardSearchClientControls({
  query,
  initiallySaved,
  resultHrefs,
}: DashboardSearchClientControlsProps) {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isPending, startTransition] = useTransition();

  const dedupedHrefs = useMemo(
    () => Array.from(new Set(resultHrefs)),
    [resultHrefs],
  );

  useEffect(() => {
    if (!query.trim()) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("query", query);
      await recordWorkspaceSearchAction({ ok: false, message: "" }, formData);
    });
  }, [query]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isEditable =
        event.target instanceof HTMLElement &&
        (event.target.tagName === "INPUT" ||
          event.target.tagName === "TEXTAREA" ||
          event.target.isContentEditable);

      if (isEditable) return;

      if (event.key === "Escape") {
        event.preventDefault();
        router.push("/dashboard");
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        const nextIndex = Math.min(
          selectedIndex + 1,
          Math.max(dedupedHrefs.length - 1, 0),
        );
        setSelectedIndex(nextIndex);
        const nextLink = document.querySelectorAll<HTMLElement>(
          "[data-search-result='true']",
        )[nextIndex];
        nextLink?.focus();
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        const nextIndex = Math.max(selectedIndex - 1, 0);
        setSelectedIndex(nextIndex);
        const nextLink = document.querySelectorAll<HTMLElement>(
          "[data-search-result='true']",
        )[nextIndex];
        nextLink?.focus();
      }

      if (event.key === "Enter" && selectedIndex >= 0) {
        event.preventDefault();
        const nextLink = document.querySelectorAll<HTMLAnchorElement>(
          "[data-search-result='true']",
        )[selectedIndex];
        nextLink?.click();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dedupedHrefs.length, router, selectedIndex]);

  function toggleSaved() {
    startTransition(async () => {
      const nextSaved = !initiallySaved;
      const formData = new FormData();
      formData.set("query", query);
      formData.set("isSaved", String(nextSaved));
      const result = await saveWorkspaceSearchAction(
        { ok: false, message: "" },
        formData,
      );

      if (result.ok) {
        router.refresh();
      }
    });
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={toggleSaved}
      className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {initiallySaved ? (
        <BookmarkCheck className="h-4 w-4 text-[#1868a6]" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
      {initiallySaved ? "Saved search" : "Save search"}
    </button>
  );
}
