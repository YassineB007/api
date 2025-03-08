import { compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";

export async function POST(req) {
  try {
    const pool = mysql.createPool({
      host: "srv1580.hstgr.io",
      user: "u634330012_yacineb007",
      password: "Lord edge1",
      database: "u634330012_task",
      port: parseInt("3306", 10), // Ensure port is a number
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    const { email, password } = await req.json();
    console.log("Login Request:", { email });  // Avoid logging sensitive data like passwords

    // Fetch user from database
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

    if (users.length === 0) {
      console.log("User not found");
      await pool.end();  // Close DB connection after query
      return new Response(
        JSON.stringify({ message: "User not found" }),
        { status: 404, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    const user = users[0];

    // Check password
    const isMatch = await compare(password, user.password_hash);

    if (!isMatch) {
      await pool.end();  // Close DB connection after query
      return new Response(
        JSON.stringify({ message: "Invalid password" }),
        { status: 401, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Generate JWT token with all user fields
    const tokenPayload = {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      surname: user.surname,
      birthdate: user.birthdate,
      age: user.age,
      xp: user.xp,
      rank: user.rank,
      profile_image: user.profile_image || "", // Include profile image URL
    };

    const token = jwt.sign(tokenPayload, "your_secret_key", { expiresIn: "1h" });

    return new Response(
      JSON.stringify({
        message: "Login successful",
        token,
        user: tokenPayload,
      }),
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*", // Allow all origins (can be restricted to specific domains)
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS", // Allow these HTTP methods
          "Access-Control-Allow-Headers": "Content-Type, Authorization", // Allow headers (add more if needed)
        },
      }
    );
  } catch (error) {
    console.error("Server Error:", error);
    return new Response(
      JSON.stringify({ message: "Internal server error", error: error.message }),
      {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" }, // Allow all origins
      }
    );
  }
}
