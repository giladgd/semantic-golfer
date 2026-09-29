import type {GameId, GameRound} from "./games.ts";

// Only explain labels that need context, without example answers.
// Model prompts and criteria are never used as player-facing help.
const roundDescriptions: Record<GameId, Record<string, Record<number, string>>> = {
    lock: {
        "2-1": {1: "An identifiable collection place; a full address is not required"},
        "3-2": {2: "Water quantity, rather than watering frequency"},
        "5-4": {1: "A request to hear what happens after trying the fix"},
        "6-1": {3: "How long the two journeys take relative to each other"},
        "6-2": {2: "How the desk's size conflicts with the available space"},
        "6-3": {2: "Which proposed dish meets the dietary requirement"},
        "7-1": {3: "An instruction for looking after the cat's drinking water"},
        "7-2": {1: "A fix already attempted, rather than a new suggestion"},
        "7-5": {3: "How the substitution changes the resulting food"},
        "8-2": {3: "A change to your own use of the shelf to make the arrangement work"},
        "8-3": {3: "The personal obligation behind the swap, rather than the shift offered in return"},
        "8-4": {1: "A concrete way for a newcomer to take part, beyond a general welcome"},
        "8-5": {4: "Consent to publish the photo, separate from permission to receive it"},
        "9-3": {5: "Whether you would stay there again, rather than when"},
        "10-4": {5: "An observable way to judge the trial, rather than its hoped-for benefit"},
        "11-1": {
            3: "Admission cost, rather than booking instructions",
            4: "Practical arrangements for people with access needs, rather than the venue's location"
        },
        "11-3": {
            2: "The skill or service you want in return for yours",
            3: "Equal durations for both contributions, rather than a shared start time"
        },
        "11-4": {
            1: "A factor held constant across the groups for a fair comparison",
            4: "The procedure for testing the idea, rather than a prediction",
            5: "An observable result to measure, rather than materials or a prediction"
        },
        "11-7": {3: "Supplies participants should bring or can expect to have available"},
        "11-8": {6: "Help with a particular setup task, rather than general support for the idea"}
    },
    signalMixing: {
        "1-2": {
            0: "A defined part of the move, rather than a general request for help",
            1: "How the moving task can still get done if the friend declines"
        },
        "1-3": {2: "The noise's effect on you, rather than a judgment about the neighbor"},
        "2-1": {0: "A specific useful feature of the chart, rather than general praise"},
        "2-2": {2: "A replacement activity or occasion, beyond a vague intention to stay in touch"},
        "3-1": {6: "Explaining away the accident to avoid responsibility"},
        "4-4": {0: "A concrete payment failure, rather than a general concern about skipping tests"},
        "5-2": {3: "Something observable to track in the trial, rather than an expected benefit"},
        "5-3": {2: "A specific helpful action you can offer, beyond reassurance"},
        "6-1": {
            2: "Whether the proposal changes the amount of work or the price charged for it",
            3: "Separate pricing for deferred work, rather than including it in today's commitment"
        },
        "6-4": {0: "Whether the money is a gift or must be repaid"},
        "6-5": {0: "A concrete contribution or responsibility supporting the pay request"},
        "7-2": {3: "Who gets to take part in discussion after the trial"},
        "7-3": {2: "Work you personally observed, rather than other people's accounts"},
        "8-2": {3: "Limits on meeting shift preferences, rather than hours or trial length"},
        "8-5": {6: "Punishment for refusal, rather than explaining the stated safety restriction"},
        "9-2": {3: "Whether the customer must agree before the workaround is applied"},
        "9-6": {0: "The newcomer's equal share of the existing total, rather than an extra charge"},
        "10-2": {4: "Whether the owner controls follow-up contact with the other recipients"},
        "10-3": {
            2: "A way to contribute without gaining power over speaker selection",
            6: "Future decision-making power, even if conditional, rather than a chance to give feedback"
        },
        "10-5": {3: "Practical help with the presentation, rather than praise for accepting"},
        "11-4": {11: "Treating the pending accessibility review as already passed"},
        "11-5": {7: "Special treatment for a donation, even through an indirect or private exception"},
        "11-6": {11: "Denying or giving away credit for your own real work"}
    }
};

const riskDescriptions: Record<string, string> = {
    "Entitlement": "Claiming an automatic right to special treatment, rather than making a request",
    "Threats for refusing": "Punishment for saying no, rather than a practical limit on your resources",
    "Guilt trips": "Framing refusal as a failure of care or loyalty",
    "Personal attacks": "Judging someone's character or worth, rather than their work or behavior",
    "Blame shifting": "Assigning fault to someone else instead of accepting your part",
    "Excuses": "Explaining away a mistake to avoid responsibility",
    "Minimizing harm": "Dismissing a problem or its effects as unimportant",
    "False certainty": "Guaranteeing an uncertain result, rather than committing to an action",
    "Assumed motives": "Attributing bad intentions, rather than describing what happened",
    "Promises beyond the limits": "An unconditional commitment beyond the message's stated limits",
    "Sales pressure": "Using urgency or scarcity to push someone into agreeing",
    "Pity or patronizing": "Treating someone as incapable of deciding for themselves",
    "Dodging the issue": "Deflecting attention from the specific concern without addressing it",
    "Assumed consent": "Proceeding as though permission was given, even if the message also asks politely",
    "Stigma": "Judging someone's worth by their identity or private circumstances",
    "Positive spin": "Presenting a setback or loss of service as good news",
    "Pressure to disclose": "Making help or participation depend on revealing private information",
    "Claimed consensus": "Presenting everyone's agreement as established",
    "Secondhand claims": "Repeating assessments of work or events you did not personally observe",
    "Leaking by hint": "Giving clues that reveal confidential information indirectly",
    "A broad proof claim": "Treating a limited result as proof beyond the situations tested",
    "Pretend validation": "Presenting the proposed larger study as already completed",
    "Exposure as payment": "Offering publicity in place of compensation for work"
};

export function getGameMeterDescriptions(game: GameId, round: GameRound): Array<string | undefined> {
    return round.labels.map((label, index) => roundDescriptions[game][round.id]?.[index] ??
        (index >= round.goalCount ? riskDescriptions[label] : undefined));
}
