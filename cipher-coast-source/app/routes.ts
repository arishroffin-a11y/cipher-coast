import { index, layout, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("logout", "routes/logout.tsx"),
  route("apply", "routes/apply.tsx"),
  layout("routes/dash-layout.tsx", [
    route("dashboard", "routes/dashboard.tsx"),
    route("dashboard/tickets", "routes/dash-tickets.tsx"),
    route("dashboard/tickets/:id", "routes/dash-ticket.tsx"),
    route("dashboard/shifts", "routes/dash-shifts.tsx"),
    route("dashboard/chat", "routes/dash-chat.tsx"),
    route("dashboard/moderation", "routes/dash-moderation.tsx"),
    route("dashboard/training", "routes/dash-training.tsx"),
    route("dashboard/sessions", "routes/dash-sessions.tsx"),
    route("dashboard/giveaways", "routes/dash-giveaways.tsx"),
    route("dashboard/applications", "routes/dash-applications.tsx"),
    route("dashboard/applications/:id", "routes/dash-application.tsx"),
    route("dashboard/staff", "routes/dash-staff.tsx"),
    route("dashboard/audit", "routes/dash-audit.tsx"),
    route("dashboard/panels", "routes/dash-panels.tsx"),
  ]),
] satisfies RouteConfig;
