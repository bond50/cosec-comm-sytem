"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type CorrespondenceDetailTab = {
  id: string;
  label: string;
  content: ReactNode;
};

type CorrespondenceDetailTabsProps = {
  tabs: CorrespondenceDetailTab[];
};

export function CorrespondenceDetailTabs({
  tabs,
}: CorrespondenceDetailTabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? "");
  const activeContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <section className="rounded-2xl border border-[#c7ddea] bg-[#f3f9fc] shadow-sm">
      <div className="flex gap-1 overflow-x-auto border-b border-[#c7ddea] px-4 pt-4">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              type="button"
              className={cn(
                "whitespace-nowrap rounded-t-xl border border-transparent px-4 py-2 text-sm font-semibold text-slate-500 transition",
                isActive
                  ? "border-[#c7ddea] border-b-[#fbfdff] bg-[#fbfdff] text-[#124f7d]"
                  : "text-slate-600 hover:bg-[#e6f1f8] hover:text-[#124f7d]",
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="space-y-4 bg-[#fbfdff] px-4 py-4 sm:px-5 [&_.shadow-sm]:shadow-none">
        {activeContent}
      </div>
    </section>
  );
}
