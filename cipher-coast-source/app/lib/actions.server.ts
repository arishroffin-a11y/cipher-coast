import type { SessionUser } from "./server";
import { portal } from "./server";

type Json = Record<string, any>;

function text(form: FormData, key: string): string {
  return String(form.get(key) ?? "");
}

function num(form: FormData, key: string): number {
  return Number(form.get(key) ?? 0);
}

export async function runAction(context: any, request: Request, user: SessionUser): Promise<Json> {
  const form = await request.formData();
  const intent = text(form, "intent");
  const stub = portal(context);
  try {
    switch (intent) {
      case "mark_notifications_read":
        await stub.markNotificationsRead(user.id);
        return { ok: true, intent };

      case "verify_start": {
        const result = await stub.startVerification(user.id);
        return { ok: !!result.ok, error: result.error ?? null, question: result.question ?? null, intent };
      }
      case "verify_answer": {
        const result = await stub.answerVerification(user.id, text(form, "answer"));
        return { ok: !!result.ok, verified: !!result.verified, error: result.error ?? null, role: result.role ?? null, intent };
      }

      case "ticket_create":
        return { ...(await stub.createTicket(user.id, text(form, "type") || "assistance", text(form, "subject"))), intent };
      case "ticket_message":
        return { ...(await stub.addTicketMessage(num(form, "ticketId"), user.id, text(form, "body"), user.rank !== "member")), intent };
      case "ticket_claim":
        return { ...(await stub.claimTicket(user.id, num(form, "ticketId"))), intent };
      case "ticket_unclaim":
        return { ...(await stub.unclaimTicket(user.id, num(form, "ticketId"))), intent };
      case "ticket_rename":
        return { ...(await stub.renameTicket(user.id, num(form, "ticketId"), text(form, "name"))), intent };
      case "ticket_close":
        return { ...(await stub.closeTicket(user.id, num(form, "ticketId"), text(form, "reason"))), intent };

      case "giveaway_create":
        return { ...(await stub.createGiveaway(user.id, { prize: text(form, "prize"), description: text(form, "description"), minutes: num(form, "minutes"), winners: num(form, "winners"), channel: text(form, "channel") })), intent };
      case "giveaway_enter":
        return { ...(await stub.enterGiveaway(num(form, "giveawayId"), user.id)), intent };
      case "giveaway_end":
        return { ...(await stub.endGiveaway(user.id, num(form, "giveawayId"))), intent };
      case "giveaway_reroll":
        return { ...(await stub.rerollGiveaway(user.id, num(form, "giveawayId"))), intent };

      case "session_start":
        return { ...(await stub.startSession(user.id, text(form, "kind"), text(form, "notes"))), intent };
      case "session_vote":
        return { ...(await stub.voteSession(num(form, "sessionId"), user.id, text(form, "choice"))), intent };
      case "session_end":
        return { ...(await stub.endSession(user.id, num(form, "sessionId"))), intent };

      case "training_request":
        return { ...(await stub.requestTraining(user.id, { time: text(form, "time"), date: text(form, "date"), notes: text(form, "notes") })), intent };
      case "training_start":
        return { ...(await stub.startTraining(user.id, num(form, "requestId"), text(form, "notes"), text(form, "location"))), intent };
      case "training_result":
        return { ...(await stub.recordTrainingResult(user.id, { requestId: num(form, "requestId") || undefined, trainee: text(form, "trainee"), driving: num(form, "driving"), moderation: num(form, "moderation"), notes: text(form, "notes"), heldOn: text(form, "heldOn") })), intent };

      case "shift_start":
        return { ...(await stub.shiftStart(user.id)), intent };
      case "shift_end":
        return { ...(await stub.shiftEnd(user.id)), intent };
      case "shift_break":
        return { ...(await stub.shiftBreak(user.id)), intent };
      case "shift_edit":
        return { ...(await stub.shiftAdminEdit(user.id, num(form, "shiftId"), num(form, "minutes"), text(form, "reason"))), intent };

      case "application_decide":
        return { ...(await stub.decideApplication(user.id, num(form, "applicationId"), text(form, "decision"), text(form, "reason"))), intent };
      case "application_submit": {
        const answers = JSON.parse(text(form, "answers") || "{}");
        const typing = JSON.parse(text(form, "typing") || "{}");
        const result = await stub.submitApplication(user.id, answers, typing, text(form, "acknowledgment") === "yes");
        return { ...result, intent };
      }

      case "staff_rank":
        return { ...(await stub.setRank(user.id, num(form, "userId"), text(form, "rank"), text(form, "reason"))), intent };
      case "staff_reviewer":
        return { ...(await stub.setReviewer(user.id, num(form, "userId"), text(form, "enabled") === "yes")), intent };
      case "staff_promote":
        return { ...(await stub.promote(user.id, num(form, "userId"), text(form, "rank"), text(form, "reason"))), intent };
      case "staff_infract":
        return { ...(await stub.infract(user.id, num(form, "userId"), text(form, "infraction"), text(form, "reason"))), intent };
      case "staff_request":
        return { ...(await stub.staffRequest(user.id, text(form, "reason"))), intent };
      case "staff_request_ack":
        return { ...(await stub.acknowledgeStaffRequest(user.id, num(form, "requestId"))), intent };
      case "staff_note":
        return { ...(await stub.addNote(user.id, num(form, "userId") || null, text(form, "body"))), intent };

      case "loa_request":
        return { ...(await stub.loaRequest(user.id, { timeframe: text(form, "timeframe"), startDate: text(form, "startDate"), endDate: text(form, "endDate"), reason: text(form, "reason") })), intent };
      case "loa_decide":
        return { ...(await stub.decideLoa(user.id, num(form, "loaId"), text(form, "decision"), text(form, "reason"))), intent };

      case "chat_post":
        return { ...(await stub.postChat(user.id, text(form, "channel") || "staff-general", text(form, "body"))), intent };

      case "case_create":
        return { ...(await stub.createCase(user.id, { target: text(form, "target"), type: text(form, "type"), reason: text(form, "reason"), evidence: text(form, "evidence"), status: text(form, "status") || "open" })), intent };
      case "case_status":
        return { ...(await stub.updateCaseStatus(user.id, num(form, "caseId"), text(form, "status"))), intent };

      case "config_save": {
        const patch = JSON.parse(text(form, "patch") || "{}");
        return { ...(await stub.saveConfig(user.id, patch)), intent };
      }
      case "embed_save": {
        const panel = JSON.parse(text(form, "panel") || "{}");
        return { ...(await stub.saveEmbed(user.id, text(form, "key"), panel)), intent };
      }

      default:
        return { ok: false, error: "Unknown action: " + intent };
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "That action failed.", intent };
  }
}
