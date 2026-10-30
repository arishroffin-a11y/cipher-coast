import { DurableObject } from "cloudflare:workers";

export const RANKS = ["member", "trial_moderator", "moderator", "senior_moderator", "management", "owner"] as const;
export type Rank = (typeof RANKS)[number];

export function rankIndex(rank: string): number {
  const i = (RANKS as readonly string[]).indexOf(rank);
  return i < 0 ? 0 : i;
}

export function atLeast(rank: string, min: Rank): boolean {
  return rankIndex(rank) >= rankIndex(min);
}

export interface PublicUser {
  id: number;
  username: string;
  rank: string;
  isReviewer: boolean;
  createdAt: string;
}

export interface EmbedButton {
  label: string;
  style: string;
  action: string;
}

export interface EmbedPanel {
  title: string;
  description: string;
  color: string;
  bannerTop: string;
  bannerBottom: string;
  thumbnail: string;
  footer: string;
  showTimestamp: boolean;
  fields: { name: string; value: string }[];
  buttons: EmbedButton[];
}

export const EMBED_KEYS = [
  "verification",
  "ticket_assistance",
  "application_panel",
  "giveaway",
  "session_vote",
  "training",
  "staff_request",
  "loa",
] as const;

function panel(
  title: string,
  description: string,
  footer: string,
  buttons: EmbedButton[],
  fields: { name: string; value: string }[] = [],
): EmbedPanel {
  return {
    title,
    description,
    color: "#0b1220",
    bannerTop: "",
    bannerBottom: "",
    thumbnail: "",
    footer,
    showTimestamp: true,
    fields,
    buttons,
  };
}

export const DEFAULT_EMBEDS: Record<string, EmbedPanel> = {
  verification: panel(
    "Cipher Coast Verification",
    "Welcome to Cipher Coast Roleplay. Press **Verify** below and answer the short maths question to unlock the server.",
    "Cipher Coast Roleplay - Verification",
    [
      { label: "Verify", style: "primary", action: "verify" },
      { label: "Get Help", style: "secondary", action: "ticket" },
    ],
    [
      { name: "Verified role", value: "Granted automatically on a correct answer" },
      { name: "Attempts", value: "Unlimited - short cooldown after repeated failures" },
    ],
  ),
  ticket_assistance: panel(
    "Cipher Coast Assistance",
    "Need help from the staff team? Open a private ticket and a member of the support team will assist you.",
    "Cipher Coast Roleplay - Assistance",
    [{ label: "Open Ticket", style: "primary", action: "ticket_open" }],
    [{ name: "Support role", value: "Responds to your request" }],
  ),
  application_panel: panel(
    "Staff Applications",
    "Think you have what it takes to join the Cipher Coast Roleplay staff team? Start your application below.",
    "Cipher Coast Roleplay - Recruitment",
    [{ label: "Start Application", style: "primary", action: "application_start" }],
    [
      { name: "Requirements", value: "Read every question and answer honestly" },
      { name: "Review", value: "Reviewed by appointed application reviewers" },
    ],
  ),
  giveaway: panel(
    "Giveaway",
    "A new giveaway is live. Press **Enter** for your chance to win.",
    "Cipher Coast Roleplay - Giveaways",
    [{ label: "Enter", style: "success", action: "giveaway_enter" }],
  ),
  session_vote: panel(
    "Session Vote",
    "A session vote is open. Cast your vote below to help the team decide.",
    "Cipher Coast Roleplay - Sessions",
    [
      { label: "Vote", style: "primary", action: "session_vote" },
      { label: "Voters", style: "secondary", action: "session_voters" },
    ],
  ),
  training: panel(
    "Training Request",
    "Request a staff training session. A high rank will respond with a time.",
    "Cipher Coast Roleplay - Training",
    [{ label: "Request Training", style: "primary", action: "training_request" }],
  ),
  staff_request: panel(
    "Staff Request",
    "Submit a staff request while a session is active. Management will review it.",
    "Cipher Coast Roleplay - Staff Requests",
    [{ label: "Acknowledge", style: "secondary", action: "staff_request_ack" }],
  ),
  loa: panel(
    "Leave of Absence",
    "Request a leave of absence. Management will accept or deny with a reason.",
    "Cipher Coast Roleplay - LOA",
    [
      { label: "Accept", style: "success", action: "loa_accept" },
      { label: "Deny", style: "danger", action: "loa_deny" },
    ],
  ),
};

export const DEFAULT_CONFIG: Record<string, unknown> = {
  guildName: "Cipher Coast Roleplay",
  logsChannel: "#ccrp-logs",
  ticketCategory: "Assistance Tickets",
  supportRole: "Support Team",
  verifiedRole: "Verified",
  shiftRole: "On Shift",
  applicationReviewChannel: "#staff-applications",
  sessionAnnounceChannel: "#ccrp-announcements",
  sessionPingEveryone: false,
  sessionChannels: ["#ccrp-general", "#ccrp-sessions", "#ccrp-roleplay"],
  lockdownChannels: ["#ccrp-general", "#ccrp-sessions", "#ccrp-roleplay"],
  trainingPassTotal: 14,
  shiftAutoEndHours: 12,
};

const SCHEMA: string[] = [
  "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL, username_lower TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, salt TEXT NOT NULL, rank TEXT NOT NULL DEFAULT 'member', is_reviewer INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), expires_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS embeds (key TEXT PRIMARY KEY, config TEXT NOT NULL, updated_by INTEGER, updated_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS applications (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, answers TEXT NOT NULL, typing TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL DEFAULT (datetime('now')), submitted_at TEXT NOT NULL DEFAULT (datetime('now')), reviewer_id INTEGER, reviewer_name TEXT, decision_reason TEXT, decided_at TEXT)",
  "CREATE TABLE IF NOT EXISTS verifications (user_id INTEGER PRIMARY KEY, status TEXT NOT NULL DEFAULT 'unverified', question TEXT, answer INTEGER, attempts INTEGER NOT NULL DEFAULT 0, failed INTEGER NOT NULL DEFAULT 0, cooldown_until TEXT, verified_at TEXT, updated_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, body TEXT NOT NULL, read INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS audit_log (id INTEGER PRIMARY KEY AUTOINCREMENT, actor_id INTEGER, actor_name TEXT, action TEXT NOT NULL, detail TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS error_log (id INTEGER PRIMARY KEY AUTOINCREMENT, scope TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, read)",
  "CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log (created_at)",
  "CREATE INDEX IF NOT EXISTS idx_applications_status ON applications (status, created_at)",
];

const SCHEMA_B: string[] = [
  "CREATE TABLE IF NOT EXISTS tickets (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, type TEXT NOT NULL, subject TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open', claimant_id INTEGER, claimant_name TEXT, closer_id INTEGER, closer_name TEXT, close_reason TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), claimed_at TEXT, closed_at TEXT)",
  "CREATE TABLE IF NOT EXISTS ticket_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, ticket_id INTEGER NOT NULL, user_id INTEGER NOT NULL, author_name TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE INDEX IF NOT EXISTS idx_ticket_messages ON ticket_messages (ticket_id, id)",
  "CREATE TABLE IF NOT EXISTS giveaways (id INTEGER PRIMARY KEY AUTOINCREMENT, prize TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', winner_count INTEGER NOT NULL DEFAULT 1, host_id INTEGER NOT NULL, host_name TEXT NOT NULL, channel TEXT NOT NULL DEFAULT '#ccrp-giveaways', status TEXT NOT NULL DEFAULT 'active', winners TEXT NOT NULL DEFAULT '[]', rerolls INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')), ends_at TEXT NOT NULL, ended_at TEXT)",
  "CREATE TABLE IF NOT EXISTS giveaway_entries (id INTEGER PRIMARY KEY AUTOINCREMENT, giveaway_id INTEGER NOT NULL, user_id INTEGER NOT NULL, entered_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE (giveaway_id, user_id))",
  "CREATE TABLE IF NOT EXISTS game_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, host_id INTEGER NOT NULL, host_name TEXT NOT NULL, kind TEXT NOT NULL DEFAULT 'vote', status TEXT NOT NULL DEFAULT 'active', votes_yes INTEGER NOT NULL DEFAULT 0, votes_no INTEGER NOT NULL DEFAULT 0, lockdown INTEGER NOT NULL DEFAULT 0, channels TEXT NOT NULL DEFAULT '[]', notes TEXT NOT NULL DEFAULT '', vote_closes_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), ended_at TEXT)",
  "CREATE TABLE IF NOT EXISTS session_votes (id INTEGER PRIMARY KEY AUTOINCREMENT, session_id INTEGER NOT NULL, user_id INTEGER NOT NULL, user_name TEXT NOT NULL, choice TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE (session_id, user_id))",
  "CREATE TABLE IF NOT EXISTS session_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, session_id INTEGER NOT NULL, author TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS training_requests (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, user_name TEXT NOT NULL, time TEXT NOT NULL, date TEXT NOT NULL, ping TEXT NOT NULL DEFAULT '@High Rank', notes TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS trainings (id INTEGER PRIMARY KEY AUTOINCREMENT, request_id INTEGER, trainee_user_id INTEGER, trainee TEXT NOT NULL, trainer_id INTEGER NOT NULL, trainer_name TEXT NOT NULL, driving INTEGER NOT NULL, moderation INTEGER NOT NULL, total INTEGER NOT NULL, passed INTEGER NOT NULL, notes TEXT NOT NULL DEFAULT '', location TEXT NOT NULL DEFAULT '', held_on TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
];

const SCHEMA_C: string[] = [
  "CREATE TABLE IF NOT EXISTS shifts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, user_name TEXT NOT NULL, started_at TEXT NOT NULL, ended_at TEXT, status TEXT NOT NULL DEFAULT 'active', on_break INTEGER NOT NULL DEFAULT 0, break_minutes REAL NOT NULL DEFAULT 0, break_started_at TEXT, minutes REAL NOT NULL DEFAULT 0)",
  "CREATE INDEX IF NOT EXISTS idx_shifts_user ON shifts (user_id, status)",
  "CREATE TABLE IF NOT EXISTS shift_edits (id INTEGER PRIMARY KEY AUTOINCREMENT, shift_id INTEGER NOT NULL, actor_id INTEGER NOT NULL, actor_name TEXT NOT NULL, reason TEXT NOT NULL, before_value TEXT NOT NULL, after_value TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS staff_actions (id INTEGER PRIMARY KEY AUTOINCREMENT, actor_id INTEGER NOT NULL, actor_name TEXT NOT NULL, target_id INTEGER, target_name TEXT NOT NULL, type TEXT NOT NULL, summary TEXT NOT NULL, reason TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS loas (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, user_name TEXT NOT NULL, timeframe TEXT NOT NULL, start_date TEXT NOT NULL, end_date TEXT NOT NULL, reason TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', decided_by INTEGER, decision_reason TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), decided_at TEXT)",
  "CREATE TABLE IF NOT EXISTS staff_notes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, author_id INTEGER NOT NULL, author_name TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS mod_cases (id INTEGER PRIMARY KEY AUTOINCREMENT, moderator_id INTEGER NOT NULL, moderator_name TEXT NOT NULL, target TEXT NOT NULL, type TEXT NOT NULL, reason TEXT NOT NULL, evidence TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'open', created_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS chat_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, channel TEXT NOT NULL, user_id INTEGER NOT NULL, user_name TEXT NOT NULL, rank TEXT NOT NULL DEFAULT 'member', body TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE INDEX IF NOT EXISTS idx_chat_channel ON chat_messages (channel, id)",
];

export class PortalStore extends DurableObject {
  constructor(ctx: DurableObjectState, env: Record<string, unknown>) {
    super(ctx, env);
    for (const statement of SCHEMA) this.ctx.storage.sql.exec(statement);
    for (const statement of SCHEMA_B) this.ctx.storage.sql.exec(statement);
    for (const statement of SCHEMA_C) this.ctx.storage.sql.exec(statement);
    this.ctx.blockConcurrencyWhile(async () => {
      await this.seedOwners();
      this.seedDefaults();
    });
  }

  private rows(sql: string, ...params: unknown[]): Record<string, any>[] {
    return this.ctx.storage.sql.exec(sql, ...(params as any[])).toArray() as Record<string, any>[];
  }

  private row(sql: string, ...params: unknown[]): Record<string, any> | null {
    const found = this.rows(sql, ...params);
    return found.length ? found[0] : null;
  }

  private log(actorId: number | null, actorName: string | null, action: string, detail: string): void {
    this.ctx.storage.sql.exec("INSERT INTO audit_log (actor_id, actor_name, action, detail) VALUES (?, ?, ?, ?)", actorId, actorName, action, detail);
  }

  private user(userId: number): Record<string, any> | null {
    return this.row("SELECT id, username, rank, is_reviewer AS isReviewer, created_at AS createdAt FROM users WHERE id = ?", userId);
  }

  private requireOwner(actorId: number): Record<string, any> {
    const actor = this.user(actorId);
    if (!actor || actor.rank !== "owner") throw new Error("Only owners can perform this action.");
    return actor;
  }

  private requireReviewer(actorId: number): Record<string, any> {
    const actor = this.user(actorId);
    if (!actor || !(actor.rank === "owner" || actor.isReviewer === 1)) throw new Error("Only owners and appointed reviewers can review applications.");
    return actor;
  }

  private hex(buf: ArrayBuffer): string {
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  private salt(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  private async derive(password: string, saltHex: string): Promise<string> {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: new TextEncoder().encode(saltHex), iterations: 100000, hash: "SHA-256" }, key, 256);
    return this.hex(bits);
  }

  private async seedOwners(): Promise<void> {
    const seeds = [
      { username: "Katari", password: "121212" },
      { username: "Potato", password: "Potato" },
    ];
    for (const seed of seeds) {
      const existing = this.row("SELECT id FROM users WHERE username_lower = ?", seed.username.toLowerCase());
      if (existing) continue;
      const salt = this.salt();
      const hash = await this.derive(seed.password, salt);
      this.ctx.storage.sql.exec("INSERT INTO users (username, username_lower, password_hash, salt, rank) VALUES (?, ?, ?, ?, 'owner')", seed.username, seed.username.toLowerCase(), hash, salt);
      this.log(null, "system", "owner_seeded", "Owner account created for " + seed.username);
    }
  }

  private seedDefaults(): void {
    for (const [key, value] of Object.entries(DEFAULT_CONFIG)) {
      const existing = this.row("SELECT key FROM config WHERE key = ?", key);
      if (!existing) this.ctx.storage.sql.exec("INSERT INTO config (key, value) VALUES (?, ?)", key, JSON.stringify(value));
    }
    for (const key of EMBED_KEYS) {
      const existing = this.row("SELECT key FROM embeds WHERE key = ?", key);
      if (!existing) this.ctx.storage.sql.exec("INSERT INTO embeds (key, config) VALUES (?, ?)", key, JSON.stringify(DEFAULT_EMBEDS[key]));
    }
  }

  recordError(scope: string, message: string): void {
    this.ctx.storage.sql.exec("INSERT INTO error_log (scope, message) VALUES (?, ?)", scope, message);
    this.log(null, "system", "error", scope + ": " + message);
  }

  async status(): Promise<Record<string, unknown>> {
    const counts: Record<string, number> = {};
    const tables = ["users", "applications", "tickets", "giveaways", "game_sessions", "shifts", "trainings", "training_requests", "mod_cases", "loas", "staff_actions", "verifications", "chat_messages"];
    for (const t of tables) {
      const r = this.row("SELECT COUNT(*) AS c FROM " + t);
      counts[t] = r ? Number(r.c) : 0;
    }
    const errors = this.rows("SELECT id, scope, message, created_at AS createdAt FROM error_log ORDER BY id DESC LIMIT 10");
    const activeShifts = this.row("SELECT COUNT(*) AS c FROM shifts WHERE status = 'active'");
    return { ok: true, database: "connected", counts, activeShifts: activeShifts ? Number(activeShifts.c) : 0, recentErrors: errors, checkedAt: new Date().toISOString() };
  }

  async register(input: { username: string; password: string; confirm: string }): Promise<Record<string, unknown>> {
    const username = (input.username || "").trim();
    if (!/^[A-Za-z0-9_.@-]{3,24}$/.test(username)) return { ok: false, error: "Usernames must be 3-24 characters (letters, numbers, _ . @ -)." };
    if ((input.password || "").length < 4) return { ok: false, error: "Passwords must be at least 4 characters." };
    if (input.password !== input.confirm) return { ok: false, error: "The two passwords do not match." };
    const taken = this.row("SELECT id FROM users WHERE username_lower = ?", username.toLowerCase());
    if (taken) return { ok: false, error: "That username is already registered." };
    const salt = this.salt();
    const hash = await this.derive(input.password, salt);
    const created = this.row("INSERT INTO users (username, username_lower, password_hash, salt) VALUES (?, ?, ?, ?) RETURNING id", username, username.toLowerCase(), hash, salt);
    const userId = Number(created!.id);
    this.log(userId, username, "register", "New account registered");
    this.notify(userId, "Welcome to Cipher Coast Roleplay. Apply for staff to unlock the staff dashboard.");
    const token = await this.createSession(userId);
    return { ok: true, token, user: this.user(userId) };
  }

  async login(input: { username: string; password: string }): Promise<Record<string, unknown>> {
    const raw = (input.username || "").trim();
    const clean = raw.replace(/^@/, "");
    const record = this.row("SELECT id, username, password_hash AS hash, salt FROM users WHERE username_lower = ?", clean.toLowerCase());
    if (!record) return { ok: false, error: "Incorrect username or password." };
    const hash = await this.derive(input.password || "", record.salt);
    if (hash !== record.hash) return { ok: false, error: "Incorrect username or password." };
    const token = await this.createSession(Number(record.id));
    this.log(Number(record.id), record.username, "login", "Signed in");
    return { ok: true, token, user: this.user(Number(record.id)) };
  }

  private async createSession(userId: number): Promise<string> {
    const token = crypto.randomUUID() + "-" + this.salt();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    this.ctx.storage.sql.exec("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)", token, userId, expires);
    return token;
  }

  async userFromToken(token: string): Promise<PublicUser | null> {
    if (!token) return null;
    const found = this.row("SELECT user_id AS userId, expires_at AS expiresAt FROM sessions WHERE token = ?", token);
    if (!found) return null;
    if (new Date(found.expiresAt).getTime() < Date.now()) {
      this.ctx.storage.sql.exec("DELETE FROM sessions WHERE token = ?", token);
      return null;
    }
    const user = this.user(Number(found.userId));
    return user ? (user as unknown as PublicUser) : null;
  }

  logout(token: string): void {
    this.ctx.storage.sql.exec("DELETE FROM sessions WHERE token = ?", token);
  }

  listUsers(): Record<string, unknown>[] {
    return this.rows("SELECT id, username, rank, is_reviewer AS isReviewer, created_at AS createdAt FROM users ORDER BY rank, username");
  }

  setRank(actorId: number, userId: number, rank: string, reason: string): Record<string, unknown> {
    const actor = this.requireOwner(actorId);
    const target = this.user(userId);
    if (!target) return { ok: false, error: "That account no longer exists." };
    if (!(RANKS as readonly string[]).includes(rank)) return { ok: false, error: "Unknown rank." };
    if (target.id === actor.id && rank !== "owner") return { ok: false, error: "You cannot demote your own owner account." };
    this.ctx.storage.sql.exec("UPDATE users SET rank = ? WHERE id = ?", rank, userId);
    this.ctx.storage.sql.exec("INSERT INTO staff_actions (actor_id, actor_name, target_id, target_name, type, summary, reason) VALUES (?, ?, ?, ?, 'rank', ?, ?)", actor.id, actor.username, target.id, target.username, target.rank + " to " + rank, reason);
    this.log(actor.id, actor.username, "rank_change", target.username + ": " + target.rank + " to " + rank + " (" + reason + ")");
    this.notify(userId, "Your rank was changed to " + rank + " by " + actor.username + ". Reason: " + reason);
    return { ok: true, user: this.user(userId) };
  }

  setReviewer(actorId: number, userId: number, enabled: boolean): Record<string, unknown> {
    const actor = this.requireOwner(actorId);
    const target = this.user(userId);
    if (!target) return { ok: false, error: "That account no longer exists." };
    this.ctx.storage.sql.exec("UPDATE users SET is_reviewer = ? WHERE id = ?", enabled ? 1 : 0, userId);
    this.ctx.storage.sql.exec("INSERT INTO staff_actions (actor_id, actor_name, target_id, target_name, type, summary, reason) VALUES (?, ?, ?, ?, 'reviewer', ?, ?)", actor.id, actor.username, target.id, target.username, enabled ? "appointed application reviewer" : "removed application reviewer", "");
    this.log(actor.id, actor.username, "reviewer_change", target.username + (enabled ? " appointed as application reviewer" : " removed as application reviewer"));
    this.notify(userId, enabled ? "You were appointed as an application reviewer." : "Your application reviewer role was removed.");
    return { ok: true };
  }

  getConfig(): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const r of this.rows("SELECT key, value FROM config")) out[r.key] = JSON.parse(r.value);
    return out;
  }

  saveConfig(actorId: number, patch: Record<string, unknown>): Record<string, unknown> {
    const actor = this.requireOwner(actorId);
    for (const [key, value] of Object.entries(patch)) {
      this.ctx.storage.sql.exec("INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')", key, JSON.stringify(value));
    }
    this.log(actor.id, actor.username, "config_update", "Updated: " + Object.keys(patch).join(", "));
    return { ok: true, config: this.getConfig() };
  }

  listEmbeds(): Record<string, unknown>[] {
    return this.rows("SELECT key, config, updated_at AS updatedAt FROM embeds").map((r) => ({ key: r.key, panel: JSON.parse(r.config), updatedAt: r.updatedAt }));
  }

  getEmbed(key: string): Record<string, unknown> {
    const found = this.row("SELECT key, config FROM embeds WHERE key = ?", key);
    if (!found) return { key, panel: DEFAULT_EMBEDS[key] ?? DEFAULT_EMBEDS.verification };
    return { key: found.key, panel: JSON.parse(found.config) };
  }

  saveEmbed(actorId: number, key: string, input: EmbedPanel): Record<string, unknown> {
    const actor = this.requireOwner(actorId);
    const clean: EmbedPanel = {
      title: String(input.title ?? "").slice(0, 200),
      description: String(input.description ?? "").slice(0, 2000),
      color: /^#[0-9a-fA-F]{6}$/.test(String(input.color)) ? String(input.color) : "#0b1220",
      bannerTop: String(input.bannerTop ?? ""),
      bannerBottom: String(input.bannerBottom ?? ""),
      thumbnail: String(input.thumbnail ?? ""),
      footer: String(input.footer ?? "").slice(0, 200),
      showTimestamp: Boolean(input.showTimestamp),
      fields: (input.fields ?? []).slice(0, 12).map((f) => ({ name: String(f.name).slice(0, 120), value: String(f.value).slice(0, 400) })),
      buttons: (input.buttons ?? []).slice(0, 5).map((b) => ({ label: String(b.label).slice(0, 60), style: String(b.style), action: String(b.action) })),
    };
    this.ctx.storage.sql.exec("INSERT INTO embeds (key, config, updated_by, updated_at) VALUES (?, ?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET config = excluded.config, updated_by = excluded.updated_by, updated_at = datetime('now')", key, JSON.stringify(clean), actor.id);
    this.log(actor.id, actor.username, "embed_update", "Panel updated: " + key);
    return { ok: true, panel: clean };
  }

  notify(userId: number, body: string): void {
    this.ctx.storage.sql.exec("INSERT INTO notifications (user_id, body) VALUES (?, ?)", userId, body);
  }

  listNotifications(userId: number): Record<string, unknown>[] {
    return this.rows("SELECT id, body, read, created_at AS createdAt FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 50", userId);
  }

  markNotificationsRead(userId: number): void {
    this.ctx.storage.sql.exec("UPDATE notifications SET read = 1 WHERE user_id = ?", userId);
  }

  submitApplication(userId: number, answers: Record<string, string>, typing: Record<string, unknown>, acknowledgment: boolean): Record<string, unknown> {
    if (!acknowledgment) return { ok: false, error: "You must confirm the typing-tracking notice before applying." };
    const pending = this.row("SELECT id FROM applications WHERE user_id = ? AND status = 'pending'", userId);
    if (pending) return { ok: false, error: "You already have an application under review." };
    const answers2 = answers || {};
    const answered = Object.values(answers2).filter((v) => String(v || "").trim().length > 0).length;
    if (answered < 20) return { ok: false, error: "Answer every question before submitting (" + answered + " of 23 answered)." };
    const created = this.row("INSERT INTO applications (user_id, answers, typing) VALUES (?, ?, ?) RETURNING id", userId, JSON.stringify(answers2), JSON.stringify(typing || {}));
    const id = Number(created!.id);
    const applicant = this.user(userId);
    const name = applicant ? applicant.username : String(userId);
    this.log(userId, name, "application_submitted", "Application #" + id);
    for (const reviewer of this.rows("SELECT id FROM users WHERE rank = 'owner' OR is_reviewer = 1")) this.notify(Number(reviewer.id), "New staff application #" + id + " from " + name);
    return { ok: true, id };
  }

  myApplication(userId: number): Record<string, unknown> | null {
    return this.row("SELECT id, status, created_at AS createdAt, reviewer_name AS reviewerName, decision_reason AS reason, decided_at AS decidedAt FROM applications WHERE user_id = ? ORDER BY id DESC LIMIT 1", userId) ?? null;
  }

  listApplications(): Record<string, unknown>[] {
    return this.rows("SELECT a.id, a.status, a.created_at AS createdAt, a.decided_at AS decidedAt, a.reviewer_name AS reviewerName, a.decision_reason AS reason, u.username, u.id AS userId, u.rank FROM applications a JOIN users u ON u.id = a.user_id ORDER BY CASE a.status WHEN 'pending' THEN 0 ELSE 1 END, a.id DESC");
  }

  getApplication(currentUserId: number, applicationId: number, canReview: boolean): Record<string, unknown> {
    const found = this.row("SELECT a.*, u.username, u.rank FROM applications a JOIN users u ON u.id = a.user_id WHERE a.id = ?", applicationId);
    if (!found) throw new Error("Application not found.");
    if (!canReview && Number(found.user_id) !== currentUserId) throw new Error("This application is private.");
    return {
      id: found.id,
      userId: found.user_id,
      username: found.username,
      rank: found.rank,
      status: found.status,
      answers: JSON.parse(found.answers),
      typing: JSON.parse(found.typing),
      createdAt: found.created_at,
      reviewerName: found.reviewer_name,
      reason: found.decision_reason,
      decidedAt: found.decided_at,
    };
  }

  decideApplication(actorId: number, applicationId: number, decision: string, reason: string): Record<string, unknown> {
    const actor = this.requireReviewer(actorId);
    if (decision !== "accepted" && decision !== "denied") return { ok: false, error: "Unknown decision." };
    if (!reason || reason.trim().length < 4) return { ok: false, error: "A decision reason is required." };
    const found = this.row("SELECT id, user_id, status FROM applications WHERE id = ?", applicationId);
    if (!found) return { ok: false, error: "Application not found." };
    if (found.status !== "pending") return { ok: false, error: "That application was already decided." };
    this.ctx.storage.sql.exec("UPDATE applications SET status = ?, reviewer_id = ?, reviewer_name = ?, decision_reason = ?, decided_at = datetime('now') WHERE id = ?", decision, actor.id, actor.username, reason, applicationId);
    const applicantId = Number(found.user_id);
    if (decision === "accepted") {
      const applicant = this.user(applicantId);
      if (applicant && rankIndex(applicant.rank) < rankIndex("trial_moderator")) {
        this.ctx.storage.sql.exec("UPDATE users SET rank = 'trial_moderator' WHERE id = ?", applicantId);
      }
      this.notify(applicantId, "Your staff application was ACCEPTED by " + actor.username + ". You now hold the Trial Moderator rank with dashboard access. Reason: " + reason);
      this.log(actor.id, actor.username, "application_accepted", "Application #" + applicationId + " (" + reason + ")");
    } else {
      this.notify(applicantId, "Your staff application was DENIED by " + actor.username + ". Reason: " + reason);
      this.log(actor.id, actor.username, "application_denied", "Application #" + applicationId + " (" + reason + ")");
    }
    return { ok: true };
  }

  verificationState(userId: number): Record<string, unknown> {
    const found = this.row("SELECT status, question, attempts, failed, cooldown_until AS cooldownUntil, verified_at AS verifiedAt FROM verifications WHERE user_id = ?", userId);
    if (!found) return { status: "unverified", attempts: 0, failed: 0 };
    return { status: found.status, attempts: Number(found.attempts), failed: Number(found.failed), question: found.question, cooldownUntil: found.cooldownUntil, verifiedAt: found.verifiedAt };
  }

  startVerification(userId: number): Record<string, unknown> {
    const state = this.verificationState(userId);
    if (state.status === "verified") return { ok: false, error: "This account is already verified." };
    if (state.cooldownUntil && new Date(String(state.cooldownUntil)).getTime() > Date.now()) return { ok: false, error: "Too many incorrect answers. Try again after the cooldown." };
    const a = 1 + Math.floor(Math.random() * 20);
    const b = 1 + Math.floor(Math.random() * 20);
    const add = Math.random() > 0.4;
    const question = add ? a + " + " + b : Math.max(a, b) + " - " + Math.min(a, b);
    const answer = add ? a + b : Math.max(a, b) - Math.min(a, b);
    this.ctx.storage.sql.exec("INSERT INTO verifications (user_id, status, question, answer, attempts, failed, cooldown_until, updated_at) VALUES (?, 'pending', ?, ?, 1, 0, NULL, datetime('now')) ON CONFLICT(user_id) DO UPDATE SET status = 'pending', question = excluded.question, answer = excluded.answer, attempts = attempts + 1, cooldown_until = NULL, updated_at = datetime('now')", userId, question, answer);
    return { ok: true, question };
  }

  answerVerification(userId: number, answer: string): Record<string, unknown> {
    const found = this.row("SELECT status, question, answer, failed, cooldown_until AS cooldownUntil FROM verifications WHERE user_id = ?", userId);
    if (!found) return { ok: false, error: "Start verification first." };
    if (found.status === "verified") return { ok: false, error: "This account is already verified." };
    if (found.cooldownUntil && new Date(found.cooldownUntil).getTime() > Date.now()) return { ok: false, error: "Verification is on cooldown. Try again shortly." };
    if (!/^-?[0-9]+$/.test(String(answer).trim())) return { ok: false, error: "Enter a whole number." };
    const user = this.user(userId);
    const name = user ? user.username : String(userId);
    if (Number(answer) === Number(found.answer)) {
      this.ctx.storage.sql.exec("UPDATE verifications SET status = 'verified', verified_at = datetime('now'), failed = 0, cooldown_until = NULL, question = NULL, answer = NULL, updated_at = datetime('now') WHERE user_id = ?", userId);
      const config = this.getConfig();
      this.log(userId, name, "verified", "Granted role " + String(config.verifiedRole));
      this.notify(userId, "Verification complete. The " + String(config.verifiedRole) + " role was granted server-side.");
      return { ok: true, verified: true, role: config.verifiedRole };
    }
    const failed = Number(found.failed) + 1;
    const cooldown = failed >= 3 ? new Date(Date.now() + 45000).toISOString() : null;
    this.ctx.storage.sql.exec("UPDATE verifications SET failed = ?, cooldown_until = ?, updated_at = datetime('now') WHERE user_id = ?", failed, cooldown, userId);
    this.log(userId, name, "verification_failed", "Attempt " + failed);
    return { ok: true, verified: false, failed, cooldownUntil: cooldown, error: cooldown ? "Three incorrect answers - a short cooldown was applied." : "That answer was incorrect. Try again." };
  }

  private nowIso(): string {
    return new Date().toISOString();
  }

  // ---- tickets ----

  createTicket(userId: number, type: string, subject: string): Record<string, unknown> {
    const clean = (subject || "").trim();
    if (clean.length < 4) return { ok: false, error: "Describe your request in a few words." };
    const existing = this.row("SELECT id FROM tickets WHERE user_id = ? AND type = ? AND status != 'closed'", userId, type);
    if (existing) return { ok: false, error: "You already have an open ticket (#" + existing.id + "). Duplicate tickets are not allowed." };
    const user = this.user(userId);
    const created = this.row("INSERT INTO tickets (user_id, type, subject) VALUES (?, ?, ?) RETURNING id", userId, type, clean);
    const id = Number(created!.id);
    this.ctx.storage.sql.exec("INSERT INTO ticket_messages (ticket_id, user_id, author_name, body) VALUES (?, ?, ?, ?)", id, userId, user ? user.username : "member", clean);
    this.log(userId, user ? user.username : String(userId), "ticket_opened", "Ticket #" + id + " (" + type + ")");
    for (const staff of this.rows("SELECT id FROM users WHERE rank IN ('trial_moderator','moderator','senior_moderator','management','owner')")) this.notify(Number(staff.id), "New " + type + " ticket #" + id + " from " + (user ? user.username : "a member"));
    return { ok: true, id };
  }

  listTickets(viewerId: number, isStaff: boolean): Record<string, unknown>[] {
    const base = "SELECT t.id, t.type, t.subject, t.status, t.claimant_id AS claimantId, t.claimant_name AS claimantName, t.closer_name AS closerName, t.close_reason AS closeReason, t.created_at AS createdAt, t.claimed_at AS claimedAt, t.closed_at AS closedAt, u.username, (SELECT COUNT(*) FROM ticket_messages m WHERE m.ticket_id = t.id) AS messages FROM tickets t JOIN users u ON u.id = t.user_id";
    if (isStaff) return this.rows(base + " ORDER BY CASE t.status WHEN 'open' THEN 0 WHEN 'claimed' THEN 1 ELSE 2 END, t.id DESC LIMIT 100");
    return this.rows(base + " WHERE t.user_id = ? ORDER BY t.id DESC LIMIT 50", viewerId);
  }

  getTicket(viewerId: number, ticketId: number, isStaff: boolean): Record<string, unknown> {
    const found = this.row("SELECT t.*, u.username FROM tickets t JOIN users u ON u.id = t.user_id WHERE t.id = ?", ticketId);
    if (!found) throw new Error("Ticket not found.");
    if (!isStaff && Number(found.user_id) !== viewerId) throw new Error("That ticket is private.");
    return { ...found, messages: this.rows("SELECT id, user_id AS userId, author_name AS authorName, body, created_at AS createdAt FROM ticket_messages WHERE ticket_id = ? ORDER BY id", ticketId) };
  }

  addTicketMessage(ticketId: number, userId: number, body: string, isStaff: boolean): Record<string, unknown> {
    const ticket = this.row("SELECT id, user_id, status FROM tickets WHERE id = ?", ticketId);
    if (!ticket) return { ok: false, error: "Ticket not found." };
    if (ticket.status === "closed") return { ok: false, error: "This ticket is closed." };
    if (!isStaff && Number(ticket.user_id) !== userId) return { ok: false, error: "That ticket is private." };
    const clean = (body || "").trim();
    if (!clean) return { ok: false, error: "Write a message first." };
    const user = this.user(userId);
    this.ctx.storage.sql.exec("INSERT INTO ticket_messages (ticket_id, user_id, author_name, body) VALUES (?, ?, ?, ?)", ticketId, userId, user ? user.username : "member", clean.slice(0, 2000));
    if (isStaff && Number(ticket.user_id) !== userId) this.notify(Number(ticket.user_id), "Staff replied to your ticket #" + ticketId + ".");
    return { ok: true };
  }

  claimTicket(actorId: number, ticketId: number): Record<string, unknown> {
    const actor = this.user(actorId);
    if (!actor || rankIndex(actor.rank) < rankIndex("trial_moderator")) return { ok: false, error: "Only the support team can claim tickets." };
    const ticket = this.row("SELECT id, status, claimant_id AS claimantId FROM tickets WHERE id = ?", ticketId);
    if (!ticket) return { ok: false, error: "Ticket not found." };
    if (ticket.status === "closed") return { ok: false, error: "This ticket is already closed." };
    if (ticket.claimantId) return { ok: false, error: "Ticket already claimed by " + String(ticket.claimantId) + "." };
    this.ctx.storage.sql.exec("UPDATE tickets SET status = 'claimed', claimant_id = ?, claimant_name = ?, claimed_at = ? WHERE id = ?", actorId, actor.username, this.nowIso(), ticketId);
    this.log(actorId, actor.username, "ticket_claimed", "Ticket #" + ticketId);
    return { ok: true };
  }

  unclaimTicket(actorId: number, ticketId: number): Record<string, unknown> {
    const actor = this.user(actorId);
    if (!actor) return { ok: false, error: "Account not found." };
    const ticket = this.row("SELECT id, status, claimant_id AS claimantId FROM tickets WHERE id = ?", ticketId);
    if (!ticket) return { ok: false, error: "Ticket not found." };
    if (Number(ticket.claimantId) !== actorId) return { ok: false, error: "Only the staff member who claimed this ticket can unclaim it." };
    if (ticket.status === "closed") return { ok: false, error: "Closed tickets cannot be unclaimed." };
    this.ctx.storage.sql.exec("UPDATE tickets SET status = 'open', claimant_id = NULL, claimant_name = NULL, claimed_at = NULL WHERE id = ?", ticketId);
    this.log(actorId, actor.username, "ticket_unclaimed", "Ticket #" + ticketId);
    return { ok: true };
  }

  renameTicket(actorId: number, ticketId: number, name: string): Record<string, unknown> {
    const actor = this.user(actorId);
    if (!actor || rankIndex(actor.rank) < rankIndex("trial_moderator")) return { ok: false, error: "Only the support team can rename tickets." };
    const clean = (name || "").trim();
    if (clean.length < 2) return { ok: false, error: "Enter a new ticket name." };
    const ticket = this.row("SELECT id, subject FROM tickets WHERE id = ?", ticketId);
    if (!ticket) return { ok: false, error: "Ticket not found." };
    this.ctx.storage.sql.exec("UPDATE tickets SET subject = ? WHERE id = ?", "ticket-" + clean.replace(/[^A-Za-z0-9-]+/g, "-").toLowerCase(), ticketId);
    this.log(actorId, actor.username, "ticket_renamed", "Ticket #" + ticketId + " renamed to " + clean);
    return { ok: true };
  }

  closeTicket(actorId: number, ticketId: number, reason: string): Record<string, unknown> {
    const actor = this.user(actorId);
    if (!actor) return { ok: false, error: "Account not found." };
    const ticket = this.row("SELECT id, user_id, status, claimant_id AS claimantId, subject FROM tickets WHERE id = ?", ticketId);
    if (!ticket) return { ok: false, error: "Ticket not found." };
    if (ticket.status === "closed") return { ok: false, error: "This ticket is already closed." };
    if (ticket.status !== "claimed") return { ok: false, error: "Closing is disabled until the ticket has been claimed." };
    const isManager = rankIndex(actor.rank) >= rankIndex("management");
    if (Number(ticket.claimantId) !== actorId && !isManager) return { ok: false, error: "Only the staff member who claimed this ticket can close it." };
    const clean = (reason || "").trim();
    if (clean.length < 3) return { ok: false, error: "A close reason is required." };
    const messages = this.rows("SELECT author_name AS author, body, created_at AS createdAt FROM ticket_messages WHERE ticket_id = ? ORDER BY id", ticketId);
    const transcript = messages.map((m) => "[" + String(m.createdAt) + "] " + String(m.author) + ": " + String(m.body)).join("\n");
    this.ctx.storage.sql.exec("UPDATE tickets SET status = 'closed', closer_id = ?, closer_name = ?, close_reason = ?, closed_at = ? WHERE id = ?", actor.id, actor.username, clean, this.nowIso(), ticketId);
    this.log(actor.id, actor.username, "ticket_closed", "Ticket #" + ticketId + " | claimant: " + String(ticket.claimantId ?? "none") + " | closer: " + actor.username + " | reason: " + clean);
    this.ctx.storage.sql.exec("INSERT INTO audit_log (actor_id, actor_name, action, detail) VALUES (?, ?, 'ticket_transcript', ?)", actor.id, actor.username, "Ticket #" + ticketId + " transcript\n" + transcript.slice(0, 4000));
    this.notify(Number(ticket.user_id), "Your ticket #" + ticketId + " was closed by " + actor.username + ". Reason: " + clean);
    return { ok: true, transcript };
  }

  // ---- giveaways ----

  createGiveaway(actorId: number, input: { prize: string; description: string; minutes: number; winners: number; channel: string }): Record<string, unknown> {
    const actor = this.user(actorId);
    if (!actor || rankIndex(actor.rank) < rankIndex("moderator")) return { ok: false, error: "Only moderators and above can manage giveaways." };
    const prize = (input.prize || "").trim();
    if (!prize) return { ok: false, error: "A prize is required." };
    const minutes = Math.max(1, Math.min(10080, Number(input.minutes) || 60));
    const winners = Math.max(1, Math.min(50, Number(input.winners) || 1));
    const endsAt = new Date(Date.now() + minutes * 60000).toISOString();
    const created = this.row("INSERT INTO giveaways (prize, description, winner_count, host_id, host_name, channel, ends_at) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id", prize, (input.description || "").slice(0, 600), winners, actor.id, actor.username, input.channel || "#ccrp-giveaways", endsAt);
    const id = Number(created!.id);
    this.log(actor.id, actor.username, "giveaway_created", "Giveaway #" + id + " for " + prize);
    return { ok: true, id };
  }

  listGiveaways(viewerId: number): Record<string, unknown>[] {
    return this.rows("SELECT g.id, g.prize, g.description, g.winner_count AS winnerCount, g.host_name AS hostName, g.channel, g.status, g.winners, g.rerolls, g.created_at AS createdAt, g.ends_at AS endsAt, g.ended_at AS endedAt, (SELECT COUNT(*) FROM giveaway_entries e WHERE e.giveaway_id = g.id) AS entries, (SELECT COUNT(*) FROM giveaway_entries e WHERE e.giveaway_id = g.id AND e.user_id = ?) AS entered FROM giveaways g ORDER BY g.id DESC LIMIT 50", viewerId);
  }

  enterGiveaway(giveawayId: number, userId: number): Record<string, unknown> {
    const giveaway = this.row("SELECT id, status, ends_at AS endsAt FROM giveaways WHERE id = ?", giveawayId);
    if (!giveaway) return { ok: false, error: "Giveaway not found." };
    if (giveaway.status !== "active") return { ok: false, error: "That giveaway has ended." };
    if (new Date(giveaway.endsAt).getTime() < Date.now()) return { ok: false, error: "That giveaway has expired." };
    const already = this.row("SELECT id FROM giveaway_entries WHERE giveaway_id = ? AND user_id = ?", giveawayId, userId);
    if (already) return { ok: false, error: "You already entered this giveaway." };
    this.ctx.storage.sql.exec("INSERT INTO giveaway_entries (giveaway_id, user_id) VALUES (?, ?)", giveawayId, userId);
    return { ok: true };
  }

  private pickWinners(giveawayId: number, count: number): string[] {
    const entries = this.rows("SELECT e.user_id AS userId, u.username FROM giveaway_entries e JOIN users u ON u.id = e.user_id WHERE e.giveaway_id = ?", giveawayId);
    const pool = entries.map((e) => String(e.username));
    const winners: string[] = [];
    while (pool.length > 0 && winners.length < count) {
      const index = Math.floor(Math.random() * pool.length);
      winners.push(pool.splice(index, 1)[0]);
    }
    return winners;
  }

  endGiveaway(actorId: number, giveawayId: number): Record<string, unknown> {
    const actor = this.user(actorId);
    if (!actor || rankIndex(actor.rank) < rankIndex("moderator")) return { ok: false, error: "Only moderators and above can end giveaways." };
    const giveaway = this.row("SELECT id, status, winner_count AS winnerCount FROM giveaways WHERE id = ?", giveawayId);
    if (!giveaway) return { ok: false, error: "Giveaway not found." };
    if (giveaway.status !== "active") return { ok: false, error: "That giveaway already ended." };
    const winners = this.pickWinners(giveawayId, Number(giveaway.winnerCount));
    this.ctx.storage.sql.exec("UPDATE giveaways SET status = 'ended', winners = ?, ended_at = ? WHERE id = ?", JSON.stringify(winners), this.nowIso(), giveawayId);
    for (const winner of winners) {
      const target = this.row("SELECT id FROM users WHERE username = ?", winner);
      if (target) this.notify(Number(target.id), "You won giveaway #" + giveawayId + ".");
    }
    this.log(actor.id, actor.username, "giveaway_ended", "Giveaway #" + giveawayId + " winners: " + (winners.join(", ") || "none"));
    return { ok: true, winners };
  }

  rerollGiveaway(actorId: number, giveawayId: number): Record<string, unknown> {
    const actor = this.user(actorId);
    if (!actor || rankIndex(actor.rank) < rankIndex("moderator")) return { ok: false, error: "Only moderators and above can reroll giveaways." };
    const giveaway = this.row("SELECT id, status, winner_count AS winnerCount, rerolls FROM giveaways WHERE id = ?", giveawayId);
    if (!giveaway) return { ok: false, error: "Giveaway not found." };
    if (giveaway.status !== "ended") return { ok: false, error: "End the giveaway before rerolling." };
    const winners = this.pickWinners(giveawayId, Number(giveaway.winnerCount));
    this.ctx.storage.sql.exec("UPDATE giveaways SET winners = ?, rerolls = ? WHERE id = ?", JSON.stringify(winners), Number(giveaway.rerolls) + 1, giveawayId);
    this.log(actor.id, actor.username, "giveaway_rerolled", "Giveaway #" + giveawayId + " winners: " + (winners.join(", ") || "none"));
    return { ok: true, winners };
  }

  // ---- sessions ----

  startSession(actorId: number, kind: string, notes: string): Record<string, unknown> {
    const actor = this.user(actorId);
    if (!actor || rankIndex(actor.rank) < rankIndex("moderator")) return { ok: false, error: "Only moderators and above can manage sessions." };
    const active = this.row("SELECT id FROM game_sessions WHERE status = 'active'");
    if (active) return { ok: false, error: "Session #" + active.id + " is still active. End it first." };
    const config = this.getConfig();
    const channels = JSON.stringify(kind === "vote" ? config.sessionChannels : config.lockdownChannels);
    const lockdown = kind === "full" ? 1 : 0;
    const created = this.row("INSERT INTO game_sessions (host_id, host_name, kind, notes, channels, lockdown, vote_closes_at) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id", actor.id, actor.username, kind, (notes || "").slice(0, 500), channels, lockdown, kind === "vote" ? new Date(Date.now() + 5 * 60000).toISOString() : null);
    const id = Number(created!.id);
    this.ctx.storage.sql.exec("INSERT INTO session_messages (session_id, author, body) VALUES (?, ?, ?)", id, "system", "Session started by " + actor.username + " (" + kind + ")" + (lockdown ? " - channels locked down: " + (config.lockdownChannels as string[]).join(", ") : ""));
    this.ctx.storage.sql.exec("INSERT INTO session_messages (session_id, author, body) VALUES (?, ?, ?)", id, "system", "Announcement posted in " + String(config.sessionAnnounceChannel) + (config.sessionPingEveryone ? " with @everyone ping" : " without a ping"));
    this.log(actor.id, actor.username, "session_started", "Session #" + id + " (" + kind + ")");
    return { ok: true, id };
  }

  listSessions(): Record<string, unknown>[] {
    const sessions = this.rows("SELECT s.id, s.kind, s.status, s.host_name AS hostName, s.votes_yes AS votesYes, s.votes_no AS votesNo, s.lockdown, s.channels, s.notes, s.created_at AS createdAt, s.ended_at AS endedAt, (SELECT COUNT(*) FROM session_votes v WHERE v.session_id = s.id) AS voters FROM game_sessions s ORDER BY s.id DESC LIMIT 25");
    return sessions.map((s) => ({
      ...s,
      votes: this.rows("SELECT user_name AS user, choice, created_at AS createdAt FROM session_votes WHERE session_id = ? ORDER BY id", s.id),
      messages: this.rows("SELECT author, body, created_at AS createdAt FROM session_messages WHERE session_id = ? ORDER BY id", s.id),
    }));
  }

  voteSession(sessionId: number, userId: number, choice: string): Record<string, unknown> {
    const session = this.row("SELECT id, status, kind FROM game_sessions WHERE id = ?", sessionId);
    if (!session) return { ok: false, error: "Session not found." };
    if (session.status !== "active") return { ok: false, error: "That session has ended." };
    if (choice !== "yes" && choice !== "no") return { ok: false, error: "Vote yes or no." };
    const already = this.row("SELECT id FROM session_votes WHERE session_id = ? AND user_id = ?", sessionId, userId);
    if (already) return { ok: false, error: "You already voted in this session." };
    const user = this.user(userId);
    this.ctx.storage.sql.exec("INSERT INTO session_votes (session_id, user_id, user_name, choice) VALUES (?, ?, ?, ?)", sessionId, userId, user ? user.username : "member", choice);
    this.ctx.storage.sql.exec("UPDATE game_sessions SET votes_yes = votes_yes + ?, votes_no = votes_no + ? WHERE id = ?", choice === "yes" ? 1 : 0, choice === "no" ? 1 : 0, sessionId);
    return { ok: true };
  }

  endSession(actorId: number, sessionId: number): Record<string, unknown> {
    const actor = this.user(actorId);
    if (!actor) return { ok: false, error: "Account not found." };
    const session = this.row("SELECT id, status, host_id AS hostId, lockdown FROM game_sessions WHERE id = ?", sessionId);
    if (!session) return { ok: false, error: "Session not found." };
    if (session.status !== "active") return { ok: false, error: "That session already ended." };
    if (Number(session.hostId) !== actorId && rankIndex(actor.rank) < rankIndex("moderator")) return { ok: false, error: "Only the session host or a moderator can end this session." };
    const owned = this.rows("SELECT COUNT(*) AS c FROM session_messages WHERE session_id = ?", sessionId);
    this.ctx.storage.sql.exec("DELETE FROM session_messages WHERE session_id = ?", sessionId);
    this.ctx.storage.sql.exec("UPDATE game_sessions SET status = 'ended', ended_at = ?, lockdown = 0 WHERE id = ?", this.nowIso(), sessionId);
    const cleanupCount = owned.length ? Number(owned[0].c) : 0;
    this.log(actor.id, actor.username, "session_ended", "Session #" + sessionId + " | cleaned " + cleanupCount + " session messages | channel permissions restored");
    return { ok: true, cleanedMessages: cleanupCount, permissionsRestored: true };
  }

  // ---- training ----

  requestTraining(userId: number, input: { time: string; date: string; notes: string }): Record<string, unknown> {
    if (!input.time || !input.date) return { ok: false, error: "Time and date are required." };
    const user = this.user(userId);
    const created = this.row("INSERT INTO training_requests (user_id, user_name, time, date, notes) VALUES (?, ?, ?, ?, ?) RETURNING id", userId, user ? user.username : "member", input.time.slice(0, 60), input.date.slice(0, 40), (input.notes || "").slice(0, 500));
    const id = Number(created!.id);
    this.log(userId, user ? user.username : String(userId), "training_requested", "Request #" + id + " for " + input.date + " " + input.time);
    for (const staff of this.rows("SELECT id FROM users WHERE rank IN ('management','owner')")) this.notify(Number(staff.id), "Training request #" + id + " from " + (user ? user.username : "a member"));
    return { ok: true, id };
  }

  listTrainingRequests(): Record<string, unknown>[] {
    return this.rows("SELECT id, user_name AS userName, time, date, ping, notes, status, created_at AS createdAt FROM training_requests ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END, id DESC LIMIT 50");
  }

  startTraining(actorId: number, requestId: number, notes: string, location: string): Record<string, unknown> {
    const actor = this.user(actorId);
    if (!actor || rankIndex(actor.rank) < rankIndex("moderator")) return { ok: false, error: "Only moderators and above can host training." };
    const request = this.row("SELECT id, status, user_name AS userName FROM training_requests WHERE id = ?", requestId);
    if (!request) return { ok: false, error: "Training request not found." };
    if (!notes || notes.trim().length < 3) return { ok: false, error: "Training notes are required." };
    if (!location || location.trim().length < 2) return { ok: false, error: "A location/place is required." };
    this.ctx.storage.sql.exec("UPDATE training_requests SET status = 'in_progress', notes = ? WHERE id = ?", "Trainer: " + actor.username + " | Location: " + location.trim() + " | Notes: " + notes.trim(), requestId);
    this.log(actor.id, actor.username, "training_started", "Request #" + requestId + " with " + String(request.userName) + " at " + location);
    this.notify(Number(request.id === requestId ? this.row("SELECT user_id AS id FROM training_requests WHERE id = ?", requestId)!.id : 0), "Your training started with " + actor.username + " at " + location + ".");
    return { ok: true };
  }

  recordTrainingResult(actorId: number, input: { requestId?: number; trainee: string; driving: number; moderation: number; notes: string; heldOn: string }): Record<string, unknown> {
    const actor = this.user(actorId);
    if (!actor || rankIndex(actor.rank) < rankIndex("moderator")) return { ok: false, error: "Only moderators and above can record training results." };
    const trainee = (input.trainee || "").trim();
    if (trainee.length < 2) return { ok: false, error: "Trainee name is required." };
    const driving = Number(input.driving);
    const moderation = Number(input.moderation);
    if (!Number.isFinite(driving) || !Number.isFinite(moderation) || driving < 0 || driving > 10 || moderation < 0 || moderation > 10) return { ok: false, error: "Scores must be between 0 and 10." };
    const config = this.getConfig();
    const threshold = Number(config.trainingPassTotal) || 14;
    const total = driving + moderation;
    const passed = total >= threshold;
    const heldOn = input.heldOn || new Date().toISOString().slice(0, 10);
    const traineeUser = this.row("SELECT id FROM users WHERE username_lower = ?", trainee.toLowerCase());
    this.ctx.storage.sql.exec("INSERT INTO trainings (request_id, trainee_user_id, trainee, trainer_id, trainer_name, driving, moderation, total, passed, notes, location, held_on) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", input.requestId ?? null, traineeUser ? traineeUser.id : null, trainee, actor.id, actor.username, driving, moderation, total, passed ? 1 : 0, (input.notes || "").slice(0, 800), "", heldOn);
    if (input.requestId) this.ctx.storage.sql.exec("UPDATE training_requests SET status = 'completed' WHERE id = ?", input.requestId);
    this.log(actor.id, actor.username, "training_result", trainee + " scored " + total + "/20 (" + (passed ? "Pass" : "Fail") + ")");
    if (traineeUser) this.notify(Number(traineeUser.id), "Training result recorded: " + driving + "/10 driving, " + moderation + "/10 moderation, " + total + "/20 - " + (passed ? "Pass" : "Fail"));
    return { ok: true, total, passed, formatted: "Training Result\n\nTrainee: " + trainee + "\nDriving: " + driving + "/10\nModeration ability: " + moderation + "/10\nTotal: " + total + "/20\n\n" + (passed ? "Pass" : "Fail") };
  }

  listTrainings(): Record<string, unknown>[] {
    return this.rows("SELECT id, trainee, trainer_name AS trainerName, driving, moderation, total, passed, notes, held_on AS heldOn, created_at AS createdAt FROM trainings ORDER BY id DESC LIMIT 50");
  }

  // ---- shifts ----

  private liveMinutes(shift: Record<string, any>): number {
    const start = new Date(shift.started_at).getTime();
    let breakMs = Number(shift.break_minutes || 0) * 60000;
    if (Number(shift.on_break) === 1 && shift.break_started_at) breakMs += Date.now() - new Date(shift.break_started_at).getTime();
    const end = shift.ended_at ? new Date(shift.ended_at).getTime() : Date.now();
    return Math.max(0, Math.round(((end - start - breakMs) / 60000) * 10) / 10);
  }

  shiftState(userId: number): Record<string, unknown> {
    const shift = this.row("SELECT * FROM shifts WHERE user_id = ? AND status = 'active'", userId);
    if (!shift) return { active: false };
    return { active: true, id: shift.id, startedAt: shift.started_at, onBreak: Number(shift.on_break) === 1, minutes: this.liveMinutes(shift), breakMinutes: Number(shift.break_minutes || 0) };
  }

  shiftStart(userId: number): Record<string, unknown> {
    const existing = this.row("SELECT id FROM shifts WHERE user_id = ? AND status = 'active'", userId);
    if (existing) return { ok: false, error: "You already have an active shift (#" + existing.id + "). Duplicate shifts are not allowed." };
    const user = this.user(userId);
    if (!user || rankIndex(user.rank) < rankIndex("trial_moderator")) return { ok: false, error: "Shift tracking is for staff members with dashboard access." };
    const config = this.getConfig();
    const created = this.row("INSERT INTO shifts (user_id, user_name, started_at) VALUES (?, ?, ?) RETURNING id", userId, user.username, this.nowIso());
    const id = Number(created!.id);
    this.log(userId, user.username, "shift_started", "Shift #" + id + " | granted role " + String(config.shiftRole));
    return { ok: true, id };
  }

  shiftBreak(userId: number): Record<string, unknown> {
    const shift = this.row("SELECT * FROM shifts WHERE user_id = ? AND status = 'active'", userId);
    if (!shift) return { ok: false, error: "Start a shift before taking a break." };
    if (Number(shift.on_break) === 1) {
      const elapsed = (Date.now() - new Date(shift.break_started_at).getTime()) / 60000;
      this.ctx.storage.sql.exec("UPDATE shifts SET on_break = 0, break_minutes = break_minutes + ?, break_started_at = NULL WHERE id = ?", Math.round(elapsed * 10) / 10, shift.id);
      this.log(userId, (this.user(userId) || {}).username, "shift_break_ended", "Break of " + Math.round(elapsed) + " minutes recorded separately from active time");
      return { ok: true, onBreak: false };
    }
    this.ctx.storage.sql.exec("UPDATE shifts SET on_break = 1, break_started_at = ? WHERE id = ?", this.nowIso(), shift.id);
    this.log(userId, (this.user(userId) || {}).username, "shift_break_started", "Break started on shift #" + shift.id);
    return { ok: true, onBreak: true };
  }

  shiftEnd(userId: number): Record<string, unknown> {
    const shift = this.row("SELECT * FROM shifts WHERE user_id = ? AND status = 'active'", userId);
    if (!shift) return { ok: false, error: "You are not on shift." };
    let breakMinutes = Number(shift.break_minutes || 0);
    if (Number(shift.on_break) === 1 && shift.break_started_at) breakMinutes += (Date.now() - new Date(shift.break_started_at).getTime()) / 60000;
    const minutes = this.liveMinutes({ ...shift, ended_at: this.nowIso(), break_minutes: breakMinutes });
    this.ctx.storage.sql.exec("UPDATE shifts SET status = 'ended', ended_at = ?, on_break = 0, break_started_at = NULL, break_minutes = ?, minutes = ? WHERE id = ?", this.nowIso(), Math.round(breakMinutes * 10) / 10, minutes, shift.id);
    const config = this.getConfig();
    const user = this.user(userId);
    this.log(userId, user ? user.username : String(userId), "shift_ended", "Shift #" + shift.id + " total " + minutes + " minutes | removed role " + String(config.shiftRole));
    return { ok: true, minutes, breakMinutes: Math.round(breakMinutes * 10) / 10 };
  }

  shiftLeaderboard(): Record<string, unknown>[] {
    const rows = this.rows("SELECT user_id AS userId, user_name AS userName, minutes, started_at, ended_at, break_minutes, on_break, status FROM shifts");
    const totals: Record<string, { userId: number; userName: string; minutes: number; shifts: number }> = {};
    for (const r of rows) {
      const key = String(r.userId);
      if (!totals[key]) totals[key] = { userId: Number(r.userId), userName: String(r.userName), minutes: 0, shifts: 0 };
      totals[key].minutes += r.status === "active" ? this.liveMinutes(r) : Number(r.minutes || 0);
      totals[key].shifts += 1;
    }
    return Object.values(totals)
      .map((t) => ({ ...t, minutes: Math.round(t.minutes * 10) / 10, hours: Math.floor(t.minutes / 60), remainder: Math.round(t.minutes % 60) }))
      .sort((a, b) => b.minutes - a.minutes);
  }

  shiftsOnline(): Record<string, unknown>[] {
    return this.rows("SELECT s.id, s.user_id AS userId, s.user_name AS userName, s.started_at AS startedAt, s.on_break AS onBreak, s.break_minutes AS breakMinutes, u.rank FROM shifts s JOIN users u ON u.id = s.user_id WHERE s.status = 'active' ORDER BY s.started_at").map((r) => ({ ...r, onBreak: Number(r.onBreak) === 1, minutes: this.liveMinutes({ started_at: r.startedAt, ended_at: null, break_minutes: r.breakMinutes, on_break: r.onBreak ? 1 : 0 }) }));
  }

  shiftAdminEdit(actorId: number, shiftId: number, minutes: number, reason: string): Record<string, unknown> {
    const actor = this.user(actorId);
    if (!actor || rankIndex(actor.rank) < rankIndex("management")) return { ok: false, error: "Only management can correct recorded shift time." };
    if (!reason || reason.trim().length < 3) return { ok: false, error: "An edit reason is required." };
    const shift = this.row("SELECT id, user_name AS userName, minutes FROM shifts WHERE id = ?", shiftId);
    if (!shift) return { ok: false, error: "Shift not found." };
    const clean = Math.max(0, Math.min(1440, Number(minutes) || 0));
    this.ctx.storage.sql.exec("UPDATE shifts SET minutes = ? WHERE id = ?", clean, shiftId);
    this.ctx.storage.sql.exec("INSERT INTO shift_edits (shift_id, actor_id, actor_name, reason, before_value, after_value) VALUES (?, ?, ?, ?, ?, ?)", shiftId, actor.id, actor.username, reason, String(shift.minutes), String(clean));
    this.log(actor.id, actor.username, "shift_edited", "Shift #" + shiftId + " (" + String(shift.userName) + ") " + String(shift.minutes) + " -> " + clean + " minutes | " + reason);
    return { ok: true };
  }

  listShiftEdits(actorId: number): Record<string, unknown>[] {
    const actor = this.user(actorId);
    if (!actor || rankIndex(actor.rank) < rankIndex("management")) throw new Error("Shift edit history is restricted to management.");
    return this.rows("SELECT id, shift_id AS shiftId, actor_name AS actorName, reason, before_value AS beforeValue, after_value AS afterValue, created_at AS createdAt FROM shift_edits ORDER BY id DESC LIMIT 50");
  }

  // ---- staff management ----

  promote(actorId: number, targetId: number, newRank: string, reason: string): Record<string, unknown> {
    const actor = this.user(actorId);
    if (!actor || rankIndex(actor.rank) < rankIndex("management")) return { ok: false, error: "Only management can promote staff." };
    if (!reason || reason.trim().length < 3) return { ok: false, error: "A promotion reason is required." };
    const target = this.user(targetId);
    if (!target) return { ok: false, error: "That account no longer exists." };
    if (!(RANKS as readonly string[]).includes(newRank)) return { ok: false, error: "Unknown rank." };
    if (newRank === "owner" && actor.rank !== "owner") return { ok: false, error: "Only an owner can grant the owner rank." };
    const oldRank = target.rank;
    this.ctx.storage.sql.exec("UPDATE users SET rank = ? WHERE id = ?", newRank, targetId);
    this.ctx.storage.sql.exec("INSERT INTO staff_actions (actor_id, actor_name, target_id, target_name, type, summary, reason) VALUES (?, ?, ?, ?, 'promote', ?, ?)", actor.id, actor.username, targetId, target.username, oldRank + " to " + newRank, reason);
    this.log(actor.id, actor.username, "promote", target.username + ": " + oldRank + " to " + newRank + " | " + reason);
    this.notify(targetId, "You were promoted to " + newRank + " by " + actor.username + ". Reason: " + reason);
    return { ok: true };
  }

  infract(actorId: number, targetId: number, infraction: string, reason: string): Record<string, unknown> {
    const actor = this.user(actorId);
    if (!actor || rankIndex(actor.rank) < rankIndex("management")) return { ok: false, error: "Only management can issue infractions." };
    const target = this.user(targetId);
    if (!target) return { ok: false, error: "That account no longer exists." };
    if (!infraction || !reason) return { ok: false, error: "Both the infraction and the reason are required." };
    this.ctx.storage.sql.exec("INSERT INTO staff_actions (actor_id, actor_name, target_id, target_name, type, summary, reason) VALUES (?, ?, ?, ?, 'infraction', ?, ?)", actor.id, actor.username, targetId, target.username, infraction.slice(0, 200), reason.slice(0, 400));
    this.log(actor.id, actor.username, "infraction", target.username + " | " + infraction + " | " + reason);
    this.notify(targetId, "You received an infraction: " + infraction + " - Reason: " + reason);
    return { ok: true };
  }

  staffRequest(userId: number, reason: string): Record<string, unknown> {
    const active = this.row("SELECT id FROM game_sessions WHERE status = 'active'");
    if (!active) return { ok: false, error: "Staff requests can only be created during an active session." };
    const user = this.user(userId);
    const clean = (reason || "").trim();
    if (clean.length < 4) return { ok: false, error: "Describe your request." };
    this.ctx.storage.sql.exec("INSERT INTO staff_actions (actor_id, actor_name, target_id, target_name, type, summary, reason) VALUES (?, ?, ?, ?, 'staff_request', ?, ?)", userId, user ? user.username : "member", userId, user ? user.username : "member", "awaiting acknowledgement", clean.slice(0, 500));
    this.log(userId, user ? user.username : String(userId), "staff_request", clean.slice(0, 300));
    for (const staff of this.rows("SELECT id FROM users WHERE rank IN ('management','owner')")) this.notify(Number(staff.id), "Staff request from " + (user ? user.username : "a member") + " during the active session");
    return { ok: true };
  }

  acknowledgeStaffRequest(actorId: number, requestId: number): Record<string, unknown> {
    const actor = this.user(actorId);
    if (!actor || rankIndex(actor.rank) < rankIndex("management")) return { ok: false, error: "Only management can acknowledge staff requests." };
    const request = this.row("SELECT id, type FROM staff_actions WHERE id = ?", requestId);
    if (!request) return { ok: false, error: "Request not found." };
    if (request.type !== "staff_request") return { ok: false, error: "That entry is not a pending staff request." };
    this.ctx.storage.sql.exec("UPDATE staff_actions SET type = 'staff_request_ack', summary = ? WHERE id = ?", "acknowledged by " + actor.username, requestId);
    this.log(actor.id, actor.username, "staff_request_ack", "Request #" + requestId);
    return { ok: true };
  }

  loaRequest(userId: number, input: { timeframe: string; startDate: string; endDate: string; reason: string }): Record<string, unknown> {
    if (!input.timeframe || !input.startDate || !input.endDate) return { ok: false, error: "Timeframe, start date and end date are required." };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(input.endDate)) return { ok: false, error: "Dates must use YYYY-MM-DD." };
    if (new Date(input.endDate).getTime() < new Date(input.startDate).getTime()) return { ok: false, error: "The end date must be after the start date." };
    const user = this.user(userId);
    const created = this.row("INSERT INTO loas (user_id, user_name, timeframe, start_date, end_date, reason) VALUES (?, ?, ?, ?, ?, ?) RETURNING id", userId, user ? user.username : "member", input.timeframe.slice(0, 120), input.startDate, input.endDate, (input.reason || "").slice(0, 500));
    const id = Number(created!.id);
    this.log(userId, user ? user.username : String(userId), "loa_requested", "LOA #" + id + " " + input.startDate + " to " + input.endDate);
    for (const staff of this.rows("SELECT id FROM users WHERE rank IN ('management','owner')")) this.notify(Number(staff.id), "LOA request #" + id + " from " + (user ? user.username : "a member"));
    return { ok: true, id };
  }

  decideLoa(actorId: number, loaId: number, decision: string, reason: string): Record<string, unknown> {
    const actor = this.user(actorId);
    if (!actor || rankIndex(actor.rank) < rankIndex("management")) return { ok: false, error: "LOA decisions are restricted to management." };
    if (decision !== "approved" && decision !== "denied") return { ok: false, error: "Unknown decision." };
    if (!reason || reason.trim().length < 3) return { ok: false, error: "A decision reason is required." };
    const loa = this.row("SELECT id, user_id, status FROM loas WHERE id = ?", loaId);
    if (!loa) return { ok: false, error: "LOA request not found." };
    if (loa.status !== "pending") return { ok: false, error: "That LOA request was already decided." };
    this.ctx.storage.sql.exec("UPDATE loas SET status = ?, decided_by = ?, decision_reason = ?, decided_at = ? WHERE id = ?", decision, actor.id, reason, this.nowIso(), loaId);
    this.log(actor.id, actor.username, "loa_" + decision, "LOA #" + loaId + " | " + reason);
    this.notify(Number(loa.user_id), "Your LOA request was " + decision + " by " + actor.username + ". Reason: " + reason);
    return { ok: true };
  }

  listLoas(): Record<string, unknown>[] {
    return this.rows("SELECT id, user_name AS userName, timeframe, start_date AS startDate, end_date AS endDate, reason, status, decision_reason AS decisionReason, created_at AS createdAt FROM loas ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END, id DESC LIMIT 50").map((r) => {
      const daysLeft = Math.ceil((new Date(String(r.endDate)).getTime() - Date.now()) / 86400000);
      return { ...r, daysLeft, reminder: r.status === "approved" && daysLeft >= 0 && daysLeft <= 2 };
    });
  }

  listStaffActions(): Record<string, unknown>[] {
    return this.rows("SELECT id, actor_name AS actorName, target_name AS targetName, type, summary, reason, created_at AS createdAt FROM staff_actions ORDER BY id DESC LIMIT 100");
  }

  addNote(actorId: number, targetId: number | null, body: string): Record<string, unknown> {
    const actor = this.user(actorId);
    if (!actor || rankIndex(actor.rank) < rankIndex("management")) return { ok: false, error: "Staff notes are restricted to management." };
    const clean = (body || "").trim();
    if (clean.length < 3) return { ok: false, error: "Write a note first." };
    this.ctx.storage.sql.exec("INSERT INTO staff_notes (user_id, author_id, author_name, body) VALUES (?, ?, ?, ?)", targetId, actor.id, actor.username, clean.slice(0, 1000));
    this.log(actor.id, actor.username, "staff_note", targetId ? "About user #" + targetId : "General note");
    return { ok: true };
  }

  listNotes(actorId: number): Record<string, unknown>[] {
    const actor = this.user(actorId);
    if (!actor || rankIndex(actor.rank) < rankIndex("management")) throw new Error("Staff notes are restricted to management.");
    return this.rows("SELECT n.id, n.user_id AS userId, n.author_name AS authorName, n.body, n.created_at AS createdAt, u.username FROM staff_notes n LEFT JOIN users u ON u.id = n.user_id ORDER BY n.id DESC LIMIT 100");
  }

  // ---- moderation cases ----

  createCase(actorId: number, input: { target: string; type: string; reason: string; evidence: string; status: string }): Record<string, unknown> {
    const actor = this.user(actorId);
    if (!actor || rankIndex(actor.rank) < rankIndex("trial_moderator")) return { ok: false, error: "Only staff with dashboard access can log moderation cases." };
    if (!input.target || !input.type || !input.reason) return { ok: false, error: "Target, action and reason are required." };
    const created = this.row("INSERT INTO mod_cases (moderator_id, moderator_name, target, type, reason, evidence, status) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id", actor.id, actor.username, input.target.slice(0, 120), input.type.slice(0, 60), input.reason.slice(0, 800), (input.evidence || "").slice(0, 500), input.status || "open");
    const id = Number(created!.id);
    this.log(actor.id, actor.username, "case_logged", "#" + id + " " + input.type + " on " + input.target);
    return { ok: true, id };
  }

  listCases(): Record<string, unknown>[] {
    return this.rows("SELECT id, moderator_name AS moderatorName, target, type, reason, evidence, status, created_at AS createdAt FROM mod_cases ORDER BY id DESC LIMIT 100");
  }

  updateCaseStatus(actorId: number, caseId: number, status: string): Record<string, unknown> {
    const actor = this.user(actorId);
    if (!actor || rankIndex(actor.rank) < rankIndex("trial_moderator")) return { ok: false, error: "Only staff can update cases." };
    if (!["open", "resolved", "appealed"].includes(status)) return { ok: false, error: "Unknown case status." };
    this.ctx.storage.sql.exec("UPDATE mod_cases SET status = ? WHERE id = ?", status, caseId);
    this.log(actor.id, actor.username, "case_updated", "#" + caseId + " -> " + status);
    return { ok: true };
  }

  // ---- staff chat ----

  postChat(userId: number, channel: string, body: string): Record<string, unknown> {
    const user = this.user(userId);
    if (!user || rankIndex(user.rank) < rankIndex("trial_moderator")) return { ok: false, error: "Staff chat is for the staff team." };
    const clean = (body || "").trim();
    if (!clean) return { ok: false, error: "Write a message first." };
    this.ctx.storage.sql.exec("INSERT INTO chat_messages (channel, user_id, user_name, rank, body) VALUES (?, ?, ?, ?, ?)", channel.slice(0, 40), user.id, user.username, user.rank, clean.slice(0, 2000));
    return { ok: true };
  }

  listChat(channel: string, afterId: number): Record<string, unknown>[] {
    return this.rows("SELECT id, user_id AS userId, user_name AS userName, rank, body, created_at AS createdAt FROM chat_messages WHERE channel = ? AND id > ? ORDER BY id ASC LIMIT 200", channel, afterId || 0);
  }

  // ---- audit + reporting ----

  listAudit(actorId: number, limit: number): Record<string, unknown>[] {
    const actor = this.user(actorId);
    if (!actor || rankIndex(actor.rank) < rankIndex("trial_moderator")) throw new Error("The audit log is restricted to staff.");
    return this.rows("SELECT id, actor_name AS actorName, action, detail, created_at AS createdAt FROM audit_log ORDER BY id DESC LIMIT ?", Math.min(500, Math.max(1, limit || 100)));
  }

  staffStats(actorId: number): Record<string, unknown>[] {
    const actor = this.user(actorId);
    if (!actor || rankIndex(actor.rank) < rankIndex("trial_moderator")) throw new Error("Staff statistics are restricted to staff.");
    return this.rows("SELECT u.id, u.username, u.rank, (SELECT COUNT(*) FROM mod_cases c WHERE c.moderator_id = u.id) AS cases, (SELECT COUNT(*) FROM tickets t WHERE t.claimant_id = u.id) AS ticketsClaimed, (SELECT COUNT(*) FROM tickets t WHERE t.closer_id = u.id) AS ticketsClosed, (SELECT COUNT(*) FROM trainings tr WHERE tr.trainer_id = u.id) AS trainingsRun, (SELECT COUNT(*) FROM applications a WHERE a.reviewer_id = u.id) AS reviews, COALESCE((SELECT SUM(CASE WHEN s.status = 'active' THEN 0 ELSE s.minutes END) FROM shifts s WHERE s.user_id = u.id), 0) AS shiftMinutes FROM users u ORDER BY shiftMinutes DESC, cases DESC");
  }

  dashboardData(viewerId: number): Record<string, unknown> {
    const user = this.user(viewerId);
    if (!user) throw new Error("Signed out.");
    const rank = String(user.rank);
    const isReviewer = rank === "owner" || Number(user.isReviewer) === 1;
    const isStaff = rankIndex(rank) >= rankIndex("trial_moderator");
    const activeSession = this.row("SELECT id, kind, status FROM game_sessions WHERE status = 'active'");
    return {
      user: { ...user, isReviewer },
      config: this.getConfig(),
      verification: this.verificationState(viewerId),
      notifications: this.listNotifications(viewerId),
      myApplication: this.myApplication(viewerId),
      activeSession: activeSession ?? null,
      shift: this.shiftState(viewerId),
      counts: {
        pendingApplications: isReviewer ? Number(this.row("SELECT COUNT(*) AS c FROM applications WHERE status = 'pending'")?.c ?? 0) : 0,
        myTickets: Number(this.row("SELECT COUNT(*) AS c FROM tickets WHERE user_id = ? AND status != 'closed'", viewerId)?.c ?? 0),
        openTickets: isStaff ? Number(this.row("SELECT COUNT(*) AS c FROM tickets WHERE status != 'closed'")?.c ?? 0) : 0,
        activeGiveaways: Number(this.row("SELECT COUNT(*) AS c FROM giveaways WHERE status = 'active'")?.c ?? 0),
        onlineStaff: Number(this.row("SELECT COUNT(*) AS c FROM shifts WHERE status = 'active'")?.c ?? 0),
        pendingLoas: Number(this.row("SELECT COUNT(*) AS c FROM loas WHERE status = 'pending'")?.c ?? 0),
      },
      isStaff,
      rank,
    };
  }
}

