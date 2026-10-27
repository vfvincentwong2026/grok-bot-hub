import { describe, it, expect } from "vitest";
import { checkXPolicy } from "../workers/src/policy";

describe("checkXPolicy", () => {
  it("blocks unsolicited DM", () => {
    const r = checkXPolicy({ payload: { action: "dm", user_initiated: false } });
    expect(r.allowed).toBe(false);
    expect(r.reason).toContain("user-initiated");
  });

  it("allows user-initiated DM", () => {
    const r = checkXPolicy({ payload: { action: "dm", user_initiated: true } });
    expect(r.allowed).toBe(true);
  });

  it("blocks cross-account identical content", () => {
    const r = checkXPolicy({ payload: { cross_account: true } });
    expect(r.allowed).toBe(false);
  });

  it("blocks posting without bot disclosure", () => {
    const r = checkXPolicy({ payload: { action: "post", bot_disclosed: false } });
    expect(r.allowed).toBe(false);
  });

  it("blocks bulk keywords", () => {
    const r = checkXPolicy({ payload: { script_text: "mass dm everyone now" } });
    expect(r.allowed).toBe(false);
  });

  it("allows clean analyze request", () => {
    const r = checkXPolicy({ payload: { script_text: "heir reveal at wedding" } });
    expect(r.allowed).toBe(true);
  });
});
