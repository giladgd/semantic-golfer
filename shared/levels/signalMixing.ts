import type {GameLevel, GameRound} from "../games.ts";

type Signal = [label: string, evidence: string | GameRound["questions"][number], absence?: string, question?: string];
type Goal = [label: string, instruction: string | GameRound["questions"][number], yes?: string, no?: string];

// Risks describe behaviors that compete with the goal, rather than unrelated topics.
const risks = {
    entitlement: ["Entitlement", "The writer claims personal superiority or an automatic right to special treatment.", "No claim of superiority or automatic entitlement is made."],
    threat: ["Threats for refusing", "The writer threatens to punish or retaliate against the recipient for refusing a request.", "No retaliation is threatened. A practical limit on time, money, or capacity is not a threat."],
    guilt: ["Guilt trips", {type: "choice", instruction: "How does the writer treat refusal?", criteria: ["Refusal is acceptable", "Refusal means not caring"]}],
    insult: ["Personal attacks", "The writer attacks a person's intelligence, character, or worth.", "Nobody is personally insulted."],
    blame: ["Blame shifting", {type: "noul", instruction: "Does the writer accuse someone else of causing the mistake?", criteria: ["", ""]}],
    excuse: ["Excuses", "The writer makes an excuse", "The writer accepts fault", "How is the mistake explained?"],
    minimize: ["Minimizing harm", "The writer dismisses it as trivial, harmless, exaggerated, or not worth worrying about.", "The writer takes it seriously rather than dismissing it.", "How does the writer treat the problem or concern?"],
    guarantee: ["False certainty", "The writer guarantees an uncertain outcome or claims a known unresolved issue is already fixed.", "No uncertain result is guaranteed. Offering an action, a status update, or a conditional plan is not an outcome guarantee."],
    apology: ["Apologizing", "The writer explicitly says sorry or apologizes.", "The writer does not apologize. Thanks, empathy, and a polite refusal are not apologies."],
    accusation: ["Assumed motives", "The writer claims someone deliberately meant to deceive, annoy, or hurt another person.", "Nobody is accused of bad intentions. A concrete problem may be described without assuming its motive."],
    promise: ["Promises beyond the limits", "An unconditional promise beyond the stated limits.", "An offer within stated limits or conditional on agreement.", "Does the writer's offer exceed the limits stated in the message?"],
    sales: ["Sales pressure", {type: "noul", instruction: "Does the text use urgency, scarcity, or fear of missing out to pressure the recipient to agree?", criteria: ["Yes", "No"]}],
    pity: ["Pity or patronizing", {type: "noul", instruction: "Does the text treat the recipient as helpless or incapable of deciding for themselves?", criteria: ["Yes", "No"]}],
    deflect: ["Dodging the issue", "The writer dodges the concern with vague praise, process language, or a demand to move on.", "The writer directly addresses the specific concern.", "Does the writer address the concrete concern?"],
    credit: ["Taking all the credit", "The writer claims other people's contributions as their own.", "The writer acknowledges other people's contributions and keeps their own credit accurate.", "How does the writer assign credit after any correction?"],
    coercion: ["Assumed consent", {type: "choice", instruction: "Is consent assumed anywhere in this message?", criteria: ["No action is taken or permission assumed without an affirmative response", "At least one action or agreement is assumed, including treating silence as consent, even if the writer also asks politely", "The message has no request, offer, or decision needing consent"]}],
    stigma: ["Stigma", "The writer labels a person or group as inferior, dangerous, irresponsible, or untrustworthy because of their identity or personal circumstances.", "The writer discusses behavior or needs without stereotyping or stigmatizing anyone.", "Does the writer judge someone by their identity or private circumstances?"],
    spin: ["Positive spin", "An exciting improvement", "A regrettable reduction", "How is the loss of service presented?"],
    pressure: ["Pressure to disclose", "The writer demands private reasons, personal history, diagnosis, or proof before offering help or participation.", "The writer does not require personal disclosures; support or participation does not depend on them.", "Is help or participation conditional on disclosing private information?"],
    tradeoff: ["Claiming no drawbacks", "Claims there are no costs or drawbacks", "Costs or limitations are stated", "Which description fits the tradeoffs in the proposal?"]
} satisfies Record<string, Signal>;

function round(id: string, title: string, limit: number, brief: string, goals: Goal[], ...riskSignals: Signal[]): GameRound {
    return {
        id, title, limit, brief, goalCount: goals.length,
        labels: [...goals, ...riskSignals].map(([label]) => label),
        questions: [
            ...goals.map(([, instruction, yes, no]) => (typeof instruction !== "string" ? instruction :
                {type: "noul" as const, instruction, criteria: [yes ?? "", no ?? ""]})),
            ...riskSignals.map(([, evidence, absence, question]) => {
                if (typeof evidence !== "string")
                    return evidence;
                return {
                    type: "choice" as const,
                    instruction: question ?? "Classify only the actual quoted message. Do not invent missing words or assume unstated details.",
                    criteria: [
                        absence ?? "Does not fulfill the requirement.",
                        evidence,
                        "No relevant request, conflict, mistake, or claim to assess."
                    ]
                };
            })
        ]
    };
}

export const signalMixingLevels: GameLevel[] = [
    {id: 1, title: "Ask without leaning", skill: "Make a clear request without making it hard to say no", estimatedDuration: "2-3 min", rounds: [
        round("1-1", "Borrow, don't demand", 150,
            "Ask to borrow a charger and thank the other person. Make it a request, without claiming you are entitled to it or threatening them.",
            [
                ["Ask to borrow a charger", "Does the writer ask to borrow a charger?"],
                ["Thank them", "Does the message express thanks?"]
            ],
            risks.entitlement, risks.threat),
        round("1-2", "A favor with an exit", 150,
            "Ask a friend to help with one specific moving task. Offer a concrete alternative if they cannot help, without using friendship or obligation to pressure them.",
            [
                ["Ask for a specific moving task", "Does the message ask for help moving?", "The writer asks for help with a particular moving task, such as carrying furniture or packing belongings.", "No help with a specific moving task is requested."],
                ["Offer a fallback for moving", {type: "choice", instruction: "What is the fallback if the friend cannot help?", criteria: ["No fallback for the moving task is stated", "Another way to complete the moving task is given"]}]
            ],
            ["Guilt trips", {type: "choice", instruction: "Does the writer imply that refusing would make the friend uncaring or disloyal?",
                criteria: ["There is no moral judgment for refusing. Offering another way to finish the move does not imply the friend is uncaring.", "Refusing the moving request is framed as proof of not caring or being a bad friend."]}], risks.threat),
        round("1-3", "Volume, not virtue", 150,
            "Ask a neighbor to keep the noise down at a specific time. Explain its effect on you without insulting them or assuming they are doing it deliberately.",
            [
                ["Ask for less noise", "Does the writer ask someone to reduce noise?"],
                ["Specify a time for quiet", "Does the quoted Text explicitly contain all of the following? The writer requests lower noise at a stated clock time or defined period. Read only the text, without completing missing details."],
                ["Explain the effect on you", "Does the message explain why the noise bothers the writer?"]
            ],
            risks.insult, risks.accusation)
    ]},
    {id: 2, title: "Kind friction", skill: "Be direct about a problem while preserving the relationship", estimatedDuration: "3-6 min", rounds: [
        round("2-1", "Useful, not brutal", 190,
            "You want to help fix a colleague's chart. Name what works, identify a specific readability problem, and ask for the editable source file. No personal criticism, empty flattery, or dismissal of the problem.",
            [
                ["Praise something that works", {type: "noul", instruction: "Does the writer say what works well in the chart? Answer yes if: A specific feature is praised, such as useful colors, clear coding, or another helpful feature. Answer no if: No particular feature is praised. Criticism alone does not name something that works.",
                    criteria: ["", ""]}],
                ["Identify a readability problem", "Does the writer identify a specific part of the chart that is hard to read?"],
                ["Ask for the editable source", {type: "noul", instruction: "Does the writer ask for the editable chart file?",
                    criteria: ["The message satisfies this requirement: The editable source requested.", "This requirement is not met by the message."]}]
            ],
            risks.insult, risks.deflect, risks.minimize),
        round("2-2", "No with an open door", 190,
            "Decline a dinner invitation and thank the host for including you. Offer a different way to connect without giving an excuse, apologizing, applying pressure, or assuming their agreement.",
            [
                ["Decline the dinner invitation", {type: "choice", instruction: "What does the writer say about attending dinner?", criteria: ["They accept the dinner invitation", "They explicitly decline the dinner invitation", "They do not say whether they will attend dinner. Declining lunch or another activity alone does not state a dinner decision."]}],
                ["Thank them for the invitation", {type: "noul", instruction: "Does the writer thank the host for inviting them?",
                    criteria: ["The message satisfies this requirement: Thanks for the invitation.", "This requirement is not met by the message."]}],
                ["Suggest another way to connect", "Does the writer propose a replacement plan?", "The writer offers a specific way to meet or talk instead of dinner, such as a call or a walk together.", "No alternative activity or way to keep in touch is proposed."]
            ],
            risks.apology, risks.guilt, risks.coercion, ["Excuse for declining", {type: "noul", instruction: "Does the writer give a reason why they cannot attend dinner?", criteria: ["", ""]}]),
        round("2-3", "The missing invoice", 190,
            "An invoice was due Friday and is still unpaid. Ask for a payment date and offer to resend the invoice. Describe the status without accusing the client of dishonesty, threatening them, or excusing the overdue payment.",
            [
                ["State that the invoice is overdue", "Does the message say the invoice due Friday is still unpaid?"],
                ["Ask for a payment date", {type: "noul", instruction: "Does the writer ask when payment will happen?",
                    criteria: ["They ask when money will be sent or received, including When can I expect it? where it refers to the payment.", "They do not ask when payment will happen. Merely saying the invoice is overdue is insufficient."]}],
                ["Offer to resend the invoice", {type: "noul", instruction: "Does the writer offer to resend the invoice?",
                    criteria: ["They offer to send the invoice or payment details again, including asking whether resending would help.", "They do not offer to resend the invoice or its details."]}]
            ],
            risks.accusation, risks.threat, risks.minimize)
    ]},
    {id: 3, title: "Own the awkward bit", skill: "Take responsibility without becoming defensive or overpromising", estimatedDuration: "9-15 min", rounds: [
        round("3-1", "The broken mug", 250,
            "You broke a borrowed mug. Apologize and take responsibility, then let its owner choose a replacement or reimbursement. Do not blame the mug, explain away the accident, or call it insignificant.",
            [
                ["Admit breaking the mug", "Does the writer admit they broke the recipient's mug?"],
                ["Apologize", {type: "choice", instruction: "Does the message contain an apology?", criteria: ["The writer may admit damage or offer a remedy but does not apologize.", "The writer says sorry or offers an apology."]}],
                ["Offer a replacement", {type: "choice", instruction: "Does the writer offer a replacement mug?",
                    criteria: ["No", "Yes"]}],
                ["Offer repayment", {type: "choice", instruction: "Does the writer offer to compensate the mug's owner with money?",
                    criteria: ["No money is offered. An apology or a replacement mug alone is not reimbursement.", "They offer reimbursement, repayment, or paying the owner back for the mug."]}],
                ["Let the owner choose", "Does the writer let the mug's owner choose the remedy?", "The owner can choose between the proposed remedies.", "The writer decides the remedy without giving the owner a choice."]
            ],
            ["Blame shifting", {type: "noul", instruction: "Does the writer accuse someone else of causing the mistake?",
                criteria: ["The message satisfies this requirement: Blame shifting.", "This requirement is not met by the message."]}], risks.excuse, risks.minimize),
        round("3-2", "Credit where it belongs", 250,
            "You presented a team result and forgot to credit Jo, who designed the method. Correct the omission in a message to the team, explain your own role in testing it, and offer to fix the presentation. No blame, excuses, or taking sole credit.",
            [
                ["Credit Jo with the design", {type: "noul", instruction: "Does the text explicitly say Jo designed the method?",
                    criteria: ["The message satisfies this requirement: Jo designed the method.", "This requirement is not met by the message."]}],
                ["Describe your testing contribution", "Did the writer test the method?", "The writer says they tested the method.", "The writer does not say they did the testing."],
                ["Own the credit omission", {type: "noul", instruction: "Does the writer admit their own credit omission?",
                    criteria: ["", ""]}],
                ["Offer to correct the presentation", "Does the writer offer to correct the presentation's credits?", "The writer offers to update the presentation or slides to give the missing credit.", "No correction to the presentation is offered."]
            ],
            risks.credit, risks.blame, ["Excuses", {type: "noul", instruction: "Does the writer give an excuse to avoid responsibility for their mistake?", criteria: ["", ""]}]),
        round("3-3", "Late, but honest", 250,
            "Your report will miss today's deadline; you do not yet know when it will be finished. Tell the recipient, offer the completed summary now, and promise an update tomorrow. Do not invent a finish date, blame others, or minimize the delay.",
            [
                ["Say today's deadline will be missed", "Will the report be late?", "The writer says the report will not meet today's deadline.", "The message does not say today's report deadline will be missed."],
                ["Say the finish date is unknown", {type: "choice", instruction: "What does the writer say about the completion date of the full report?", criteria: ["A definite completion date is given", "The writer explicitly says they do not know the completion date yet", "No statement is made about whether the completion date is known"]}],
                ["Offer the summary now", "Does the writer offer the completed summary now?"],
                ["Promise an update tomorrow", "Will the writer give an update tomorrow?", "The writer promises an update tomorrow.", "No update tomorrow is offered."]
            ],
            ["An invented finish date", {type: "noul", instruction: "Does the writer give a definite completion date for the full report?", criteria: ["", ""]}], risks.blame, risks.minimize)
    ]},
    {id: 4, title: "Boundaries that help", skill: "Protect a real limit and still give the other person a useful route", estimatedDuration: "20-32 min", rounds: [
        round("4-1", "Two urgent things", 310,
            "Your manager asks for a new analysis today, but today is already allocated to the launch. Ask them to choose which takes priority and say the other will move to tomorrow. Stay constructive without apologizing, blaming, or threatening to stop work.",
            [
                ["Say only one task fits today", {type: "choice", instruction: "Classify only what the writer actually says. Do not infer unwritten details or complete unfinished words.", criteria: ["The message does not state that only one task fits today.", "The writer says either the analysis or the launch can fit today, but not both."]}],
                ["Ask the manager to set priority", {type: "choice", instruction: "Classify only what the writer actually says. Do not infer unwritten details or complete unfinished words.", criteria: ["The message does not ask for a choice between the tasks.", "The writer asks the manager which of the two tasks should take priority."]}],
                ["Defer the other task to tomorrow", "Does the message explicitly fulfill the requirement below?", "The task not chosen for today is explicitly deferred to tomorrow.", "The message does not say the other task will move to tomorrow."]
            ],
            risks.apology, risks.blame, risks.threat),
        round("4-2", "A refund with edges", 310,
            "A customer wants a cash refund outside the 30-day window. You can offer store credit or a repair, but cannot authorize cash. Acknowledge their frustration and offer those two options without blaming the customer, belittling the issue, or promising an exception.",
            [
                ["Acknowledge the frustration", "Does the writer say they understand the customer's frustration?"],
                ["State the cash-refund boundary", {type: "noul", instruction: "Does the writer say they cannot authorize a cash refund outside 30 days?",
                    criteria: ["The message satisfies this requirement: The cash-refund boundary.", "This requirement is not met by the message."]}],
                ["Offer store credit", "Does the writer offer store credit?"],
                ["Offer a repair", "Does the writer offer a repair?"]
            ],
            risks.blame, risks.minimize,
            ["Unauthorized refund", {type: "noul", instruction: "Does the writer offer a cash refund outside the 30-day window?", criteria: ["", ""]}]),
        round("4-3", "Helpful, not on call", 310,
            "A colleague keeps asking for evening help. Say you will answer work questions during office hours, offer a 15-minute slot tomorrow morning, and ask them to bring one priority question. Do not apologize, shame them, or imply that refusing the slot has a penalty.",
            [
                ["Set an office-hours boundary", "Does the message explicitly fulfill the requirement below?", "The writer explicitly limits help to office hours and excludes evenings.", "There is no boundary excluding evening help."],
                ["Offer 15 minutes tomorrow morning", {type: "noul", instruction: "Does the writer propose meeting for fifteen minutes tomorrow morning?",
                    criteria: ["", ""]}],
                ["Ask for one priority question", {type: "choice", instruction: "Does the message ask for one main question?",
                    criteria: ["No request to bring a priority question is made.", "The recipient is asked to bring a priority, top, or most important question."]}]
            ],
            risks.apology, risks.guilt, risks.threat),
        round("4-4", "Disagree without digging in", 310,
            "A teammate proposes skipping tests to ship faster. Disagree, explain a specific risk, and propose testing the payment path before shipping. Invite their view without attacking their competence, claiming certainty about failure, or taking over the decision.",
            [
                ["Describe a specific payment risk", "Does the writer describe a particular way a payment could go wrong?", "A concrete payment failure is described, such as duplicate charges, a failed purchase, or an incorrect amount.", "No actual payment failure is described. Merely mentioning testing, risk, or payments is insufficient."],
                ["Propose payment tests before shipping", "Does the writer propose testing payments before release?"],
                ["Invite their view", "Does the writer ask for the teammate's opinion?"]
            ],
            risks.insult, risks.guarantee, risks.coercion)
    ]},
    {id: 5, title: "Confidence with limits", skill: "Give people something useful without pretending uncertainty has vanished", estimatedDuration: "24-40 min", rounds: [
        round("5-1", "The service is coming back", 360,
            "Logins are working again, but some reports remain delayed and the cause is under investigation. Tell customers both facts, offer an export as a workaround, and promise another status update at 16:00. No claim that everything is fixed, blame, or cheerful spin.",
            [
                ["Say logins work again", "Can users log in again?"],
                ["Say reports are still delayed", "Does the message say reports remain delayed?"],
                ["Say the cause is being investigated", "Does the message say the cause is still under investigation?"],
                ["Offer an export workaround", "Does the writer offer an export as a workaround?"],
                ["Promise a 16:00 update", {type: "noul", instruction: "Does the writer commit to another status update at 16:00?",
                    criteria: ["The message satisfies this requirement: A 16:00 update.", "This requirement is not met by the message."]}]
            ],
            ["A premature all-clear", {type: "noul", instruction: "Does the writer claim that every service problem is now fixed?", criteria: ["", ""]}], risks.blame, risks.spin),
        round("5-2", "Promising is not proven", 360,
            "A pilot cut average queue time from ten minutes to eight across 20 visits. Recommend a larger trial and name a measurement to track. Do not claim the pilot proves the change works for everyone, hide the small sample, or pressure people to adopt it now.",
            [
                ["Report the ten-to-eight-minute average", {type: "noul", instruction: "Does the text report average queue time falling from ten minutes to eight?",
                    criteria: ["The message satisfies this requirement: The measured change.", "This requirement is not met by the message."]}],
                ["Mention the sample of 20 visits", "Does the text say the pilot result is based on 20 visits?"],
                ["Propose a larger trial", "Does the writer propose a larger trial?"],
                ["Name a measurement to track", "Does the message explicitly fulfill the requirement below?", "The writer names a concrete measurement to track in the next trial, such as waiting time or complaints.", "No measurement is proposed for the next trial."]
            ],
            ["A broad proof claim", {type: "noul", instruction: "Does the writer claim the small pilot proves the change works for everyone?", criteria: ["", ""]}], risks.sales),
        round("5-3", "Reassurance without a diagnosis", 360,
            "A friend is worried about an unfamiliar test result. Acknowledge the worry, suggest discussing the result with their clinician, and offer a practical form of support. Do not diagnose them, promise the result is harmless, minimize their fear, or demand private details.",
            [
                ["Acknowledge the worry", "Does the quoted Text explicitly contain all of the following? The writer explicitly acknowledges that the result feels worrying or uncertain to the recipient."],
                ["Suggest a clinician's explanation", "Does the quoted Text explicitly contain all of the following? The writer suggests discussing the result with a doctor or clinician.", "", "The writer does not recommend discussing the result with a clinician."],
                ["Offer practical support", "Does the writer offer practical help?", "A particular action is offered, such as accompanying the recipient, taking notes, or preparing questions.", "No concrete support action is offered."]
            ],
            risks.guarantee, risks.minimize, risks.pressure, ["Giving a diagnosis", {type: "noul", instruction: "Does the writer say what medical condition the test result means the recipient has?", criteria: ["", ""]}]),
        round("5-4", "The honest recommendation", 360,
            "Recommend a quiet café for conversation while disclosing that it closes at six and has no step-free entrance. Suggest an accessible alternative if that matters to the recipient, without deciding their needs, hiding a drawback, or pressuring them.",
            [
                ["Recommend a quiet place to talk", "Does the writer recommend a quiet café for conversation?"],
                ["Mention the six o'clock closing", "Does the writer disclose that the café closes at six?"],
                ["Mention the entrance steps", {type: "noul", instruction: "Does the text mention steps or a lack of step-free access at the original café entrance?",
                    criteria: ["", ""]}],
                ["Offer an accessible alternative", "Does the writer offer an accessible alternative if the recipient needs one?"]
            ],
            risks.pity, risks.tradeoff, risks.sales)
    ]},
    {id: 6, title: "Negotiate the shape", skill: "Trade scope, time, and cost instead of just asking for less", estimatedDuration: "40-60 min", rounds: [
        round("6-1", "The budget has corners", 430,
            "A designer quotes $600 for six pages. Your budget is $400. Propose fewer pages now with remaining pages priced separately later, and ask whether that scope is feasible. Keep their rate intact; no discount demand, entitlement, pressure, or commitment without agreement.",
            [
                ["Acknowledge the original quote", "Does the writer acknowledge a $600 quote for six pages?"],
                ["State your $400 budget", "How much can the writer spend?", "The writer states a budget of $400.", "A $400 budget is not stated."],
                ["Reduce scope, not the rate", {type: "choice", instruction: "How does the writer propose fitting the project to the smaller budget?", criteria: ["The rate is reduced, or no adjustment is proposed", "Fewer pages now, with the normal rate preserved", "Pay for the full project in installments"]}],
                ["Price the rest separately", "Does the writer propose pricing the remaining pages as a separate later phase?"],
                ["Ask what is feasible", "Does the text include a question about feasibility?"]
            ],
            risks.entitlement, risks.sales, risks.guilt, risks.coercion, ["A discount demand", {type: "noul", instruction: "Does the writer ask the designer to lower their rate?", criteria: ["", ""]}]),
        round("6-2", "A deadline with a lever", 430,
            "A client wants a full report Friday; it needs until Monday. Offer the full report Monday, or the core findings Friday without the optional appendix. Ask them to choose before changing scope. Do not promise the full report Friday, hide the missing appendix, blame the client, or treat silence as consent.",
            [
                ["Offer the full report on Monday", "Does the message say the full report needs until Monday?"],
                ["Offer Friday without the appendix", "Does the writer offer a Friday report without the optional appendix?", "The writer offers Friday delivery of the core findings, explicitly leaving out the optional appendix.", "No Friday alternative excluding the appendix is offered."],
                ["Ask the client to choose first", "Does the text ask for the client's choice?", "The client is directly asked to select or state a preference between the plans.", "The plans are described, but no request for the client's choice is made."]
            ],
            ["An impossible Friday promise", {type: "noul", instruction: "Does the writer promise the full report on Friday?", criteria: ["", ""]}], risks.tradeoff, risks.blame, risks.coercion),
        round("6-3", "The noisy compromise", 430,
            "Neighbors want to rehearse from seven to ten for a performance on Saturday; you need quiet after nine. Offer two alternatives: rehearsing tomorrow afternoon, or moving the last hour to another room away from your wall. Acknowledge the upcoming performance and ask whether either alternative works. No blanket ban, guilt trip, insult, or claim that everyone agrees with you.",
            [
                ["Acknowledge Saturday's performance", "Does the message mention a performance on Saturday?"],
                ["Request quiet after nine", "Does the writer explain their need for quiet after nine?"],
                ["Suggest tomorrow afternoon instead", {type: "noul", instruction: "Does the writer propose rehearsing tomorrow afternoon as an alternative?",
                    criteria: ["The message satisfies this requirement: Tomorrow afternoon instead.", "This requirement is not met by the message."]}],
                ["Propose moving the last hour", "Does the writer offer moving the nine-to-ten hour away from the shared wall as another option?"],
                ["Invite agreement", "Does the writer ask whether the proposed compromise works for the recipient?"]
            ],
            ["A blanket ban", {type: "noul", instruction: "Does the writer demand an end to all rehearsals?", criteria: ["", ""]}], risks.guilt, risks.insult, ["Claimed consensus", {type: "noul", instruction: "Does the writer claim that everybody has already agreed?", criteria: ["", ""]}]),
        round("6-4", "Support without a blank cheque", 430,
            "A friend asks to borrow $500. You can give $100 but cannot lend the rest. Offer help finding another option if wanted. Make the gift clear, without demanding an explanation, judging their spending, apologizing for the limit, or expecting a favor in return.",
            [
                ["Offer a $100 gift", "Does the writer offer $100 as a gift with no repayment?"],
                ["Decline the $500 loan", {type: "choice", instruction: "Does the writer refuse the requested loan beyond the gift?",
                    criteria: ["No lending limit is stated. Offering a $100 gift alone does not refuse the rest.", "They say they cannot lend $500 or cannot lend the remaining $400 after offering a $100 gift."]}],
                ["Offer optional practical help", "Does the writer offer to help find another source of support if wanted?"]
            ],
            risks.pressure, risks.insult, risks.apology, ["A return favor", {type: "noul", instruction: "Does the writer require a favor in return for the gift?", criteria: ["", ""]}]),
        round("6-5", "A raise, not a ransom", 430,
            "Ask your manager for a raise and name a concrete contribution or responsibility supporting the request. Invite discussion without claiming you are owed money, making them feel guilty, or threatening to leave.",
            [
                ["Give a work-related reason", {type: "noul", instruction: "Does the message match this description? A concrete task or achievement is named, such as training staff or leading a team",
                    criteria: ["", ""]}],
                ["Ask politely for a raise", "Does the writer politely ask for a pay raise?"]
            ],
            ["Entitlement", {type: "choice", instruction: "Does the message express entitlement?", criteria: ["No automatic entitlement or superiority is claimed. Asking to discuss fair compensation for a contribution is not entitlement.", "The writer claims they are automatically owed special treatment, or superior to others."]}], risks.guilt, risks.threat)
    ]},
    {id: 7, title: "Say enough, keep trust", skill: "Make a useful message without exposing what is not yours to share", estimatedDuration: "45-70 min", rounds: [
        round("7-1", "Cover without disclosure", 490,
            "Alex is away for a private reason. Tell the team that you cover approvals through Friday and urgent requests go to Sam after that. Do not reveal or speculate about Alex's reason, imply Alex is unreliable, promise their return, or invite questions about their private life.",
            [
                ["Say Alex is away", "Does the message say Alex is away?"],
                ["Offer coverage through Friday", "Does the writer say they will cover approvals through Friday?"],
                ["Redirect urgent requests afterward", {type: "noul", instruction: "Does the message direct urgent requests after Friday to Sam?",
                    criteria: ["The message satisfies this requirement: Urgent requests afterward.", "This requirement is not met by the message."]}]
            ],
            risks.accusation, ["Questioning reliability", {type: "noul", instruction: "Does the writer describe Alex as unreliable?", criteria: ["", ""]}], risks.guarantee, risks.pressure, ["Private details", {type: "noul", instruction: "Does the text name or speculate about the actual reason for Alex's absence?", criteria: ["", ""]}]),
        round("7-2", "A concern, not a culprit", 490,
            "An anonymous colleague reported interruptions in meetings. Ask the team to try a speaking queue for two weeks and then review participation. Describe the behavior without identifying the reporter, guessing the interrupter's motives, shaming anyone, or promising it will solve everything.",
            [
                ["Describe the reported behavior", "Have interruptions in meetings been reported?"],
                ["Propose a speaking queue", "Does the writer propose using a speaking queue?"],
                ["Set a two-week trial", "Does the writer propose trying the change for two weeks?"],
                ["Plan to review participation", {type: "choice", instruction: "What happens after the speaking-queue trial?", criteria: ["No later review is described", "Participation will be reviewed", "Only the trial itself is described"]}]
            ],
            risks.accusation, risks.insult, risks.guarantee, risks.coercion, ["Identifying the reporter", "The writer names the reporter or gives personal details that identify who complained.", "The reporter remains anonymous; no identifying clue is shared."]),
        round("7-3", "The reference boundary", 490,
            "A prospective employer asks why a former colleague left. You can confirm their dates and describe work you personally saw, but do not know the reason for departure. Offer those facts without speculation, hints of misconduct, private details, or endorsing work you did not see.",
            [
                ["Say the reason is unknown", "Does the writer say they do not know why the colleague left?"],
                ["Offer employment dates", {type: "choice", instruction: "Classify only what the writer actually says. Do not infer unwritten details or complete unfinished words.", criteria: ["No employment dates are offered.", "The writer offers to confirm the colleague's employment dates."]}],
                ["Offer firsthand work observations", "Does the writer offer to describe work they personally observed?"]
            ],
            risks.accusation, ["Secondhand claims", "The writer repeats rumors, speculation, or assessments of work they did not personally observe.", "Only firsthand observations or an offer to provide them are given."], ["Private personal details", {type: "noul", instruction: "Does the writer disclose private facts about the former employee's health, family, or personal life?",
                criteria: ["Private personal circumstances beyond professional work information are disclosed.", "Only employment dates or firsthand professional observations are offered; no private personal circumstances are disclosed."]}], ["Hints of misconduct", {type: "noul", instruction: "Does the writer imply the former colleague did something wrong?", criteria: ["", ""]}]),
        round("7-4", "The surprise stays a surprise", 490,
            "A colleague asks about a confidential launch. Decline to share its date or features, but point them to the public newsletter for confirmed announcements. Stay friendly without confirming guesses, inventing a release date, teasing secret knowledge, or making them feel excluded.",
            [
                ["Decline to share launch details", "Does the writer decline to share confidential launch details?"],
                ["Point to the public newsletter", "Does the writer direct the recipient to the public newsletter for confirmed announcements?"]
            ],
            risks.guarantee, risks.pity, ["Insider teasing", {type: "noul", instruction: "Does the writer tease the recipient about knowing secrets they do not know?", criteria: ["", ""]}], risks.insult, ["Leaking by hint", {type: "noul", instruction: "Does the message reveal the actual launch date or describe an unreleased feature?", criteria: ["A date, feature, or clue about the launch", "No date, feature, or clue is revealed"]}]),
        round("7-5", "Help without the backstory", 490,
            "A student requests a quieter room. Offer a quiet desk or a different session and let them choose. Explain that you do not need their diagnosis or personal history. Do not speculate about a condition, treat them as incapable, ask for proof, or decide for them.",
            [
                ["Offer a quiet desk", "Does the writer offer a quiet desk?"],
                ["Offer another session", {type: "noul", instruction: "Does the message offer attending another session as an option?",
                    criteria: ["", ""]}],
                ["Let the student choose", "Does the writer ask the student which option they prefer?"],
                ["Say no private history is required", "Does the writer explicitly say a diagnosis or personal history is not needed?"]
            ],
            risks.pity, risks.stigma, risks.pressure, ["Assumed consent", {type: "noul", instruction: "Does any part of the message treat silence as consent or decide for the recipient?",
                criteria: ["", ""]}], ["Speculative diagnosis", "The writer labels or guesses the student's medical or psychological condition.", "No diagnosis is stated or guessed."])
    ]},
    {id: 8, title: "One message, two audiences", skill: "Keep the message fair when different readers need different things", estimatedDuration: "50-90 min", rounds: [
        round("8-1", "The closure notice", 550,
            "A library room will close Tuesday for repairs. Write one notice for readers and staff: apologize for the disruption, direct readers to the downstairs room, and tell staff to move bookings there. Access stays free. Do not blame staff, celebrate the closure, promise repairs will finish Tuesday, or suggest readers caused it.",
            [
                ["Announce Tuesday's closure", "Does the notice say the library room closes Tuesday for repairs?"],
                ["Apologize", "Does the writer apologize for the disruption?"],
                ["Direct readers downstairs", "Does the quoted Text explicitly contain all of the following? The notice tells readers to use the downstairs room.", "", "Readers are not directed downstairs. Instructions to staff about bookings alone do not tell readers where to go."],
                ["Say access remains free", {type: "choice", instruction: "Does the message state that readers do not have to pay?",
                    criteria: ["Free access is not stated.", "Library access is described as free or free of charge."]}],
                ["Offer to move the bookings", "Does the notice ask staff to move affected bookings to the downstairs room?"]
            ],
            risks.blame, risks.spin, risks.guarantee, risks.accusation, risks.minimize),
        round("8-2", "A pilot is not a pay cut", 550,
            "Propose a four-week rota trial to staff and managers. It must preserve contracted hours while inviting staff to submit preferred shifts through a private form. Explain that not all preferences can be met and invite feedback before a decision. Avoid pretending everyone benefits, implying a final decision, blaming staff, or making refusal shameful.",
            [
                ["Propose a four-week rota trial", "Does the writer propose a four-week rota trial?"],
                ["Protect contracted hours", "Does the message explicitly fulfill the requirement below?", "The writer explicitly says contracted hours will be preserved.", "The message does not say contracted hours are protected."],
                ["Request shifts through a private form", "Does the writer ask staff to submit preferred shifts through a private form?"],
                ["Acknowledge limits on preferences", "Does the writer acknowledge that not every shift preference can be met?", "The message acknowledges that not every shift preference can be met.", "The limit on meeting shift preferences is not acknowledged."],
                ["Invite feedback before deciding", "Does the writer ask for feedback before deciding on the rota trial?"]
            ],
            risks.tradeoff, risks.coercion, risks.blame, risks.guilt, risks.spin),
        round("8-3", "Thanks without an endorsement", 550,
            "A company donated chairs to your community event. Thank them for the chairs, credit the volunteers who set up, and state that the donation does not buy influence over the program. Be warm without endorsing the company's products, insulting the donor, claiming all credit, or implying future funding is guaranteed.",
            [
                ["Thank them for the chairs", "Does the writer thank the company for donating chairs?"],
                ["Credit the volunteers", "Does the writer credit volunteers for setting up?"],
                ["Rule out influence over the program", {type: "noul", instruction: "Does the message explicitly deny giving the donor control over the program? Answer yes if: It says the donation gives no control or influence over the program, or that program decisions remain independent. Answer no if: It does not state that the donor lacks control over program decisions.",
                    criteria: ["", ""]}]
            ],
            risks.insult, risks.credit, risks.guarantee, ["Product endorsement", "The writer recommends the donor's products or treats the donation as proof of product quality.", "The donation is acknowledged without recommending products or asserting their quality."]),
        round("8-4", "A correction without a repeat", 550,
            "Yesterday you wrote that bookings were open. They open Friday instead. Correct your own error, give the right opening day and the public booking page, and acknowledge the inconvenience. Do not blame the reader, imply seats are reserved, use scarcity pressure, or turn the error into good news.",
            [
                ["Own the wrong announcement", "Does the writer admit their earlier statement that bookings were open was wrong?"],
                ["State that opening day is Friday", "Do bookings open on Friday?", "The message states that bookings open Friday.", "The Friday opening day is not stated."],
                ["Point to the public booking page", "Does the writer direct readers to the public booking page?"],
                ["Acknowledge the inconvenience", "Does the writer acknowledge the inconvenience caused by the error?"]
            ],
            ["Blame shifting", {type: "noul", instruction: "Does the writer accuse someone else of causing the mistake?",
                criteria: ["", ""]}], risks.spin, risks.sales, ["Promised seats", {type: "noul", instruction: "Does the message say any seats are already reserved for the recipient?", criteria: ["", ""]}], risks.minimize),
        round("8-5", "A rule with a welcome", 550,
            "A workshop cannot admit late arrivals once machinery starts. Invite newcomers to arrive ten minutes early for a safety briefing; offer the next session if they miss it. Explain a concrete danger from entering while machines run, without calling late people careless, threatening them, hiding the restriction, or promising an exception.",
            [
                ["Welcome newcomers", "Does the writer welcome newcomers to the workshop?"],
                ["Ask them to arrive ten minutes early", "Does the writer ask participants to arrive ten minutes early for a safety briefing?"],
                ["Explain the entry restriction", "Does the message prohibit entering once the machinery starts?", "The message explicitly states that people cannot enter after machines start running.", "No entry restriction tied to running machinery is stated. A safety warning or early-arrival request alone is insufficient."],
                ["Explain the safety reason", {type: "noul", instruction: "Does the message name an accident or injury that could happen to late arrivals?",
                    criteria: ["A specific physical hazard is described, such as being injured by blades or walking into moving parts.", "No injury or accident mechanism is described. A safety briefing and an entry ban alone do not explain the hazard."]}],
                ["Offer the next session", "Does the writer offer the next session to anyone who misses the briefing?"]
            ],
            risks.insult, ["Threats for refusing", {type: "noul", instruction: "Does the message match this description? The writer threatens to punish or retaliate against the recipient for refusing a request.", criteria: ["", ""]}], ["An entry exception", {type: "noul", instruction: "Does the writer offer to admit someone after the machinery starts?", criteria: ["", ""]}], risks.minimize)
    ]},
    {id: 9, title: "Plans that survive reality", skill: "Write contingencies that are actionable without overstepping", estimatedDuration: "60-120 min", rounds: [
        round("9-1", "Rain, rooms, and consent", 630,
            "A park picnic is planned for Saturday at noon. Check the forecast at nine; if heavy rain is forecast, propose the hall at noon. If the hall is unavailable, offer postponing to Sunday. The hall costs $40 split equally only among those who agree. Ask for explicit agreement before booking it. No assumed consent, guaranteed weather, hidden cost, pressure, or claim the hall is already booked.",
            [
                ["Plan a forecast check at nine", "Does the writer propose checking the forecast at nine on Saturday?"],
                ["Explain the rainy-day plan", "Does the text specify meeting in the hall at noon if heavy rain is forecast?", "The writer proposes meeting in the hall at noon if heavy rain is forecast.", "No such rainy-day plan is stated. Hall costs or booking alone do not state a plan to meet there at noon."],
                ["Offer a Sunday fallback", "Does the writer offer postponing the picnic to Sunday if the hall is unavailable?"],
                ["State the $40 cost", {type: "noul", instruction: "Does the writer state that the hall costs $40?",
                    criteria: ["The message satisfies this requirement: The $40 cost.", "This requirement is not met by the message."]}],
                ["Seek agreement on an equal split", {type: "noul", instruction: "Does the writer propose splitting the hall cost equally only among those who agree?",
                    criteria: ["The message satisfies this requirement: An agreed equal split.", "This requirement is not met by the message."]}],
                ["Ask for permission before booking", {type: "noul", instruction: "Does the writer explicitly request agreement before booking the hall?",
                    criteria: ["", ""]}]
            ],
            risks.coercion, risks.guarantee, risks.tradeoff, risks.guilt, ["Premature booking", {type: "noul", instruction: "Does the writer say they have already booked the hall?", criteria: ["", ""]}]),
        round("9-2", "A delivery with a fallback", 630,
            "A replacement part may arrive Thursday. If it arrives, offer installation Friday; if it does not, offer an update Friday and a temporary workaround. Ask the customer before applying the workaround, which disables one optional feature. No arrival guarantee, silent changes, hidden loss, blame, or claim the repair is complete.",
            [
                ["Make installation depend on arrival", "Does the writer make Friday installation conditional on the part arriving Thursday?"],
                ["Promise an update if delayed", "Does the writer offer a Friday update if the part does not arrive?", "The writer offers a Friday update if the part has not arrived.", "A Friday update for a delayed part is not offered."],
                ["Disclose the lost feature", "Does the writer disclose that the workaround disables an optional feature?"],
                ["Seek permission for the change", "Will the workaround wait for the customer's agreement?", "The writer asks the customer to agree before applying the workaround.", "The writer does not seek agreement before applying the workaround."]
            ],
            risks.guarantee, risks.coercion, risks.tradeoff, risks.blame, ["Premature completion", {type: "noul", instruction: "Does the writer claim the repair is already complete?", criteria: ["", ""]}]),
        round("9-3", "Two queues, one team", 630,
            "A team has capacity for either a security review or a feature launch today, not both. If the review finds a critical issue, fix it before launching; otherwise propose launching tomorrow. Ask the lead to approve the priority. No certainty about review results, blaming security, treating silence as consent, hiding delay, or promising both today.",
            [
                ["State today's capacity", {type: "noul", instruction: "Does the writer say only the security review or feature launch fits today, not both?",
                    criteria: ["The message satisfies this requirement: Today's capacity.", "This requirement is not met by the message."]}],
                ["Prioritize critical fixes", {type: "noul", instruction: "Does the plan require critical findings to be fixed before launch?",
                    criteria: ["The message satisfies this requirement: Fix critical findings first.", "This requirement is not met by the message."]}],
                ["Propose tomorrow's launch if clear", {type: "choice", instruction: "Does the writer propose launching tomorrow if the review finds no critical problem?",
                    criteria: ["No", "Yes"]}],
                ["Seek the lead's approval", {type: "choice", instruction: "Does the writer ask the lead to approve the priority?", criteria: ["The writer does not ask for approval. Stating a proposal alone is insufficient.", "The writer directly requests the lead's approval before proceeding."]}]
            ],
            risks.guarantee, risks.blame, risks.coercion, ["Claiming no drawbacks", {type: "noul", instruction: "Does the writer claim their proposal has no costs or drawbacks?", criteria: ["", ""]}], ["Overcommitting today", {type: "noul", instruction: "Does the writer promise to complete both the security review and the feature launch today?", criteria: ["", ""]}]),
        round("9-4", "A fair waitlist", 630,
            "There are two workshop seats and five people waiting. Propose offering seats in signup order, with a 24-hour response window, then moving to the next person. Offer everyone the next session too. Do not favor donors, treat silence as acceptance, shame slow replies, imply a guaranteed seat, or hide the two-seat limit.",
            [
                ["State two seats for five people", "How many seats and waiting people are there?", "There are two seats and five people waiting.", "The message does not state both two seats and five waiting people."],
                ["Use signup order", "Does the writer propose offering seats in signup order?"],
                ["Allow 24 hours to respond", {type: "noul", instruction: "Does the writer give each person 24 hours to respond?",
                    criteria: ["The message satisfies this requirement: A 24-hour response window.", "This requirement is not met by the message."]}],
                ["Move on if there is no reply", {type: "noul", instruction: "Does the writer say the offer moves to the next person if there is no reply?",
                    criteria: ["The message satisfies this requirement: Move to the next person.", "This requirement is not met by the message."]}],
                ["Offer another session to everyone", "Does the writer offer everyone a place at the next session as an alternative?", "All waiting people are invited to consider the next session.", "The next session is not offered to everyone waiting."]
            ],
            risks.coercion, ["Reply shaming", {type: "noul", instruction: "Does the writer shame people who take time to reply?", criteria: ["", ""]}], risks.guarantee, risks.tradeoff, ["Preferential access", "The writer gives donors, friends, or favored people priority over signup order.", "The same signup-order rule applies to everyone."]),
        round("9-5", "A reversible trial", 630,
            "Propose a two-week software trial with volunteers only. Keep the existing tool available; stop if data exports fail; review export reliability and time saved afterward. Say no one must move permanently before the review. No assumed consent, guaranteed savings, hiding rollback, pressure, or claiming the trial is already approved.",
            [
                ["Propose a two-week trial", "Does the writer propose a two-week software trial?"],
                ["Invite volunteers only", "Is participation in the software trial voluntary?", "Only volunteers take part in the trial.", "The message does not limit the trial to volunteers. Delaying permanent adoption alone does not make the trial voluntary."],
                ["Keep the existing tool available", "Does the writer keep the existing tool available during the trial?"],
                ["Set an export-failure stop rule", "Does the writer propose stopping the trial if data exports fail?"],
                ["Plan to review export reliability", {type: "choice", instruction: "Does the writer propose a later review of export reliability?", criteria: ["No post-trial review of export reliability is stated. A stop rule for failed exports alone is insufficient.", "Export reliability is explicitly included in the post-trial review."]}],
                ["Plan to measure time saved", "Does the writer propose reviewing time saved during the trial?"],
                ["Defer any permanent switch", "Does the writer explicitly defer any required permanent move until after the review?", "No one is required to move permanently until after the review.", "The message does not explicitly defer any required permanent move until after the review."]
            ],
            risks.coercion, risks.guarantee, ["Claiming no drawbacks", {type: "noul", instruction: "Does the writer claim there are no risks or drawbacks to the proposed trial?", criteria: ["", ""]}], risks.guilt, ["Presumed approval", {type: "noul", instruction: "Does the writer claim the trial has already been approved?", criteria: ["", ""]}]),
        round("9-6", "The shared bill", 630,
            "Three friends have each paid $30 for a $90 booking. A fourth wants to join. Work out an equal four-way split and explain the new payment and each refund. Ask everyone to agree before changing the booking; refund the original payers only after the newcomer pays. No guaranteed payment, shame, hidden cost, or charging the newcomer more.",
            [
                ["State the newcomer's payment", {type: "noul", instruction: "Does the quoted Text explicitly contain all of the following? The newcomer is asked to pay $22.50.",
                    criteria: ["The message satisfies this requirement: The newcomer's payment.", "This requirement is not met by the message."]}],
                ["Offer three $7.50 refunds", {type: "choice", instruction: "Does each original payer get $7.50 back?",
                    criteria: ["A $7.50 refund for each original payer is not offered.", "The message refunds $7.50 to each of the three people who originally paid $30."]}],
                ["Seek everyone's agreement first", "Does the writer ask all four people to agree before changing the booking?"],
                ["Require payment before refunds", "Does the writer make refunds conditional on receiving the newcomer's payment?"]
            ],
            ["Assumed consent", {type: "choice", instruction: "How is permission obtained for changing the booking?", criteria: ["Each person must explicitly agree before the booking changes", "Permission is assumed, including from silence", "No condition for consent is stated"]}], risks.guarantee, risks.guilt, risks.tradeoff, ["Unequal charging", {type: "noul", instruction: "Is the proposed final cost per person unequal?",
                criteria: ["", ""]}])
    ]},
    {id: 10, title: "The narrow path", skill: "Correct, persuade, and protect trust without convenient evasions", estimatedDuration: "75-150 min", rounds: [
        round("10-1", "A claim smaller than the headline", 710,
            "Your team advertised “twice as fast” after one ten-person test of a single task. Publicly narrow the claim to that test, acknowledge that the headline overstated the evidence, and propose a larger test across different tasks. Do not blame readers, imply broad proof, hide the small sample, use sales pressure, or claim the test already happened.",
            [
                ["Own the overstated headline", "Does the text explicitly mention a mistake in the original headline?"],
                ["Limit the claim to one task", {type: "choice", instruction: "According to the text alone, how many tasks produced the twice-as-fast result?", criteria: ["The number of tasks is not stated", "Only one task", "Multiple tasks"]}],
                ["State that only ten people took part", {type: "choice", instruction: "Is the ten-person sample stated?",
                    criteria: ["The number of people in the test is not given as ten.", "The message says ten people or ten participants took part in the test."]}],
                ["Propose a larger study", {type: "choice", instruction: "Does the writer propose testing more participants than before?", criteria: ["No larger study is proposed. A next study with different tasks alone does not say the sample will be larger.", "The writer proposes a larger study or sample before broadening the claim."]}],
                ["Include different tasks", "Does the writer explicitly propose testing different tasks?"]
            ],
            risks.blame, risks.guarantee, ["A broad proof claim", {type: "noul", instruction: "Does the writer present the small test as proof of a general speed improvement?", criteria: ["", ""]}], risks.sales, ["Pretend validation", {type: "noul", instruction: "Does the writer claim the larger study has already been completed?", criteria: ["", ""]}]),
        round("10-2", "The apology without a bargain", 710,
            "You shared a private message without permission. Apologize, say you removed your copy from the shared channel, and offer to ask recipients to delete theirs if the owner wants. Acknowledge you cannot guarantee deletion. Do not repeat the private content, excuse yourself, blame the owner, ask forgiveness as a condition, or promise complete erasure.",
            [
                ["Admit the disclosure", "Does the writer admit sharing a private message without permission?"],
                ["Apologize", "Does the writer apologize?"],
                ["Say you removed the shared copy", "Does the writer say they removed their copy from the shared channel?"],
                ["Offer to ask others to delete it", "Does the writer offer to ask recipients to delete their copies?"],
                ["Let the owner decide on contact", {type: "noul", instruction: "Does the owner choose whether other recipients are asked to delete their copies? Answer yes if: Contacting the recipients is offered only if the owner wants it, including if you'd like or if you want me to. Answer no if: The writer does not leave that choice to the owner.",
                    criteria: ["", ""]}],
                ["Say deletion is not guaranteed", {type: "noul", instruction: "Does the text contain \"cannot guarantee deletion\" or wording with the same meaning?",
                    criteria: ["", ""]}]
            ],
            risks.excuse, risks.blame, ["Guilt trips", {type: "noul", instruction: "Does the writer use personal obligation or guilt to obtain forgiveness or agreement from the owner?",
                criteria: ["The writer implies that refusing would make the owner uncaring or a bad friend.", "No refusal is morally judged. Admitting the privacy breach and offering repairs do not make forgiveness obligatory."]}], risks.guarantee, ["Repeating the disclosure", {type: "noul", instruction: "Does the text reveal what the original private message said?", criteria: ["", ""]}]),
        round("10-3", "A principled no with a route", 710,
            "A sponsor offers funding if they can choose which speaker is excluded. Decline that condition, explain that program decisions use the same published criteria for everyone, and offer an unrestricted donation or public feedback route. Do not insult the sponsor, bargain over a named speaker, imply a private exception, threaten them, or promise special influence over future decisions.",
            [
                ["Decline funding with a veto", "Does the writer refuse funding with control over speaker selection?", "The writer refuses to accept funding conditional on excluding a speaker.", "The exclusion condition is not refused."],
                ["Apply the same published criteria", "Does the writer state that speaker decisions use the same published criteria for everyone?"],
                ["Offer an unrestricted route", "Is a route without control over the speakers offered?", "The writer offers an unrestricted donation or a public feedback route without control over speaker selection.", "No unrestricted donation or public feedback route is offered."]
            ],
            risks.insult, risks.threat, ["A speaker bargain", {type: "noul", instruction: "Does the writer offer to exclude a named speaker in return for funding?", criteria: ["", ""]}], ["Promised program control", {type: "noul", instruction: "Does any sentence promise the recipient decision-making power over future programs, including a conditional or later offer? Ordinary public feedback does not count as control.",
                criteria: ["The recipient is offered control over future program or speaker choices.", "No such control is offered."]}], ["Private exception", "The writer offers or hints at a private exception to the published selection criteria.", "No exception or back-channel influence is offered."]),
        round("10-4", "A warning without a culprit", 710,
            "Duplicate charges are reported but their cause is unconfirmed. Tell users to check their statements, send transaction IDs through the private support form, and expect a status update at noon. Distinguish reports from confirmed findings. Do not name a culprit, request card numbers, guarantee refunds, call the reports harmless, or claim a fix exists.",
            [
                ["Report charges; say the cause is unknown", {type: "noul", instruction: "Does the message say duplicate charges were reported and the cause is not yet confirmed?",
                    criteria: ["", ""]}],
                ["Ask users to check statements", "Does the writer ask users to check their statements?"],
                ["Request transaction IDs privately", "Does the writer ask for transaction IDs through the private support form?"],
                ["Promise a noon status update", "Does the writer commit to a status update at noon?"]
            ],
            ["Naming a culprit", {type: "noul", instruction: "Does the writer blame any person or system for the duplicate charges?", criteria: ["", ""]}], risks.guarantee, risks.minimize, ["A premature fix", {type: "noul", instruction: "Does the writer claim the duplicate-charge problem has been fixed?", criteria: ["", ""]}], ["Sensitive data request", "The writer asks users to send card numbers, passwords, or payment details in public or through support.", "Only transaction IDs are requested through a private support route."]),
        round("10-5", "Opportunity without unpaid debt", 710,
            "Invite a junior colleague to present a project they helped build. Credit their contribution, make declining safe, and offer paid preparation time or co-presenting. Do not offer exposure instead of payment, imply refusal harms their career, take their credit, assume agreement, or demand personal reasons.",
            [
                ["Credit their contribution", "Does the writer give the recipient credit for helping build the project?"],
                ["Invite them to present", "Does the writer invite the recipient to present the project?"],
                ["Rule out penalties for declining", {type: "choice", instruction: "Which description fits the message?", criteria: ["There is no assurance that declining is acceptable.", "The message explicitly says the recipient can decline without penalty."]}],
                ["Offer concrete support", "Does the writer offer paid preparation time or co-presenting as support?"]
            ],
            risks.guilt, risks.credit, risks.coercion, risks.pressure, ["Exposure as payment", {type: "noul", instruction: "Does the writer offer publicity or exposure instead of payment for the work?", criteria: ["", ""]}]),
        round("10-6", "The review that leaves room", 710,
            "A pilot improved speed but produced two accessibility complaints. Recommend extending it only if those issues are addressed, keep the old route available, and ask affected users how to test the changes. Do not dismiss two complaints as too few, guarantee accessibility, force disclosure, imply everyone agrees, or hide the benefit.",
            [
                ["Acknowledge the speed benefit", "Does the writer acknowledge that the pilot improved speed?"],
                ["Report two accessibility complaints", "Does the text explicitly say there were two accessibility complaints?", "Two accessibility complaints are reported.", "The number of complaints is not given, or it is not two."],
                ["Require fixes before extending", "Does the quoted Text explicitly contain all of the following? The writer makes extending the pilot conditional on addressing the accessibility complaints."],
                ["Keep the old route available", {type: "noul", instruction: "Does the writer keep the old route available?",
                    criteria: ["The message satisfies this requirement: Retain the old route.", "This requirement is not met by the message."]}],
                ["Ask affected users how to test", "Does the writer ask affected users how the changes should be tested?"]
            ],
            risks.minimize, risks.guarantee, risks.pressure, risks.coercion, ["Claimed consensus", {type: "noul", instruction: "Does the writer claim that everybody has already agreed?", criteria: ["", ""]}])
    ]},
    {id: 11, title: "The full balancing act", skill: "Reconcile evidence, consent, fairness, uncertainty, and a usable plan", estimatedDuration: "2-4 hr", rounds: [
        round("11-1", "The raise after a freeze", 850,
            "Pay is frozen this quarter. You now lead training previously done by a manager. Ask for a documented pay review next quarter tied to that responsibility; propose agreeing review criteria now. Acknowledge the freeze without withdrawing the request. Avoid entitlement, threats, coworker comparisons, a guaranteed raise, or volunteering indefinite unpaid extra duties.",
            [
                ["Acknowledge this quarter's freeze", "Does the writer acknowledge that pay is frozen this quarter?"],
                ["Describe the new training role", "Does the writer say they now lead training previously done by a manager?"],
                ["Request a documented review next quarter", "Does the writer request a documented pay review next quarter tied to the training responsibility?"],
                ["Propose agreeing review criteria now", "Does the writer propose agreeing the review criteria now?"]
            ],
            risks.entitlement, risks.threat, risks.guarantee, ["Coworker comparison", "The writer argues for their raise by disparaging coworkers or claiming to be worth more than them.", "The case is based on the writer's responsibilities, not comparisons with coworkers."], ["Indefinite unpaid commitment", "The writer agrees to keep the extra duties indefinitely without a review or limit.", "The extra responsibility is connected to a concrete future review, not an indefinite unpaid commitment."]),
        round("11-2", "An incident without a scapegoat", 850,
            "A service outage lasted 40 minutes; access is restored, some exports are still queued, and the cause is unconfirmed. Apologize, tell users not to resubmit exports, offer the private support route for urgent cases, and promise an update at 18:00. No culprit, complete-fix claim, finish-time guarantee, sensitive-data request, or minimizing the impact.",
            [
                ["Report the 40-minute outage", {type: "noul", instruction: "Does the message state the outage lasted 40 minutes?",
                    criteria: ["The message satisfies this requirement: The 40-minute outage.", "This requirement is not met by the message."]}],
                ["Say access is restored", "Does the message say access is restored?"],
                ["Say exports remain queued", "Does the message say some exports are still queued?"],
                ["Say the cause is unconfirmed", {type: "noul", instruction: "Does the message say the cause is unconfirmed?",
                    criteria: ["The message satisfies this requirement: The cause is unconfirmed.", "This requirement is not met by the message."]}],
                ["Apologize", "Does the writer apologize for the outage?"],
                ["Tell users not to resubmit exports", "Does the writer tell users not to resubmit exports?"],
                ["Offer private support for urgent cases", "Does the writer offer private support for urgent cases?"],
                ["Promise an 18:00 update", "Does the writer commit to another update at 18:00?"]
            ],
            ["Naming a culprit", {type: "noul", instruction: "Does the writer blame any person or system for the outage?", criteria: ["", ""]}], ["A premature all-clear", {type: "noul", instruction: "Does the writer claim that all problems from the outage are now resolved?", criteria: ["", ""]}], risks.guarantee, risks.minimize, ["Unsafe data collection", "The writer asks users to post credentials, private files, or sensitive details publicly.", "Urgent cases go through private support without requesting public sensitive data."]),
        round("11-3", "Two reasonable sides", 850,
            "Two neighbors share a room: one needs a quiet call at six, the other has booked music practice from five to seven. Propose keeping practice five to six and moving six to seven elsewhere only if both agree; offer another call location as a fallback. Acknowledge the booking and quiet need. No imposed decision, blame, guilt, guaranteed room availability, or erasing either person's hour.",
            [
                ["Acknowledge the music booking", "Does the writer acknowledge music practice booked from five to seven?"],
                ["Acknowledge the quiet call at six", {type: "choice", instruction: "Does the writer explicitly describe a need for a quiet call at six?", criteria: ["No quiet call at six is described; mentioning practice from five to seven or another call location is insufficient", "A neighbor needs quiet for a call at six"]}],
                ["Propose moving only the last hour", {type: "noul", instruction: "Does the proposed plan keep music practice here from five to six and move the six-to-seven hour elsewhere?",
                    criteria: ["", ""]}],
                ["Require both people's agreement", "Does the writer make the proposed change conditional on both neighbors agreeing?"],
                ["Offer a fallback location for the call", "Does the writer offer another location for the call if moving practice cannot work?"]
            ],
            risks.coercion, risks.blame, risks.guilt, risks.guarantee, risks.tradeoff),
        round("11-4", "A launch with a stop rule", 850,
            "A launch has passed functional tests; accessibility review is scheduled for Monday. Propose a voluntary limited pilot after that review, retain the existing service, and stop the pilot if payment errors appear. Review completion times and support requests after one week before deciding on expansion. No full-launch promise, assumed consent, hidden review gap, pressure on testers, or certainty that no errors will occur.",
            [
                ["Say functional tests passed", "Does the writer state that functional tests have passed?"],
                ["Mention Monday's accessibility review", "Does the writer say accessibility review is scheduled for Monday?"],
                ["Propose a limited pilot after review", {type: "choice", instruction: "Does the message suggest a small pilot after the accessibility review?",
                    criteria: ["No", "Yes"]}],
                ["Make participation voluntary", {type: "choice", instruction: "Does the message explicitly say the pilot is voluntary?", criteria: ["Voluntary participation is not stated. A limited pilot alone does not establish consent.", "Participation is described as voluntary or limited to volunteers."]}],
                ["Keep the existing service available", "Does the writer keep the existing service available during the pilot?"],
                ["Set payment errors as a stop rule", {type: "noul", instruction: "Do payment errors stop the pilot under this plan? Answer yes if: The proposal stops the pilot if payment errors appear, including we stop for payment errors. Answer no if: No stop condition tied to payment errors is given.",
                    criteria: ["", ""]}],
                ["Plan a review before expanding", "Does the writer propose reviewing the pilot after one week before deciding whether to expand?"],
                ["Plan to review completion times", "Does the message propose reviewing completion times?"],
                ["Plan to review support requests", "Does the message propose reviewing support requests?"]
            ],
            risks.promise, risks.coercion, ["Pretend clearance", {type: "noul", instruction: "Does the writer claim the accessibility review has already passed?", criteria: ["", ""]}], risks.guilt, risks.guarantee),
        round("11-5", "Funding without favoritism", 850,
            "A donor offers $2,000 for a youth program if their child gets priority. Decline the priority condition while welcoming an unrestricted donation. Explain that all places use the public signup order, offer the same waitlist route, and avoid disclosing other children's details. No shaming, backroom exception, seat guarantee, pressure to donate, or identifying another applicant.",
            [
                ["Decline priority for funding", "Does the writer decline priority for the donor's child in exchange for $2,000?", "The writer refuses priority for the donor's child in return for $2,000.", "The priority-for-funding condition is not refused."],
                ["Welcome an unrestricted gift", "Does the writer welcome an unrestricted donation?"],
                ["Apply public signup order", "Does the text state that signup order determines who gets places?", "The writer states that places follow public signup order.", "The writer may offer a waitlist but does not state that places follow signup order."],
                ["Offer the normal waitlist", "Is the usual waitlist offered to the child?", "The writer offers the donor's child the same waitlist route as other applicants.", "No normal waitlist route is offered."]
            ],
            risks.insult, risks.sales, risks.guarantee, ["Hidden exception", "Special treatment for the donation", "Normal signup and waitlist rules", "How will the donor's child be admitted?"], ["Applicant disclosure", "The writer reveals identifying information or private circumstances of another child or applicant.", "No other applicant's identity or private circumstances are revealed."]),
        round("11-6", "Correct the record, keep the person", 850,
            "A public post wrongly credited you alone for a tool: Priya designed it, you tested it, and Lee wrote the guide. Correct the credit, own that you approved the post, and offer to update both the post and guide credits. Invite each contributor to confirm wording before you change it. No excuse, blame, sole-credit claim, assumed consent, or erasing your real contribution.",
            [
                ["Credit Priya with the design", "Did Priya design the tool?"],
                ["Describe your testing role", {type: "choice", instruction: "Does the writer say they tested the tool?", criteria: ["The writer's testing contribution is not stated. Credit to other people alone is insufficient.", "The writer states that they tested the tool."]}],
                ["Credit Lee with the guide", {type: "choice", instruction: "What does the text say Lee did?", criteria: ["Lee is not mentioned or no work by Lee is described", "Lee wrote the guide"]}],
                ["Own approving the wrong post", "Does the writer admit approving the inaccurate sole-credit post?"],
                ["Offer to correct the post credits", {type: "choice", instruction: "Which documents does the writer offer to update?", criteria: ["Only the guide", "The public post, with or without an update to the guide", "Neither document"]}],
                ["Offer to correct the guide credits", {type: "noul", instruction: "Does the message propose correcting the guide's credits?",
                    criteria: ["", ""]}],
                ["Ask contributors to confirm first", "Does the writer ask contributors to confirm the wording before it is changed?"]
            ],
            risks.excuse, risks.blame, risks.credit, risks.coercion, ["Erasing your contribution", "The writer denies doing the testing or transfers all of their actual testing contribution to someone else.", "The writer retains accurate credit for testing while recognizing others."]),
        round("11-7", "A hard change without a soft lie", 850,
            "A community class must move from free weekly sessions to two free sessions a month because funding fell by half. Explain the loss plainly, invite feedback before choosing the dates, and offer the free practice materials between sessions. Do not call it an upgrade, blame participants, imply donations buy access, promise funding will recover, or ask people to disclose hardship.",
            [
                ["Say funding fell by half", "Does the writer explain that funding fell by half?"],
                ["Explain the reduced session frequency", "Does the writer say free weekly classes will become two free sessions a month?"],
                ["Invite feedback before choosing dates", "Does the writer invite feedback before choosing session dates?"],
                ["Offer free materials between sessions", "Does the writer offer free practice materials between sessions?"]
            ],
            risks.spin, risks.blame, risks.guarantee, risks.pressure, ["Paying for priority", "The writer implies donating or paying will secure priority access to the free sessions.", "Access to the free sessions is not conditional on donating."]),
        round("11-8", "The last responsible word", 850,
            "A trial of a new booking system cut median waiting from ten minutes to seven across 30 users, but two could not complete checkout with a keyboard. Recommend no wider rollout yet. Propose fixing keyboard checkout and keeping the old route. Invite volunteers to sign up for retesting through a form, and pay participants for their time. Plan a two-week review before rollout, measuring satisfaction ratings and support requests. Do not erase the speed gain, minimize the exclusion, guarantee success, assume consent, or request diagnoses.",
            [
                ["Report the ten-to-seven-minute median", "Does the writer report median waiting time falling from ten minutes to seven?"],
                ["State the sample of 30 users", "Does the writer say the trial involved 30 users?"],
                ["Report two keyboard checkout failures", "Does the writer report that two users could not complete checkout with a keyboard?"],
                ["Propose fixing keyboard checkout", {type: "noul", instruction: "Does the writer explicitly propose repairing keyboard checkout?",
                    criteria: ["", ""]}],
                ["Keep the old route available", {type: "noul", instruction: "Does the writer keep the old booking route available?",
                    criteria: ["The message satisfies this requirement: Keep the old route.", "This requirement is not met by the message."]}],
                ["Offer to pay for participants' time", "Does the writer offer to pay retest participants for their time?"],
                ["Invite volunteers through a form", "Does the writer invite volunteers to sign up for retesting through a form?"],
                ["Plan a review after two weeks", "Does the writer propose a two-week review before deciding on rollout?"],
                ["Plan to review satisfaction ratings", "Does the message propose reviewing satisfaction ratings?"],
                ["Plan to review support requests", "Does the message propose reviewing support requests?"]
            ],
            risks.minimize, risks.guarantee,
            ["Mandatory retesting", {type: "choice", instruction: "What does the writer say about participating in retesting?", criteria: ["Participants can choose whether to retest", "Everyone must take part", "Participation requirements are not stated"]}],
            risks.pressure)
    ]}
];
