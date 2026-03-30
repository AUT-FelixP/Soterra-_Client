"use client";

import { useMemo, useState } from "react";
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
  BuildingOffice2Icon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  HomeIcon,
  LightBulbIcon,
  MapPinIcon,
  PresentationChartLineIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { classNames } from "@/lib/classNames";
import { AUTH_STORAGE_KEY } from "@/lib/auth";

const navigation = [
  { name: "Overview", href: "/app", icon: HomeIcon },
  { name: "Company", href: "/app/company", icon: BuildingOffice2Icon },
  { name: "Live tracker", href: "/app/tracker", icon: MapPinIcon },
  { name: "Performance", href: "/app/performance", icon: PresentationChartLineIcon },
  { name: "Insights", href: "/app/insights", icon: LightBulbIcon },
  { name: "Risk", href: "/app/risk", icon: ExclamationTriangleIcon },
  { name: "Settings", href: "/app/settings", icon: Cog6ToothIcon },
];

const breadcrumbMap = new Map([
  ["/app", "Overview"],
  ["/app/company", "Company"],
  ["/app/tracker", "Live tracker"],
  ["/app/performance", "Performance"],
  ["/app/insights", "Insights"],
  ["/app/risk", "Risk"],
  ["/app/settings", "Settings"],
]);

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    router.push("/");
  }

  const breadcrumbs = useMemo(() => {
    let label = breadcrumbMap.get(pathname) ?? "Overview";

    if (pathname.startsWith("/app/company/")) {
      label = "Project";
    }

    return [
      { name: "App", href: "/app", current: pathname === "/app" },
      { name: label, href: pathname, current: true },
    ];
  }, [pathname]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
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

            <div className="relative flex grow flex-col gap-y-6 overflow-y-auto bg-white px-6 pb-6 dark:bg-gray-900 dark:before:pointer-events-none dark:before:absolute dark:before:inset-0 dark:before:border-r dark:before:border-white/10 dark:before:bg-black/10">
              <div className="relative flex h-16 shrink-0 items-center">
                <span className="brand-glow text-lg font-semibold text-gray-900 dark:text-white">
                  Soterra
                </span>
              </div>
              <nav className="relative flex flex-1 flex-col">
                <ul role="list" className="space-y-2">
                  {navigation.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/app" && pathname.startsWith(item.href));
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={classNames(
                            isActive
                              ? "bg-gray-100 text-gray-900 dark:bg-white/10 dark:text-white"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white",
                            "group flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-semibold"
                          )}
                        >
                          <item.icon
                            aria-hidden="true"
                            className={classNames(
                              isActive
                                ? "text-indigo-600 dark:text-indigo-300"
                                : "text-gray-400 group-hover:text-indigo-600 dark:text-gray-500 dark:group-hover:text-indigo-300",
                              "size-5 shrink-0"
                            )}
                          />
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
        <div className="relative flex grow flex-col gap-y-6 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-6 dark:border-white/10 dark:bg-gray-950 dark:before:pointer-events-none dark:before:absolute dark:before:inset-0 dark:before:bg-black/10">
          <div className="relative flex h-16 shrink-0 items-center">
            <span className="brand-glow text-lg font-semibold text-gray-900 dark:text-white">
              Soterra
            </span>
          </div>
          <nav className="relative flex flex-1 flex-col">
            <ul role="list" className="space-y-2">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/app" && pathname.startsWith(item.href));
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={classNames(
                        isActive
                          ? "bg-gray-100 text-gray-900 dark:bg-white/10 dark:text-white"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white",
                        "group flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-semibold"
                      )}
                    >
                      <item.icon
                        aria-hidden="true"
                        className={classNames(
                          isActive
                            ? "text-indigo-600 dark:text-indigo-300"
                            : "text-gray-400 group-hover:text-indigo-600 dark:text-gray-500 dark:group-hover:text-indigo-300",
                          "size-5 shrink-0"
                        )}
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-40 flex items-center gap-x-4 border-b border-gray-200 bg-white/95 px-4 py-4 shadow-sm backdrop-blur sm:px-6 lg:px-8 dark:border-white/10 dark:bg-gray-950/95 dark:shadow-none">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="-m-2.5 p-2.5 text-gray-600 lg:hidden dark:text-gray-300"
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon aria-hidden="true" className="size-6" />
          </button>

          <nav aria-label="Breadcrumb" className="flex flex-1 items-center">
            <ol className="flex items-center space-x-3 text-sm">
              <li className="flex items-center">
                <Link
                  href="/app"
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  <HomeIcon aria-hidden="true" className="size-4" />
                  <span className="sr-only">App</span>
                </Link>
              </li>
              {breadcrumbs.map((page) => (
                <li key={page.name} className="flex items-center">
                  <svg
                    viewBox="0 0 24 44"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                    className="h-5 w-4 shrink-0 text-gray-200 dark:text-white/10"
                  >
                    <path d="M.293 0l22 22-22 22h1.414l22-22-22-22H.293z" />
                  </svg>
                  <span
                    className={classNames(
                      page.current
                        ? "ml-3 font-semibold text-gray-900 dark:text-white"
                        : "ml-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    )}
                    aria-current={page.current ? "page" : undefined}
                  >
                    {page.name}
                  </span>
                </li>
              ))}
            </ol>
          </nav>

          <Menu as="div" className="relative">
            <MenuButton className="flex items-center gap-3 rounded-full text-sm font-semibold text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-white dark:focus-visible:outline-indigo-500">
              <span className="sr-only">Open user menu</span>
              <span className="inline-flex size-9 items-center justify-center rounded-full bg-indigo-600 text-white">
                SC
              </span>
              <span className="hidden text-sm font-semibold text-gray-900 sm:block dark:text-white">
                Sam Carter
              </span>
            </MenuButton>
            <MenuItems
              transition
              className="absolute right-0 z-10 mt-3 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg outline outline-black/5 transition data-closed:scale-95 data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in dark:bg-gray-900 dark:shadow-none dark:outline-white/10"
            >
              <MenuItem>
                <Link
                  href="/app/settings"
                  className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-50 data-focus:text-gray-900 data-focus:outline-hidden dark:text-gray-300 dark:data-focus:bg-white/5 dark:data-focus:text-white"
                >
                  Account settings
                </Link>
              </MenuItem>
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

        <main className="px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
