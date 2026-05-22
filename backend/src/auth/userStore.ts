import { nanoid } from "nanoid";
import { User } from "../types.js";

type StoredUser = User & {
  password: string;
};

const users = new Map<string, StoredUser>();

export function signup(name: string, email: string, password: string): User {
  const normalizedEmail = email.trim().toLowerCase();
  if (users.has(normalizedEmail)) {
    throw new Error("An account with this email already exists.");
  }

  const user: StoredUser = {
    id: nanoid(),
    name: name.trim(),
    email: normalizedEmail,
    password
  };
  users.set(normalizedEmail, user);
  return toPublicUser(user);
}

export function signin(email: string, password: string): User {
  const user = users.get(email.trim().toLowerCase());
  if (!user || user.password !== password) {
    throw new Error("Invalid email or password.");
  }
  return toPublicUser(user);
}

function toPublicUser(user: StoredUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email
  };
}
