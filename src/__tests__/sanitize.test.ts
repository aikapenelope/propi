import { describe, it, expect } from "vitest";
import { sanitizeLike } from "@/lib/sanitize";

describe("sanitizeLike", () => {
  it("escapes percent signs", () => {
    expect(sanitizeLike("100%")).toBe("100\\%");
  });

  it("escapes underscores", () => {
    expect(sanitizeLike("first_name")).toBe("first\\_name");
  });

  it("escapes backslashes", () => {
    expect(sanitizeLike("path\\to")).toBe("path\\\\to");
  });

  it("escapes all special characters together", () => {
    expect(sanitizeLike("100%_test\\end")).toBe("100\\%\\_test\\\\end");
  });

  it("returns plain strings unchanged", () => {
    expect(sanitizeLike("hello world")).toBe("hello world");
  });

  it("handles empty string", () => {
    expect(sanitizeLike("")).toBe("");
  });
});
