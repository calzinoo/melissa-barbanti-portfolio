import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type * as schema from "./schema";

export type Database = LibSQLDatabase<typeof schema>;
/** A transaction exposes the same query API as the database. */
export type DbOrTx = Pick<Database, "select" | "insert" | "update" | "delete">;
