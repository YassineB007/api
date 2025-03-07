import { compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";

export async function POST(req) {
  try {
    const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT, JWT_SECRET } = process.env;

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

    const { id } = await req.json();

    // Fetch only xp and rank fields from database
    const [users] = await pool.query("SELECT xp, rank FROM users WHERE id = ?", [id]);
    console.log("User Query Result:", users);

    if (users.length === 0) {
      console.log("User not found");
      return new Response(JSON.stringify({ message: "User not found" }), { status: 400 });
    }

    const user = users[0];

    // Return only xp and rank values
    return new Response(JSON.stringify({ xp: user.xp, rank: user.rank }), { status: 200 });
  } catch (error) {
    console.error("Server Error:", error);
    return new Response(JSON.stringify({ message: "Internal server error", error: error.message }), { status: 500 });
  }
}
