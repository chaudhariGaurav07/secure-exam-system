import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import Navbar from "@/components/ui/Navbar";
import Sidebar from "@/components/ui/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth guard
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) redirect("/login");

  const payload = await verifyToken(token);
  if (!payload) redirect("/login");

  // Fetch user info
  let user: { id: string; name: string; role: string; email: string } | null = null;
  try {
    await connectDB();
    const dbUser = await User.findById(payload.id).select("name email role").lean();
    if (dbUser) {
      user = {
        id: String((dbUser as { _id: unknown })._id),
        name: (dbUser as { name: string }).name,
        email: (dbUser as { email: string }).email,
        role: (dbUser as { role: string }).role,
      };
    }
  } catch {
    redirect("/login");
  }

  if (!user) redirect("/login");

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar user={user} />
      <div className="dashboard-shell">
        <Sidebar role={user.role} />
        <main className="dashboard-main" id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
