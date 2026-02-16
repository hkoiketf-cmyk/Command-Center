import { eq, sql, and, lt, isNotNull } from "drizzle-orm";
import { db } from "./db";
import { users } from "@shared/schema";
import {
  userSettings,
  desktops,
  widgets,
  ventures,
  priorities,
  revenueData,
  dashboardLayouts,
  focusContracts,
  appSettings,
  captureItems,
  habits,
  habitEntries,
  journalEntries,
  scorecardMetrics,
  scorecardEntries,
  kpis,
  waitingItems,
  deals,
  timeBlocks,
  recurringExpenses,
  variableExpenses,
  meetings,
  aiConversations,
  aiMessages,
} from "@shared/schema";

const RETENTION_DAYS = 30;

const tablesWithUserId = [
  userSettings,
  desktops,
  widgets,
  ventures,
  priorities,
  revenueData,
  dashboardLayouts,
  focusContracts,
  appSettings,
  captureItems,
  habits,
  habitEntries,
  journalEntries,
  scorecardMetrics,
  scorecardEntries,
  kpis,
  waitingItems,
  deals,
  timeBlocks,
  recurringExpenses,
  variableExpenses,
  meetings,
  aiConversations,
  aiMessages,
];

export async function cleanupExpiredUserData() {
  try {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

    const expiredUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          isNotNull(users.subscriptionEndedAt),
          lt(users.subscriptionEndedAt, cutoff)
        )
      );

    if (expiredUsers.length === 0) {
      return { cleaned: 0 };
    }

    let totalCleaned = 0;

    for (const { id: userId } of expiredUsers) {
      for (const table of tablesWithUserId) {
        const result = await db.delete(table).where(eq(table.userId, userId));
        totalCleaned += (result as any).rowCount || 0;
      }
      await db.execute(
        sql`DELETE FROM sessions WHERE sess->>'userId' = ${userId}`
      );
      await db.delete(users).where(eq(users.id, userId));
      console.log(`[Data Retention] Cleaned up all data for expired user ${userId}`);
    }

    console.log(`[Data Retention] Cleanup complete: removed data for ${expiredUsers.length} expired users, ${totalCleaned} total records`);
    return { cleaned: expiredUsers.length, records: totalCleaned };
  } catch (error) {
    console.error("[Data Retention] Cleanup error:", error);
    return { cleaned: 0, error };
  }
}

export function startRetentionSchedule() {
  cleanupExpiredUserData();

  setInterval(() => {
    cleanupExpiredUserData();
  }, 24 * 60 * 60 * 1000);

  console.log("[Data Retention] Scheduled daily cleanup of expired user data (30-day retention)");
}
