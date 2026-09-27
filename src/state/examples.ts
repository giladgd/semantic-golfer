import type {DecisionInput, DecisionType} from "../../shared/decision.ts";

const ticket = "My whole team is locked out of our accounts. None of us can sign in, so we cannot continue our work.";

export const examples: Record<DecisionType, Array<{name: string, input: DecisionInput}>> = {
    noul: [
        {name: "Team access", input: {
            type: "noul", document: ticket,
            instruction: "Is the entire team unable to sign in?",
            criteria: ["Every team member is unable to sign in", "At least one team member can still sign in"]
        }},
        {name: "An animal", input: {
            type: "noul", document: "A small cat curled up on my keyboard while I was working.",
            instruction: "Does this text mention an animal?",
            criteria: ["An animal is mentioned", "No animal is mentioned"]
        }},
        {name: "Needs a reply", input: {
            type: "noul", document: "Thanks for sending the notes. Could you confirm whether Tuesday at 10 works for the review?",
            instruction: "Does this message need a reply?",
            criteria: ["The sender asks a question or requests action", "The message is informational and needs no response"]
        }}
    ],
    choice: [
        {name: "Support routing", input: {
            type: "choice", document: ticket,
            instruction: "Which support team should handle this ticket?",
            criteria: ["Accounts: signing in, passwords, and account access", "Billing: invoices, payments, and refunds",
                "Technical: problems using features after signing in"]
        }},
        {name: "Delivery", input: {
            type: "choice", document: "Please send my order by express courier. I am choosing express delivery rather than standard shipping or store pickup.",
            instruction: "Which delivery method has the customer chosen?",
            criteria: ["Standard shipping", "Express courier", "Store pickup"]
        }},
        {name: "Intent", input: {
            type: "choice", document: "Please add an option to export the dashboard charts as SVG files. This export option is currently missing.",
            instruction: "What is the main intent of this message?",
            criteria: ["Report a bug", "Request a feature", "Ask for help", "Give a compliment"]
        }}
    ],
    score: [
        {name: "Issue severity", input: {
            type: "score", document: ticket,
            instruction: "How much is the issue affecting the customer's work?",
            criteria: ["No interruption to work", "Some tasks are slower or harder", "The customer cannot continue their work"]
        }},
        {name: "Purchase intent", input: {
            type: "score", document: "We want to buy 20 seats, but only if your product integrates with our CRM. We need to confirm that before purchasing.",
            instruction: "How strongly does the customer express an intention to purchase?",
            criteria: ["Not interested", "Just browsing", "Considering purchasing", "Conditional intent to purchase", "Ready to buy"]
        }},
        {name: "Order status", input: {
            type: "score", document: "The parcel has arrived at my address. I signed for it and have opened the package.",
            instruction: "What stage has the order reached?",
            criteria: ["Not ordered", "Order placed", "Dispatched", "Delivered"]
        }}
    ]
};
