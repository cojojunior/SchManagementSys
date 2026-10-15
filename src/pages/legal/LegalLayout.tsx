import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

export function LegalLayout({
  title,
  lastUpdated,
  contactEmail,
  children,
}: {
  title: string;
  lastUpdated: string;
  contactEmail: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-ink-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-ink-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to="/"
            className="text-sm text-ink-600 hover:text-ink-900 inline-flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
          <div className="text-xs text-ink-500">
            Last updated: {lastUpdated}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="h-5 w-5 text-brand-600" />
          <span className="text-xs font-medium text-brand-700 uppercase tracking-wide">
            Supreme Academy
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-ink-900 mb-2">{title}</h1>
        <p className="text-sm text-ink-500 mb-8">
          Contact:{" "}
          <a
            href={`mailto:${contactEmail}`}
            className="text-brand-600 hover:underline">
            {contactEmail}
          </a>
        </p>

        <article className="prose prose-slate max-w-none [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-ink-900 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-ink-900 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-ink-700 [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:pl-5 [&_li]:text-sm [&_li]:text-ink-700 [&_li]:mb-1.5 [&_strong]:text-ink-900">
          {children}
        </article>

        <footer className="mt-16 pt-8 border-t border-ink-200 text-xs text-ink-500">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <span>
              © {new Date().getFullYear()} Supreme Academy. All rights reserved.
            </span>
            <div className="flex items-center gap-4">
              <Link to="/terms" className="hover:text-ink-700">
                Terms
              </Link>
              <Link to="/privacy" className="hover:text-ink-700">
                Privacy
              </Link>
              <Link to="/login" className="hover:text-ink-700">
                Sign in
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
