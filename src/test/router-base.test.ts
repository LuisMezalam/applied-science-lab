import { describe, expect, it } from "vitest";
import { getRouterBasename } from "@/lib/routerBase";

describe("getRouterBasename", () => {
  it("leaves root-hosted builds unscoped", () => {
    expect(getRouterBasename("/")).toBeUndefined();
    expect(getRouterBasename(undefined)).toBeUndefined();
  });

  it("normalizes GitHub Pages repository paths", () => {
    expect(getRouterBasename("/applied-science-lab/")).toBe("/applied-science-lab");
    expect(getRouterBasename("/applied-science-lab")).toBe("/applied-science-lab");
  });
});
