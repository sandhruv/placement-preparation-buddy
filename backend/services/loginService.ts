// Login service — changed in this PR (entry point)
import { verifyPassword, needsRehash } from "./authHelper";
import { findUserByEmail } from "./userRepo";

const CURRENT_SALT_ROUNDS = 12;

export async function login(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error("Invalid credentials");
  }

  if (!verifyPassword(user.passwordHash, password)) {
    throw new Error("Invalid credentials");
  }

  if (needsRehash(user.passwordHash, CURRENT_SALT_ROUNDS)) {
    console.log(`user ${user.id} needs password rehash`);
  }

  return { id: user.id, email: user.email };
}
