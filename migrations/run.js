const fs = require("fs");
const path = require("path");
const pool = require("../db");
module.exports = async function runMigrations() {
  await pool.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (name varchar(255) PRIMARY KEY, applied_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  );
  for (const file of fs
    .readdirSync(__dirname)
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    const exists = await pool.query(
      "SELECT 1 FROM schema_migrations WHERE name=$1",
      [file],
    );
    if (!exists.rowCount) {
      await pool.query(fs.readFileSync(path.join(__dirname, file), "utf8"));
      await pool.query("INSERT INTO schema_migrations(name) VALUES($1)", [
        file,
      ]);
      console.log(`Applied migration ${file}`);
    }
  }
};
