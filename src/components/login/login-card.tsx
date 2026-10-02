"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// LoginCard — the reference's slate-style card: logo, title, Google button
// (degrades to an explanatory toast — no OAuth credentials in a self-hosted
// clone), divider, email/password form, Sign in submit, sign-up mode, and
// ?from_url return handling.

type Mode = "signin" | "signup";

export function LoginCard({
  fromUrl,
  signedInEmail,
}: {
  fromUrl: string;
  signedInEmail: string | null;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(
    signedInEmail ? `You are already signed in as ${signedInEmail}.` : null,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const res = await fetch(mode === "signin" ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          mode === "signin" ? { email, password } : { email, password, fullName: name },
        ),
      });
      const json = (await res.json()) as
        | { ok: true; data: { id: string } }
        | { ok: false; error: { message: string } };
      if (!json.ok) {
        setError(json.error.message);
        return;
      }
      router.push(fromUrl || "/");
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isSignIn = mode === "signin";

  return (
    <div className="w-full max-w-md">
      <div className="relative overflow-hidden rounded-2xl border-0 bg-white/95 text-card-foreground shadow-2xl backdrop-blur-sm">
        {/* top accent bar */}
        <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200" />
        <div className="p-8 sm:p-10 md:pb-10 md:pt-12 md:px-10">
          <div className="flex flex-col items-center space-y-6 text-center sm:space-y-8">
            {/* logo */}
            <div className="group relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 opacity-30 blur-xl transition-opacity duration-300 group-hover:opacity-40" />
              <span className="relative flex h-20 w-20 shrink-0 overflow-hidden rounded-full shadow-lg ring-4 ring-white/50 transition-all duration-300 group-hover:shadow-xl sm:h-24 sm:w-24">
                <img
                  src="/logo.svg"
                  alt="Personalized Tutor App logo"
                  className="h-full w-full aspect-square object-cover bg-white"
                />
              </span>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Welcome to Personalized Tutor App
              </h1>
              <p className="text-sm font-medium text-slate-500 sm:text-base">
                {isSignIn ? "Sign in to continue" : "Create your account to get started"}
              </p>
            </div>

            <div className="w-full">
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() =>
                    setNotice(
                      "Google sign-in is not configured in this self-hosted clone. Use email and password below.",
                    )
                  }
                  className="group flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3.5 font-medium text-[16px] text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm"
                >
                  <span className="-ml-4 transition-transform duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  </span>
                  <span>Continue with Google</span>
                </button>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="h-[1px] w-full shrink-0 bg-slate-200" role="none" data-orientation="horizontal" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 font-medium tracking-wider text-slate-500">or</span>
                </div>
              </div>

              <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-3 sm:space-y-4">
                  {!isSignIn ? (
                    <div className="space-y-1.5">
                      <label
                        htmlFor="name"
                        className="text-sm font-medium text-slate-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Name
                      </label>
                      <div className="relative">
                        <input
                          id="name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-base text-slate-900 outline-none transition-all placeholder:text-slate-600 focus:border-slate-400 focus:ring-2 focus:ring-slate-400 sm:h-12 md:text-sm"
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-1.5">
                    <label
                      htmlFor="email"
                      className="text-sm font-medium text-slate-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Email
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="20" height="16" x="2" y="4" rx="2" />
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                      </span>
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-3 text-base text-slate-900 outline-none transition-all placeholder:text-slate-600 focus:border-slate-400 focus:ring-2 focus:ring-slate-400 sm:h-12 md:text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="password"
                      className="text-sm font-medium text-slate-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </span>
                      <input
                        id="password"
                        type="password"
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-3 text-base text-slate-900 outline-none transition-all placeholder:text-slate-600 focus:border-slate-400 focus:ring-2 focus:ring-slate-400 sm:h-12 md:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {error ? (
                  <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600" role="alert">
                    {error}
                  </p>
                ) : null}
                {notice ? (
                  <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600" role="status">
                    {notice}
                  </p>
                ) : null}

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex h-11 w-full items-center justify-center gap-1 whitespace-nowrap rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 sm:h-12"
                  >
                    {loading
                      ? isSignIn
                        ? "Signing in…"
                        : "Creating account…"
                      : isSignIn
                        ? "Sign in"
                        : "Create account"}
                  </button>
                  <div className="flex flex-col items-center justify-between gap-2 sm:flex-row sm:gap-0">
                    <button
                      type="button"
                      onClick={() =>
                        setNotice(
                          "Password reset requires a configured email transport. In this self-hosted clone, sign in with your email and password, or create a new account.",
                        )
                      }
                      className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
                    >
                      Forgot password?
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMode(isSignIn ? "signup" : "signin");
                        setError(null);
                        setNotice(null);
                      }}
                      className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
                    >
                      {isSignIn ? (
                        <>
                          Need an account? <span className="font-medium text-slate-700">Sign up</span>
                        </>
                      ) : (
                        <>
                          Have an account? <span className="font-medium text-slate-700">Sign in</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8 hidden text-center text-xs text-slate-400 sm:block">
        <p>&nbsp;</p>
      </div>
    </div>
  );
}
