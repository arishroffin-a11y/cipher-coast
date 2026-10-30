export interface ApplicationQuestion {
  id: string;
  prompt: string;
  hint?: string;
  long: boolean;
  step: number;
}

export const APPLICATION_STEPS: { title: string; blurb: string }[] = [
  { title: "About you", blurb: "Introduce yourself and tell us why you want to join the team." },
  { title: "Rule knowledge", blurb: "Show that you understand the rules you will be enforcing." },
  { title: "Scenarios", blurb: "Walk us through how you would handle these situations." },
  { title: "Confirmation", blurb: "Confirm your answers are your own and sign the application." },
];

export const APPLICATION_QUESTIONS: ApplicationQuestion[] = [
  { id: "discord", prompt: "What is your Discord username?", long: false, step: 0 },
  { id: "roblox", prompt: "What is your Roblox username?", long: false, step: 0 },
  { id: "age", prompt: "How old are you?", long: false, step: 0 },
  { id: "why", prompt: "Why do you want to join the Cipher Coast Roleplay (CCRP) staff team?", long: true, step: 0 },
  { id: "rdm", prompt: "What is RDM? Give an example.", long: true, step: 1 },
  { id: "vdm", prompt: "What is VDM? Give an example.", long: true, step: 1 },
  { id: "trolling", prompt: "What is trolling? Give an example.", long: true, step: 1 },
  { id: "ma", prompt: "What is MA? Give an example.", long: true, step: 1 },
  { id: "aa", prompt: "What is AA? Give an example.", long: true, step: 1 },
  { id: "coa", prompt: "What is COA/OA? Give an example of each.", long: true, step: 1 },
  { id: "frp", prompt: "What is FRP? Give an example.", long: true, step: 1 },
  { id: "nitrp", prompt: "What is NITRP? Give an example.", long: true, step: 1 },
  { id: "nlr", prompt: "What is NLR? Give an example.", long: true, step: 1 },
  { id: "gtad", prompt: "What is GTAD? Give an example.", long: true, step: 1 },
  { id: "ta", prompt: "What is TA? Give an example.", long: true, step: 1 },
  { id: "staffabuse", prompt: "What is staff abuse, and how does it differ from regular rule-breaking?", long: true, step: 1 },
  { id: "scenario_vehicle", prompt: "If Potato shot a vehicle for no reason, what would you do as a staff member?", long: true, step: 2 },
  { id: "scenario_kill", prompt: "If Potato killed someone for no reason, what would you do as a staff member?", long: true, step: 2 },
  { id: "scenario_sticks", prompt: "If Potato was trolling players with stop sticks, what would you do?", long: true, step: 2 },
  { id: "scenario_commands", prompt: "If Potato was abusing staff commands, what would you do?", long: true, step: 2 },
  { id: "scenario_driving", prompt: "If Potato was driving on the wrong side of the road during roleplay, what would you do?", long: true, step: 2 },
  { id: "ai_confirmation", prompt: "Do you confirm that you completed this application without using AI to generate your answers?", long: false, step: 3 },
  { id: "signature", prompt: "Sign this application by typing your Discord username.", long: false, step: 3 },
];

export const TYPING_NOTICE =
  "This application records how it is typed: timing, key counts and pastes are stored with your answers so reviewers can replay your typing. By continuing you agree to that tracking. Do not use AI to generate answers.";
