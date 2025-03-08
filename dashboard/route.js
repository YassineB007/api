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

    const { id } = await req.json();

    // Fetch only xp and rank fields from database
    const [users] = await pool.query("SELECT xp, rank FROM users WHERE id = ?", [id]);
    console.log("User Query Result:", users);

    if (users.length === 0) {
      console.log("User not found");
      await pool.end(); // Close pool before returning
      return new Response(
        JSON.stringify({ message: "User not found" }),
        { status: 404, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    const user = users[0];

    await pool.end(); // Close pool after query execution

    // Return only xp and rank values
    return new Response(
      JSON.stringify({ xp: user.xp, rank: user.rank }),
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*", // Allow all origins (can be restricted to specific domains)
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS", // Allow these HTTP methods
          "Access-Control-Allow-Headers": "Content-Type", // Allow headers (add more if needed)
        },
      }
    );
  } catch (error) {
    console.error("Server Error:", error);
    return new Response(
      JSON.stringify({ message: "Internal server error", error: error.message }),
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*", // Allow all origins
        },
      }
    );
  }
}
