import { describe, expect, it } from "vitest";
import {
  isDisplayableImageSource,
  isInlineImageUrl,
  readImageFileAsDataUrl,
} from "./imageDataUrl";

describe("imageDataUrl", () => {
  it("identifies inline and displayable image sources", () => {
    expect(isInlineImageUrl("data:image/png;base64,abc")).toBe(true);
    expect(isInlineImageUrl("https://example.com/image.png")).toBe(false);
    expect(isDisplayableImageSource("https://example.com/image.png")).toBe(
      true,
    );
    expect(isDisplayableImageSource("http://example.com/image.png")).toBe(true);
    expect(isDisplayableImageSource("data:image/webp;base64,abc")).toBe(true);
    expect(isDisplayableImageSource("ftp://example.com/image.png")).toBe(false);
  });

  it("rejects unsupported image types", async () => {
    const file = new File(["avatar"], "avatar.gif", { type: "image/gif" });

    await expect(readImageFileAsDataUrl(file)).rejects.toThrow(
      "Use a PNG, JPG, or WebP image.",
    );
  });

  it("rejects images larger than 450 KB", async () => {
    const file = new File([new Uint8Array(451 * 1024)], "large.png", {
      type: "image/png",
    });

    await expect(readImageFileAsDataUrl(file)).rejects.toThrow(
      "Use an image smaller than 450 KB.",
    );
  });

  it("reads accepted images as data URLs", async () => {
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });

    await expect(readImageFileAsDataUrl(file)).resolves.toMatch(
      /^data:image\/png;base64,/,
    );
  });
});
