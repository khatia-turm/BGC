const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_IMAGE_BYTES = 450 * 1024;

export function isInlineImageUrl(value: string) {
  return value.startsWith("data:image/");
}

export function isDisplayableImageSource(value: string) {
  return value.startsWith("http://") || value.startsWith("https://") || isInlineImageUrl(value);
}

export function readImageFileAsDataUrl(file: File): Promise<string> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return Promise.reject(new Error("Use a PNG, JPG, or WebP image."));
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return Promise.reject(new Error("Use an image smaller than 450 KB."));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read this image."));
    });
    reader.addEventListener("error", () => reject(new Error("Could not read this image.")));
    reader.readAsDataURL(file);
  });
}
