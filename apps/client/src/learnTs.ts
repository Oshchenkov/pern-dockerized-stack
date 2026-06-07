const obj = {
  a: 1,
  age: 23,
  name: "John",
};

function getByKey<T, K extends keyof T>(obj: T, key: K) {
  return obj[key];
}

getByKey(obj, "age"); // 23
getByKey(obj, "name"); // "John"

interface User {
  name: string;
  age: number;
  friends: Array<string>;
}

type ReadonlyMyType<T> = {
  readonly [K in keyof T]?: T[K];
};

type ReadonlyUser = ReadonlyMyType<User>;

const user: ReadonlyUser = {
  name: "John",
  age: 30,
  friends: ["Alice", "Bob"],
};

type BackReadonly<T> = {
  -readonly [K in keyof T]-?: T[K];
};

type MutableUser = BackReadonly<ReadonlyUser>;

const mutableUser: MutableUser = {
  name: "John",
  age: 30,
  friends: ["Alice", "Bob"],
};
