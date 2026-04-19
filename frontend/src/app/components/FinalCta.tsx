"use client";

import { useMemo, useState } from "react";

type ToastState = {
  tone: "success" | "error";
  title: string;
  message: string;
};

export default function FinalCta() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const toastStyles = useMemo(
    () =>
      toast?.tone === "success"
        ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-100"
        : "bg-rose-50 text-rose-900 dark:bg-rose-500/10 dark:text-rose-100",
    [toast]
  );

  const showToast = (payload: ToastState) => {
    setToast(payload);
    window.setTimeout(() => {
      setToast(null);
    }, 4200);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const organisation = String(formData.get("organisation") || "").trim();

    if (!name || !email || !organisation) {
      showToast({
        tone: "error",
        title: "Missing details",
        message: "Please complete all fields to request a demo.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, organisation }),
      });

      if (!response.ok) {
        throw new Error("Lead submission failed");
      }

      form.reset();
      showToast({
        tone: "success",
        title: "Request sent",
        message: "We will reach out shortly to schedule a demo.",
      });
    } catch {
      showToast({
        tone: "error",
        title: "Something went wrong",
        message: "Please try again or email hello@soterra.com.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-white/10 bg-white/5">
        <div className="px-6 py-10 sm:px-10">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="text-sm/6 font-semibold uppercase tracking-[0.2em] text-indigo-300">
                Request a demo
              </p>
              <h2 className="mt-4 text-3xl font-semibold text-white">
                Turn inspection data into confident decisions.
              </h2>
              <p className="mt-4 text-base/7 text-slate-300">
                See how Soterra delivers portfolio-wide risk visibility, faster
                corrective action, and clear reporting for every stakeholder.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="lead-name"
                  className="block text-sm/6 font-medium text-white"
                >
                  Name
                </label>
                <div className="mt-2">
                  <input
                    id="lead-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    className="block w-full rounded-md bg-white/5 px-3 py-2.5 text-sm/6 text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-slate-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500"
                    placeholder="Alex Morgan"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="lead-email"
                  className="block text-sm/6 font-medium text-white"
                >
                  Email
                </label>
                <div className="mt-2">
                  <input
                    id="lead-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full rounded-md bg-white/5 px-3 py-2.5 text-sm/6 text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-slate-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500"
                    placeholder="alex@company.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="lead-organisation"
                  className="block text-sm/6 font-medium text-white"
                >
                  Organisation
                </label>
                <div className="mt-2">
                  <input
                    id="lead-organisation"
                    name="organisation"
                    type="text"
                    autoComplete="organization"
                    required
                    className="block w-full rounded-md bg-white/5 px-3 py-2.5 text-sm/6 text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-slate-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500"
                    placeholder="Soterra Construction Group"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-full bg-[#6D5EF5] px-5 py-2.5 text-sm/6 font-semibold text-white transition-colors hover:bg-[#7C70FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D5EF5] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Submitting..." : "Request a Demo"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {toast ? (
        <div className="fixed bottom-6 right-6 z-50">
          <div
            className={`rounded-md px-4 py-3 text-sm/6 shadow-lg ${toastStyles}`}
            role="status"
          >
            <div className="font-semibold">{toast.title}</div>
            <div className="mt-1 text-sm/6 opacity-90">{toast.message}</div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
