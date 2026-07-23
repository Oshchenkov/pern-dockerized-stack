// packages/shared/src/index.ts
export const greet = (name: string) =>
  `Hello, ${name} from the shared package!`;

export type User = {
  id: string;
  name: string;
};

export * from "./schemas/index.js";
export * from "./types/index.js";
