// These express just one target meaning. They must not complete a whole round.
export const singleMeaning: Record<string, string> = {
    "Names an animal": "My dog is asleep.",
    "Apologizes": "I'm sorry I was rude.",
    "Names a food": "The sandwich is on the table.",
    "Expresses thanks": "Thank you for your kindness.",
    "Gives an instruction": "Close the door.",
    "Names bad weather": "It is raining outside.",
    "Sets a condition": "If you agree, I'll go.",
    "Names a vehicle": "The bus is parked.",
    "Warns of a risk": "Beware of the broken glass.",
    "Declines a request": "I decline your invitation.",
    "Proposes a compromise": "You want $10, I want $6. Let's meet halfway at $8.",
    "Asks permission": "May I leave?",
    "Praise": "I love this song!",
    "Work": "My paid job is filing invoices.",
    "Invitation": "Come join us for lunch.",
    "Food": "The sandwich is on the table.",
    "Music": "A violin plays a tune.",
    "Pets": "My pet dog is asleep.",
    "Technology": "The computer stores files on a disk.",
    "Health": "My ankle is injured.",
    "Cooking": "I boiled rice for dinner.",
    "Learning": "I'm learning French.",
    "Travel": "We flew to Paris.",
    "Repair": "I fixed the broken chair.",
    "Gratitude": "Thank you for your kindness.",
    "Refusal": "I decline your invitation.",
    "Apology": "I'm sorry I was rude.",
    "Promise": "I promise to call you tomorrow.",
    "Gardening": "I planted flowers in my garden.",
    "Art": "I drew a red circle.",
    "Family": "My sister is at home.",
    "Nature": "A wild wolf lives in the forest.",
    "Weather": "It is raining outside.",
    "Offer of help": "I can help carry your bag."
};

// These otherwise plausible answers omit a required detail.
export const missingDetails: Record<string, string[]> = {
    "lock/8-1": ["To share the cost fairly, shall we split the $10 into two $5 payments or take turns paying?"],
    "lock/10-4": ["Your $8 is higher than my $4. Shall we meet halfway at $6, or $5 if I collect? I'll pay."],
    "lock/11-5": ["I can't work all day because I'm tired. Could we compromise on a half day instead? If so, I'll come."]
};
