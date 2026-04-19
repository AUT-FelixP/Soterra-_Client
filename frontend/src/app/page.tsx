import Link from "next/link";
import {
  ChartPieIcon,
  ClipboardDocumentCheckIcon,
  DocumentChartBarIcon,
  FolderOpenIcon,
  SparklesIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import FinalCta from "./components/FinalCta";

const primaryButtonClassName =
  "inline-flex items-center justify-center rounded-full bg-[#6D5EF5] px-5 py-2.5 text-sm/6 font-semibold text-white transition-colors hover:bg-[#7C70FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D5EF5]";

const secondaryButtonClassName =
  "inline-flex items-center justify-center rounded-full bg-white/5 px-5 py-2.5 text-sm/6 font-semibold text-white ring-1 ring-inset ring-white/10 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

const sectionEyebrowClassName =
  "text-sm/6 font-semibold uppercase tracking-[0.2em] text-indigo-300";

const sectionTitleClassName = "text-base/6 font-semibold text-white";
const sectionCopyClassName = "mt-1 text-sm/6 text-slate-400";

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
    icon: SparklesIcon,
  },
  {
    title: "Risk scoring & trend analysis",
    description:
      "Surface high-risk patterns across trades, sites, and timeframes.",
    icon: ChartPieIcon,
  },
  {
    title: "Portfolio dashboard for sites/projects",
    description:
      "Track inspection health across the entire portfolio with a single view.",
    icon: FolderOpenIcon,
  },
  {
    title: "Exportable reporting for stakeholders",
    description:
      "Share clear summaries with owners, consultants, and delivery teams.",
    icon: DocumentChartBarIcon,
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "Upload Reports",
    description: "Drop in inspection PDFs, notes, and photos from any project.",
  },
  {
    step: "02",
    title: "Extract Data with AI",
    description:
      "Turn unstructured findings into structured, searchable records.",
  },
  {
    step: "03",
    title: "Review Risks & Trends",
    description: "Spot repeat failures and trade-level patterns in minutes.",
  },
  {
    step: "04",
    title: "Share Insights",
    description: "Send clear summaries to owners, consultants, and site leads.",
  },
];

const audienceSegments = [
  {
    title: "Construction Companies",
    bullets: [
      "Standardize QA across every site and trade.",
      "Reduce rework by prioritizing repeat defects.",
      "Keep PMs aligned with real-time inspection insights.",
    ],
    href: "#product",
    icon: ClipboardDocumentCheckIcon,
  },
  {
    title: "Councils & Asset Owners",
    bullets: [
      "Track portfolio-wide risk exposure in one view.",
      "Audit inspection outcomes against compliance goals.",
      "Share executive-ready summaries with stakeholders.",
    ],
    href: "#solutions",
    icon: ChartPieIcon,
  },
  {
    title: "Engineering & Safety Teams",
    bullets: [
      "Surface high-risk patterns before incidents occur.",
      "Turn site notes into structured, searchable data.",
      "Report trends clearly across disciplines and sites.",
    ],
    href: "#resources",
    icon: UsersIcon,
  },
];

const proofStats = [
  { name: "Reports processed", stat: "128,000+" },
  { name: "Issues identified", stat: "24,600" },
  { name: "Time saved", stat: "42%" },
  { name: "Projects monitored", stat: "860" },
];

export default function LandingPage() {
  return (
    <div className="min-h-full bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div className="brand-glow text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Soterra
          </div>
          <nav className="hidden items-center gap-8 text-sm/6 font-semibold text-slate-300 md:flex">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-3 sm:flex">
            <Link href="/login" className={secondaryButtonClassName}>
              Login
            </Link>
            <Link href="/contact" className={primaryButtonClassName}>
              Request a Demo
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <section className="flex max-w-5xl flex-col justify-center py-10 sm:py-14">
          <p className={sectionEyebrowClassName}>Construction Intelligence</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-balance text-white sm:text-5xl lg:text-6xl">
            Make inspection outcomes predictable.
          </h1>
          <p className="mt-6 max-w-6xl text-xl/9 text-slate-300">
            Soterra turns inspection history into focused insight reports so you
            know what fails, why it repeats, and what to fix first. Give teams a
            QA workflow that keeps projects moving and reduces rework.
          </p>
          <ul className="mt-10 space-y-4 text-lg/8 text-slate-200">
            {valueBullets.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-3 size-2.5 rounded-full bg-indigo-400"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/contact" className={primaryButtonClassName}>
              Request a Demo
            </Link>
          </div>
        </section>
      </main>

      <section
        id="product"
        className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8"
      >
        <div className="border-b border-white/10 pb-5">
          <div className="sm:flex sm:items-baseline sm:justify-between">
            <div className="sm:w-0 sm:flex-1">
              <h2 className={sectionTitleClassName}>What Soterra does</h2>
              <p className={sectionCopyClassName}>
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
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-inset ring-white/10">
                    <feature.icon
                      aria-hidden="true"
                      className="size-6 text-indigo-300"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm/6 font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm/6 text-slate-300">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section
        id="solutions"
        className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6 lg:px-8"
      >
        <div className="border-b border-white/10 pb-5">
          <h2 className={sectionTitleClassName}>How it works</h2>
          <p className={sectionCopyClassName}>
            A simple four-step flow from raw inspections to shared insights.
          </p>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {workflowSteps.map((item) => (
            <div
              key={item.step}
              className="flex h-full flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-indigo-500/15 text-sm/6 font-semibold text-indigo-200 ring-1 ring-inset ring-indigo-400/30">
                  {item.step}
                </span>
                <h3 className="text-base/6 font-semibold text-white">
                  {item.title}
                </h3>
              </div>
              <p className="text-sm/6 text-slate-300">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="resources"
        className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6 lg:px-8"
      >
        <div className="border-b border-white/10 pb-5">
          <h2 className={sectionTitleClassName}>Built for</h2>
          <p className={sectionCopyClassName}>
            Tailored workflows for the teams shaping safer, smarter projects.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {audienceSegments.map((segment) => (
            <div
              key={segment.title}
              className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-white/5 ring-1 ring-inset ring-white/10">
                  <segment.icon
                    aria-hidden="true"
                    className="size-6 text-indigo-300"
                  />
                </div>
                <h3 className="text-base/6 font-semibold text-white">
                  {segment.title}
                </h3>
              </div>
              <ul className="mt-4 space-y-3 text-sm/6 text-slate-300">
                {segment.bullets.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-2.5 size-2 rounded-full bg-indigo-400"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link href={segment.href} className={primaryButtonClassName}>
                  Learn more
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        id="pricing"
        className="border-y border-white/10 bg-white/[0.03]"
      >
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className={sectionEyebrowClassName}>Proof at scale</p>
              <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
                Enterprise-grade impact across inspection programs.
              </h2>
            </div>
            <p className="text-sm/6 text-slate-400">
              Updated weekly from active client portfolios.
            </p>
          </div>

          <dl className="mt-10 grid grid-cols-1 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/5 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
            {proofStats.map((item) => (
              <div key={item.name} className="px-6 py-6">
                <dt className="text-sm/6 font-medium text-slate-400">
                  {item.name}
                </dt>
                <dd className="mt-3 text-3xl font-semibold tracking-tight text-white">
                  {item.stat}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <FinalCta />

      <footer className="border-t border-white/10 bg-slate-950">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="text-lg font-semibold tracking-tight text-white">
                Soterra
              </div>
              <p className="mt-3 text-sm/6 text-slate-400">
                Predict inspection risk and accelerate corrective action with
                AI-powered insight workflows.
              </p>
            </div>

            <div>
              <h3 className="text-sm/6 font-semibold uppercase tracking-[0.16em] text-white">
                Product
              </h3>
              <ul className="mt-4 space-y-3 text-sm/6 text-slate-300">
                <li>
                  <Link
                    href="#product"
                    className="transition-colors hover:text-white"
                  >
                    Platform overview
                  </Link>
                </li>
                <li>
                  <Link
                    href="#solutions"
                    className="transition-colors hover:text-white"
                  >
                    Solutions
                  </Link>
                </li>
                <li>
                  <Link
                    href="#pricing"
                    className="transition-colors hover:text-white"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="#resources"
                    className="transition-colors hover:text-white"
                  >
                    Resources
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm/6 font-semibold uppercase tracking-[0.16em] text-white">
                Company
              </h3>
              <ul className="mt-4 space-y-3 text-sm/6 text-slate-300">
                <li>
                  <Link href="#" className="transition-colors hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="transition-colors hover:text-white">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="transition-colors hover:text-white">
                    Security
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="transition-colors hover:text-white"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm/6 font-semibold uppercase tracking-[0.16em] text-white">
                Contact
              </h3>
              <ul className="mt-4 space-y-3 text-sm/6 text-slate-300">
                <li>hello@soterra.co.nz</li>
                <li>Auckland, Auckland, NZ</li>
                <li>soterra.co.nz</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-6 text-xs/6 text-slate-500">
            Copyright 2026 Soterra. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
