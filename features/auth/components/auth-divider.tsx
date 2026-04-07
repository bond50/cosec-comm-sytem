import { Separator } from "@/components/ui/separator";

export function AuthDivider({
  label = "Or continue with",
}: {
  label?: string;
}) {
  return (
    <div className="flex w-full items-center gap-3 py-0">
      <Separator className="flex-1" />
      <span className="text-[10px] font-normal uppercase tracking-[0.08em] text-slate-300">
        {label}
      </span>
      <Separator className="flex-1" />
    </div>
  );
}
