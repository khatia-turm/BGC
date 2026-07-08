export const truncateText = (
  value: string | null | undefined,
  maxLength = 120,
) => {
  const text = value?.trim() ?? "";
  return text.length > maxLength
    ? `${text.slice(0, maxLength).trimEnd()}…`
    : text;
};
