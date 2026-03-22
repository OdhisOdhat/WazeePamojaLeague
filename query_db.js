
import { createClient } from '@libsql/client';

const TURSO_CONFIG = {
  url: "https://odhisodhat-vercel-icfg-ftcymaxmqxj9bs7ney2w5mpx.aws-us-east-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjkwODMyMjEsImlkIjoiNzA2MmVkNjItNDUwOS00YmEzLWIwYWYtNjBjY2YzNDJlMTg4IiwicmlkIjoiMDQ4ZmNlMDctMGEwOS00OGIxLTg3OWQtNTEzZGZiMWUxZmUzIn0.0i537WhP95mSF1AUrhIiakcMQebMcDFk21Q2C0d4b-YZpgJB4Plba8ox3wDDLtoFhJrsKDtr7r_E-dQ_aIDiBw"
};

const db = createClient(TURSO_CONFIG);

async function run() {
  try {
    const teams = await db.execute("SELECT * FROM teams");
    console.log("TEAMS:");
    teams.rows.forEach(row => {
      const team = JSON.parse(row.data);
      console.log(`ID: ${team.id}, Name: ${team.name}`);
    });

    const matches = await db.execute("SELECT * FROM matches");
    console.log("\nMATCHES:");
    matches.rows.forEach(row => {
      const match = JSON.parse(row.data);
      console.log(`ID: ${match.id}, Home: ${match.homeTeamId}, Away: ${match.awayTeamId}, Status: ${match.status}, isCompleted: ${match.isCompleted}`);
    });

    const settings = await db.execute("SELECT * FROM settings WHERE id = 'global'");
    if (settings.rows.length > 0) {
      console.log("\nSETTINGS:");
      console.log(settings.rows[0].data);
    }
  } catch (e) {
    console.error(e);
  }
}

run();
