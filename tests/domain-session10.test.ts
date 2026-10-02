// Session-10 domain pins: the from_url writer/consumer pair (the live's
// navigateToLogin = redirectToLogin(window.location.href) contract, decoded
// with a query-carrying URL: the CURRENT URL's path AND query ride) and the
// onboarding validity predicate consolidation (the 2/2/20 thresholds in ONE
// place — the session-9 R5 completion).
import { describe, expect, it } from "vitest";
import {
  loginRedirectUrl,
  onboardingInputsValid,
  sameOriginRedirectTarget,
} from "@/lib/domain";

describe("loginRedirectUrl(pathname, search) — the ONE from_url writer", () => {
  it("encodes the bare root", () => {
    expect(loginRedirectUrl("/", "")).toBe("/login?from_url=%2F");
  });

  it("carries the QUERY STRING (the S10-F1 decode: window.location.href rides)", () => {
    expect(loginRedirectUrl("/", "?q=parity")).toBe("/login?from_url=%2F%3Fq%3Dparity");
  });

  it("carries path + query together", () => {
    expect(loginRedirectUrl("/hub", "?course=demo-enrollment")).toBe(
      "/login?from_url=%2Fhub%3Fcourse%3Ddemo-enrollment",
    );
  });

  it("encodes the onboarding deferral target", () => {
    expect(loginRedirectUrl("/onboarding", "")).toBe("/login?from_url=%2Fonboarding");
  });

  it("falls back to / when the pathname is empty", () => {
    expect(loginRedirectUrl("", "")).toBe("/login?from_url=%2F");
  });

  it("handles a bare '?' search without doubling", () => {
    expect(loginRedirectUrl("/", "?")).toBe("/login?from_url=%2F%3F");
  });

  it("normalizes a search missing its leading ? (useSearchParams().toString() shape)", () => {
    expect(loginRedirectUrl("/", "q=1")).toBe("/login?from_url=%2F%3Fq%3D1");
  });
});

describe("sameOriginRedirectTarget(raw, origin) — the login's from_url consumer", () => {
  const ORIGIN = "https://clone.example";

  it("returns / for empty or missing values", () => {
    expect(sameOriginRedirectTarget("", ORIGIN)).toBe("/");
    expect(sameOriginRedirectTarget(null, ORIGIN)).toBe("/");
    expect(sameOriginRedirectTarget(undefined, ORIGIN)).toBe("/");
  });

  it("passes relative same-app paths through untouched (the clone's own writer format)", () => {
    expect(sameOriginRedirectTarget("/hub?course=d", ORIGIN)).toBe("/hub?course=d");
    expect(sameOriginRedirectTarget("/", ORIGIN)).toBe("/");
    expect(sameOriginRedirectTarget("/?q=parity", ORIGIN)).toBe("/?q=parity");
  });

  it("rejects protocol-relative URLs (the classic open-redirect escape)", () => {
    expect(sameOriginRedirectTarget("//evil.example/x", ORIGIN)).toBe("/");
  });

  it("decodes same-origin ABSOLUTE urls to path+search (the live's format tolerance)", () => {
    expect(sameOriginRedirectTarget("https://clone.example/x?q=1", ORIGIN)).toBe("/x?q=1");
    expect(sameOriginRedirectTarget(`${ORIGIN}/?q=parity&s10=1`, ORIGIN)).toBe("/?q=parity&s10=1");
  });

  it("rejects FOREIGN origins (the open-redirect fix — the live ships the vulnerability)", () => {
    expect(sameOriginRedirectTarget("https://evil.example/x", ORIGIN)).toBe("/");
    expect(sameOriginRedirectTarget("http://clone.example/x", ORIGIN)).toBe("/");
  });

  it("strips the hash (path+search is the navigable target)", () => {
    expect(sameOriginRedirectTarget("https://clone.example/x#frag", ORIGIN)).toBe("/x");
  });

  it("rejects malformed urls", () => {
    expect(sameOriginRedirectTarget("not a url at all://", ORIGIN)).toBe("/");
  });
});

describe("onboardingInputsValid({mode, topic, courseName, contentText}) — ONE predicate", () => {
  it("topic mode: topic >= 2 chars", () => {
    expect(onboardingInputsValid({ mode: "topic", topic: "Calculus", courseName: "", contentText: "" })).toBe(true);
    expect(onboardingInputsValid({ mode: "topic", topic: "C", courseName: "", contentText: "" })).toBe(false);
    expect(onboardingInputsValid({ mode: "topic", topic: "  ", courseName: "", contentText: "" })).toBe(false);
  });

  it("material mode: courseName >= 2 AND contentText >= 20", () => {
    expect(
      onboardingInputsValid({ mode: "material", topic: "", courseName: "My Course", contentText: "A".repeat(20) }),
    ).toBe(true);
    expect(
      onboardingInputsValid({ mode: "material", topic: "", courseName: "M", contentText: "A".repeat(20) }),
    ).toBe(false);
    expect(
      onboardingInputsValid({ mode: "material", topic: "", courseName: "My Course", contentText: "A".repeat(19) }),
    ).toBe(false);
    expect(
      onboardingInputsValid({ mode: "material", topic: "", courseName: "My Course", contentText: "   " }),
    ).toBe(false);
  });

  it("trims before measuring (the live's .trim() semantics)", () => {
    expect(onboardingInputsValid({ mode: "topic", topic: "  Py  ", courseName: "", contentText: "" })).toBe(true);
    expect(
      onboardingInputsValid({ mode: "material", topic: "", courseName: "  My Course  ", contentText: `  ${"A".repeat(20)}  ` }),
    ).toBe(true);
  });
});
