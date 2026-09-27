import type {GameLevel, GameRound} from "../games.ts";

// Each condition describes evidence in the message, rather than a likely intention.
const conditions = {
    animal: ["Names an animal", "Does the text contain an actual animal name? A category label is not an animal name.", "An animal name like cat, dog, or fox appears in the text.", "No animal name appears in the text."],
    help: ["Asks for help", "Does the writer ask someone for help?", "The writer requests assistance or asks someone to help."],
    urgent: ["Needs action now", "Does the text explicitly call for immediate action?", "The message requests action now, immediately, or describes an emergency."],
    apology: ["Apologizes", "Does the writer apologize?", "The writer expresses regret for something and says sorry or apologizes."],
    weather: ["Names bad weather", "Does the text name a bad-weather condition?", "A concrete condition is named, such as rain, snow, or a storm. The generic phrase bad weather alone does not count. Do not infer unfinished words."],
    alternative: ["Proposes another plan", "Does the writer propose a replacement plan?", "The writer suggests doing something else instead of the original plan."],
    food: ["Names a food", "Does the text name a food?", "The text names a food such as pizza, bread, soup, or rice. The generic word food alone does not count. Do not infer unfinished words."],
    question: ["Asks a question", "Does the quoted Text contain an interrogative sentence? Judge only the quoted Text. Unfinished words do not count; do not guess what comes next.", "The text contains a question.", "The text contains no questions."],
    excited: ["Shows excitement", "Does the writer express excitement?", "The writer expresses enthusiasm, delight, or eagerness about something."],
    thanks: ["Expresses thanks", "Does the writer thank someone?", "The text includes thanks, thank you, or another expression of gratitude."],
    time: ["Gives a time", "Does the text mention a time or day?", "A specific time or day is mentioned, such as noon, six, Friday, or tomorrow."],
    place: ["Names a location", "Does the text mention a place or location?", "A concrete place is named, such as a house, river, bridge, park, kitchen, or office."],
    invite: ["Invites someone", "Does the writer invite someone to take part?", "The writer invites the reader to join an activity or come somewhere."],
    warning: ["Warns of a risk", "Does the message warn someone about a danger or problem?", "The writer warns of a specific risk or harmful possibility."],
    reason: ["Explains why", "Does the message give a reason for a situation, action, or request?", "A reason is given for a situation, request, or action, for example using because or so."],
    condition: ["Sets a condition", "Does the message make an action depend on a condition?", "An action or outcome depends on an explicit condition, for example if or unless something happens."],
    offer: ["Offers assistance", "Does the writer offer to help someone?", "The writer offers their own help or assistance."],
    promise: ["Makes a commitment", "Does the writer commit to a future action?", "The writer states something they will do or promises to do it."],
    contrast: ["Contrasts two facts", "Does the text contrast two facts or qualities?", "The text presents contrasting preferences or facts, often joined by but, although, or despite."],
    refuse: ["Declines a request", "Does the writer decline or refuse something?", "The writer clearly says they cannot or will not accept, attend, or do something."],
    repair: ["Offers to make amends", "Does the writer offer to put right something that went wrong?", "The writer proposes a concrete repair, replacement, repayment, or corrective action."],
    quantity: ["Gives a quantity", "Does the message state how many or how much?", "There is a count of things, people, or payments, expressed in digits or words."],
    transport: ["Names a vehicle", "Does the text name a vehicle?", "The text names a vehicle, such as a train, bus, bike, car, or boat. Do not infer unfinished words."],
    sequence: ["Orders two actions", "Does the message explicitly put two actions in order?", "The message says one action should happen before or after another, or gives a first step and then a second."],
    compare: ["Makes a comparison", "Does the message contain an explicit comparison?", "A comparison is made, for example saying one thing is cheaper, faster, higher, or lower than another."],
    consequence: ["States a consequence", "Does the message state what will result from an action or event?", "The message explicitly connects an action or event to a resulting outcome."],
    permission: ["Asks permission", "Does the writer ask permission to do something?", "The writer asks whether they may do a specific action."],
    compromise: ["Proposes a compromise", "Does the writer propose meeting someone halfway?", "The writer proposes a middle ground or concession that accommodates two different needs or preferences."],
    choice: ["Offers a choice", "Does the writer give the reader a choice between alternatives?", "The reader is offered two or more specific alternatives to choose from."],
    money: ["Mentions a price", "Does the text mention an amount of money?", "The text mentions a sum of money, such as $5 or ten dollars."],
    reassure: ["Reassures someone", "Does the writer reassure someone who might worry?", "The writer explicitly offers reassurance that a situation is safe, manageable, or will be taken care of."],
    credit: ["Credits someone else", "Does the writer give someone else credit for a contribution?", "Another person or group is acknowledged for a helpful action, idea, or achievement."],
    instructions: ["Gives an instruction", "Does the message tell the reader to do a specific action?", "The writer directly instructs the reader to do something concrete."]
} satisfies Record<string, [string, string, string, string?]>;

function round(id: string, title: string, limit: number, ...keys: (keyof typeof conditions)[]): GameRound {
    const selected = keys.map((key) => conditions[key]);
    return {
        id, title, limit, labels: selected.map(([label]) => label),
        questions: keys.map((key) => {
            const [, instruction, yes, no] = conditions[key];
            return no != null ? {
                type: "noul",
                instruction,
                criteria: [yes, no]
            } : {
                type: "noul",
                instruction: `${instruction} Answer yes if ${yes[0]!.toLowerCase()}${yes.slice(1)} Answer no otherwise.`,
                criteria: ["Yes", "No"]
            };
        })
    };
}

export const lockLevels: GameLevel[] = [
    {id: 1, title: "Make yourself understood", skill: "Combine a topic, a purpose, and a tone.", rounds: [
        round("1-1", "A small emergency", 120, "animal", "help", "urgent"),
        round("1-2", "Change of plans", 110, "apology", "weather", "alternative"),
        round("1-3", "A bright idea", 100, "food", "question", "excited")
    ]},
    {id: 2, title: "Say what you need", skill: "Make requests and invitations precise.", rounds: [
        round("2-1", "Lunch is on me", 100, "food", "invite", "time"),
        round("2-2", "A helpful neighbor", 100, "thanks", "animal", "offer"),
        round("2-3", "A clear handoff", 95, "instructions", "place", "time")
    ]},
    {id: 3, title: "Give it a reason", skill: "Connect a request or change to its cause.", rounds: [
        round("3-1", "The rainy picnic", 125, "weather", "alternative", "reason", "invite"),
        round("3-2", "Running late", 120, "apology", "transport", "reason", "time"),
        round("3-3", "A hungry guest", 115, "food", "help", "reason", "thanks")
    ]},
    {id: 4, title: "Plan ahead", skill: "Use conditions and sequences without losing clarity.", rounds: [
        round("4-1", "Weather permitting", 120, "condition", "weather", "invite", "place"),
        round("4-2", "Dinner in order", 115, "food", "sequence", "instructions", "time"),
        round("4-3", "The early train", 115, "transport", "condition", "promise", "time"),
        round("4-4", "A careful crossing", 115, "warning", "sequence", "instructions", "reason")
    ]},
    {id: 5, title: "Small repairs", skill: "Take responsibility and propose a useful next step.", rounds: [
        round("5-1", "The broken mug", 140, "apology", "repair", "promise", "time", "reason"),
        round("5-2", "Dinner went wrong", 135, "food", "apology", "repair", "choice", "time"),
        round("5-3", "Sorry I can't make it", 130, "refuse", "apology", "reason", "alternative", "time"),
        round("5-4", "A borrowed bicycle", 130, "transport", "thanks", "promise", "time", "place")
    ]},
    {id: 6, title: "Make room for both", skill: "Compare choices and balance different needs.", rounds: [
        round("6-1", "A quieter dinner", 135, "food", "contrast", "compare", "choice", "question"),
        round("6-2", "Meet halfway", 130, "compromise", "place", "time", "invite", "reason"),
        round("6-3", "The cheaper journey", 125, "transport", "compare", "money", "choice", "question"),
        round("6-4", "A little reassurance", 125, "animal", "warning", "reassure", "offer", "condition")
    ]},
    {id: 7, title: "Useful details", skill: "Fit six pieces of useful information into one message.", rounds: [
        round("7-1", "Soup for the team", 155, "food", "quantity", "time", "place", "invite", "question"),
        round("7-2", "A rescue plan", 150, "animal", "help", "urgent", "place", "warning", "instructions"),
        round("7-3", "A missed delivery", 145, "apology", "repair", "promise", "time", "choice", "place"),
        round("7-4", "The last bus", 140, "transport", "warning", "condition", "consequence", "alternative", "time"),
        round("7-5", "A generous offer", 140, "thanks", "credit", "offer", "time", "place", "question")
    ]},
    {id: 8, title: "Tact and tradeoffs", skill: "Keep the relationship intact while changing the plan.", rounds: [
        round("8-1", "A fair split", 150, "compromise", "money", "quantity", "reason", "choice", "time"),
        round("8-2", "Not tonight", 145, "refuse", "apology", "reason", "alternative", "invite", "time"),
        round("8-3", "A safer outing", 145, "weather", "warning", "alternative", "reason", "invite", "place"),
        round("8-4", "A careful favor", 140, "permission", "animal", "condition", "promise", "place", "time"),
        round("8-5", "Dinner, revised", 140, "food", "contrast", "compromise", "choice", "time", "question")
    ]},
    {id: 9, title: "Seven moving parts", skill: "Combine seven conditions in a coherent message.", rounds: [
        round("9-1", "The surprise picnic", 175, "food", "excited", "invite", "quantity", "time", "place", "question"),
        round("9-2", "A wet-weather rescue", 170, "animal", "weather", "help", "urgent", "place", "warning", "instructions"),
        round("9-3", "Make it right", 165, "apology", "repair", "promise", "time", "money", "choice", "reason"),
        round("9-4", "Two ways home", 165, "transport", "compare", "money", "time", "choice", "condition", "question"),
        round("9-5", "A team effort", 160, "thanks", "credit", "offer", "promise", "time", "place", "reason"),
        round("9-6", "A safe sequence", 160, "food", "warning", "sequence", "instructions", "condition", "consequence", "reason")
    ]},
    {id: 10, title: "Every word earns its place", skill: "Keep the same meaning while trimming seven-part messages.", rounds: [
        round("10-1", "The short invitation", 135, "food", "invite", "time", "place", "quantity", "excited", "question"),
        round("10-2", "The short apology", 135, "apology", "refuse", "reason", "alternative", "invite", "time", "place"),
        round("10-3", "The short rescue", 130, "animal", "help", "urgent", "place", "warning", "instructions", "reason"),
        round("10-4", "The short bargain", 130, "compromise", "compare", "money", "choice", "condition", "promise", "time"),
        round("10-5", "The short handoff", 130, "instructions", "sequence", "time", "place", "quantity", "food", "thanks"),
        round("10-6", "The short reassurance", 130, "animal", "reassure", "offer", "condition", "promise", "time", "place")
    ]},
    {id: 11, title: "The final edit", skill: "Eight different situations. Seven conditions. Make each message count.", rounds: [
        round("11-1", "The gathering", 145, "food", "invite", "excited", "quantity", "time", "place", "question"),
        round("11-2", "The setback", 140, "weather", "apology", "reason", "alternative", "invite", "time", "place"),
        round("11-3", "The emergency", 140, "animal", "help", "urgent", "warning", "place", "instructions", "reason"),
        round("11-4", "The repair", 140, "apology", "repair", "promise", "time", "choice", "money", "reason"),
        round("11-5", "The negotiation", 140, "compromise", "refuse", "reason", "alternative", "condition", "promise", "money"),
        round("11-6", "The journey", 135, "transport", "compare", "choice", "money", "time", "condition", "question"),
        round("11-7", "The handover", 135, "food", "sequence", "instructions", "warning", "reason", "time", "thanks"),
        round("11-8", "The thank-you", 135, "thanks", "credit", "offer", "promise", "invite", "time", "place")
    ]}
];
