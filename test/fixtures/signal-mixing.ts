// Natural reference answers and deliberate near misses; never imported by the application.
export const signalMixingCases: Record<string, {solutions: string[], nearMisses: string[], omissions?: Record<string, string>}> = {
    "1-1": {
        solutions: [
            "Could I borrow your charger? Thanks",
            "May I borrow your charger? Thank you"
        ],
        nearMisses: [
            "Thanks",
            "Could I borrow your charger?",
            "Could I borrow your cha",
            "Thanks. Could I borrow your",
            "Give me your charger or I will hurt you. Thanks"
        ]
    },
    "1-2": {
        solutions: [
            "Could you help carry my sofa on Saturday? No worries if not; I can hire a mover",
            "Would you help pack my books for the move? If you are busy, that is fine; I can pack them myself"
        ],
        nearMisses: [
            "Please help me move",
            "You are my friend, so help with my sofa or never ask me for help"
        ]
    },
    "1-3": {
        solutions: [
            "Please lower your TV after ten; its noise keeps me awake",
            "Could you stop drilling after eight? The noise stops me sleeping",
            "Could you lower the music after ten? It keeps me awake before my early shift",
            "Would you stop drilling by eight? I cannot hear my work calls over it"
        ],
        nearMisses: [
            "Turn it down",
            "You selfish idiot, lower the music after ten so I can sleep",
            "You play music to annoy me; stop after ten so I can sleep"
        ]
    },
    "2-1": {
        solutions: [
            "I like the chart's clear colors, but the tiny labels are hard to read. Could you send me the editable chart file?",
            "The colors in your chart are clear and useful, but the labels are too small to read. Could you send the editable chart file?",
            "The chart's color coding makes groups easy to compare. The tiny axis labels are hard to read. Could you send the editable chart file?",
            "The colors in your chart are clear and useful, but the labels are too small to read. Please send me the editable source file"
        ],
        nearMisses: [
            "You are bad at charts; enlarge the axis labels",
            "Great chart, just make it better",
            "The chart makes the trend clear, but th",
            "The chart makes the trend clear, but the tiny axis labels are hard to read",
            "The chart's color coding helps compare groups, but its axis labels are too small to read. Please add next month's data",
            "The tiny labels do not matter; the trend is clear"
        ]
    },
    "2-2": {
        // Offering something "instead" can itself decline dinner; omit that implication too.
        omissions: {"Decline the dinner invitation": "Thank you for inviting me to dinner. Would you like to catch up by phone?"},
        solutions: [
            "Thanks for inviting me to dinner. I will pass this time. Would a short walk together next week work for you?",
            "Thank you for including me. I cannot join dinner; would you like to catch up by phone instead?"
        ],
        nearMisses: [
            "Thanks",
            "No",
            "Thank you, not today",
            "Thanks, maybe later",
            "Sorry, thanks for dinner but I cannot come",
            "Thanks for inviting me to dinner, but I cannot come",
            "Thank you for including me. I cannot join dinner; would you like to",
            // "Instead" could implicitly decline dinner too; the extra call here does not.
            "Thanks for inviting me to dinner. I cannot join lunch. Could we also catch up by phone?",
            "Thanks for dinner. Maybe some other time",
            "Thanks for dinner; I will pass. I have booked us a walk whether you like it or not"
        ]
    },
    "2-3": {
        solutions: [
            "The invoice due Friday is still unpaid. Could you confirm a payment date? I can resend the invoice if helpful",
            "I have not received payment for the invoice due Friday. When can I expect it? Would resending the details help?"
        ],
        nearMisses: [
            "You are ignoring the invoice due Friday. Pay or else; I can resend it",
            "Could you pay?",
            "The overdue invoice is no big deal; pay whenever"
        ]
    },
    "3-1": {
        solutions: [
            "I am sorry I broke your mug. That was my responsibility. Would you prefer that I replace it or pay you its value?",
            "I broke your mug, and I apologize. I will make it right: would a replacement or reimbursement suit you better?"
        ],
        omissions: {"Let the owner choose": "I broke your mug; that was my responsibility. I am sorry. I have decided to replace it and pay you its value; I will not ask which remedy you want."},
        nearMisses: [
            "Sorry your flimsy mug broke; I can replace it or pay for it",
            "It is just a mug. I broke it; replacement or cash?",
            "Sorry I broke your mug; let us forget it"
        ]
    },
    "3-2": {
        solutions: [
            "Jo designed the method, and I tested it. My mistake: I left Jo out of the presentation. I will correct the credits in the slides",
            "Jo designed the method; I tested it. My mistake: I left Jo out of the presentation. I will correct the credits in the slides",
            "I left Jo's credit out of the presentation. Jo designed the method; I tested it. I will update the slides to reflect both contributions",
            "Jo designed the method, and I tested it. I omitted Jo from the slides; I will correct that omission"
        ],
        nearMisses: [
            "I designed the method with Jo's help and tested it",
            "Jo should have reminded me to credit the method. I tested it; I will fix the slides"
        ]
    },
    "3-3": {
        solutions: [
            "I will miss today's report deadline. I do not know when the report will be finished. I can send the completed summary now and will update you tomorrow",
            "I will miss today's report deadline, and I cannot yet give a finish date. I can send the completed summary now and will update you tomorrow",
            "The report will not be ready today; the completion time is still uncertain. I can share the finished summary now. I will give you an update tomorrow",
            "I'm sorry, I won't finish the report by today's deadline. I don't know when it will be ready yet. The summary is done and I can send it now. I'll give you an update tomorrow",
            "The report is late: I won't meet today's deadline, and I don't know its completion date yet. I can send you the finished summary now. Tomorrow I'll update you on my progress"
        ],
        nearMisses: [
            "The report is late but it is fine; I will finish tomorrow",
            "I will miss today's report deadline. I do not know when it will be done"
        ]
    },
    "4-1": {
        solutions: [
            "I can complete the analysis or the launch today, but not both. Which should take priority? I will move the other to tomorrow",
            "Both the analysis and launch need today, but I only have capacity for one. Which comes first? The other will move to tomorrow"
        ],
        nearMisses: [
            "Choose the analysis or launch or I stop working",
            "Sorry I am so useless; which should I do?",
            "I can do both today; which matters more?"
        ]
    },
    "4-2": {
        solutions: [
            "I understand this is frustrating. Outside 30 days I cannot authorize a cash refund, but I can offer store credit or a repair. Which would you prefer?",
            "I can see why this is frustrating. The 30-day cash refund window has passed, so cash is outside my authority. Would you prefer store credit or a repair?"
        ],
        nearMisses: [
            "You missed 30 days, so it is your fault. Take credit or a repair",
            "I know it is frustrating; I will make an exception and refund cash"
        ]
    },
    "4-3": {
        solutions: [
            "I only answer work questions during office hours, not in the evening. I can offer 15 minutes tomorrow morning; please bring your highest-priority question",
            "I cannot help in the evenings; I keep work help to office hours. Could we use 15 minutes tomorrow morning for your one most important question?"
        ],
        nearMisses: [
            "Stop bothering me at night; you are inconsiderate",
            "I can always help at night. Bring one question tomorrow"
        ]
    },
    "4-4": {
        // "Could we test...?" already invites a response. Use a statement when removing that invitation.
        omissions: {"Invite their view": "A payment bug could charge customers twice. I propose testing the payment path before shipping"},
        solutions: [
            "I disagree with skipping tests: a payment bug could charge customers incorrectly. Could we test the payment path before shipping? What do you think?",
            "I would not skip the tests: an untested payment change could charge people twice. Shall we test payments before release? I would like your view"
        ],
        nearMisses: [
            "Your idea is stupid; I have decided we will test payments",
            "Skipping tests will definitely destroy the company. Thoughts?"
        ]
    },
    "5-1": {
        solutions: [
            "Logins are working again; some reports are still delayed. We are investigating the cause. You can use an export meanwhile. We will post another update at 16:00",
            "You can log in again, but reports are still delayed and we do not yet know the cause. An export is available while we investigate. Our next status update will be at 16:00"
        ],
        nearMisses: [
            "Everything is fixed! Export your reports; update at 16:00",
            "Logins work again and reports are delayed; the vendor broke it"
        ]
    },
    "5-2": {
        solutions: [
            "In 20 pilot visits, average queue time fell from ten minutes to eight. That is encouraging but a small sample. Could we run a larger trial and track queue time and complaints?",
            "The pilot covered only 20 visits: average waits went from ten minutes to eight. Let us test a larger sample and measure waiting time before deciding whether to adopt the change"
        ],
        nearMisses: [
            "The pilot proves this works for everyone; adopt it now",
            "Queues fell from ten to eight; a larger trial would be useful"
        ]
    },
    "5-3": {
        solutions: [
            "That uncertainty sounds worrying. Could you ask your clinician to explain the result? I can come with you or help write down your questions if you would like",
            "An unfamiliar test result can be unsettling. Your clinician can explain what it means; would you like me to join the appointment or help list questions for them?"
        ],
        nearMisses: [
            "It is definitely nothing; send me the result and I will explain",
            "Do not worry; doctors always make it sound worse"
        ]
    },
    "5-4": {
        solutions: [
            "For a quiet conversation, I recommend the café. Its entrance has steps and no step-free access, and it closes at six. If you need step-free access, the library café is an accessible alternative",
            "The café is quiet for a chat, but it closes at six and has steps at the entrance. If step-free access would suit you better, we could try the library café. Which works for you?",
            "I suggest the café for a quiet conversation. It closes at six and its entrance has steps. If you want step-free access, the library café is another option. Which would suit you?",
            "The café offers a quiet chat, with two drawbacks: it closes at six, and stairs are the only way in. A step-free library café is also available if you prefer. Which do you choose?",
            "For a quiet conversation, I recommend the café, but it closes at six and has no step-free entrance, only stairs. If access is an issue, we could use the step-free library café instead. Which would you prefer?"
        ],
        nearMisses: [
            "The café is perfect for everyone; see you there at six",
            "Because you cannot manage steps, I booked the library café"
        ]
    },
    "6-1": {
        solutions: [
            "You quoted $600 for six pages. My budget is $400. I propose fewer pages now at your normal rate, with remaining pages priced separately later. Would this scope be feasible for you?",
            "Thank you for quoting $600 for six pages. I can spend $400. I would like four pages now for $400, keeping your $100-per-page rate unchanged. Could we price the other two pages separately later, if that scope works for you?",
            "You quoted $600 for six pages. My budget is $400. Could we reduce the number of pages and keep your normal rate? I am not asking for a discount. We could price the other pages separately later if that works for you",
            "Your quote of $600 for six pages sets the rate at $100 per page. My budget is $400. Could we keep that rate and do four pages now, pricing the remaining two separately later? Would that scope work for you?",
            "Your quote is $600 for six pages; I have $400. Could we reduce the first phase to four pages and quote the other two separately later? Would that scope work at your usual rate?",
            "You quoted $600 for six pages; my budget is $400. Rather than cut your rate, could we do fewer pages now and price the rest as a separate phase later? What scope would be feasible?"
        ],
        nearMisses: [
            "I only have $400, so do all six pages for that or lose my business",
            "I agree to $600; I will pay $400 now and the rest later"
        ]
    },
    "6-2": {
        solutions: [
            "The full report needs until Monday. Alternatively, I can deliver the core findings Friday without the optional appendix. Which plan works for you? I will wait for your choice before changing scope",
            "Would you prefer the complete report on Monday, or the core findings without the optional appendix on Friday? The full report cannot be ready before Monday. Please choose before I change the scope"
        ],
        nearMisses: [
            "I guarantee the full report on Friday; I will change scope unless you object",
            "I can deliver something Friday or Monday; I have already decided for you"
        ]
    },
    "6-3": {
        // Asking "Could you..." already seeks agreement; use statements to omit that request.
        omissions: {"Invite agreement": "Your performance is on Saturday. I need quiet after nine to sleep. I propose rehearsing tomorrow afternoon, or moving nine to ten to a room away from our shared wall."},
        solutions: [
            "I know your performance is on Saturday and you want to rehearse seven to ten. I need quiet after nine to sleep. Could you rehearse tomorrow afternoon instead, or move the nine-to-ten hour to a room away from our shared wall? Would either option work for you?",
            "Your performance is Saturday and rehearsal is planned seven to ten; I need quiet after nine. Could we shift it to tomorrow afternoon, or move nine to ten to a room away from my wall? Would either work?"
        ],
        nearMisses: [
            "Everyone thinks you are selfish; stop rehearsing",
            "End at nine or I will make sure you cannot rehearse again"
        ]
    },
    "6-4": {
        solutions: [
            "I cannot lend $500, but I can give you $100 with no repayment expected. If you would like, I can help you look for other options",
            "I cannot lend the $500 you asked for. I can offer $100 as a gift, with nothing to repay. If you want, we could look together for other sources of help"
        ],
        nearMisses: [
            "Explain what you spent everything on and I might give you $100",
            "I can give $100, but you will owe me a favor"
        ]
    },
    "6-5": {
        solutions: [
            "Could we discuss a raise for the extra shifts I now cover?",
            "Could we discuss a raise? I lead the team now",
            "I now train new staff. Could we review my pay?",
            "I improved our sales this year. Could we discuss a raise?",
            "Would you consider a raise to reflect my new responsibility for training staff?"
        ],
        nearMisses: [
            "Please give me a raise",
            "I cover extra shifts",
            "I cover extra shifts. Could we discuss",
            "I cover extra shifts. Give me a raise or I quit",
            "Raise request, polite, no threats",
            "Could we discuss a raise for",
            "Could we discuss a raise for the extra sh"
        ]
    },
    "7-1": {
        solutions: [
            "While Alex is away, I will cover approvals through Friday. After that, please send urgent requests to Sam. The reason for the absence is private; this handoff is all we need to keep work moving",
            "Alex is away; their reason is private. I will handle approvals until Friday, and Sam is the contact for urgent requests afterward. Those arrangements let us continue without needing any personal details",
            "Alex is away. I will cover approvals through Friday; please send urgent requests to Sam after that. This keeps approvals moving while Alex is unavailable"
        ],
        nearMisses: [
            "Alex is probably ill, so I cover approvals through Friday; ask Sam after that",
            "Alex will definitely be back Monday; approvals go to me until Friday"
        ]
    },
    "7-2": {
        solutions: [
            "Interruptions are making it hard for everyone to contribute. Could we try a speaking queue for two weeks, then review who gets time to speak? We can address the behavior without identifying who raised it",
            "When people are interrupted in meetings, we miss their contributions. Would everyone try a speaking queue for two weeks and then review participation? We can improve this without naming the person who raised it"
        ],
        nearMisses: [
            "Our only intern complained that you interrupt her; use a speaking queue",
            "Stop being selfish and let others speak; that will solve the problem"
        ]
    },
    "7-3": {
        solutions: [
            "I do not know why they left, so I cannot speak to that. I can confirm their employment dates and describe the projects I personally worked on with them",
            "I cannot explain their departure because I do not know the reason. What I can provide is their employment dates and an account of the work I directly observed"
        ],
        nearMisses: [
            "I do not know, but I heard they were difficult",
            "They were flawless at every part of the job, including work I never saw"
        ]
    },
    "7-4": {
        solutions: [
            "I cannot share the launch date or features while they are confidential. You are welcome to follow our public newsletter for confirmed announcements",
            "The launch date and features are confidential, so I cannot discuss or confirm them. Please feel welcome to subscribe to our public newsletter; confirmed announcements will appear there"
        ],
        nearMisses: [
            "I cannot say much, but your guess about Friday is close",
            "You are not important enough to know; read the newsletter"
        ]
    },
    "7-5": {
        solutions: [
            "Would a quiet desk or a different session work better for you? You can choose either, and you do not need to share a diagnosis or personal history to use it",
            "You could use a quiet desk or attend a different session. Which would you prefer? Both are available without explaining your diagnosis or personal history"
        ],
        nearMisses: [
            "Your anxiety means you need the quiet desk; I have moved you",
            "Send proof of your condition and I can offer a quieter session"
        ]
    },
    "8-1": {
        solutions: [
            "The library room will close Tuesday for repairs. We are sorry for the disruption. Readers can use the downstairs room free of charge; staff, please move affected bookings there. We will share a reopening date when it is confirmed",
            "Our library room closes Tuesday for repairs. We apologize for the disruption. Readers, please use the downstairs room, still free of charge. Staff, please transfer bookings downstairs. A completion date is not confirmed yet"
        ],
        nearMisses: [
            "Good news: the room closes Tuesday! Staff caused this; use downstairs",
            "The room closes Tuesday and will definitely reopen Wednesday; move bookings downstairs"
        ]
    },
    "8-2": {
        solutions: [
            "I propose a four-week rota trial preserving contracted hours. Please submit preferred shifts through the private form. We cannot meet every preference. Please give feedback before we decide whether to proceed",
            "Could we try a four-week rota trial while keeping contracted hours unchanged? Staff can send preferred shifts through a private form, though not all preferences can be met. Please share feedback before a decision"
        ],
        nearMisses: [
            "We have decided on a four-week rota; silence means agreement",
            "This will suit everyone perfectly, so loyal staff should support it"
        ]
    },
    "8-3": {
        solutions: [
            "Thank you to the company for the donated chairs, and to the volunteers who set them up. We appreciate that support. Our program remains independent; a donation does not give a sponsor control over it",
            "We thank the company for providing chairs and our volunteers for setting them up. That support is appreciated. Donations do not buy control of the program; our event decisions remain independent"
        ],
        nearMisses: [
            "Buy their wonderful products; they donated the chairs",
            "Thanks for the chairs. We will let the donor choose the program"
        ]
    },
    "8-4": {
        solutions: [
            "I was wrong yesterday when I said bookings were open. They open Friday on the public booking page. I am sorry for the inconvenience; that page is the same route for everyone",
            "Yesterday I incorrectly said bookings were open. I apologize for the inconvenience. They actually open Friday, and everyone can book through the public booking page then",
            "I made a mistake in yesterday's announcement. Bookings open on Friday. Please book through the public booking page then. I'm sorry for the inconvenience my error has caused",
            "My announcement yesterday was incorrect. Bookings open Friday, through the public booking page. I take responsibility for the mix-up and I'm sorry for the inconvenience"
        ],
        nearMisses: [
            "You misunderstood: bookings open Friday, hurry before they vanish",
            "Good news, bookings are delayed until Friday; your seats are safe"
        ]
    },
    "8-5": {
        solutions: [
            "Newcomers are welcome at the workshop. Please arrive ten minutes early for the safety briefing. Once the machines start, no late entry: moving blades could injure someone coming in. If you miss the briefing, please join the next session",
            "New to the workshop? You are welcome. Please arrive ten minutes early for the safety briefing; once machinery starts, entry closes because arrivals could walk into moving parts. If you miss the briefing, we can help you join the next session",
            "Welcome to the workshop. Please come ten minutes early for the safety briefing. Entry closes when machines start; late arrivals could walk into moving parts. If you miss the briefing, we can offer the next session instead"
        ],
        nearMisses: [
            "Late people are irresponsible; arrive early or lose your place forever",
            "You can join whenever you arrive; safety is no big deal"
        ]
    },
    "9-1": {
        solutions: [
            "Let's check Saturday's forecast at nine. In heavy rain, we would meet in the hall at noon. If the hall is unavailable, we could postpone the picnic to Sunday. The hall costs $40, split equally only among those who agree. I will wait for explicit agreement before booking",
            "For Saturday, let us check the forecast at nine. If heavy rain is forecast, the rainy-day plan is to meet in the hall at noon. If the hall is unavailable, I suggest postponing to Sunday. Hall hire costs $40, shared equally only by those who agree. Please confirm your agreement before I book",
            "Let's check Saturday's forecast at nine. If heavy rain is forecast, I propose meeting in the hall at noon. If the hall is unavailable, we could postpone the picnic to Sunday. The hall costs $40, split equally only among those who agree. Please confirm before I book anything",
            "For Saturday's picnic, I suggest checking the forecast at nine: use the hall at noon if heavy rain is forecast, or postpone to Sunday if the hall is unavailable. The hall costs $40, shared equally only by people who agree. I will wait for explicit agreement before booking"
        ],
        nearMisses: [
            "Let's check Saturday's forecast at nine. If heavy rain is forecast, meet in the hall at noon. If the hall is unavailable, we will find another place. The hall costs $40 split equally among those who agree. Please confirm before I book",
            "Let's check Saturday's forecast at nine. If heavy rain is forecast, meet in the hall at five. If the hall is unavailable, postpone to Sunday. The hall costs $40 split equally among those who agree. Please confirm before I book",
            "Let's check Saturday's forecast at nine. In heavy rain, we would meet in the hall at noon. If the hall is unavailable, we could postpone the picnic to Sunday. The hall costs $40, split equally only among those who agree. I will wait for explicit agree",
            "If I hear nothing, I will book the $40 hall for everyone",
            "The weather will be fine, so no backup is needed"
        ]
    },
    "9-2": {
        solutions: [
            "If the part arrives Thursday, we can install it Friday. If it does not, we will update you Friday and can offer a temporary workaround. That disables one optional feature; would you like it applied if the part is delayed? We will wait for your agreement",
            "The part may arrive Thursday. If it does, we can install Friday. Otherwise, we will update you Friday and offer a workaround that turns off one optional feature. May we use that workaround if needed? We will not apply it without your permission"
        ],
        nearMisses: [
            "The part will arrive Thursday, so the repair is guaranteed Friday",
            "I have applied the workaround; it has no downside"
        ]
    },
    "9-3": {
        solutions: [
            "We have capacity for the review or the launch today, not both. Could we review first? If it finds a critical issue, we fix that before launch; if not, we could launch tomorrow. Please approve this priority before we change the schedule",
            "We cannot fit both the security review and feature launch into today. I propose doing the review first: fix any critical finding before launch, or launch tomorrow if there is none. Would you approve that order before we change the plan?"
        ],
        nearMisses: [
            "Security is delaying us again, but we will do both today",
            "We will find no issues, so tomorrow's launch is guaranteed"
        ]
    },
    "9-4": {
        solutions: [
            "Two seats are available for five people waiting. Could we offer them in signup order, allowing 24 hours for each reply before asking the next person? Everyone can also choose the next session; being on this list is not a confirmed seat",
            "There are two seats and five people waiting. I suggest offering seats in signup order, giving each person 24 hours to reply before moving down the list. Everyone may choose the next session as well; a waitlist entry does not guarantee a place"
        ],
        nearMisses: [
            "Donors get the two seats first; everyone else can wait",
            "No reply within a day means you accept your seat"
        ]
    },
    "9-5": {
        solutions: [
            "Could volunteers try the new tool for two weeks while the existing tool stays available? We would stop if data exports fail. Afterward, let us review export reliability and time saved before deciding on any permanent move; no one has to switch before that review",
            "I propose a two-week trial for volunteers, with the old tool still available. We stop if exports fail. Afterward we review export reliability and time saved before considering a permanent move. Nobody has to switch before that review",
            "Let's invite volunteers to try the new software for two weeks; participation is optional. Keep the current tool available and stop the trial if exports fail. Afterward, review export reliability and time saved. Nobody will be required to move permanently before that review",
            "Could we run a two-week software trial with people who volunteer? The old tool stays available. We stop the trial if data exports fail. Afterward, we review how reliably exports worked and how much time was saved. No permanent switch will be required before that review"
        ],
        nearMisses: [
            "I propose a software trial with volunteers. Keep the existing tool available and stop if exports fail. Afterward review export reliability and time saved. Nobody must move permanently before review.",
            "I propose a two-week software trial. Keep the existing tool available and stop if exports fail. Afterward review export reliability and time saved. Nobody must move permanently before review.",
            "Everyone will switch for two weeks unless they object",
            "The trial will definitely save time; we can remove the old tool now"
        ]
    },
    "9-6": {
        solutions: [
            "The newcomer would pay $22.50. Each of the three original payers who paid $30 would receive a $7.50 refund. Could all four of us agree before I change the booking? We would issue refunds only after the newcomer's payment arrives. Under that plan, each person would end up paying exactly $22.50",
            "Would all four of us agree to split the $90 booking at $22.50 each instead of $30 for three? Once the fourth payment arrives, each original payer would get $7.50 back. I will wait for everyone's agreement before changing the booking",
            "Could all four of us agree to pay $22.50 each for the $90 booking? The three who paid $30 would each receive $7.50 back, but only once the fourth person pays. I will not change the booking before everyone agrees",
            "May all four of us agree to split the $90 equally at $22.50 each? The newcomer would pay $22.50. Only after that payment arrives would we three original payers each receive $7.50 back from our $30 payments. Everyone would then have paid exactly $22.50. I will wait for all four to confirm before changing the booking.",
            "An equal split of our $90 booking is $22.50 each. The fourth person would pay $22.50, then each of the three who paid $30 would get $7.50 back. Please can all four of us confirm we agree before I change the booking? Refunds will wait until the new payment is received",
            "The newcomer pays $22.50, and each of us three original payers gets $7.50 of our $30 back. That makes our $90 booking an equal $22.50 each. I need all four of you to agree before changing the booking. No refunds will be sent until the newcomer's payment arrives"
        ],
        nearMisses: [
            "The newcomer pays $30 and the rest of us split the saving",
            "I have added the fourth person and refunded everyone before they paid"
        ]
    },
    "10-1": {
        solutions: [
            "Our headline overstated the evidence. “Twice as fast” was the result of one task in a ten-person test, not a general finding. We should run a larger test across different tasks before making a broader speed claim; that work has not yet been done",
            "We overstated the evidence in our headline. Ten people did one task twice as fast in one test; that is the limit of the finding. We should test a larger group on different tasks before making wider speed claims"
        ],
        nearMisses: [
            "Readers misunderstood; the test proves twice the speed for everyone",
            "The larger study already proved it; buy now"
        ]
    },
    "10-2": {
        solutions: [
            "I shared your private message without permission, and I am sorry. I have removed my copy from the shared channel. If you want, I can ask recipients to delete theirs too, though I cannot guarantee they will. You decide whether you want that step",
            "I am sorry I shared your private message without permission. I have deleted my shared copy from the channel. Would you like me to ask the other recipients to delete theirs? I cannot guarantee they will delete them, and I will follow your choice about asking"
        ],
        nearMisses: [
            "Sorry, but you should have marked it private; everything is erased now",
            "I will ask others to delete it only if you forgive me"
        ]
    },
    "10-3": {
        solutions: [
            "We cannot accept funding in return for excluding a speaker. Every speaker is assessed against the same published criteria. An unrestricted donation is welcome, or you can use the public feedback route. Neither gives control over speakers; there are no private exceptions or promises of future influence",
            "We cannot accept funding conditional on excluding a speaker. Program decisions follow the same published criteria for everyone. You are welcome to make an unrestricted donation or submit feedback through the public process, but neither purchases a program decision",
            "We must decline a donation that depends on removing a speaker. Everyone is considered using the same published program criteria. An unrestricted gift or feedback through our public process would be welcome, without control over speaker selection"
        ],
        nearMisses: [
            "We will quietly exclude the speaker if you double the donation",
            "Your offer is disgusting; fund us or we expose you"
        ]
    },
    "10-4": {
        solutions: [
            "We have reports of duplicate charges; the cause is not yet confirmed. Please check your statement and send affected transaction IDs through our private support form, not card details. We will post a status update at noon",
            "We are receiving reports of duplicate charges, but have not confirmed the cause. Please check your statement. If affected, use the private support form to send transaction IDs only. We will provide another status update at noon"
        ],
        nearMisses: [
            "The bank caused duplicate charges; send your full card number here",
            "Everything is fixed and every refund is guaranteed by noon"
        ]
    },
    "10-5": {
        solutions: [
            "Your analysis shaped this project. Would you like to present it? It is fine to decline, with no explanation needed. If you are interested, we can arrange paid preparation time or co-present so you have support",
            "Your analysis was an important contribution to the project. Would you like to present it? You can say no without giving a reason. If you accept, we can provide paid preparation time or present alongside you"
        ],
        nearMisses: [
            "This is great exposure; saying no would show you lack ambition",
            "I will present your analysis as mine unless you agree to do it unpaid"
        ]
    },
    "10-6": {
        solutions: [
            "The pilot improved speed, but two accessibility complaints identify issues we need to address. I would extend it only after those changes, with the old route kept available. Would affected users like to help decide how we test the changes, without sharing personal details?",
            "The pilot was faster, yet two users raised accessibility problems. I recommend extending it only once those problems are addressed, while retaining the old route. Could affected users help plan how to test the changes? No personal information is required"
        ],
        nearMisses: [
            "Only two people complained, so we should roll it out to everyone",
            "The fixes guarantee accessibility; disclose your condition to join the test"
        ]
    },
    "11-1": {
        solutions: [
            "I understand pay is frozen this quarter. Since I now lead training previously handled by a manager, could we document a pay review for next quarter? I would like us to agree the review criteria now so the added responsibility has a clear review point. I am asking for a fair assessment, not a guaranteed outcome",
            "I recognize the pay freeze this quarter. I now lead the training a manager previously delivered. Could we agree criteria now for a documented pay review next quarter, reflecting that added responsibility? I would like to keep the request open for a review, without assuming its outcome"
        ],
        nearMisses: [
            "I deserve more than everyone; lift the freeze or I quit",
            "I will train staff unpaid forever; perhaps review my pay someday"
        ]
    },
    "11-2": {
        solutions: [
            "We are sorry for the disruption during the 40-minute outage. Access is restored, but some exports remain queued and the cause is still unconfirmed. Please do not resubmit exports. For an urgent case, contact private support with its reference. We will post another update at 18:00, including what remains unresolved",
            "We apologize for the 40-minute outage. Access is back, but exports are still queued and we have not confirmed the cause. Please avoid resubmitting exports. Urgent cases can go through private support. We will give a further status update at 18:00"
        ],
        nearMisses: [
            "The vendor caused the harmless outage; everything is fixed",
            "Exports will all finish by 18:00; post your password if yours does not"
        ]
    },
    "11-3": {
        solutions: [
            "Your music practice is booked from five to seven, and our neighbor needs a quiet phone call at six. My suggestion is to keep practice here from five to six and move practice from six to seven to another room. We would change the plan only if both of you agree. If moving practice will not work, we could find another location for the call instead",
            "One of you booked music practice from five to seven; the other needs quiet for a call at six. If both agree and space is available, could music practice stay here from five to six and move to another room for six to seven? Otherwise, we could look for another place for the call. Please confirm together before either arrangement changes",
            "Your music practice is booked from five to seven. Our neighbor needs quiet at six for a phone call. I propose keeping practice here from five to six and moving only the six-to-seven hour to another room, if both of you agree. If moving practice cannot work, we can look for a different location for the call instead",
            "You booked music practice from five to seven, and our neighbor needs quiet for a call at six. Could practice stay here from five to six and move to another room from six to seven? Only if you both agree. If not, we could look for somewhere else for the call",
            "The five-to-seven practice booking matters, and so does having quiet for the call at six. Would you both agree to practice here from five to six and move the last hour elsewhere if a room is available? If not, could we find another call location instead? Let us confirm a workable option before changing either plan",
            "One of you booked practice from five to seven; the other needs quiet for a call at six. If both agree and space is available, could practice stay here until six and move elsewhere for six to seven? Otherwise, we could look for another place for the call. Please confirm together before either arrangement changes"
        ],
        nearMisses: [
            "Music is selfish; I cancelled the last hour",
            "There is definitely another room, so I moved practice without asking"
        ]
    },
    "11-4": {
        solutions: [
            "Functional tests have passed; accessibility review is scheduled for Monday. After that review, could we offer a limited pilot to volunteers while keeping the existing service available? We would stop if payment errors appear. After one week, let us review completion times and support requests before deciding whether to expand",
            "Functional testing passed, and accessibility review is scheduled for Monday. Once that review is complete, I propose a limited voluntary pilot, keeping the current service available. We stop for payment errors and review completion times and support requests after one week before any expansion"
        ],
        nearMisses: [
            "Functional tests passed; accessibility review is scheduled for Monday. After that review, propose a limited voluntary pilot. Keep the existing service and stop on payment errors. After one week review completion times before expansion.",
            "Functional tests passed; accessibility review is scheduled for Monday. After that review, propose a limited voluntary pilot. Keep the existing service and stop on payment errors. After one week review support requests before expansion.",
            "All reviews passed; everyone will move next week unless they object",
            "There cannot be payment errors, so no rollback is needed"
        ]
    },
    "11-5": {
        solutions: [
            "We appreciate the offer of $2,000, but cannot attach priority for a place to it. All places follow public signup order. You are welcome to make an unrestricted donation, and your child can use the same waitlist route as everyone else. Neither action guarantees a seat, and we keep other applicants' details private",
            "Thank you for offering $2,000. We would welcome an unrestricted donation, but cannot offer your child priority in return. Public signup order applies to every place. Your child may join the same waitlist as others; we cannot promise a seat or discuss other applicants"
        ],
        nearMisses: [
            "Donate $2,000 and we will quietly move your child ahead of Mia",
            "It is shameful to ask; donate anyway or you do not care about children"
        ]
    },
    "11-6": {
        // Keep the confirmation request tied to the remaining edit, without implying the missing one.
        omissions: {
            "Offer to correct the post credits": "Priya designed the tool. I tested it. Lee wrote the guide. I approved the inaccurate post that credited me alone. I will correct the guide credits. Could each contributor confirm the guide wording before I change the guide?",
            "Offer to correct the guide credits": "Priya designed the tool. I tested it. Lee wrote the guide. I approved the inaccurate post that credited me alone. I will correct the post credits. Could each contributor confirm the post wording before I change the post?"
        },
        solutions: [
            "I approved a post that wrongly credited me alone. Priya designed the tool, I tested it, and Lee wrote the guide. I would like to correct the post and the guide credits to reflect that. Priya and Lee, could you confirm the wording before I make those changes?",
            "I approved the inaccurate post giving me sole credit. To correct it: Priya designed the tool, I tested it, and Lee wrote the guide. I propose updating both the post and guide credits. Would each contributor confirm the wording before I edit either?",
            "I approved the post that wrongly gave me all the credit. Priya designed the tool, I tested it, and Lee wrote the guide. I'd like to update the post with those credits and add the correct credits to the guide as well. Can everyone confirm this wording before I change either?"
        ],
        nearMisses: [
            "Priya designed the tool, I tested it, and Lee wrote the guide. I approved the incorrect post crediting me alone. I will correct the post credits after each contributor confirms the wording.",
            "Priya designed the tool, I tested it, and Lee wrote the guide. I approved the incorrect post crediting me alone. I will correct the guide credits after each contributor confirms the wording.",
            "Marketing made the mistake; I had nothing to do with approval",
            "Priya and Lee did everything; I contributed nothing, so I changed the credits"
        ]
    },
    "11-7": {
        solutions: [
            "Our funding has fallen by half, so we must reduce free weekly classes to two free sessions a month. That means less time together, and we know it affects access. Before choosing dates, we would welcome your scheduling preferences; no personal explanation is needed. Free practice materials will remain available between sessions",
            "Funding has been halved. We will have to replace free weekly classes with two free sessions each month, reducing access. Please share preferred dates before we settle the schedule; no private reasons are needed. Free practice materials will be available between sessions"
        ],
        nearMisses: [
            "Good news: fewer classes mean an upgraded experience",
            "Donate to secure your seat; tell us your financial hardship to keep access"
        ]
    },
    "11-8": {
        solutions: [
            "The 30-user trial reduced median waiting from ten minutes to seven, but two users could not complete checkout with a keyboard. I would delay wider rollout. Let us fix keyboard checkout and retain the old route. Volunteers can sign up to retest through a form; we will pay them for their time without asking for diagnoses. After two weeks, review satisfaction ratings and support requests before deciding on rollout",
            "Across 30 trial users, median waiting dropped from ten minutes to seven, but two could not finish keyboard checkout. Wider rollout should wait. I propose fixing that problem and retaining the old route. Please volunteer to retest using the signup form; participants will be paid for their time, with no diagnosis required. After two weeks, review satisfaction ratings and support requests before deciding about rollout"
        ],
        nearMisses: [
            "Median waiting fell from ten minutes to seven in a trial of 30 users, but two could not finish keyboard checkout. Fix keyboard checkout and keep the old route. Invite volunteers to sign up through a form to retest. Review satisfaction ratings and support requests after two weeks before deciding on rollout.",
            // An invitation is already voluntary; this explicitly makes participation compulsory.
            "Median waiting fell from ten minutes to seven in a trial of 30 users, but two could not finish keyboard checkout. Fix keyboard checkout and keep the old route. We will pay participants for their time; they must sign up through the retesting form. Participation is not optional. Review satisfaction ratings and support requests after two weeks before deciding on rollout.",
            "Median waiting fell from ten minutes to seven in a trial of 30 users, but two could not finish keyboard checkout. Fix keyboard checkout and keep the old route. Invite volunteers to sign up for retesting through a form and pay them for their time. Review satisfaction ratings after two weeks before deciding on rollout.",
            "Only two users had trouble, so the speed gain proves we should roll out now",
            "We guarantee the fix works; everyone must retest and disclose their diagnosis"
        ]
    }
};

// Append these to an otherwise good message: avoiding a risk must matter even when the goals are met.
export const signalRiskAdditions: Record<string, string> = {
    "Mandatory retesting": "Retesting is mandatory; everyone must participate.",
    "An impossible Friday promise": "I guarantee the complete report will be ready this Friday.",
    "Excuse for declining": "I cannot come because I have another appointment.",
    "An invented finish date": "The full report will definitely be finished Friday.",
    "Giving a diagnosis": "That test result means you have flu.",
    "A discount demand": "Please lower your rate instead of reducing the scope.",
    "A blanket ban": "Stop rehearsing altogether.",
    "Claimed consensus": "Everyone has already agreed to this.",
    "A return favor": "You must repay my gift with a favor.",
    "Questioning reliability": "Alex is unreliable and cannot be trusted.",
    "Private personal details": "They were treated for depression last year.",
    "Hints of misconduct": "Their departure followed some very suspicious behavior.",
    "Insider teasing": "I know secrets you do not; you are not in the inner circle.",
    "Promised seats": "Your seats are already reserved.",
    "An entry exception": "I will let you enter after the machinery starts.",
    "Premature booking": "I have already booked the hall.",
    "Premature completion": "The repair is already complete.",
    "Overcommitting today": "I promise both the security review and launch today.",
    "Reply shaming": "Only careless people fail to reply immediately.",
    "A broad proof claim": "This test proves it is faster for every task and person.",
    "A speaker bargain": "For your funding, we can exclude the speaker Alex.",
    "Naming a culprit": "The provider caused this problem.",
    "A premature fix": "The duplicate-charge problem has been fixed.",
    "A premature all-clear": "All problems from the outage are now resolved.",
    "Pretend clearance": "The accessibility review has already passed.",
    "Entitlement": "I am better than everyone else and you owe me this.",
    "Threats for refusing": "If you refuse, I will make you regret it.",
    "Guilt trips": "If you cared about me, you would say yes.",
    "Personal attacks": "You are an incompetent idiot.",
    "Assumed motives": "You deliberately did this to hurt me.",
    "Dodging the issue": "Actually, forget the problem and move on.",
    "Minimizing harm": "It is no big deal; stop making a fuss.",
    "Apologizing": "I am sorry and I apologize.",
    "Assumed consent": "I will take your silence as agreement.",
    "Blame shifting": "This is entirely your fault, not mine.",
    "Excuses": "It was not my fault because I was too busy.",
    "Taking all the credit": "Actually, all the ideas and work were mine alone.",
    "False certainty": "I guarantee everything will work perfectly.",
    "Promises beyond the limits": "I promise to deliver everything despite the stated limit.",
    "Presumed approval": "The trial has already been approved by everyone.",
    "Pretend validation": "The larger study is already complete and proved our claim.",
    "Unauthorized refund": "I will give you a cash refund even though it has been more than 30 days.",
    "Positive spin": "This loss is great news, an upgrade for everyone.",
    "Sales pressure": "Agree right now or you will miss your only chance.",
    "Pressure to disclose": "First, you must tell me your diagnosis and personal history.",
    "Pity or patronizing": "You are helpless, so I will decide for you.",
    "Claiming no drawbacks": "There is no cost, risk, or downside for anyone.",
    "Stigma": "People with mental illness cannot be trusted.",
    "Private details": "Alex is away for treatment for depression.",
    "Identifying the reporter": "Maya made the complaint about you.",
    "Secondhand claims": "I heard they left because they stole money.",
    "Leaking by hint": "Hint: look for our new phone next Tuesday.",
    "Speculative diagnosis": "You clearly have an anxiety disorder.",
    "Product endorsement": "Their products must be excellent; you should buy them.",
    "Preferential access": "Donors get the first seats, regardless of signup order.",
    "Unequal charging": "Actually, the newcomer pays $45.",
    "Repeating the disclosure": "Your private message said you were divorcing.",
    "Promised program control": "A later donation will let you choose our speakers.",
    "Private exception": "We can secretly bend the rules for you.",
    "Sensitive data request": "Send support your full card number and password.",
    "Exposure as payment": "The exposure is your payment for preparation.",
    "Coworker comparison": "I deserve more than Sam because Sam is useless.",
    "Indefinite unpaid commitment": "I will keep doing the extra duties forever without a pay review.",
    "Unsafe data collection": "Post your password and private files in the public forum.",
    "Hidden exception": "We can secretly move your child to the front.",
    "Applicant disclosure": "Maya Jones's child is waiting because their family cannot pay.",
    "Erasing your contribution": "Actually, I did none of the testing; Priya did that too.",
    "Paying for priority": "Donations will buy you priority access to the free sessions."
};
