import { LoaderCircle, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="flex items-center gap-4 px-6 py-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e6f1f8] text-[#1868a6]">
            <Search className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">
              Workspace search
            </p>
            <div className="mt-2 flex items-center gap-3 text-slate-900">
              <LoaderCircle className="h-4 w-4 animate-spin text-[#1868a6]" />
              <span className="text-base font-semibold">
                Loading results...
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Resolving the current organization workspace and preparing ranked
              results.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <Card key={item} className="border-slate-200 shadow-sm">
            <CardContent className="space-y-4 px-6 py-6">
              <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
              <div className="h-6 w-3/4 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
