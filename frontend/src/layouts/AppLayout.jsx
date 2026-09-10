import React from "react";

const menus = {
  APPLICANT: [
    "Dashboard",
    "My Instruments",
    "New Application",
    "My Applications",
    "Certificates",
    "Profile",
  ],
  ADMIN: [
    "Dashboard",
    "Applications",
    "Assignments",
    "Officers",
    "Certificates",
    "Reports",
  ],
  OFFICER: ["My Jobs", "Inspection History", "Profile"],
};
export function AppLayout({ role, children }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          Legal Metrology<small>Verification Portal</small>
        </div>
        <nav>
          {menus[role].map((item, i) => (
            <a className={i === 0 ? "active" : ""} href="#" key={item}>
              {item}
            </a>
          ))}
        </nav>
      </aside>
      <main className="main">
        <header className="topbar">
          <span>{role.replace("_", " ")} PORTAL</span>
          <span className="avatar">U</span>
        </header>
        {children}
      </main>
    </div>
  );
}
