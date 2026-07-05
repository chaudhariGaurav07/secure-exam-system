#!/usr/bin/env node
// scripts/seed-users.mjs
// Run: node scripts/seed-users.mjs
// Seeds 4 test users by calling the live /api/auth/register endpoint

const BASE_URL = "http://localhost:3000";

const USERS = [
  {
    name: "Admin User",
    email: "admin@secureexam.dev",
    password: "Admin@1234",
    role: "admin",
  },
  {
    name: "Author User",
    email: "author@secureexam.dev",
    password: "Author@1234",
    role: "author",
  },
  {
    name: "Reviewer User",
    email: "reviewer@secureexam.dev",
    password: "Reviewer@1234",
    role: "reviewer",
  },
  {
    name: "Exam Center User",
    email: "examcenter@secureexam.dev",
    password: "ExamCenter@1234",
    role: "exam_center",
  },
];

async function seedUsers() {
  console.log("\n🔐 Secure Exam System — User Seeder");
  console.log("═".repeat(50));
  console.log(`Connecting to: ${BASE_URL}\n`);

  const results = [];

  for (const user of USERS) {
    process.stdout.write(`  Creating [${user.role.padEnd(12)}] ${user.email} ... `);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        console.log("✅ Created");
        results.push({ ...user, id: String(data.user.id), status: "created" });
      } else {
        // User might already exist
        const msg = data.error || data.message || "unknown error";
        if (msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("already") || msg.toLowerCase().includes("unique")) {
          console.log("⚠️  Already exists (skipped)");
          results.push({ ...user, id: "already-exists", status: "exists" });
        } else {
          console.log(`❌ Failed: ${msg}`);
          results.push({ ...user, id: "—", status: "failed", reason: msg });
        }
      }
    } catch (err) {
      console.log(`❌ Network error: ${err.message}`);
      results.push({ ...user, id: "—", status: "error", reason: err.message });
    }
  }

  // Print summary table
  console.log("\n" + "═".repeat(70));
  console.log("  CREDENTIALS SUMMARY");
  console.log("═".repeat(70));

  const roleLabel = {
    admin: "Administrator",
    author: "Question Author",
    reviewer: "Reviewer",
    exam_center: "Exam Center",
  };

  for (const r of results) {
    console.log(`\n  Role   : ${roleLabel[r.role] || r.role}`);
    console.log(`  Name   : ${r.name}`);
    console.log(`  Email  : ${r.email}`);
    console.log(`  Pass   : ${r.password}`);
    console.log(`  Status : ${r.status === "created" ? "✅ Created" : r.status === "exists" ? "⚠️  Already Existed" : "❌ " + (r.reason || "Failed")}`);
    console.log("  " + "─".repeat(40));
  }

  console.log("\n  Login URL: http://localhost:3000/login");
  console.log("═".repeat(70) + "\n");
}

seedUsers().catch((e) => {
  console.error("Seed script crashed:", e);
  process.exit(1);
});
