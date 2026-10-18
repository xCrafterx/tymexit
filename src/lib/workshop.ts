import { z } from "zod";

export const moneySchema = z.coerce.number().finite().min(0).max(9999999999.99).transform((value) => Math.round(value * 100) / 100);
export const partSchema = z.object({
  name: z.string().trim().min(1, "Wpisz nazwę części").max(120),
  quantity: z.coerce.number().int().min(0).max(2147483647),
  unit_cost: moneySchema,
});
export const financeSchema = z.object({
  customer_price: moneySchema,
  parts_cost: moneySchema,
  other_cost: moneySchema,
  paid: z.boolean(),
});
export type FinanceValues = z.infer<typeof financeSchema>;
export function profit(values: Pick<FinanceValues, "customer_price" | "parts_cost" | "other_cost">) {
  return (Math.round(values.customer_price * 100) - Math.round(values.parts_cost * 100) - Math.round(values.other_cost * 100)) / 100;
}
export function nextStock(quantity: number, delta: number) {
  if (!Number.isInteger(quantity) || ![-1, 1].includes(delta) || quantity + delta < 0) throw new Error("Niedozwolona zmiana stanu magazynu");
  return quantity + delta;
}
export const formatMoney = (value: number) => new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(value);
export function csvCell(value: unknown) {
  const text = String(value ?? "");
  // Spreadsheet formulas must never execute from customer-supplied cells.
  const safe = /^[\s]*[=+@-]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}
export function createCsv(rows: unknown[][]) {
  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(";")).join("\r\n");
}
export function downloadCsv(filename: string, rows: unknown[][]) {
  const url = URL.createObjectURL(new Blob([createCsv(rows)], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}