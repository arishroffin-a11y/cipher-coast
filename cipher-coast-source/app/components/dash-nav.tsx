import { NavLink } from "react-router";

export interface NavItem {
  to: string;
  label: string;
  minimum: string;
  reviewerOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Overview", minimum: "member" },
  { to: "/dashboard/tickets", label: "Tickets", minimum: "member" },
  { to: "/dashboard/shifts", label: "Shifts", minimum: "trial_moderator" },
  { to: "/dashboard/chat", label: "Staff Chat", minimum: "trial_moderator" },
  { to: "/dashboard/moderation", label: "Moderation", minimum: "trial_moderator" },
  { to: "/dashboard/training", label: "Training", minimum: "trial_moderator" },
  { to: "/dashboard/sessions", label: "Sessions", minimum: "moderator" },
  { to: "/dashboard/giveaways", label: "Giveaways", minimum: "member" },
  { to: "/dashboard/applications", label: "Applications", minimum: "member", reviewerOnly: true },
  { to: "/dashboard/staff", label: "Staff Management", minimum: "trial_moderator" },
  { to: "/dashboard/audit", label: "Audit & Stats", minimum: "trial_moderator" },
  { to: "/dashboard/panels", label: "Panel Builder", minimum: "owner" },
];

export function DashNav({ rank, isReviewer }: { rank: string; isReviewer: boolean }) {
  const order = ["member", "trial_moderator", "moderator", "senior_moderator", "management", "owner"];
  const level = Math.max(0, order.indexOf(rank));
  const items = NAV_ITEMS.filter((item) => {
    if (order.indexOf(item.minimum) > level) return false;
    if (item.reviewerOnly && !isReviewer) return false;
    return true;
  });
  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/dashboard"}
          className={({ isActive }) =>
            "rounded-lg px-3 py-2 text-sm whitespace-nowrap transition " + (isActive ? "bg-white text-black font-medium" : "text-white/70 hover:bg-white/10 hover:text-white")
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
