// Business logic
import { notFoundError, conflict } from "#src/utils/commonErrors";

export const getUserById = async (id: string) => {
  const user = await db.user.findUnique({ where: { id } });
  if (!user) throw notFoundError(`User ${id} not found`);
  return user;
};

export const createUser = async (data: CreateUserBody) => {
  const exists = await db.user.findUnique({ where: { email: data.email } });
  if (exists) throw conflict("Email already registered", { email: data.email });
  return db.user.create({ data });
};
