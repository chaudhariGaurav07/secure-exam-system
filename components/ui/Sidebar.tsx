"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  HelpCircle,
  FileText,
  BookOpen,
  ClipboardList,
  Shield,
  Settings,
} from "lucide-react";

interface SidebarProps {
  role: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
  section?: string;
}

const navItems: NavItem[] = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: <LayoutDashboard size={16} />,
    roles: ["admin", "author", "reviewer", "exam_center"],
    section: "Main",
  },
  {
    label: "Question Bank",
    href: "/dashboard/questions",
    icon: <HelpCircle size={16} />,
    roles: ["admin", "author", "reviewer"],
    section: "Examination",
  },
  {
    label: "Templates",
    href: "/dashboard/templates",
    icon: <BookOpen size={16} />,
    roles: ["admin", "author", "reviewer"],
    section: "Examination",
  },
  {
    label: "Exam Papers",
    href: "/dashboard/papers",
    icon: <FileText size={16} />,
    roles: ["admin", "author", "reviewer", "exam_center"],
    section: "Examination",
  },
  {
    label: "Audit Log",
    href: "/dashboard/audit",
    icon: <ClipboardList size={16} />,
    roles: ["admin"],
    section: "Admin",
  },
  {
    label: "Blockchain",
    href: "/dashboard/blockchain",
    icon: <Shield size={16} />,
    roles: ["admin"],
    section: "Admin",
  },
];

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const allowed = navItems.filter((item) => item.roles.includes(role));

  // Group by section
  const sections = allowed.reduce<Record<string, NavItem[]>>((acc, item) => {
    const sec = item.section || "General";
    if (!acc[sec]) acc[sec] = [];
    acc[sec].push(item);
    return acc;
  }, {});

  return (
    <aside className="gov-sidebar" role="navigation" aria-label="Dashboard navigation">
      {Object.entries(sections).map(([section, items]) => (
        <div key={section} className="gov-sidebar-section">
          <div className="gov-sidebar-label">{section}</div>
          {items.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                id={`sidebar-link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                className={`gov-sidebar-link ${isActive ? "active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}

      {/* Bottom settings */}
      <div style={{ marginTop: "auto", padding: "0 1rem" }}>
        <div className="gov-sidebar-label" style={{ marginTop: "1rem" }}>Account</div>
        <Link
          href="/dashboard/settings"
          id="sidebar-link-settings"
          className={`gov-sidebar-link ${pathname === "/dashboard/settings" ? "active" : ""}`}
        >
          <Settings size={16} />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
