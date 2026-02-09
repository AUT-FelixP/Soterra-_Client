import Link from "next/link";
import FinalCta from "./components/FinalCta";

const navLinks = [
  { label: "Product", href: "#product" },
  { label: "Solutions", href: "#solutions" },
  { label: "Pricing", href: "#pricing" },
  { label: "Resources", href: "#resources" },
  { label: "Contact", href: "/contact" },
];

const valueBullets = [
  "Spot repeat inspection failures before they happen.",
  "Prioritize the few issues driving most rework.",
  "Give site teams clear, actionable QA guidance.",
];

const featureCards = [
  {
    title: "AI extraction from inspection reports",
    description:
      "Normalize unstructured inspection notes into structured, searchable insights.",
    icon: "AI",
  },
  {
    title: "Risk scoring & trend analysis",
    description:
      "Surface high‑risk patterns across trades, sites, and timeframes.",
    icon: "RS",
  },
  {
    title: "Portfolio dashboard for sites/projects",
    description:
      "Track inspection health across the entire portfolio with a single view.",
    icon: "PD",
  },
  {
    title: "Exportable reporting for stakeholders",
    description:
      "Share clear summaries with owners, consultants, and delivery teams.",
    icon: "ER",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-full bg-white dark:bg-gray-900">
      <header className="border-b border-gray-200 bg-white dark:border-white/10 dark:bg-gray-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div className="brand-glow text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl dark:text-white">
            Soterra
          </div>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-gray-600 md:flex dark:text-gray-300">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="transition hover:text-gray-900 dark:hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-3 sm:flex">
            <Link
              href="/login"
              className="rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20"
            >
              Login
            </Link>
            <Link
              href="/contact"
              className="rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
            >
              Request a Demo
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <section className="flex flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">
            Construction intelligence
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-gray-900 sm:text-5xl dark:text-white">
            Make inspection outcomes predictable.
          </h1>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-300">
            Soterra turns inspection history into focused insight reports so you
            know what fails, why it repeats, and what to fix first. Give teams a
            QA workflow that keeps projects moving and reduces rework.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-gray-600 dark:text-gray-300">
            {valueBullets.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1 size-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/contact"
              className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
            >
              Request a Demo
            </Link>
          </div>
        </section>
      </main>

      <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200 pb-5 dark:border-white/10">
          <div className="sm:flex sm:items-baseline sm:justify-between">
            <div className="sm:w-0 sm:flex-1">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                What Soterra does
              </h2>
              <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
                Core capabilities that power inspection outcomes.
              </p>
            </div>
          </div>
        </div>

        <ul
          role="list"
          className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {featureCards.map((feature) => (
            <li
              key={feature.title}
              className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow-sm dark:divide-white/10 dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10"
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-indigo-600 text-base font-semibold text-white dark:bg-indigo-500">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200 pb-5 dark:border-white/10">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            How it works
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            A simple four-step flow from raw inspections to shared insights.
          </p>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: "01",
              title: "Upload reports",
              description:
                "Drop in inspection PDFs, notes, and photos from any project.",
            },
            {
              step: "02",
              title: "Extract data with AI",
              description:
                "Turn unstructured findings into structured, searchable records.",
            },
            {
              step: "03",
              title: "Review risks & trends",
              description:
                "Spot repeat failures and trade-level patterns in minutes.",
            },
            {
              step: "04",
              title: "Share insights",
              description:
                "Send clear summaries to owners, consultants, and site leads.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="flex h-full flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900/40 dark:shadow-none"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white shadow-sm dark:bg-indigo-500">
                  {item.step}
                </span>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  {item.title}
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200 pb-5 dark:border-white/10">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Built for
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tailored workflows for the teams shaping safer, smarter projects.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "Construction companies",
              bullets: [
                "Standardize QA across every site and trade.",
                "Reduce rework by prioritizing repeat defects.",
                "Keep PMs aligned with real-time inspection insights.",
              ],
              href: "#product",
            },
            {
              title: "Councils & asset owners",
              bullets: [
                "Track portfolio-wide risk exposure in one view.",
                "Audit inspection outcomes against compliance goals.",
                "Share executive-ready summaries with stakeholders.",
              ],
              href: "#solutions",
            },
            {
              title: "Engineering & safety teams",
              bullets: [
                "Surface high-risk patterns before incidents occur.",
                "Turn site notes into structured, searchable data.",
                "Report trends clearly across disciplines and sites.",
              ],
              href: "#resources",
            },
          ].map((segment) => (
            <div
              key={segment.title}
              className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900/40 dark:shadow-none"
            >
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {segment.title}
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                {segment.bullets.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 size-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link
                  href={segment.href}
                  className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20"
                >
                  Learn more
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-gray-200 bg-gray-50/80 dark:border-white/10 dark:bg-gray-900/70">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">
                Proof at scale
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-gray-900 sm:text-3xl dark:text-white">
                Enterprise-grade impact across inspection programs.
              </h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Updated weekly from active client portfolios.
            </p>
          </div>

          <dl className="mt-10 grid grid-cols-1 divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-4 dark:divide-white/10 dark:border-white/10 dark:bg-gray-900/60 dark:shadow-none">
            {[
              { name: "Reports processed", stat: "128,000+" },
              { name: "Issues identified", stat: "24,600" },
              { name: "Time saved", stat: "42%" },
              { name: "Projects monitored", stat: "860" },
            ].map((item) => (
              <div key={item.name} className="px-6 py-6">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {item.name}
                </dt>
                <dd className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
                  {item.stat}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <FinalCta />

      <footer className="border-t border-gray-200 bg-white dark:border-white/10 dark:bg-gray-900">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
                Soterra
              </div>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                Predict inspection risk and accelerate corrective action with
                AI-powered insight workflows.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-900 dark:text-white">
                Product
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <li>
                  <Link
                    href="#product"
                    className="transition hover:text-gray-900 dark:hover:text-white"
                  >
                    Platform overview
                  </Link>
                </li>
                <li>
                  <Link
                    href="#solutions"
                    className="transition hover:text-gray-900 dark:hover:text-white"
                  >
                    Solutions
                  </Link>
                </li>
                <li>
                  <Link
                    href="#pricing"
                    className="transition hover:text-gray-900 dark:hover:text-white"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="#resources"
                    className="transition hover:text-gray-900 dark:hover:text-white"
                  >
                    Resources
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-900 dark:text-white">
                Company
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <li>
                  <Link
                    href="#"
                    className="transition hover:text-gray-900 dark:hover:text-white"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="transition hover:text-gray-900 dark:hover:text-white"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="transition hover:text-gray-900 dark:hover:text-white"
                  >
                    Security
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="transition hover:text-gray-900 dark:hover:text-white"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-900 dark:text-white">
                Contact
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <li>hello@soterra.co.nz</li>
                <li>Auckland, Auckland, NZ</li>
                <li>soterra.co.nz</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-gray-200 pt-6 text-xs text-gray-500 dark:border-white/10 dark:text-gray-400">
            © 2026 Soterra. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
