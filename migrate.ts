
import { db } from "./server/db";

async function migrate() {
  try {
    console.log("Starting migration...");
    
    // Add missing columns to stories table
    await db.execute(`
      ALTER TABLE stories 
      ADD COLUMN IF NOT EXISTS child_name VARCHAR,
      ADD COLUMN IF NOT EXISTS child_age INTEGER,
      ADD COLUMN IF NOT EXISTS child_gender VARCHAR,
      ADD COLUMN IF NOT EXISTS favorite_themes VARCHAR,
      ADD COLUMN IF NOT EXISTS tone VARCHAR,
      ADD COLUMN IF NOT EXISTS length VARCHAR,
      ADD COLUMN IF NOT EXISTS bedtime_message TEXT
    `);
    
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    process.exit(0);
  }
}

migrate();
