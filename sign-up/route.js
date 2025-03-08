import { hash } from "bcryptjs";
import mysql from "mysql2/promise";

export async function POST(request) {
  try {
    const { name, surname, username, email, password, birthdate, imageUrl } =
      await request.json();

    // Validate required fields
    if (!name || !surname || !username || !email || !password || !birthdate) {
      return Response.json({ message: "All fields are required" }, { status: 400 });
    }

    // Create a pool connection to the database
    const pool = mysql.createPool({
      host: "srv1580.hstgr.io",
      user: "u634330012_yacineb007",
      password: "Lord edge1",
      database: "u634330012_task",
      port: 3306, // Use port 3306 as an integer
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    // Validate username uniqueness
    const [existingUser] = await pool.query("SELECT * FROM users WHERE username = ? || email = ?", [
      username, email
    ]);
    if (existingUser.length > 0) {
      await pool.end(); // Close the connection after query
      return Response.json({ message: "Username or email already taken" }, { status: 400 });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      await pool.end(); // Close the connection after query
      return Response.json(
        {
          message:
            "Password must be at least 8 characters, include one uppercase letter, one number, and one special character.",
        },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await hash(password, 10);

    // Calculate age
    const birthDateObj = new Date(birthdate);
    const today = new Date();
    const ageInYears = Math.floor(
      (today - birthDateObj) / (1000 * 60 * 60 * 24 * 365.25)
    );

    // Default values for XP and Rank
    const xp = 0;
    const rank = "F";

    // Insert user into database with image URL
    const [result] = await pool.query(
      `INSERT INTO users (name, surname, username, email, password_hash, birthdate, age, xp, rank, profile_image) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, surname, username, email, hashedPassword, birthdate, ageInYears, xp, rank, imageUrl]
    );

    await pool.end(); // Close the connection after query

    return Response.json(
      { message: "User registered successfully", id: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Database error:", error);
    return Response.json({ message: "Database error", error }, { status: 500 });
  }
}
