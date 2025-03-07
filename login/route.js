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

    const { email, password } = await req.json();
    console.log("Login Request:", { email, password });

    // Fetch user from database
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    console.log("User Query Result:", users);

    if (users.length === 0) {
      console.log("User not found");
      return new Response(JSON.stringify({ message: "User not found" }), { status: 400 });
    }

    const user = users[0];

    // Check password
    const isMatch = await compare(password, user.password_hash);
    console.log("Password Match:", isMatch);

    if (!isMatch) {
      return new Response(JSON.stringify({ message: "Invalid password" }), { status: 400 });
    }

    // Compute rank based on XP


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

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "1h" });

    console.log("Generated Token:", token);

    return new Response(
      JSON.stringify({
        message: "Login successful",
        token,
        user: tokenPayload,
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error("Server Error:", error);
    return new Response(JSON.stringify({ message: "Internal server error", error: error.message }), { status: 500 });
  }
}
