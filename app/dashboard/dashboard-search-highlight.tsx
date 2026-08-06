"use client";

import { Fragment } from "react";
import {
  getWorkspaceSearchHighlightTerms,
  normalizeWorkspaceSearchKey,
} from "@/features/application/lib/workspace-search";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function DashboardSearchHighlight({
  text,
  query,
  className = "rounded bg-amber-100 px-0.5 text-slate-950",
}: {
  text: string | null | undefined;
  query: string;
  className?: string;
}) {
  if (!text) return null;

  const terms = getWorkspaceSearchHighlightTerms(query);
  if (terms.length === 0) {
    return <>{text}</>;
  }

  const normalizedText = normalizeWorkspaceSearchKey(text);
  const hasRelevantMatch = terms.some((term) => normalizedText.includes(term));

  if (!hasRelevantMatch) {
    return <>{text}</>;
  }

  const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, index) => {
        const normalizedPart = normalizeWorkspaceSearchKey(part);
        const isMatch =
          normalizedPart.length > 0 &&
          terms.some((term) => normalizedPart === term);

        return isMatch ? (
          <mark key={`${part}-${index}`} className={className}>
            {part}
          </mark>
        ) : (
          <Fragment key={`${part}-${index}`}>{part}</Fragment>
        );
      })}
    </>
  );
}
