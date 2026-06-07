import type { ApiV1User } from "@/app/api/v1/users/route";

export type User = ApiV1User;

export type ReadonlyUser = Readonly<User>;

export type MutableUser = User;

export function getByKey<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

export function setByKey<T, K extends keyof T>(
  obj: T,
  key: K,
  value: T[K],
): void {
  obj[key] = value;
}
