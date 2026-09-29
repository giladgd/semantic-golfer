import type {GameId} from "../../shared/games.ts";

// Conversational rewrites, authored from the briefs rather than their model questions.
// Keep rejected valid wording here: passing a different reference must not hide it.
export const gameParaphrases: Record<GameId, Record<string, string[]>> = {
    lock: {
        "1-1": [
            "Quick, can someone help get my dog out of the drain?",
            "Help my cat now!"
        ],
        "1-2": [
            "Could you drive me to the library? I can pay for fuel",
            "A lift to the station, please? Gas is on me"
        ],
        "1-3": [
            "Want one of my homemade lemon cookies?",
            "Have a chocolate cookie; I baked them myself"
        ],
        "2-1": [
            "I got your package, come pick it at my home at 5pm",
            "Your delivery is at mine, swing by after work",
            "I've got your parcel. You can grab it from my porch tomorrow morning",
            "Your package arrived here. I'll bring it to the cafe for you to collect at noon",
            "Your parcel is with me; collect it at my flat after six"
        ],
        "2-2": [
            "Try The Hobbit, the riddles are great! Happy to lend you mine",
            "Read The Hobbit for its brilliant riddles; borrow my copy"
        ],
        "2-3": [
            "Can I use your screwdriver to tighten my door handle? You'll get it back tonight",
            "May I borrow your screwdriver to fix my door handle? I'll return it"
        ],
        "3-1": [
            "The bridge is shut, so go through the park past the fountain. Mind the slippery steps",
            "Bridge closed; take the park path past the fountain. Watch for slippery steps"
        ],
        "3-2": [
            "I'm out of town. Could you give my fern a cup of water? Thanks!",
            "I'm away; could you give my fern one cup of water? Thanks"
        ],
        "3-3": [
            "Could I keep The Hobbit until Friday? I haven't finished it yet and will bring it back then",
            "Could I keep The Hobbit from the library until Friday? I have two chapters left and will return it then"
        ],
        "4-1": [
            "It's raining, so let's watch the rooftop movie in our living room instead. Same start time",
            "Rain means moving our rooftop film indoors to the lounge; same start time"
        ],
        "4-2": [
            "Could you grab Mum's cake from Rose Bakery at 3?",
            "Please collect Maya's cake at Rose Bakery at noon"
        ],
        "4-3": [
            "Key's under the blue pot. Lift the handle as you turn it, then leave the key on the kitchen table when you go. Enjoy your stay!",
            "Key under the blue pot; lift the handle to unlock. Put the key back there afterward. Enjoy your stay"
        ],
        "4-4": [
            "Rehearsal at my place at 7? Bring your guitar and I'll bring the sheet music",
            "Rehearse in the hall at six? Bring your violin; I'll bring the sheet music"
        ],
        "5-1": [
            "I asked for cheese but got tuna. Could I get the cheese sandwich instead? Thanks",
            "I ordered cheese but got tuna. Could you replace this sandwich with the cheese one? Thanks"
        ],
        "5-2": [
            "Sorry, I spilled water on your notebook. I'll get you a new one and copy your notes into it",
            "Sorry I spilled water on your notebook; I'll replace it and copy your notes into the new one"
        ],
        "5-3": [
            "We're not meeting in Oak after all, it's Pine. Still at 2. Please let anyone who missed this know",
            "Meeting now in Room 4, not Room 2; same time. Please tell anyone who misses this message"
        ],
        "5-4": [
            "That frozen app sounds annoying. Try closing and reopening it, then tell me what happens. Happy to help further",
            "A frozen app is frustrating. Try restarting it and tell me what happens; I can help troubleshoot further"
        ],
        "6-1": [
            "Bus is $2 and takes 10 minutes; walking is free but takes 25. Which would you rather do?",
            "Bus or walk? Walking costs less, but the bus is faster. Which do you prefer?"
        ],
        "6-2": [
            "I'd get that $80 desk: loads of drawers, but it's wide. Measure your space before buying it",
            "I'd buy this $80 desk for its roomy drawers, but it's wide. Measure your space before buying"
        ],
        "6-3": [
            "Soup or pasta for lunch? The soup's vegetarian. I'll cook; everyone vote for the one you want",
            "Soup or pasta for lunch? The soup is vegetarian. I'll cook; please vote for your preferred dish"
        ],
        "6-4": [
            "I could get you The Hobbit for its wonderful riddles, or a bookshop gift card so you can choose your own. Which would you like?",
            "Would you prefer The Hobbit for its beautiful illustrations or a bookshop voucher to choose any title? My gift to you"
        ],
        "7-1": [
            "Give the cat dry food at 6, change her water daily, and look under the sofa if she hides. Text me if you need anything",
            "Feed my cat dry food at six, refill her water, and look under the sofa if she hides. Call my mobile if needed"
        ],
        "7-2": [
            "The lamp on my desk won't light. I've tried another bulb; could you check the switch and let me know what you find?",
            "My lamp won't turn on despite a new bulb. It's on the kitchen table; please check its switch and tell me what you find"
        ],
        "7-3": [
            "We're selling jam at $4 a jar. Cash or card is fine. Jo takes over from you at 2pm",
            "We sell jam at $4 a jar; cash goes in the tin. Hand the stall over to Maya at noon"
        ],
        "7-4": [
            "Let's read 30 pages of Dune and meet at the cafe on Friday to chat about it. Bring your notes",
            "Read thirty pages of Dune; let's discuss them at the cafe on Friday. Bring your notes"
        ],
        "7-5": [
            "Out of cream? Stir in two tablespoons of yogurt at the end, off the heat. It'll make it a bit tangier",
            "No butter? Use two tablespoons of oil after whisking the eggs; the cake will taste less buttery"
        ],
        "8-1": [
            "I get that you want fresh air and Jo's cold. How about opening the window for five minutes? I'll shut it afterwards",
            "You need fresh air; I'm cold. Let's open the window for five minutes, then I'll close it"
        ],
        "8-2": [
            "We both need room for our books. You take the top shelf, I'll take the bottom and move my boxes out. Does that work for you?",
            "My books and your plants both need shelf space. Half each? I'll move my books to my half. Does that work?"
        ],
        "8-3": [
            "Could we swap my Friday evening shift for your Saturday morning one? I've got a family dinner on Friday. Thanks!",
            "Could you cover my Saturday shift for a wedding? I'll take your Sunday shift in exchange. Thanks"
        ],
        "8-4": [
            "Everyone fancy Uno for half an hour? I'll walk the beginners through a practice hand, and Sam can referee since he's played loads",
            "Everyone, join an hour of chess. We'll teach beginners the moves, with an experienced player coaching each team",
            "Let us play chess. We can teach new players the moves. An experienced player can coach each team. We will play for one hour."
        ],
        "8-5": [
            "Could you email me our group photo for my album? I'll send you mine too. Is it OK to put yours on my public page?",
            "Please email our group photo for my scrapbook; I'll send my sunset shot back. May I post yours publicly?",
            "Could you email our group photo? I'll send my sunset shot back. May I post yours on my public page?"
        ],
        "9-1": [
            "Come to our wildlife photo show at the library this Saturday. It's free, and you'll see close-ups of local owls",
            "Join our city-wildlife photo show at the library on Saturday. Free entry, and you can meet the photographers"
        ],
        "9-2": [
            "Let's grow a herb garden in an old bucket on the balcony. Mint would do well there. I'll drill drainage holes; can you help plant it?",
            "Let's grow a herb garden of basil in an old bucket on the kitchen windowsill. I'll plant seeds; could you help water it?"
        ],
        "9-3": [
            "Comfy bed and a host who helped with our bags. The dripping tap kept me awake; replacing its washer would help. I'd stay again once that's fixed",
            "Comfortable bed; the host gave great directions. Thin curtains let streetlight keep me awake; blackout curtains would help. I'd return"
        ],
        "9-4": [
            "Fancy a local history walk? We can see the old steam engine sign at the station, then the clock tower's bell. Could you lead the second bit?",
            "Let's take a history walk: see the steam engine sign at the old station, then the clock tower's old bell. Will you lead the second part?"
        ],
        "9-5": [
            "Neighbors, come to our repair cafe at the hall on Sunday at 2. Bring a broken lamp; I can mend wiring. Anyone up for helping run it?",
            "Neighbors, join our repair cafe at the library Sunday noon. Bring torn clothes; I can sew buttons. Could you volunteer to help?"
        ],
        "9-6": [
            "Since you love baking, how about a bread-making class for your birthday? It's $40. I can book it for Saturday if that sounds good to you",
            "A $30 pottery class for your birthday fits your love of making things. Saturday? I'll book it if that plan suits you"
        ],
        "10-1": [
            "We've got $100. The oak bench is $150, the pine one $80, so I'd pick pine. Its storage box would be useful. I'll collect it",
            "Our bench budget is $60. Oak costs $90, pine $50; let's get pine, which folds for storage. I'll collect it"
        ],
        "10-2": [
            "We've only got half an hour now. Let's keep the main exercise and drop the slides, which just repeat the notes. I'll send everyone the notes. What do you think?",
            "Our workshop time is halved. Keep drawing; drop slides as they repeat the handout. I'll send everyone notes. Thoughts on this plan?"
        ],
        "10-3": [
            "Jo's vegetarian and Sam avoids gluten, so let's do vegetable curry with rice: no meat or gluten ingredients. I'll cook",
            "One guest is vegetarian; another avoids gluten. Let's serve vegetable curry with rice: no meat, gluten-free. I'll cook"
        ],
        "10-4": [
            "How about a tool-sharing shelf in the lobby to save us buying duplicates? Return tools within a week. Try it for a month, then count how many loans we made",
            "Let's trial a tool-lending shelf in the garage for a month to save buying rarely used tools. Return tools in two days; count on-time returns"
        ],
        "10-5": [
            "Join us on the lake trail? It's flat, ideal for a first hike. We'll go at your pace, I can lend you boots, and we'll stop for a rest by the bridge",
            "Join us for your first hike on the flat, two-mile lake trail. We'll go at your pace, rest at the lakeside bench, and I can lend boots"
        ],
        "10-6": [
            "Book swap at the hall, Saturday at 2! Bring books you've finished, take one for each you bring, and we'll donate any left to charity",
            "Book swap in the hall Sunday at two: bring books you've finished; take one per book brought. Let's donate leftovers to charity"
        ],
        "11-1": [
            "Let's show Paddington at the hall this Friday. Tickets are $3, there's step-free access and we'll have popcorn. Can anyone help set up?",
            "Paddington in the hall Friday: $3 tickets, step-free access, popcorn provided. Could you help set up the screen?"
        ],
        "11-2": [
            "Local gift shoppers, try our new candle website from Monday! Browse without queuing, order through the form and pick up at our shop",
            "Our candle website opens Monday for local gift buyers: browse without queuing, order through its form, collect at our shop. Give it a try"
        ],
        "11-3": [
            "Neighbors, let's swap skills hour for hour. I can mend clothes and need help fixing my bike. Meet at the hall Saturday at noon; anyone want to join?",
            "Neighbors, join our skill swap in the hall Saturday noon: an hour for an hour. I'll mend clothes in return for bike repairs"
        ],
        "11-4": [
            "Want to test bean growth with me for two weeks? We'll need beans, pots and soil. Put one in sun and one in shade, give both equal water and measure height daily. I reckon the sunny one will grow taller",
            "Join my two-week bean experiment: beans, pots and soil, one pot in sun and one in shade, equal water. I predict taller plants in sun; measure heights daily"
        ],
        "11-5": [
            "Let's make a school-days museum at the library, Saturday 2-4, free entry. I'll bring the lunchbox I used for ten years. Could you bring an old school object too?",
            "Our school-days pop-up museum at the library opens Saturday, two to four, for free. I'll show the lunchbox I used for ten years; please bring old school objects"
        ],
        "11-6": [
            "Day trip to York by train? Let's see the railway museum's steam engines, then walk the city walls for the views. Home at six",
            "Day trip to York by train: railway museum for its steam engines, then city walls for the views. Back at six"
        ],
        "11-7": [
            "Local adults, join our free drawing club at the library Tuesdays at six. Bring paper and pencils; beginners get a short lesson. Email me to sign up",
            "Local adults: join our free drawing club at the library every Tuesday at six. Bring pencils and paper; beginners get a short lesson. Email me to sign up"
        ],
        "11-8": [
            "Let's share books through a street library by the park gate: take one, leave one. I'll build a waterproof box to keep them dry. Open it Sunday? Could someone help paint it?",
            "Let's share books in a street library by the park gate: take one, leave one. I'll build a waterproof box to keep books dry, opening Sunday. Could you help paint it?"
        ]
    },
    signalMixing: {
        "1-1": [
            "Could I borrow your charger for a bit? Thanks!",
            "Could I borrow your charger? Thanks"
        ],
        "1-2": [
            "Could you help carry my sofa upstairs? If you're busy I'll book movers instead",
            "Could you help pack my books for the move? I can pack them myself instead"
        ],
        "1-3": [
            "Could you turn the music down after 10? It's keeping me awake",
            "Please lower your TV after ten; its noise keeps me awake"
        ],
        "2-1": [
            "The chart's color coding helps, but the tiny axis labels are hard to read. Could you send me the editable file so I can fix them?",
            "I like the chart's clear colors, but the tiny labels are hard to read. Could you send me the editable chart file?"
        ],
        "2-2": [
            "Thanks for inviting me to dinner! I can't make it. Fancy a walk together instead?",
            "I cannot join dinner. Thank you for inviting me. Would you like to catch up by phone instead?"
        ],
        "2-3": [
            "The invoice due Friday hasn't been paid yet. When can you send the payment? Happy to resend the invoice",
            "I have not received payment for the invoice due Friday. When can I expect it? Would resending the details help?"
        ],
        "3-1": [
            "I'm sorry I broke your mug. Would you rather I buy you a new one or pay you back? It's your choice",
            "I broke your mug, and I apologize. I will make it right: would a replacement or reimbursement suit you better?"
        ],
        "3-2": [
            "Team, I left Jo out of the credits. Jo designed the method; I tested it. I'll update the slides to put that right",
            "Jo designed the method, and I tested it. I omitted Jo from the slides; I will correct that omission"
        ],
        "3-3": [
            "I won't finish the report today and can't give you a finish date yet. I can send the completed summary now, and I'll update you tomorrow",
            "The report will miss today's deadline. I cannot yet give a finish date. I can send the completed summary now. I will update you tomorrow"
        ],
        "4-1": [
            "I can do the analysis or the launch today, but not both. Which should I prioritize? I'll do the other tomorrow",
            "I can complete the analysis or the launch today, but not both. Which should take priority? I will move the other to tomorrow"
        ],
        "4-2": [
            "I understand how frustrating this is. I can't authorize cash back after 30 days, but I can offer store credit or a repair. Which would help?",
            "I understand this is frustrating. Outside 30 days I cannot authorize a cash refund. I can offer store credit. A repair is another option."
        ],
        "4-3": [
            "I'll answer work questions during office hours. How about 15 minutes tomorrow morning? Bring your top-priority question",
            "I cannot help in the evenings; I keep work help to office hours. Could we use 15 minutes tomorrow morning for your one most important question?"
        ],
        "4-4": [
            "I'd rather test payments before we ship; skipping that could let duplicate charges through. What do you think?",
            "A payment bug could charge customers twice. Could we test the payment path before shipping? What do you think?"
        ],
        "5-1": [
            "You can log in again, but some reports are still delayed. We're investigating why. You can use an export for now; we'll post another update at 16:00",
            "Logins are working again; some reports are still delayed. We are investigating the cause. You can use an export meanwhile. We will post another update at 16:00"
        ],
        "5-2": [
            "Average waits dropped from 10 to 8 minutes in our 20-visit pilot. That's a small sample; I'd run a bigger trial and track queue times before drawing wider conclusions",
            "The pilot cut average queue time from ten minutes to eight. That result is based on only 20 visits. I suggest a larger trial. We should track average queue time in that trial"
        ],
        "5-3": [
            "That result sounds worrying. Could you talk it through with your clinician? I can give you a lift to the appointment if you'd like",
            "An unfamiliar test result can feel worrying. Could you ask your clinician to explain the result? I can come with you if you would like"
        ],
        "5-4": [
            "Oak Cafe is quiet enough for a chat, but closes at six and has steps at the entrance. If step-free access matters to you, River Cafe has it. Which suits you?",
            "The café is quiet for a chat, but it closes at six and has steps at the entrance. If step-free access would suit you better, we could try the library café. Which works for you?"
        ],
        "6-1": [
            "Your quote is $600 for six pages; I've got $400. Could we do four pages now at your usual rate, then price the other two separately later? Would that scope work for you?",
            "Your quote is $600 for six pages; I have $400. Could we reduce the first phase to four pages and quote the other two separately later? Would that scope work at your usual rate?"
        ],
        "6-2": [
            "The full report needs until Monday. I can do that, or send the core findings Friday without the optional appendix. Which would you prefer? I'll wait for your choice before changing scope",
            "The full report needs until Monday. Alternatively I can deliver the core findings Friday without the optional appendix. Which plan do you prefer? I will wait for your choice before changing scope"
        ],
        "6-3": [
            "I know you're getting ready for Saturday's show, but I need quiet after nine. Could you rehearse tomorrow afternoon, or move the 9-10 part to a room away from my wall? Would either work?",
            "Your performance is Saturday and rehearsal is planned seven to ten; I need quiet after nine. Could we shift it to tomorrow afternoon, or move nine to ten to a room away from my wall? Would either work?"
        ],
        "6-4": [
            "I can give you $100, no need to pay it back, but I can't lend the other $400. Want a hand finding another option?",
            "I cannot lend $500, but I can give you $100 with no repayment expected. If you would like, I can help you look for other options"
        ],
        "6-5": [
            "Could we discuss a raise? I've taken over training the new hires and would like my pay to reflect that responsibility",
            "Could we discuss a raise? I lead the team now"
        ],
        "7-1": [
            "I'm covering approvals while Alex is away, through Friday. After that, please send urgent requests to Sam",
            "Alex is away. I will cover approvals through Friday. After Friday, please send urgent requests to Sam"
        ],
        "7-2": [
            "Interruptions in meetings have been raised as a concern. Could we try a speaking queue for two weeks, then look at who gets to participate?",
            "Interruptions in meetings have been reported. Could we try a speaking queue? I suggest trying it for two weeks. Then we can review participation together"
        ],
        "7-3": [
            "I don't know why they left. I can confirm their employment dates and talk about the work I saw them do firsthand",
            "I do not know why they left. I can confirm their employment dates. I can describe work I personally observed"
        ],
        "7-4": [
            "I can't share launch dates or features, but you're welcome to follow our public newsletter for confirmed announcements",
            "I cannot share confidential launch details. You are welcome to follow the public newsletter for confirmed announcements"
        ],
        "7-5": [
            "Would a quiet desk or a different session suit you better? You can choose, and there's no need to tell me your diagnosis or personal history",
            "I can offer a quiet desk. A different session is another option. Which would you prefer? You do not need to share a diagnosis or personal history"
        ],
        "8-1": [
            "The library room is closed Tuesday for repairs. Sorry for the disruption. Readers can use the downstairs room free of charge; staff, please move the bookings there too",
            "The library room closes Tuesday for repairs. We are sorry for the disruption. Readers can use the downstairs room. Access remains free. Staff, please move affected bookings to the downstairs room"
        ],
        "8-2": [
            "Could we try a new rota for four weeks, keeping everyone's contracted hours? Please send preferred shifts through the private form. We may not fit every preference, so let's hear feedback before deciding",
            "I propose a four-week rota trial preserving contracted hours. Please submit preferred shifts through the private form. We cannot meet every preference. Please give feedback before we decide whether to proceed"
        ],
        "8-3": [
            "Thanks for donating chairs to our event, and thanks to the volunteers who set them up. Program decisions remain independent of donations",
            "Thank you to the company for donating chairs. Our volunteers did the setup, and we appreciate their work. The donation gives no control over our program decisions"
        ],
        "8-4": [
            "I got yesterday's announcement wrong: bookings open Friday, not now. Use our public booking page. I know the mix-up has been inconvenient",
            "I was wrong to say yesterday that bookings were open. Bookings open Friday. Please use the public booking page. I recognize the inconvenience this caused"
        ],
        "8-5": [
            "New to the workshop? You're welcome! Come ten minutes early for the safety briefing. Once machines start, we can't let anyone in: moving blades could injure you. If you miss it, join the next session",
            "Welcome to the workshop. Please come ten minutes early for the safety briefing. Entry closes when machines start; late arrivals could walk into moving parts. If you miss the briefing, we can offer the next session instead"
        ],
        "9-1": [
            "For Saturday's noon picnic, let's check the forecast at nine. If heavy rain is forecast, could we use the hall at noon? If it's unavailable, let's postpone to Sunday. It costs $40, split equally among those who agree. I'll only book once everyone joining has explicitly agreed",
            "Let's check Saturday's forecast at nine. In heavy rain, we would meet in the hall at noon. If the hall is unavailable, we could postpone the picnic to Sunday. The hall costs $40, split equally only among those who agree. I will wait for explicit agreement before booking"
        ],
        "9-2": [
            "The part might arrive Thursday. If it does, I can install it Friday; if not, I'll update you Friday. Meanwhile I could disable the optional alerts as a workaround. Would you like me to do that? I'll wait for your OK",
            "If the part arrives Thursday, I can offer installation Friday. If the part does not arrive, I will update you Friday. A temporary workaround would disable one optional feature. Would you like me to apply it? I will wait for your approval"
        ],
        "9-3": [
            "We've only room for a security review or launch today. I'd do the review first, fix any critical findings before launch, or launch tomorrow if it's clear. Can you approve that priority?",
            "We have capacity for the review or the launch today, not both. Could we review first? If it finds a critical issue, we fix that before launch; if not, we could launch tomorrow. Please approve this priority before we change the schedule"
        ],
        "9-4": [
            "We have two seats and five people waiting. Let's offer seats in signup order, give each person 24 hours to reply, then move on if they don't. Everyone can also opt for the next session",
            "Two seats are available for five people waiting. Could we offer them in signup order, allowing 24 hours for each reply before asking the next person? Everyone can also choose the next session; being on this list is not a confirmed seat"
        ],
        "9-5": [
            "Could volunteers try the new tool for two weeks? We'd keep the old one available and stop if exports fail. Afterwards, let's review export reliability and time saved before anyone has to switch permanently. What do you think?",
            "I propose a two-week trial for volunteers, with the old tool still available. We stop if exports fail. Afterward we review export reliability and time saved before considering a permanent move. Nobody has to switch before that review"
        ],
        "9-6": [
            "Four ways makes the $90 booking $22.50 each. Once the new person pays $22.50, each of the original three gets $7.50 back. Is everyone happy with that? I'll wait for all four to agree before changing the booking",
            "Could all four of us agree to pay $22.50 each for the $90 booking? The three who paid $30 would each receive $7.50 back, but only once the fourth person pays. I will not change the booking before everyone agrees"
        ],
        "10-1": [
            "Our 'twice as fast' headline overstated it. We only tested one task with ten people, so it isn't a general result. Let's run a larger study with different tasks before making broader claims",
            "We overstated the evidence in our headline. Ten people did one task twice as fast in one test; that is the limit of the finding. We should test a larger group on different tasks before making wider speed claims"
        ],
        "10-2": [
            "I'm sorry I shared your private message without asking. I've removed my copy from the channel. If you'd like, I'll ask the recipients to delete theirs, though I can't guarantee they will",
            "I shared your private message without permission. I am sorry. I removed my copy from the shared channel. I can ask the recipients to delete their copies. I will contact them only if you want me to. I cannot guarantee every copy will be deleted"
        ],
        "10-3": [
            "We can't accept funding on condition that you veto a speaker. Everyone is assessed using the same published program criteria. We'd welcome an unrestricted donation or feedback through our public form",
            "We cannot accept funding tied to excluding a speaker. Our program uses the same published criteria for everyone. You are welcome to make an unrestricted donation or use the public feedback route, without control over speaker selection"
        ],
        "10-4": [
            "We've had reports of duplicate charges, but haven't confirmed the cause. Please check your statements and send transaction IDs through the private support form. We'll update you at noon",
            "Duplicate charges have been reported; their cause is still unconfirmed. Please check your statements. Send transaction IDs through the private support form. We will post a status update at noon"
        ],
        "10-5": [
            "Your design work helped make this project possible. Would you like to present it? It's completely fine to say no. We can pay for your preparation time or present together, whichever suits you",
            "You helped build this project, and I want to credit your contribution. Would you like to present it? It is completely fine to decline. I can offer paid preparation time or co-present with you"
        ],
        "10-6": [
            "The pilot was faster, but two people reported accessibility problems. I'd only extend it once those are addressed, with the old route still available. If you were affected, how would you like us to test the changes?",
            "The pilot improved speed. It also produced two accessibility complaints. I recommend extending it only if those accessibility issues are addressed. We should keep the old route available. Could affected users help decide how we test the changes?"
        ],
        "11-1": [
            "I understand pay is frozen this quarter. I've taken over training that our manager used to lead. Could we document a pay review next quarter based on that responsibility, and agree the review criteria now?",
            "I understand pay is frozen this quarter. I now lead the training previously handled by a manager. Could we document a pay review next quarter tied to that training responsibility? I would like us to agree the review criteria now"
        ],
        "11-2": [
            "Sorry about the 40-minute outage. Access is back, but some exports are still queued and we haven't confirmed the cause. Please don't resubmit exports. For urgent cases, use private support. We'll update you at 18:00",
            "We apologize for the 40-minute outage. Access is back, but exports are still queued and we have not confirmed the cause. Please avoid resubmitting exports. Urgent cases can go through private support. We will give a further status update at 18:00"
        ],
        "11-3": [
            "You've booked practice from five to seven, and Jo needs quiet for a call at six. If you both agree, could practice stay here five to six and move elsewhere for six to seven? Otherwise, Jo could try taking the call in another room, if one is available",
            "You booked music practice from five to seven, and our neighbor needs quiet for a call at six. Could practice stay here from five to six and move to another room from six to seven? Only if you both agree. If not, we could look for somewhere else for the call"
        ],
        "11-4": [
            "Functional tests passed; accessibility review is Monday. After that, could volunteers try a limited pilot? We'd keep the current service and stop if payment errors appear. After one week, let's review completion times and support requests before deciding whether to expand",
            "Functional testing passed, and accessibility review is scheduled for Monday. Once that review is complete, I propose a limited voluntary pilot, keeping the current service available. We stop for payment errors and review completion times and support requests after one week before any expansion"
        ],
        "11-5": [
            "We can't offer your child priority for the $2,000, but an unrestricted donation would be welcome. All places follow the public signup order; your child can join the same waitlist as everyone else",
            "We cannot give your child priority in exchange for the $2,000 donation. An unrestricted donation would be welcome. Places follow public signup order for everyone. Your child can use the same waitlist route as everyone else"
        ],
        "11-6": [
            "I approved a post that wrongly credited me alone. Priya designed the tool, I tested it, and Lee wrote the guide. I'd like to fix the credits in both the post and guide. Priya and Lee, could you confirm the wording before I change either?",
            "I approved the inaccurate post giving me sole credit. To correct it: Priya designed the tool, I tested it, and Lee wrote the guide. I propose updating both the post and guide credits. Would each contributor confirm the wording before I edit either?"
        ],
        "11-7": [
            "Our funding has halved, so we have to cut free weekly classes to two free sessions a month. Please share your thoughts before we choose the dates. You can use the free practice materials between sessions",
            "Our funding fell by half. Free weekly classes will become two free sessions a month. Please share feedback before we choose the dates. Free practice materials will be available between sessions"
        ],
        "11-8": [
            "Median waits fell from ten to seven minutes across 30 users, but two couldn't check out with a keyboard. I'd hold off wider rollout, fix keyboard checkout and keep the old route. Volunteers can sign up through the form for paid retesting. Let's review satisfaction ratings and support requests after two weeks before deciding on rollout",
            "The 30-user trial reduced median waiting from ten minutes to seven, but two users could not complete checkout with a keyboard. I would delay wider rollout. Let us fix keyboard checkout and retain the old route. Volunteers can sign up to retest through a form; we will pay them for their time without asking for diagnoses. After two weeks, review satisfaction ratings and support requests before deciding on rollout"
        ]
    }
};
