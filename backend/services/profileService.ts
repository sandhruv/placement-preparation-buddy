// Main service — changed in this PR
import { findUser, findUserByEmail } from "./userRepo";
import { validateEmail } from "./validators";

export async function getProfile(userId: string) {
  const user = await findUser(userId);
  // BUG 1: user can be null (db.findOne returns null) — but code accesses .name directly below without null check in one path
  return { id: user.id, name: user.name, email: user.email };
}

export async function getProfileSafe(userId: string) {
  const user = await findUser(userId);
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email };
}

export async function findByEmail(email: string) {
  if (!validateEmail(email)) {
    throw new Error("Invalid email");
  }
  // BUG 2: findUserByEmail can return null, but caller might not expect null
  const user = await findUserByEmail(email);
  return user.email; // crashes if user is null
}

export async function createProfile(email: string, name: string) {
  // BUG 3: validateEmail imported but validateName not imported/used — name not validated
  if (!validateEmail(email)) {
    throw new Error("Invalid email");
  }
  return { email, name }; // name could be empty/invalid
}
