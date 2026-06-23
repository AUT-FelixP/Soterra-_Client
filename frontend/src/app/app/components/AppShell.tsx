"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  TransitionChild,
} from "@headlessui/react";
import {
  Bars3Icon,
  ChartBarSquareIcon,
  CircleStackIcon,
  Cog6ToothIcon,
  HomeIcon,
  SparklesIcon,
  Squares2X2Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { classNames } from "@/lib/classNames";
import { AUTH_STORAGE_KEY } from "@/lib/auth";
import type { PublicAppSession } from "@/lib/auth";
import AnimatedAppBackground from "./AnimatedAppBackground";

const navigation = [
  { id: "overview", name: "Dashboard", href: "/app", icon: Squares2X2Icon },
  { id: "repository", name: "Repository", href: "/app/repository", icon: CircleStackIcon },
  { id: "soterra-ai", name: "Soterra AI", href: "/app/soterra-ai", icon: SparklesIcon },
  { id: "insights", name: "Insights", href: "/app/insights", icon: ChartBarSquareIcon },
  { id: "settings", name: "Settings", href: "/app/settings", icon: Cog6ToothIcon },
] as const;

const breadcrumbMap = new Map([
  ["/app", "Dashboard"],
  ["/app/repository", "Repository"],
  ["/app/soterra-ai", "Soterra AI"],
  ["/app/insights", "Insights"],
  ["/app/settings", "Settings"],
]);

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [session, setSession] = useState<PublicAppSession | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (active) setSession(payload?.user ?? null);
      })
      .catch(() => null);
    return () => {
      active = false;
    };
  }, []);

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    router.push("/");
  }

  const breadcrumbs = useMemo(() => {
    let label = breadcrumbMap.get(pathname) ?? "Overview";
    let parentHref = pathname;

    if (pathname.startsWith("/app/company/")) {
      label = "Project";
      parentHref = "/app/company";
    }

    if (pathname.startsWith("/app/reports/")) {
      label = "Repository report";
      parentHref = "/app/repository";
    }

    return [
      { name: "App", href: "/app", current: pathname === "/app" },
      { name: label, href: parentHref, current: true },
    ];
  }, [pathname]);

  const visibleNavigation = navigation;
  const initials = (session?.name ?? "Soterra Client")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "SC";

  return (
    <div className="app-shell relative min-h-screen overflow-hidden bg-white text-slate-950 dark:bg-[#050505] dark:text-white">
      <AnimatedAppBackground />

      <Dialog
        open={sidebarOpen}
        onClose={setSidebarOpen}
        className="relative z-50 lg:hidden"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-closed:opacity-0"
        />

        <div className="fixed inset-0 flex">
          <DialogPanel
            transition
            className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
          >
            <TransitionChild>
              <div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="-m-2.5 p-2.5"
                >
                  <span className="sr-only">Close sidebar</span>
                  <XMarkIcon aria-hidden="true" className="size-6 text-white" />
                </button>
              </div>
            </TransitionChild>

            <div className="relative flex grow flex-col gap-y-5 overflow-y-auto border-r border-black/10 bg-white/70 px-6 pb-2 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-black/[0.78] dark:before:pointer-events-none dark:before:absolute dark:before:inset-0 dark:before:border-r dark:before:border-white/10 dark:before:bg-black/[0.18]">
              <div className="relative flex h-16 shrink-0 items-center">
                <Link href="/app" className="flex items-center gap-3">
                  <span className="brand-mark size-9 rounded-xl text-sm font-semibold text-white">
                    S
                  </span>
                  <span className="text-base font-semibold tracking-tight text-gray-900 dark:text-white">
                    Soterra
                  </span>
                </Link>
              </div>
              <nav className="relative flex flex-1 flex-col">
                <ul role="list" className="-mx-2 space-y-1">
                  {visibleNavigation.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/app" && pathname.startsWith(item.href));
                    return (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          className={classNames(
                            isActive
                              ? "bg-slate-100 text-slate-950 ring-1 ring-slate-200 dark:bg-white/[0.055] dark:text-white dark:ring-white/[0.07]"
                              : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.035] dark:hover:text-white",
                            "group flex items-center gap-x-3 rounded-lg px-2 py-1.5 text-sm/6 font-semibold transition-all"
                          )}
                        >
                          <span
                            className={classNames(
                              isActive
                                ? "border-indigo-500/30 bg-indigo-500/12 text-indigo-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] dark:text-indigo-300"
                                : "border-slate-200/80 bg-white/60 text-slate-400 group-hover:border-slate-300 group-hover:text-slate-700 dark:border-white/[0.065] dark:bg-white/[0.025] dark:text-slate-500 dark:group-hover:border-white/10 dark:group-hover:text-slate-300",
                              "flex size-8 shrink-0 items-center justify-center rounded-lg border transition-colors"
                            )}
                          >
                            <item.icon aria-hidden="true" strokeWidth={1.8} className="size-[18px]" />
                          </span>
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="relative flex grow flex-col gap-y-5 overflow-y-auto border-r border-black/10 bg-white/70 px-6 shadow-[0_0_70px_rgba(0,0,0,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-black/75 dark:shadow-[0_0_80px_rgba(0,0,0,0.72)] dark:before:pointer-events-none dark:before:absolute dark:before:inset-0 dark:before:bg-black/[0.18]">
          <div className="relative flex h-16 shrink-0 items-center">
            <Link href="/app" className="flex items-center gap-3">
              <span className="brand-mark size-9 rounded-xl text-sm font-semibold text-white">
                S
              </span>
              <span className="text-base font-semibold tracking-tight text-gray-900 dark:text-white">
                Soterra
              </span>
            </Link>
          </div>
          <nav className="relative flex flex-1 flex-col">
            <ul role="list" className="-mx-2 space-y-1">
              {visibleNavigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/app" && pathname.startsWith(item.href));
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={classNames(
                        isActive
                          ? "bg-slate-100 text-slate-950 ring-1 ring-slate-200 dark:bg-white/[0.055] dark:text-white dark:ring-white/[0.07]"
                          : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.035] dark:hover:text-white",
                        "group flex items-center gap-x-3 rounded-lg px-2 py-1.5 text-sm/6 font-semibold transition-all"
                      )}
                    >
                      <span
                        className={classNames(
                          isActive
                            ? "border-indigo-500/30 bg-indigo-500/12 text-indigo-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] dark:text-indigo-300"
                            : "border-slate-200/80 bg-white/60 text-slate-400 group-hover:border-slate-300 group-hover:text-slate-700 dark:border-white/[0.065] dark:bg-white/[0.025] dark:text-slate-500 dark:group-hover:border-white/10 dark:group-hover:text-slate-300",
                          "flex size-8 shrink-0 items-center justify-center rounded-lg border transition-colors"
                        )}
                      >
                        <item.icon aria-hidden="true" strokeWidth={1.8} className="size-[18px]" />
                      </span>
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>

      <div className="relative z-10 lg:pl-72">
        <header className="sticky top-0 z-40 flex items-center gap-x-4 border-b border-black/10 bg-white/72 px-4 py-3 shadow-sm shadow-black/5 backdrop-blur-2xl sm:px-6 lg:px-8 dark:border-white/10 dark:bg-[#050505]/80 dark:shadow-none">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="relative -m-2.5 p-2.5 text-gray-700 lg:hidden dark:text-gray-400"
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon aria-hidden="true" className="size-6" />
          </button>

          <nav aria-label="Breadcrumb" className="flex flex-1 items-center overflow-x-auto">
            <ol className="flex items-center gap-2 text-sm/6 whitespace-nowrap">
              <li className="flex items-center">
                <Link
                  href="/app"
                  className="rounded-md p-1 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-white/5 dark:hover:text-gray-300"
                >
                  <HomeIcon aria-hidden="true" className="size-4" />
                  <span className="sr-only">App</span>
                </Link>
              </li>
              {breadcrumbs.map((page) => (
                <li key={page.name} className="flex items-center gap-2">
                  <span className="text-slate-300 dark:text-white/20" aria-hidden="true">
                    /
                  </span>
                  {page.current ? (
                    <span
                      className="font-semibold text-gray-900 dark:text-white"
                      aria-current="page"
                    >
                      {page.name}
                    </span>
                  ) : (
                    <Link
                      href={page.href}
                      className="rounded-md px-1.5 py-1 text-gray-500 transition hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
                    >
                      {page.name}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          <Menu as="div" className="relative">
            <MenuButton className="flex items-center gap-3 rounded-full text-sm/6 font-semibold text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-white dark:focus-visible:outline-indigo-500">
              <span className="sr-only">Open user menu</span>
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                {initials}
              </span>
              <span className="hidden text-sm/6 font-semibold text-gray-900 sm:block dark:text-white">
                {session?.name ?? "Soterra Client"}
              </span>
            </MenuButton>
            <MenuItems
              transition
              className="absolute right-0 z-10 mt-3 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg outline outline-black/5 transition data-closed:scale-95 data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in dark:bg-[#0b0b0c] dark:shadow-none dark:outline-white/10"
            >
              <MenuItem>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-50 data-focus:text-gray-900 data-focus:outline-hidden dark:text-gray-300 dark:data-focus:bg-white/5 dark:data-focus:text-white"
                >
                  Sign out
                </button>
              </MenuItem>
            </MenuItems>
          </Menu>
        </header>

        <main className="relative px-4 py-6 sm:px-6 lg:px-8 lg:py-6">{children}</main>
      </div>
    </div>
  );
}
