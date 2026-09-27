import type {GameLevel, GameRound} from "../games.ts";

const categories = {
    praise: ["Praise", "Does the quoted Text contain any praise or compliment, even if it also contains criticism?"],
    complaint: ["Complaint", "Does the quoted Text complain about a problem the writer has experienced? A warning about a possible danger is not a complaint."],
    question: ["Question", "Does the quoted Text contain an interrogative sentence?"],
    apology: ["Apology", "Does the writer explicitly apologize, such as saying sorry or I apologize?"],
    invitation: ["Invitation", "Does the quoted Text directly ask another person to join the writer in an activity?"],
    warning: ["Warning", "Does the text warn of a danger?"],
    thanks: ["Gratitude", "Is there an expression of gratitude anywhere in the quoted Text?"],
    offer: ["Offer of help", "Does the quoted Text explicitly volunteer help to another person, such as \"I can help you\"?"],
    request: ["Request for help", "Does the writer ask the reader to provide help? Offering help is different."],
    promise: ["Promise", "Does the writer explicitly commit to a future action, such as saying I promise or I will? Describing a current activity is not a promise."],
    refusal: ["Refusal", "Does the writer turn down an invitation, offer, or request?"],
    food: ["Food", "Is a food item or ingredient named anywhere in the text?"],
    nature: ["Nature", "Does the text mention wild animals, wild plants, or a natural landscape?"],
    pets: ["Pets", "Does the text mention a pet?"],
    travel: ["Travel", "Does the text describe a person taking a journey or visiting a different place? Mentioning a location alone is not travel."],
    work: ["Work", "Does the text explicitly mention a paid job, employment, or professional duties?"],
    leisure: ["Leisure", "Does the text explicitly say an activity is done for fun, pleasure, or as a hobby? Performing an activity alone does not say it is recreation."],
    shopping: ["Shopping", "Does the text explicitly describe buying, selling, or ordering goods?"],
    learning: ["Learning", "Does the text explicitly describe someone learning, studying, or being taught? Performing an activity alone is not evidence of learning."],
    science: ["Science", "Does the text mention a scientific fact, scientific process, experiment, or scientific study?"],
    music: ["Music", "Does the text mention singing or playing music?"],
    sport: ["Sport", "Does the text mention a sport or physical exercise?"],
    art: ["Art", "Does the text mention drawing, painting, or sculpture?"],
    technology: ["Technology", "Does the text mention computers, software, or electronic devices?"],
    health: ["Health", "Does the text describe an illness, injury, or medical treatment?"],
    gardening: ["Gardening", "Does the text describe cultivating plants in a garden? Look for an actual gardening action, such as planting seeds or watering flowers."],
    cooking: ["Cooking", "Does the text explicitly describe preparing or cooking food, such as chopping, mixing, baking, or boiling? Eating or tasting food alone does not count."],
    repair: ["Repair", "Does the quoted Text identify a broken object and describe repairing it? Do not infer or complete missing text."],
    transport: ["Transport", "Does the text mention a vehicle?"],
    weather: ["Weather", "Does the text mention a weather condition?"],
    celebration: ["Celebration", "Does the text describe celebrating a special occasion?"],
    family: ["Family", "Does the text mention a family member?"],
    history: ["History", "Does the quoted Text name a particular ancient civilization or a specific historical event?"]
} satisfies Record<string, [string, string]>;

const criteria: Record<keyof typeof categories, [string, string]> = {
    question: ["The text contains a question.", "The text contains no questions."],
    praise: ["The writer gives a compliment or positive feedback.", "The writer gives no compliment or positive feedback."],
    complaint: ["An actual complaint about a bad experience.", "No complaint about a bad experience."],
    learning: ["Someone is explicitly learning, studying, or receiving a lesson.", "No learning, study, or lesson is described."],
    offer: ["An explicit offer to help another person.", "A personal activity or other message without an offer of help."],
    leisure: ["An activity is explicitly done for fun or as a hobby.", "No recreational purpose is stated. This includes unrelated text or fragments without enough information."],
    shopping: ["Goods are bought, sold, or ordered.", "No goods are bought, sold, or ordered."],
    apology: ["The writer explicitly apologizes.", "The writer does not apologize."],
    invitation: ["A direct invitation addressed to another person.", "No direct invitation is addressed to another person."],
    warning: ["The text warns someone about a specific danger.", "The text does not warn of a danger."],
    thanks: ["Thanks, thank you, or being grateful is expressed.", "No expression of gratitude is present."],
    promise: ["The writer commits to a future action.", "No commitment to a future action is made."],
    refusal: ["The writer says no to an invitation, offer, or request.", "The writer does not turn down an invitation, offer, or request."],
    request: ["The writer asks someone else for assistance.", "The writer does not ask for assistance."],
    food: ["A food or ingredient is named, such as bread, rice, cake, or lemon.", "No actual food or ingredient is named; the text may be unrelated or unfinished."],
    nature: ["Wild animals, wild plants, or a natural landscape are mentioned.", "No wild animals, wild plants, or natural landscape are mentioned."],
    pets: ["The text mentions an animal kept as a pet.", "No pet is mentioned."],
    travel: ["Someone is traveling or visiting a place.", "No one is traveling or visiting a place."],
    work: ["The text explicitly describes paid work, employment, or professional duties.", "The text does not describe paid work, employment, or professional duties."],
    science: ["A scientific process, finding, experiment, or study is described.", "No scientific process, finding, experiment, or study is described."],
    music: ["Singing, playing music, or a musical instrument is mentioned.", "No singing, music, or musical instrument is mentioned."],
    sport: ["A sport or physical exercise is mentioned.", "No sport or physical exercise is mentioned."],
    art: ["Drawing, painting, or sculpture is mentioned.", "No drawing, painting, or sculpture is mentioned."],
    technology: ["Computers, software, or electronic devices are mentioned.", "No computers, software, or electronic devices are mentioned. This includes unrelated text or fragments without enough information."],
    health: ["An illness, injury, or medical treatment is described.", "No illness, injury, or medical treatment is described."],
    gardening: ["An actual gardening action is described.", "No gardening action is described."],
    cooking: ["Preparing or cooking food is described.", "No preparation or cooking of food is described."],
    repair: ["The text identifies a broken object and describes a repair.", "No specific broken object and repair are described; the text may be unrelated or unfinished."],
    transport: ["The text names a vehicle, such as a car, bus, bicycle, or train.", "No vehicle is named."],
    weather: ["A specific weather condition is mentioned.", "No weather condition is mentioned."],
    celebration: ["Someone celebrates a special occasion.", "No celebration of a special occasion is described."],
    family: ["A family member is mentioned.", "No family member is mentioned."],
    history: ["The text names an ancient civilization or a historical event.", "No ancient civilization or historical event is named in the text."]
};

function round(id: string, title: string, limit: number, ...keys: (keyof typeof categories)[]): GameRound {
    const selected = keys.map((key) => categories[key]);
    return {
        id, title, limit, labels: selected.map(([label]) => label),
        questions: keys.map((key) => ({
            type: "choice",
            instruction: categories[key][1],
            // Absence first reduces false matches on ambiguous, unfinished input.
            criteria: [criteria[key][1], criteria[key][0]]
        }))
    };
}

export const camouflageLevels: GameLevel[] = [
    {id: 1, title: "Two meanings at once", skill: "Blend two clear meanings and avoid the distractions.", rounds: [
        round("1-1", "Praise and criticism", 120, "praise", "complaint", "question", "apology"),
        round("1-2", "Work can be fun", 110, "work", "leisure", "shopping", "warning"),
        round("1-3", "An invitation with a catch", 110, "invitation", "warning", "apology", "refusal")
    ]},
    {id: 2, title: "Cross the topics", skill: "Make one activity connect two different subjects.", rounds: [
        round("2-1", "Edible experiments", 110, "food", "science", "shopping", "complaint"),
        round("2-2", "A musical lesson", 100, "music", "learning", "work", "shopping"),
        round("2-3", "The active pet", 100, "pets", "sport", "shopping", "warning")
    ]},
    {id: 3, title: "Purpose and subject", skill: "Give a familiar topic a distinct purpose.", rounds: [
        round("3-1", "A helpful meal", 110, "food", "offer", "request", "apology", "shopping"),
        round("3-2", "A digital question", 105, "technology", "question", "complaint", "shopping", "promise"),
        round("3-3", "A grateful patient", 105, "health", "thanks", "complaint", "question", "warning")
    ]},
    {id: 4, title: "The obvious wrong answer", skill: "Make the distinction that the distractor tries to blur.", rounds: [
        round("4-1", "Making it, not buying it", 105, "cooking", "leisure", "shopping", "work", "request"),
        round("4-2", "Practice without a paycheck", 100, "learning", "technology", "work", "shopping", "complaint"),
        round("4-3", "A stroll through time", 100, "travel", "history", "shopping", "work", "sport"),
        round("4-4", "Helping, not asking", 100, "repair", "offer", "request", "shopping", "apology")
    ]},
    {id: 5, title: "Mixed feelings", skill: "Combine two intentions without accidentally adding a third.", rounds: [
        round("5-1", "A grateful critic", 105, "thanks", "complaint", "apology", "request", "question"),
        round("5-2", "No, but thank you", 100, "refusal", "thanks", "apology", "question", "promise"),
        round("5-3", "Sorry, let me help", 100, "apology", "offer", "request", "warning", "promise"),
        round("5-4", "A promise of praise", 100, "promise", "praise", "invitation", "question", "thanks")
    ]},
    {id: 6, title: "Find the connection", skill: "Connect subjects through one concrete detail.", rounds: [
        round("6-1", "A living laboratory", 105, "gardening", "science", "shopping", "work", "food", "warning"),
        round("6-2", "A painted past", 100, "art", "history", "shopping", "travel", "work", "music"),
        round("6-3", "A family melody", 100, "family", "music", "shopping", "work", "question", "complaint"),
        round("6-4", "Recover through movement", 100, "health", "sport", "shopping", "work", "warning", "complaint")
    ]},
    {id: 7, title: "Six-way distinction", skill: "Keep two signals strong among four plausible alternatives.", rounds: [
        round("7-1", "A scientific repair", 105, "repair", "science", "shopping", "work", "question", "request"),
        round("7-2", "The birthday recipe", 100, "cooking", "celebration", "shopping", "work", "invitation", "question"),
        round("7-3", "A wildlife lesson", 100, "nature", "learning", "travel", "sport", "gardening", "work"),
        round("7-4", "Rain on the route", 100, "weather", "transport", "travel", "warning", "shopping", "question"),
        round("7-5", "An artistic hobby", 95, "art", "leisure", "shopping", "work", "learning", "question")
    ]},
    {id: 8, title: "Close neighbors", skill: "Separate related meanings with carefully chosen details.", rounds: [
        round("8-1", "Wild, not a pet", 100, "nature", "science", "pets", "gardening", "travel", "shopping"),
        round("8-2", "Enjoying, not cooking", 95, "food", "praise", "cooking", "shopping", "thanks", "question"),
        round("8-3", "Teach, don't take over", 95, "learning", "repair", "offer", "request", "work", "shopping"),
        round("8-4", "Praise without gratitude", 95, "praise", "art", "thanks", "shopping", "question", "offer"),
        round("8-5", "A plan, not an invitation", 95, "promise", "transport", "invitation", "offer", "question", "warning")
    ]},
    {id: 9, title: "Seven signals", skill: "Keep five distracting meanings out of a two-topic message.", rounds: [
        round("9-1", "The singing family", 110, "family", "music", "work", "shopping", "invitation", "learning", "complaint"),
        round("9-2", "The kitchen experiment", 105, "cooking", "science", "shopping", "work", "health", "question", "warning"),
        round("9-3", "The outdoor painting", 105, "art", "nature", "gardening", "pets", "travel", "shopping", "work"),
        round("9-4", "A polite no", 105, "refusal", "thanks", "apology", "promise", "question", "complaint", "offer"),
        round("9-5", "The recovery routine", 100, "health", "sport", "work", "shopping", "complaint", "warning", "request"),
        round("9-6", "A promised repair", 100, "repair", "promise", "apology", "request", "shopping", "question", "warning")
    ]},
    {id: 10, title: "Distill the meaning", skill: "Keep two meanings and lose the spare words.", rounds: [
        round("10-1", "A concise review", 80, "praise", "complaint", "thanks", "apology", "question", "request", "warning"),
        round("10-2", "A concise invitation", 80, "invitation", "warning", "apology", "refusal", "complaint", "promise", "thanks"),
        round("10-3", "A concise lesson", 80, "music", "learning", "work", "shopping", "invitation", "question", "promise"),
        round("10-4", "A concise offer", 80, "offer", "food", "request", "shopping", "apology", "question", "warning"),
        round("10-5", "A concise connection", 80, "gardening", "technology", "shopping", "work", "food", "question", "warning"),
        round("10-6", "A concise experiment", 80, "pets", "science", "work", "shopping", "health", "warning", "question")
    ]},
    {id: 11, title: "Perfectly mixed", skill: "Eight blends, with five distractions to avoid in each.", rounds: [
        round("11-1", "The balanced verdict", 85, "praise", "complaint", "thanks", "apology", "question", "request", "warning"),
        round("11-2", "The cautious welcome", 85, "invitation", "warning", "apology", "refusal", "complaint", "promise", "thanks"),
        round("11-3", "The playful profession", 85, "work", "leisure", "shopping", "learning", "apology", "question", "offer"),
        round("11-4", "The ancient canvas", 85, "art", "history", "travel", "shopping", "work", "learning", "question"),
        round("11-5", "The growing gadget", 85, "gardening", "technology", "shopping", "work", "food", "question", "warning"),
        round("11-6", "The family feast", 85, "family", "celebration", "invitation", "shopping", "question", "thanks", "promise"),
        round("11-7", "The scientific snack", 85, "food", "science", "shopping", "work", "health", "question", "warning"),
        round("11-8", "The gracious exit", 85, "refusal", "thanks", "apology", "promise", "question", "complaint", "offer")
    ]}
];
