// User repository — related file (imported by profileService)
// This file has MULTIPLE functions, but profileService only uses findUser and findUserByEmail

import { collection } from "./db";

export async function findUser(id: string) {
  return await collection.findOne({ _id: id });
}

export async function findUserByEmail(email: string) {
  return await collection.findOne({ email: email.toLowerCase() });
}

// Below functions are NOT imported by profileService — should be trimmed by Level 2

export async function createUser(data: any) {
  const result = await collection.insertOne(data);
  return result.insertedId;
}

export async function updateUser(id: string, updates: any) {
  await collection.updateOne({ _id: id }, { $set: updates });
}

export async function deleteUser(id: string) {
  await collection.deleteOne({ _id: id });
}

export async function listUsers(page: number, limit: number) {
  return await collection.find({}).skip(page * limit).limit(limit).toArray();
}

export async function countUsers() {
  return await collection.countDocuments({});
}

export async function searchUsers(query: string) {
  return await collection.find({ name: { $regex: query, $options: "i" } }).toArray();
}
