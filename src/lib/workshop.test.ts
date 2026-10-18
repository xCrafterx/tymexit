import { describe, expect, test } from "bun:test";
import { createCsv, financeSchema, nextStock, partSchema, profit } from "./workshop";

describe("Workshop rules", () => {
  test("purchased parts add exactly one to stock", () => expect(nextStock(10, 1)).toBe(11));
  test("using one part subtracts exactly one", () => expect(nextStock(10, -1)).toBe(9));
  test("empty stock cannot become negative", () => expect(() => nextStock(0, -1)).toThrow());
  test("fractional stock is rejected", () => expect(partSchema.safeParse({ name: "SSD", quantity: 1.5, unit_cost: 100 }).success).toBe(false));
  test("profit deducts parts and other repair costs", () => expect(profit({ customer_price: 200, parts_cost: 70.15, other_cost: 10.1 })).toBe(119.75));
  test("loss remains visible rather than becoming zero", () => expect(profit({ customer_price: 10, parts_cost: 20, other_cost: 5 })).toBe(-15));
  test("negative repair cost is rejected", () => expect(financeSchema.safeParse({ customer_price: 20, parts_cost: -1, other_cost: 0, paid: false }).success).toBe(false));
  test("export preserves Polish text, semicolons and quotes", () => expect(createCsv([["Części; SSD", 'Model "A"']])).toBe('\uFEFF"Części; SSD";"Model ""A"""'));
  test("export does not execute a customer spreadsheet formula", () => expect(createCsv([["=1+1"]])).toBe('\uFEFF"\'=1+1"'));
});