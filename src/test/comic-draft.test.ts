import { describe, expect, it } from "vitest";
import { comicInsert, type ComicDraft } from "@/lib/comic-draft";

const draft: ComicDraft = { title: "  Kisah Anak  ", synopsis: " Sinopsis ", sources: " Sumber ", genre: "Siroh", age_group: "8-12", status: "Ongoing", published: false, is_premium: false };

describe("manual comic creation", () => {
  it("rejects empty titles", () => {
    expect(() => comicInsert({ ...draft, title: "  " }, "abc")).toThrow();
  });
  it("preserves entered metadata and visibility without inventing content", () => {
    expect(comicInsert(draft, "abc")).toEqual({ ...draft, title: "Kisah Anak", synopsis: "Sinopsis", sources: "Sumber", slug: "kisah-anak-abc" });
  });
  it("keeps separate links for comics with the same title", () => {
    expect(comicInsert(draft, "abc").slug).not.toBe(comicInsert(draft, "xyz").slug);
  });
});