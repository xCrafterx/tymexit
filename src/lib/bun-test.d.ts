// Deklaracje typów dla `bun:test` — testy uruchamiane przez `bun test`,
// ale tsgo nie zna tego modułu, więc dostarczamy minimalny interfejs.
declare module "bun:test" {
  export function describe(name: string, fn: () => void): void;
  export function test(name: string, fn: () => void): void;
  export const expect: (value: unknown) => {
    toBe(expected: unknown): void;
    toThrow(): void;
  };
}
