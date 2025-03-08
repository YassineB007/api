import { NextResponse } from "next/server";
import mysql from "mysql2/promise"; // Import mysql2 for creating a pool connection

// Create a pool connection to the database
const pool = mysql.createPool({
  host: "srv1580.hstgr.io",
  user: "u634330012_yacineb007",
  password: "Lord edge1",
  database: "u634330012_task",
  port: 3306, // Ensure the port is correctly set as a number
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Allow all origins, adjust if needed
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PATCH, DELETE", // Allow necessary HTTP methods
  "Access-Control-Allow-Headers": "Content-Type, Authorization", // Allow custom headers
};

// Handle OPTIONS request for pre-flight CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  try {
    const [tasks] = await pool.query("SELECT * FROM tasks");
    return NextResponse.json(tasks, { headers: corsHeaders });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(req) {
  try {
    const { user_id, name, description, difficulty } = await req.json();

    if (!user_id || !name || !description || !difficulty) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400, headers: corsHeaders });
    }

    await pool.query(
      "INSERT INTO tasks (name, description, difficulty, user_id) VALUES (?, ?, ?, ?)",
      [name, description, difficulty, user_id]
    );

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to add task" }, { status: 500, headers: corsHeaders });
  }
}

export async function PATCH(req) {
  try {
    const { task_id, status, user_id, difficulty } = await req.json();
    const completed_at = status === "Done" ? new Date() : null;

    await pool.query("UPDATE tasks SET status = ?, completed_at = ? WHERE task_id = ?", [
      status,
      completed_at,
      task_id,
    ]);

    if (status === "Done") {
      let xpGain = 0;
      if (difficulty === "Easy") xpGain = 10;
      else if (difficulty === "Medium") xpGain = 20;
      else if (difficulty === "Hard") xpGain = 30;

      // Update XP
      await pool.query("UPDATE users SET xp = xp + ? WHERE id = ?", [xpGain, user_id]);

      // Get updated XP
      const [user] = await pool.query("SELECT xp FROM users WHERE id = ?", [user_id]);
      const xp = user[0].xp;

      // Determine new rank
      let newRank = "F";
      if (xp >= 1200) newRank = "S";
      else if (xp >= 800) newRank = "A";
      else if (xp >= 500) newRank = "B";
      else if (xp >= 300) newRank = "C";
      else if (xp >= 150) newRank = "D";
      else if (xp >= 50) newRank = "E";

      // Update rank in the database
      await pool.query("UPDATE users SET rank = ? WHERE id = ?", [newRank, user_id]);
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(req) {
  try {
    const { task_id } = await req.json();
    await pool.query("DELETE FROM tasks WHERE task_id = ?", [task_id]);
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500, headers: corsHeaders });
  }
}
