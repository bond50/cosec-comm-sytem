"use client";

import { usePathname } from "next/navigation";

type DashboardHeaderMeta = {
  eyebrow: string;
  title: string;
  description: string;
};

function getDashboardHeaderMeta(pathname: string): DashboardHeaderMeta {
  if (pathname === "/dashboard") {
    return {
      eyebrow: "Overview",
      title: "Dashboard",
      description:
        "Protected access point for the authenticated business area.",
    };
  }

  if (pathname === "/dashboard/organization/setup") {
    return {
      eyebrow: "Organizations",
      title: "Organization Setup",
      description: "Create the first active organization for this account.",
    };
  }

  if (pathname === "/dashboard/members") {
    return {
      eyebrow: "Users",
      title: "Members",
      description: "View organization memberships, roles, and assignments.",
    };
  }

  if (pathname === "/dashboard/members/add") {
    return {
      eyebrow: "Users",
      title: "Add Member",
      description:
        "Add an existing user into the current organization with an active membership.",
    };
  }

  if (pathname === "/dashboard/departments") {
    return {
      eyebrow: "Departments",
      title: "Departments",
      description:
        "Review organization departments and their current structure.",
    };
  }

  if (/^\/dashboard\/departments\/[^/]+\/members$/.test(pathname)) {
    return {
      eyebrow: "Departments",
      title: "Assign Members",
      description: "Assign organization members into the selected department.",
    };
  }

  if (/^\/dashboard\/departments\/[^/]+\/head$/.test(pathname)) {
    return {
      eyebrow: "Departments",
      title: "Assign Department Head",
      description:
        "Choose the active organization member leading this department.",
    };
  }

  if (/^\/dashboard\/departments\/[^/]+$/.test(pathname)) {
    return {
      eyebrow: "Departments",
      title: "Department Details",
      description: "Review department information, head, and assigned members.",
    };
  }

  return {
    eyebrow: "Business Area",
    title: "Authenticated Area",
    description: "Manage organization-scoped business modules from this shell.",
  };
}

export function DashboardHeaderTitle() {
  const pathname = usePathname();
  const meta = getDashboardHeaderMeta(pathname);

  return (
    <div className="min-w-0 space-y-0.5 xl:hidden">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {meta.eyebrow}
      </p>
      <h1 className="truncate text-[1.15rem] font-semibold tracking-[-0.03em] text-slate-950">
        {meta.title}
      </h1>
      <p className="hidden max-w-2xl truncate text-[0.82rem] text-slate-500 lg:block">
        {meta.description}
      </p>
    </div>
  );
}
