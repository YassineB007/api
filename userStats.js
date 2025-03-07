import mysql from "mysql2/promise";

// MySQL connection settings
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

export async function GET(req) {
  try {
    const pool = await mysql.createPool({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      port: DB_PORT,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    const userId = req.query.userId;  // assuming you send userId as a query parameter

    if (!userId) {
      return new Response(
        JSON.stringify({ message: "User ID is required" }),
        { status: 400 }
      );
    }

    // Fetch user stats from the database based on user ID
    const [userStats] = await pool.query(
      "SELECT rank, xp FROM users WHERE id = ?",
      [userId]
    );

    if (userStats.length === 0) {
      return new Response(
        JSON.stringify({ message: "User not found" }),
        { status: 404 }
      );
    }

    const { rank, xp } = userStats[0];

    return new Response(
      JSON.stringify({ rank, xp }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Database error:", error);
    return new Response(
      JSON.stringify({ message: "Internal server error", error: error.message }),
      { status: 500 }
    );
  }
}
