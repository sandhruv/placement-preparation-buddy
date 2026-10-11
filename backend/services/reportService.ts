// Report service — changed in this PR (entry point)
import { setCache, getCache } from "./cacheHelper";
import { findUser } from "./userRepo";

const CACHE_TTL = 5 * 60 * 1000;

export async function getReport(userId: string) {
  const cacheKey = `report:${userId}`;
  const cached = getCache<{ sections: string[] }>(cacheKey);
  if (cached) return cached;

  const user = await findUser(userId);
  if (!user) throw new Error("User not found");

  const report = {
    sections: ["summary", "scores", "recommendations"],
    userId: user.id,
    generatedAt: Date.now(),
  };

  setCache(cacheKey, report, CACHE_TTL);
  return report;
}

export async function invalidateReport(userId: string) {
  const { clearCache } = await import("./cacheHelper");
  clearCache(`report:${userId}`);
}
