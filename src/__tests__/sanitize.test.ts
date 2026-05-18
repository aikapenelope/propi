import { describe, it, expect } from "vitest";
import { sanitizeLike, escapeHtml } from "@/lib/sanitize";

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

describe("escapeHtml", () => {
  it("escapes ampersands", () => {
    expect(escapeHtml("Tom & Jerry")).toBe("Tom &amp; Jerry");
  });

  it("escapes less-than signs", () => {
    expect(escapeHtml("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;",
    );
  });

  it("escapes greater-than signs", () => {
    expect(escapeHtml("a > b")).toBe("a &gt; b");
  });

  it("escapes double quotes", () => {
    expect(escapeHtml('class="evil"')).toBe("class=&quot;evil&quot;");
  });

  it("escapes single quotes", () => {
    expect(escapeHtml("it's")).toBe("it&#39;s");
  });

  it("escapes all special characters together", () => {
    expect(escapeHtml(`<img src="x" onerror='alert(1)'>& done`)).toBe(
      "&lt;img src=&quot;x&quot; onerror=&#39;alert(1)&#39;&gt;&amp; done",
    );
  });

  it("returns plain strings unchanged", () => {
    expect(escapeHtml("Apartamento en Caracas, 120m2")).toBe(
      "Apartamento en Caracas, 120m2",
    );
  });

  it("handles empty string", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("preserves newlines and whitespace", () => {
    expect(escapeHtml("line1\nline2\ttab")).toBe("line1\nline2\ttab");
  });
});
