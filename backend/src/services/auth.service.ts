import bcrypt from "bcrypt";
import { Role, User } from "@prisma/client";
import { prisma } from "../config/prisma";

export type PublicUser = Omit<User, "password">;

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

const sanitizeUser = ({ password: _password, ...user }: User): PublicUser => user;

export const registerUser = async ({ name, email, password }: RegisterInput): Promise<PublicUser> => {
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (existingUser) {
    const error = new Error("An account with this email already exists");
    Object.assign(error, { statusCode: 409 });
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name: name.trim(), email: normalizedEmail, password: hashedPassword, role: Role.USER },
  });

  return sanitizeUser(user);
};

export const authenticateUser = async (email: string, password: string): Promise<PublicUser> => {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    const error = new Error("Invalid email or password");
    Object.assign(error, { statusCode: 401 });
    throw error;
  }

  return sanitizeUser(user);
};

export const getUserById = async (id: string): Promise<PublicUser | null> => {
  const user = await prisma.user.findUnique({ where: { id } });
  return user ? sanitizeUser(user) : null;
};
