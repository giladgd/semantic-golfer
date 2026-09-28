import type {DecisionInput, DecisionType} from "../../shared/decision.ts";

const ticket = "My whole team is locked out of our accounts. None of us can sign in, so we cannot continue our work.";

export const examples: Record<DecisionType, Array<{name: string, input: DecisionInput}>> = {
    noul: [
        {name: "Shared issue", input: {
            type: "noul", document: ticket,
            instruction: "Does this issue affect multiple people?",
            criteria: ["Multiple people are affected", "No indication multiple people are affected"]
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
            type: "choice", document: "I need it delivered as soon as possible",
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
        {name: "Intent", input: {
            type: "score", document: "We want to buy 20 seats, but only if your product integrates with our CRM. We need to confirm that before purchasing.",
            instruction: "How strongly does the customer express an intention to purchase?",
            criteria: ["Not interested", "Just browsing", "Considering purchasing", "Conditional intent to purchase", "Ready to buy"]
        }},
        {name: "Satisfaction", input: {
            type: "score", document: "The app saves me time every day. The confusing menus still annoy me, but overall I’m happy with it",
            instruction: "How satisfied is the customer with their overall experience?",
            criteria: ["Very dissatisfied", "Somewhat dissatisfied", "Neutral", "Somewhat satisfied", "Very satisfied"]
        }}
    ]
};
