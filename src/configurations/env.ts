export const toInt = (value: string | undefined, fallback: number): number => {
  const parsed = parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const parseCorsOrigin = (value: string): string | string[] =>
  value === "*" ? "*" : value.split(",").map((origin) => origin.trim()).filter(Boolean);
