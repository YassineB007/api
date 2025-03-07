import { NextResponse } from "next/server";
import pool from "@/lib/db"; // Adjust based on your structure

export async function GET() {
  try {
    const [tasks] = await pool.query("SELECT * FROM tasks");
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { user_id, name, description, difficulty } = await req.json();

    if (!user_id || !name || !description || !difficulty) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await pool.query(
      "INSERT INTO tasks (name, description, difficulty, user_id) VALUES (?, ?, ?, ?)",
      [name, description, difficulty, user_id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to add task" }, { status: 500 });
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { task_id } = await req.json();
    await pool.query("DELETE FROM tasks WHERE task_id = ?", [task_id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
