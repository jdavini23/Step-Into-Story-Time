
import { db } from "./server/db";

async function migrateFavorites() {
  try {
    console.log("Starting favorites migration...");
    
    // Create favorites table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL REFERENCES users(id),
        story_id INTEGER NOT NULL REFERENCES stories(id),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create unique index to prevent duplicate favorites
    await db.execute(`
      CREATE UNIQUE INDEX IF NOT EXISTS unique_user_story_favorite 
      ON favorites(user_id, story_id)
    `);
    
    console.log("Favorites migration completed successfully!");
  } catch (error) {
    console.error("Favorites migration failed:", error);
  } finally {
    process.exit(0);
  }
}

migrateFavorites();
