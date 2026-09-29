// Complete messages split into removable details. Overrides remove indirect restatements too.
export const semanticGolfingCases: Record<string, {
    parts: string[], alternatives?: string[], omissions?: Record<string, string>
}> = {
    "1-1": {
        "parts": [
            "My dog is stuck.",
            "Please help me.",
            "Act immediately."
        ],
        "alternatives": [
            "Help my cat now!",
            "Please help my dog immediately!"
        ],
        "omissions": {
            "Name an animal": "Please help me now!",
            "Ask for help": "My dog needs a walk immediately.",
            "Call for immediate action": "Please help brush my sleepy dog."
        }
    },
    "1-2": {
        "parts": [
            "Could you give me a ride?",
            "I need to go to the library.",
            "I will pay for the fuel."
        ],
        "alternatives": [
            "Could you drive me to the library? I can pay for fuel",
            "A lift to the station, please? Gas is on me"
        ]
    },
    "1-3": {
        "parts": [
            "You can have my spare cookie.",
            "It is a chocolate cookie.",
            "I baked them myself."
        ],
        "alternatives": [
            "Have a chocolate cookie; I baked them myself"
        ]
    },
    "2-1": {
        "parts": [
            "I have your parcel.",
            "It is at my flat.",
            "Collect it after six."
        ],
        "alternatives": [
            "Your parcel is with me; collect it at my flat after six"
        ]
    },
    "2-2": {
        "parts": [
            "You should read The Hobbit.",
            "Its riddles are brilliant.",
            "You can borrow my copy."
        ],
        "alternatives": [
            "Read The Hobbit for its brilliant riddles; borrow my copy"
        ]
    },
    "2-3": {
        "parts": [
            "May I borrow your screwdriver?",
            "I need the screwdriver to fix a loose screw on my door handle.",
            "I will return it."
        ],
        "alternatives": [
            "May I borrow your screwdriver to fix my door handle? I'll return it",
            "May I borrow your screwdriver? I need to fix a loose door handle. I will return it."
        ],
        "omissions": {
            "Ask for a screwdriver": "I need a screwdriver to fix my door handle. I will put my own screwdriver back in the toolbox."
        }
    },
    "3-1": {
        "parts": [
            "The bridge is closed.",
            "There is a path through the park.",
            "The Clock Tower is a landmark along this alternative route.",
            "Be careful of slippery steps on the path."
        ],
        "alternatives": [
            "Bridge closed; take the park path past the fountain. Watch for slippery steps",
            "The bridge is closed. Take the park path; the fountain is your landmark. Beware of slippery steps.",
            "The bridge is closed. Take the park path past the Clock Tower. Be careful of slippery steps on the path.",
            "The bridge is closed. There is a path through the park. Follow the fountain along the park path. Watch for slippery steps on that path."
        ],
        "omissions": {
            "Suggest another route": "The bridge is closed. Please wait here."
        }
    },
    "3-2": {
        "parts": [
            "Could you water my fern?",
            "I am away from home this weekend.",
            "The fern needs one cup of water.",
            "Thank you."
        ],
        "alternatives": [
            "I'm away; could you give my fern one cup of water? Thanks",
            "Could you water my fern? I am away this weekend. Give it one cup of water. Thank you."
        ],
        "omissions": {
            "Ask them to water the fern": "I am away from home this weekend. I already gave my fern one cup of water. Thank you."
        }
    },
    "3-3": {
        "parts": [
            "May I keep my library book for another week?",
            "I have not finished reading it yet.",
            "I will return it on Friday.",
            "The book is The Hobbit."
        ],
        "alternatives": [
            "Could I keep The Hobbit from the library until Friday? I have two chapters left and will return it then"
        ]
    },
    "4-1": {
        "parts": [
            "Let us move the rooftop film indoors.",
            "Rain is why we must move it.",
            "We can watch in the lounge.",
            "The original start time stays the same."
        ],
        "alternatives": [
            "Rain means moving our rooftop film indoors to the lounge; same start time"
        ]
    },
    "4-2": {
        "parts": [
            "Please collect the cake.",
            "It is at Rose Bakery.",
            "Collect it at noon.",
            "It is for Maya."
        ],
        "alternatives": [
            "Please collect Maya's cake at Rose Bakery at noon"
        ]
    },
    "4-3": {
        "parts": [
            "The spare key is under the blue pot.",
            "Lift the handle to unlock the door.",
            "After your visit, leave the key on the kitchen hook.",
            "Enjoy your stay."
        ],
        "alternatives": [
            "Key under the blue pot; lift the handle to unlock. Put the key back there afterward. Enjoy your stay",
            "The spare key is under the blue pot. Lift the handle to unlock the door. Put the key back under the pot. Enjoy your stay."
        ]
    },
    "4-4": {
        "parts": [
            "Let us rehearse in the hall.",
            "We can start at six.",
            "Please bring your violin.",
            "I will bring the sheet music."
        ],
        "alternatives": [
            "Rehearse in the hall at six? Bring your violin; I'll bring the sheet music"
        ]
    },
    "5-1": {
        "parts": [
            "I ordered a cheese sandwich.",
            "I received a tuna sandwich.",
            "Could I have the cheese one instead?",
            "Thank you for your help."
        ],
        "alternatives": [
            "I ordered cheese but got tuna. Could you replace this sandwich with the cheese one? Thanks",
            "I ordered a cheese sandwich but got tuna. Please bring the cheese sandwich instead. Thank you for helping me.",
            "I asked for ham, but you've brought me egg. Could you swap this sandwich for the ham I ordered? Thanks!",
            "My order was a cheese sandwich, but you gave me tuna. Please replace it with a cheese sandwich. Thank you!"
        ],
        "omissions": {
            "Describe your original order": "I received a tuna sandwich. Please replace it with the one I ordered. Thank you for your help."
        }
    },
    "5-2": {
        "parts": [
            "I spilled water on your notebook.",
            "I am sorry.",
            "I will buy you a new notebook.",
            "I can copy your notes into it."
        ],
        "alternatives": [
            "Sorry I spilled water on your notebook; I'll replace it and copy your notes into the new one"
        ]
    },
    "5-3": {
        "parts": [
            "The meeting is no longer in Room 2.",
            "We will use Room 4.",
            "The meeting time is unchanged.",
            "Please tell anyone who misses this message."
        ],
        "alternatives": [
            "Meeting now in Room 4, not Room 2; same time. Please tell anyone who misses this message"
        ]
    },
    "5-4": {
        "parts": [
            "Try restarting the app.",
            "Tell me what happens after the restart.",
            "I can help you troubleshoot further.",
            "A frozen app is frustrating."
        ],
        "alternatives": [
            "A frozen app is frustrating. Try restarting it and tell me what happens; I can help troubleshoot further"
        ],
        "omissions": {
            "Suggest a restart": "Tell me whether the app is still frozen. I can help troubleshoot further; I know this is frustrating."
        }
    },
    "6-1": {
        "parts": [
            "We could take the bus.",
            "Walking is another option.",
            "Walking is cheaper than the bus.",
            "The bus is faster than walking.",
            "Which option would you prefer?"
        ],
        "alternatives": [
            "Bus or walk? Walking costs less, but the bus is faster. Which do you prefer?"
        ],
        "omissions": {
            "Offer the bus option": "We could walk to town for free. Which would you prefer?",
            "Offer the walking option": "We could take the bus to town for $2. It is fast. Which would you prefer?"
        }
    },
    "6-2": {
        "parts": [
            "I recommend this desk.",
            "The desk has lots of useful storage space.",
            "The desk is so large it will not fit a small room.",
            "It costs $80.",
            "Measure your space before buying it."
        ],
        "alternatives": [
            "I'd buy this $80 desk for its roomy drawers, but it's wide. Measure your space before buying",
            "I recommend this desk. Its drawers hold plenty. It is too wide for a small room. It costs $80. Measure your space before buying it.",
            "I recommend this $80 desk for its excellent storage: the drawers are big and useful. It takes up lots of space, though, so measure your room before buying",
            "You should buy this desk: its storage is great, with plenty of useful drawers. It costs $80 but is quite bulky, so measure the space first"
        ]
    },
    "6-3": {
        "parts": [
            "We could have soup for lunch.",
            "Pasta is another lunch option.",
            "The soup is vegetarian.",
            "I can cook lunch.",
            "Please vote for your preferred dish."
        ],
        "alternatives": [
            "Soup or pasta for lunch? The soup is vegetarian. I'll cook; please vote for your preferred dish"
        ],
        "omissions": {
            "Offer soup": "How about pasta for lunch? It is vegetarian. I can cook; please vote."
        }
    },
    "6-4": {
        "parts": [
            "As a gift, I could give you the book The Hobbit.",
            "Or I could give you a bookshop voucher.",
            "The book has beautiful illustrations.",
            "The voucher lets you pick any title.",
            "Which gift would you prefer?"
        ],
        "alternatives": [
            "Would you prefer The Hobbit for its beautiful illustrations or a bookshop voucher to choose any title? My gift to you",
            "For your gift: the book The Hobbit with its beautiful illustrations, or a bookshop voucher so you choose any book. Which would you prefer?"
        ],
        "omissions": {
            "Suggest a book as a gift": "I could give you a bookshop voucher so you can pick any title. Would you like that gift?",
            "Offer a bookshop voucher": "I could give you The Hobbit for its beautiful illustrations. Would you like that gift?"
        }
    },
    "7-1": {
        "parts": [
            "Give my cat dry cat food.",
            "Feed her at six.",
            "She hides under the sofa.",
            "Please refill her water bowl.",
            "Call me on my mobile if needed."
        ],
        "alternatives": [
            "Feed my cat dry food at six, refill her water, and look under the sofa if she hides. Call my mobile if needed"
        ]
    },
    "7-2": {
        "parts": [
            "The lamp will not turn on.",
            "I already replaced the bulb.",
            "Please check the switch.",
            "The lamp is on the kitchen table.",
            "Let me know what you find."
        ],
        "alternatives": [
            "My lamp won't turn on despite a new bulb. It's on the kitchen table; please check its switch and tell me what you find",
            "My lamp won't switch on. I tried changing its bulb without success. Please inspect the lamp's power switch. It's on the kitchen table. Can you tell me what the fault is?"
        ]
    },
    "7-3": {
        "parts": [
            "Our stall sells jam.",
            "Each jar costs $4.",
            "We accept payment in cash.",
            "Maya will take over from you.",
            "The handover is at noon."
        ],
        "alternatives": [
            "We sell jam at $4 a jar; cash goes in the tin. Hand the stall over to Maya at noon",
            "Our stall sells jam. Each jar costs $4. Take cash in the tin. Maya will take over from you. The handover is at noon."
        ]
    },
    "7-4": {
        "parts": [
            "Let us read Dune.",
            "Read thirty pages.",
            "Let us discuss it on Friday.",
            "Meet at the cafe.",
            "Please bring your notes."
        ],
        "alternatives": [
            "Read thirty pages of Dune; let's discuss them at the cafe on Friday. Bring your notes"
        ]
    },
    "7-5": {
        "parts": [
            "We have run out of butter for the cake.",
            "Use oil instead of butter.",
            "Use two tablespoons of oil.",
            "The cake will be less buttery.",
            "Add the oil after whisking the eggs."
        ],
        "alternatives": [
            "No butter? Use two tablespoons of oil after whisking the eggs; the cake will taste less buttery",
            "We have no butter. Use oil instead of butter. Use two tablespoons of oil. The cake will be less buttery. Add the oil after whisking the eggs."
        ],
        "omissions": {
            "Name a substitute": "We have run out of butter for the cake. A substitute could affect its flavor."
        }
    },
    "8-1": {
        "parts": [
            "You want some fresh air.",
            "I am feeling cold.",
            "Let us open the window briefly.",
            "Keep it open for five minutes.",
            "I will close it afterward."
        ],
        "alternatives": [
            "You need fresh air; I'm cold. Let's open the window for five minutes, then I'll close it"
        ],
        "omissions": {
            "Propose a brief airing": "You want fresh air; I am cold. I will close the window."
        }
    },
    "8-2": {
        "parts": [
            "I need shelf space for my books.",
            "You need shelf space for your plants.",
            "Let us take half the shelf each.",
            "I can move my books to my half.",
            "Would that arrangement work for you?"
        ],
        "alternatives": [
            "My books and your plants both need shelf space. Half each? I'll move my books to my half. Does that work?"
        ]
    },
    "8-3": {
        "parts": [
            "Could we swap shifts?",
            "Please cover my Saturday morning work shift.",
            "I can cover your Sunday shift.",
            "I need to attend a family wedding on Saturday.",
            "Thank you."
        ],
        "alternatives": [
            "Could you cover my Saturday shift for a wedding? I'll take your Sunday shift in exchange. Thanks",
            "Could we swap shifts? I need my Saturday shift covered. I can cover your Sunday shift. I have a wedding on Saturday. Thank you.",
            "Could you work my Saturday morning shift? I will work your Sunday shift in exchange because of a family wedding. Thank you.",
            "Please swap work shifts with me. I work Saturday and need you to cover that day for a family wedding. I can cover your Sunday. Thank you."
        ],
        "omissions": {
            "Ask to swap shifts": "I need my Saturday shift covered because of a family wedding. Thank you."
        }
    },
    "8-4": {
        "parts": [
            "Let us play chess.",
            "We can teach new players the moves.",
            "An experienced player can coach each team.",
            "We will play for one hour.",
            "Everyone is welcome to join us."
        ],
        "alternatives": [
            "Everyone, join an hour of chess. We'll teach beginners the moves, with an experienced player coaching each team"
        ],
        "omissions": {
            "Invite everyone": "Chess is the game. New players can learn the moves, and an experienced player can coach each team. A session lasts one hour."
        }
    },
    "8-5": {
        "parts": [
            "Could you send me our group photo?",
            "I want it for my scrapbook.",
            "In return, I can send you my sunset photo.",
            "We can exchange them by email.",
            "May I post your photo on my public page?"
        ],
        "alternatives": [
            "Please email our group photo for my scrapbook; I'll send my sunset shot back. May I post yours publicly?",
            "Could you email me our group photo for my scrapbook? I'll email my sunset photo in return. Would you also be happy for me to share your photo publicly?",
            "Can you send our group photo by email? I'd like it for my scrapbook, and I'll email you a sunset photo in return. Is it OK to put yours on my public page?"
        ],
        "omissions": {
            "Explain its intended use": "Could you send me our group photo? I can send you my sunset shot. Please email yours. I'll ask before making any other use of it."
        }
    },
    "9-1": {
        "parts": [
            "Come to our photo exhibition.",
            "The theme is city wildlife.",
            "It is at the town library.",
            "The show is on Saturday.",
            "Entry is free.",
            "You can meet the photographers."
        ],
        "alternatives": [
            "Join our city-wildlife photo show at the library on Saturday. Free entry, and you can meet the photographers"
        ]
    },
    "9-2": {
        "parts": [
            "Let us start a herb garden.",
            "We can reuse an old bucket as a planter.",
            "We can grow basil.",
            "Put it on the kitchen windowsill.",
            "My task will be planting the seeds.",
            "Could you help water it?"
        ],
        "alternatives": [
            "Let's grow a herb garden of basil in an old bucket on the kitchen windowsill. I'll plant seeds; could you help water it?",
            "Let us start a herb garden. We can reuse an old bucket as a planter. We can grow basil. Put it on the kitchen windowsill. I will plant the seeds. Could you help water it?"
        ],
        "omissions": {
            "Propose a garden": "Reuse an old bucket to store seeds on the kitchen windowsill. I will organize the seeds. Could you help?"
        }
    },
    "9-3": {
        "parts": [
            "The bed was comfortable.",
            "The host gave us excellent directions.",
            "The room has thin curtains that let streetlight in.",
            "It kept me awake.",
            "Blackout curtains would help.",
            "I would stay here again."
        ],
        "alternatives": [
            "Comfortable bed; the host gave great directions. Thin curtains let streetlight keep me awake; blackout curtains would help. I'd return",
            "The bed was comfortable. The host gave us excellent directions. The curtains are too thin and let in streetlight. It kept me awake. Blackout curtains would help. I would stay here again."
        ],
        "omissions": {
            "Describe a concrete problem": "The bed was comfortable and the host gave excellent directions. I enjoyed my stay and would return."
        }
    },
    "9-4": {
        "parts": [
            "Let us take a local history walk.",
            "Start at the old station.",
            "Then visit the clock tower.",
            "Look at the steam engine sign at the station.",
            "Notice the old bell at the clock tower.",
            "Will you lead the second part?"
        ],
        "alternatives": [
            "Let's take a history walk: see the steam engine sign at the old station, then the clock tower's old bell. Will you lead the second part?",
            "Let's walk through our town's history: first the railway station to see its original ticket office, then the clock tower to look at its old bell. Would you lead the clock tower part?",
            "Fancy a history walk? We could visit the old station and look at its Victorian roof, then see the bronze bell at the clock tower. Could you lead us around the tower?"
        ],
        "omissions": {
            "Include a station stop": "Let us take a local history walk to the clock tower to see its old bell. Will you lead part?",
            "Include a clock tower stop": "Let us take a local history walk to the old station to see its steam engine sign. Will you lead part?"
        }
    },
    "9-5": {
        "parts": [
            "Neighbors, join our repair cafe.",
            "Bring broken lamps to repair.",
            "Meet at the library.",
            "We start at noon on Sunday.",
            "I can replace lamp switches.",
            "Could anyone volunteer to help?"
        ],
        "alternatives": [
            "Neighbors, join our repair cafe at the library Sunday noon. Bring torn clothes; I can sew buttons. Could you volunteer to help?",
            "Neighbors, join our repair cafe. Bring your torn clothes. Meet at the library. We start at noon on Sunday. I can sew on buttons. Could anyone volunteer to help?"
        ]
    },
    "9-6": {
        "parts": [
            "For your birthday, how about a pottery class?",
            "It fits your love of making things.",
            "The class costs $30.",
            "I can arrange the booking.",
            "We could go on Saturday.",
            "Would that birthday plan suit you?"
        ],
        "alternatives": [
            "A $30 pottery class for your birthday fits your love of making things. Saturday? I'll book it if that plan suits you"
        ]
    },
    "10-1": {
        "parts": [
            "We can spend at most $60 on a bench.",
            "The oak bench costs $90.",
            "The pine bench costs $50.",
            "Let us choose the pine bench.",
            "It folds for easy storage.",
            "I can collect it."
        ],
        "alternatives": [
            "Our bench budget is $60. Oak costs $90, pine $50; let's get pine, which folds for storage. I'll collect it"
        ]
    },
    "10-2": {
        "parts": [
            "We have only half the usual time for our workshop.",
            "We will keep the drawing exercise.",
            "We will cut the slideshow.",
            "The slides repeat the handout.",
            "I can send everyone the notes.",
            "What do you think of this plan?"
        ],
        "alternatives": [
            "Our workshop time is halved. Keep drawing; drop slides as they repeat the handout. I'll send everyone notes. Thoughts on this plan?",
            "The workshop time has been halved. We will keep the drawing exercise. We will cut the slideshow. The slides repeat the handout. I can send everyone the notes. What do you think of this shorter plan?"
        ]
    },
    "10-3": {
        "parts": [
            "One guest is vegetarian.",
            "Another guest avoids gluten.",
            "Let us serve vegetable curry with rice.",
            "This dish contains no meat.",
            "It is gluten-free.",
            "I will cook it."
        ],
        "alternatives": [
            "One guest is vegetarian; another avoids gluten. Let's serve vegetable curry with rice: no meat, gluten-free. I'll cook"
        ]
    },
    "10-4": {
        "parts": [
            "Let us put up a tool-lending shelf.",
            "It will save us buying tools we rarely use.",
            "The tool-sharing shelf can go in the garage.",
            "All borrowed tools must be returned within two days.",
            "Try the scheme for one month.",
            "Count how many loans are returned on time."
        ],
        "alternatives": [
            "Let's trial a tool-lending shelf in the garage for a month to save buying rarely used tools. Return tools in two days; count on-time returns",
            "Let's share tools on a shelf in our garage so we don't all have to buy our own. Borrowers must return tools within two days. Try it for a month, then count the loans that came back on time"
        ]
    },
    "10-5": {
        "parts": [
            "Join us for your first hike.",
            "We will take the lake trail.",
            "It is flat and only two miles.",
            "We will walk at your pace.",
            "I can lend you walking boots.",
            "We can rest at the lakeside bench."
        ],
        "alternatives": [
            "Join us for your first hike on the flat, two-mile lake trail. We'll go at your pace, rest at the lakeside bench, and I can lend boots"
        ]
    },
    "10-6": {
        "parts": [
            "Let us hold a book swap.",
            "We can meet in the hall.",
            "Start at two on Sunday.",
            "Bring books you have finished reading.",
            "Take one book for each one you bring.",
            "We can donate leftover books to charity."
        ],
        "alternatives": [
            "Book swap in the hall Sunday at two: bring books you've finished; take one per book brought. Let's donate leftovers to charity"
        ],
        "omissions": {
            "Propose a book swap": "Bring books you have finished to the hall on Sunday at two. We will donate them to charity."
        }
    },
    "11-1": {
        "parts": [
            "We will screen the film Paddington.",
            "The screening is in the hall.",
            "It is on Friday.",
            "Tickets cost $3.",
            "There is step-free access.",
            "We will provide popcorn as a snack during the film.",
            "Could anyone help set up the screen?"
        ],
        "alternatives": [
            "Paddington in the hall Friday: $3 tickets, step-free access, popcorn provided. Could you help set up the screen?",
            "We will show Paddington. The screening is in the hall. It is on Friday. Tickets cost $3. There is step-free access. Popcorn will be provided. Could anyone help set up the screen?"
        ]
    },
    "11-2": {
        "parts": [
            "Our website sells handmade candles.",
            "It is for local gift buyers.",
            "You can browse without queuing.",
            "Order using the website form.",
            "Collect your order from our shop.",
            "The website launches on Monday.",
            "Please give our new site a try."
        ],
        "alternatives": [
            "Our candle website opens Monday for local gift buyers: browse without queuing, order through its form, collect at our shop. Give it a try",
            "Our website sells handmade candles. It is for local gift buyers. You can browse without queuing. Order using the website form. Collect your order from our shop. The site opens on Monday. Please give our new site a try."
        ]
    },
    "11-3": {
        "parts": [
            "Let us swap skills with our neighbors.",
            "I can mend clothes.",
            "I would like help fixing my bike.",
            "Trade one hour of help for one hour back.",
            "Meet in the community hall.",
            "We can meet on Saturday at noon.",
            "Anyone interested is welcome to join us."
        ],
        "alternatives": [
            "Neighbors, join our skill swap in the hall Saturday noon: an hour for an hour. I'll mend clothes in return for bike repairs"
        ],
        "omissions": {
            "Propose swapping skills": "I can mend clothes. I need bike repairs. Meet at the hall on Saturday at noon; everyone is welcome."
        }
    },
    "11-4": {
        "parts": [
            "Run the experiment for two weeks.",
            "Give both pots the same amount of water.",
            "I predict the beans in sunlight will grow taller.",
            "We need beans, pots and soil.",
            "Grow one pot in sun and one in shade.",
            "Measure their height each day.",
            "Would you join me?"
        ],
        "alternatives": [
            "Join my two-week bean experiment: beans, pots and soil, one pot in sun and one in shade, equal water. I predict taller plants in sun; measure heights daily"
        ]
    },
    "11-5": {
        "parts": [
            "Our pop-up museum will explore school days.",
            "I will display my old lunchbox.",
            "It carried my lunch every day for ten years.",
            "We can display it in the library.",
            "Visit on Saturday from two to four.",
            "Entry is free.",
            "Please bring an old school object to exhibit."
        ],
        "alternatives": [
            "Our school-days pop-up museum at the library opens Saturday, two to four, for free. I'll show the lunchbox I used for ten years; please bring old school objects"
        ]
    },
    "11-6": {
        "parts": [
            "Let us spend a day in York.",
            "We can take the train to York.",
            "First visit the railway museum.",
            "Its steam engines are worth seeing.",
            "Then visit the city walls.",
            "The walls offer views over the city.",
            "We will return at six."
        ],
        "alternatives": [
            "Day trip to York by train: railway museum for its steam engines, then city walls for the views. Back at six"
        ],
        "omissions": {
            "Name a destination": "We can take the train. Visit the railway museum for its steam engines, then the city walls for their views. We will return at six."
        }
    },
    "11-7": {
        "parts": [
            "Our drawing club is for local adults.",
            "We meet at the library.",
            "Meet every Tuesday at six.",
            "Bring pencils and paper.",
            "Beginners get a short lesson each week.",
            "The club is free.",
            "Email me to sign up."
        ],
        "alternatives": [
            "Local adults: join our free drawing club at the library every Tuesday at six. Bring pencils and paper; beginners get a short lesson. Email me to sign up"
        ]
    },
    "11-8": {
        "parts": [
            "A street library will let neighbors share books.",
            "The street library will be beside the park gate.",
            "Take a book and leave one for someone else.",
            "A waterproof box will keep the books dry.",
            "I will build the box.",
            "Let us open it on Sunday.",
            "Please help set up the street library by painting the box."
        ],
        "alternatives": [
            "Let's share books in a street library by the park gate: take one, leave one. I'll build a waterproof box to keep books dry, opening Sunday. Could you help paint it?",
            "A street library will let neighbors share books. Put it beside the park gate. Take a book and leave one for someone else. A waterproof box will keep the books dry. I will build the box. Let us open it on Sunday. Could you help paint the box?"
        ]
    }
};
