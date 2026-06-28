export const STATIC = {
  card1: {
    eyebrow: 'A+A · AI READINESS',
    lede: 'AI does not fail in the tool. It leaks in the *decision*.',
    body: 'Your answers show the gap between what {brandName} sees and what it does. That is the one to map first.'
  },
  card2: {
    label: 'WHERE {brandName} STANDS TODAY'
  },
  card5: {
    eyebrow: 'THE ANSWERS BEHIND IT',
    lede: 'We are not guessing. You told us this.',
    tail: 'Three answers. One pattern. The business has shown us where the drag sits.'
  },
  card6: {
    eyebrow: 'THE PATTERN IN YOUR ANSWERS',
    lead: 'The value is not one answer. It is the pattern across them.'
  },
  card7: {
    eyebrow: 'What you said vs what you did',
    divergentLead: 'We asked what is holding {brandName} back. You pointed at this.',
    divergentTurn: 'Here is the uncomfortable part: your answers do not fully agree with you.',
    convergentLead: 'You named it yourself.',
    convergentTurn: 'Most people name the easier blocker. You named the real one.',
    noneLead: 'We asked what is holding {brandName} back. You said the business is not blocked.',
    noneTurn: 'Your operating answers are more cautious than that.'
  },
  card9: {
    eyebrow: 'WHAT THE GAP COSTS'
  },
  card10: {
    eyebrow: 'And it is getting more expensive'
  },
  card11: {
    eyebrow: 'What fixing it actually means'
  },
  card12: {
    eyebrow: 'THE FIRST MOVE'
  },
  card13: {
    eyebrow: 'WHERE THIS GOES NEXT',
    button: 'Book the working session',
    qualifier: 'Six new clients a year. Our CEO is in every one. Fit check, both ways.'
  },
  card14: {
    button: 'Book the working session'
  }
};

export const PERSONA = {
  'c-vi': {
    name: 'The Dead Reckoner',
    signature: 'a business plotting the week by estimate because the instruments are not yet trusted',
    headline: 'Stop steering {brandName} by *guess*.',
    fitLine: 'You came in as The Dead Reckoner: a business moving by feel because the numbers do not yet give leadership a clean position.',
    closeLine: 'The Dead Reckoner changes the day it stops steering by estimate.'
  },
  'c-ve': {
    name: 'The Sole Hand',
    signature: 'a business where too many real decisions still wait for the same one or two people',
    headline: 'Get the decision *out of your hands*.',
    fitLine: 'You came in as The Sole Hand: a business that can see the move, but still waits for the same person to make it real.',
    closeLine: 'The Sole Hand changes the day one repeat call no longer needs you in the room.'
  },
  'c-co': {
    name: 'The Patchwork Crew',
    signature: 'a crew stitching the picture together by hand before the work can begin',
    headline: 'One picture. *Then* the work starts.',
    fitLine: 'You came in as The Patchwork Crew: capable people rebuilding the picture before they can decide what to do.',
    closeLine: 'The Patchwork Crew changes the day one question has one agreed answer.'
  },
  't-vi': {
    name: 'The Blind Sprinter',
    signature: 'a business with real pace, running faster than the evidence underneath it',
    headline: 'Run fast. On numbers you *trust*.',
    fitLine: 'You came in as The Blind Sprinter: momentum is real, but the business is moving faster than its evidence.',
    closeLine: 'The Blind Sprinter changes the day it can prove which growth deserves more speed.'
  },
  't-ve': {
    name: 'The Late Caller',
    signature: 'a business that reads the play correctly and acts a beat late',
    headline: 'Make {brandName} stop *calling it late*.',
    fitLine: 'You came in as The Late Caller: a business that reads the play and arrives after the whistle.',
    closeLine: 'The Late Caller wins the day it stops calling things late.'
  },
  't-co': {
    name: 'The Splitting Pack',
    signature: 'a fast-moving business whose teams are pulling in different directions',
    headline: 'Point the whole team *one way*.',
    fitLine: 'You came in as The Splitting Pack: speed is real, but the work is starting to split by team, tool and definition.',
    closeLine: 'The Splitting Pack changes the day teams stop solving the same problem twice.'
  },
  's-vi': {
    name: 'The Flagship on Faith',
    signature: 'a large operation with a clear direction and numbers that still require belief',
    headline: 'Back the conviction with *numbers*.',
    fitLine: 'You came in as The Flagship on Faith: direction is clear, but the evidence underneath still asks for belief.',
    closeLine: 'The Flagship on Faith changes the day conviction is backed by numbers the room can defend.'
  },
  's-ve': {
    name: 'The Lagging Tanker',
    signature: 'a large business with power and mandate, turning slower than the market allows',
    headline: 'Turn the ship before the *market* does.',
    fitLine: 'You came in as The Lagging Tanker: the direction is right, the power is real but the turn is still too slow.',
    closeLine: 'The Lagging Tanker changes the day strong evidence stops waiting for permission.'
  },
  's-co': {
    name: 'The Scattered Fleet',
    signature: 'a large business where functions are powered up but sailing different charts',
    headline: 'One chart for the *whole fleet*.',
    fitLine: 'You came in as The Scattered Fleet: each function has motion, but the business does not yet have one shared chart.',
    closeLine: 'The Scattered Fleet changes the day the AI work connects instead of duplicating.'
  }
};

// Plain-language meaning for each pillar, shown on the shape card so the terms
// (especially Coherence) are immediately legible to a time-poor CEO.
export const PILLAR_PLAIN = {
  Visibility: 'What you can see.',
  Velocity: 'How fast you act on it.',
  Coherence: 'Whether your teams see one picture.',
  Leverage: 'How far AI reaches into real calls.'
};

// Where strong peer operators tend to sit. Rendered as a benchmark marker
// beside each respondent bar so the gap, not the absolute score, is the message.
export const BENCHMARK = { Visibility: 88, Velocity: 84, Coherence: 86, Leverage: 82 };
export const BENCHMARK_LABEL = 'Strong peer mark';

export const PILLAR_COPY = {
  Visibility: {
    strong: 'The business has enough signal to move.',
    weak: 'The room still has to defend the number before it can act.'
  },
  Velocity: {
    strong: 'Signal can still turn into action while it matters.',
    weak: 'The wait starts after the signal appears.'
  },
  Coherence: {
    strong: 'Teams are close to one picture.',
    weak: 'Teams can each be right and still create drag.'
  },
  Leverage: {
    strong: 'AI already reaches meaningful work. Now the decisions underneath need to hold.',
    weak: 'AI is present, but it still sits outside the calls that decide outcomes.'
  }
};

export const HURDLE_COPY = {
  Visibility: {
    hurdleCard: {
      lede: "You have the numbers. You can't *trust* them.",
      body: 'Every growth call stands on a number. Yours still has to be defended before it can move the week.',
      close: 'First leak: Visibility'
    },
    reframe: {
      lede: 'Here is what is actually happening. It is not just a data problem.',
      body: [
        'You do not need more numbers. Your team is not short of dashboards and your tools are not the whole issue.',
        'You have a delay built into the picture itself. The business waits for numbers to be cleaned, reconciled and believed before it can move. By the time the picture is safe enough to use, the decision has already cooled.',
        'You are not running without data. You are running from data that arrives too late to change the week. That wiring is fixable.'
      ]
    },
    surfaceVsEmbedded: [
      'Here is what fixing it does not mean.',
      'Not another reporting layer. Not a prettier dashboard. Not a summary of numbers nobody trusts. Those sit beside the problem. They make a blurry business produce blur faster.',
      'What good looks like for you is evidence wired into the week itself: the number that matters is defined, trusted and already tied to the decision it is allowed to change.'
    ],
    firstMove: [
      'You do not need to clean the whole business to feel it move. You need one number.',
      'Your answer gave us the clue: "{quote}"',
      'Now choose the number behind that answer. Ask three questions. Who owns it? What decision can it change? What would make the room stop trusting it?',
      'You will find the weakness quickly. Fix one number that runs the week. That is the whole first move.'
    ],
    artefact: 'map which numbers actually deserve to run your week',
    closeClause: 'the business keeps steering from a picture it cannot fully defend'
  },
  Velocity: {
    hurdleCard: {
      lede: 'You see the move. You make it *too late*.',
      body: 'The value is not in seeing it. The value is in moving while the window is still open.',
      close: 'First leak: Velocity'
    },
    reframe: {
      lede: 'Here is what is actually happening. It is not what you think.',
      body: [
        'You do not have a speed problem. Your team is not lazy and your tools are not broken.',
        'You have a delay that is built in. Every report, dashboard and Monday meeting was designed to tell you what already happened. By the time a signal becomes a slide becomes a decision, the week it belonged to is gone.',
        'You are not running the business in real time. You are running last month\'s business this month and calling it strategy. That delay is not a flaw in your team. It is a flaw in the wiring. Wiring is fixable.'
      ]
    },
    surfaceVsEmbedded: [
      'Here is what fixing it does not mean.',
      'Not another dashboard. Not a faster meeting. Not another tool that writes up the same late decision. Those sit beside the problem. They make delay look more productive.',
      'What good looks like for you is intelligence wired into the week itself: the signal flags when it matters, with the decision already framed, to the person who owns it.'
    ],
    firstMove: [
      'You do not need to fix all of this to feel it move. You need one decision path.',
      'Your answer gave us the clue: "{quote}"',
      'Now choose one recurring decision where that delay shows up. Map it once. Where does the signal start? Where does it wait? Who finally calls it?',
      'You will find the lost days. They are almost never in the analysis. They are in the handoffs around it. Close one. That is the whole first move.'
    ],
    artefact: 'map the one decision path that keeps missing its window',
    closeClause: 'good evidence keeps arriving after its useful window has closed'
  },
  Coherence: {
    hurdleCard: {
      lede: "Your teams are sharp. They don't share *one picture*.",
      body: 'Each team can be right. The business still pays for the split before the work starts.',
      close: 'First leak: Coherence'
    },
    reframe: {
      lede: 'Here is what is actually happening. It is not just a collaboration problem.',
      body: [
        'Your teams are not the problem. They may each be doing disciplined work from the picture they have.',
        'You have a delay built into the joins. Finance waits for Digital to reconcile. Operations waits for Finance to define the number. AI pilots wait for someone to say which source counts. By the time the business agrees, the moment has moved.',
        'You are not short of effort. You are short of one picture that is ready before people enter the room. That wiring is fixable.'
      ]
    },
    surfaceVsEmbedded: [
      'Here is what fixing it does not mean.',
      'Not another alignment meeting. Not another shared folder. Not more AI pilots in different teams. Those sit beside the split. They let separate work look like progress.',
      'What good looks like for you is one decision, one source and one owner wired into the week before teams start acting from different pictures.'
    ],
    firstMove: [
      'You do not need to align the whole business to feel it move. You need one cross-team decision.',
      'Your answer gave us the clue: "{quote}"',
      'Now choose the recurring decision where that split shows up. Write down the one source, the one definition and the one person who decides when the numbers disagree.',
      'You will find the split quickly. Close one. That is the whole first move.'
    ],
    artefact: 'find the one decision where your teams are working from different pictures',
    closeClause: 'teams keep moving from pictures that do not quite agree'
  }
};

export const BUCKET_COPY = {
  Clarity: {
    wideningGap: [
      'And it is getting more expensive.',
      'At this stage, the businesses that get the basics right build advantage quietly. The ones that do not keep needing the same senior people, the same manual fixes and the same explanations.',
      'Every month the gap stays open, the operating habit gets harder to change. This is still fixable, but it is cheaper to fix before the business grows around it.'
    ]
  },
  Traction: {
    wideningGap: [
      'And it is getting more expensive.',
      'You are at the stage where momentum decides everything. The businesses around you are starting to pull ahead or starting to stall. The deciding factor is not who has the best idea. It is who closes the gap between seeing and acting fastest.',
      'Every month that gap stays open, a competitor with worse instincts and a faster operating rhythm pulls in front. Not because they are sharper. Because they are sooner. This is the window where that becomes permanent.'
    ]
  },
  Scale: {
    wideningGap: [
      'And it is getting more expensive.',
      'Once the business is this large, the gap is no longer local. It slows capital choices, customer decisions and confidence in what should scale.',
      'Every month the gap stays open, the business pays twice. First in missed windows, then in the extra governance needed to explain why the windows were missed.'
    ]
  }
};

export const COST_SCENES = {
  Visibility_Clarity: [
    'Picture a real week.',
    'A channel looks strong on Monday. By Wednesday, someone asks whether the growth is profitable. The answer takes three people and four tabs to assemble. Five days pass before the business knows whether the number can be trusted.',
    'For a smaller team, five days is not a reporting delay. It is five days where the founder is back in the work, judging by feel.',
    'Run that across a quarter. The cost is not the spreadsheet. It is the number of times leadership has to steer by estimate.'
  ],
  Visibility_Traction: [
    'Picture a real month.',
    'Growth looks strong in one channel. Spend follows it. Only later does the team learn that payback was rougher than the top line suggested. Three weeks have passed before the business knows which growth was worth buying.',
    'For a business with momentum, three weeks is enough to scale the wrong pattern.',
    'Run that across a year of campaigns. The cost is not bad data. It is good money following evidence that was not ready.'
  ],
  Visibility_Scale: [
    'Picture a real quarter.',
    'The room agrees on the direction, then spends the next two meetings testing whether the numbers underneath it are solid. Six weeks pass before confidence catches up with conviction.',
    'For a scaled business, six weeks is not a data issue. It is a quarter leadership was counting on.',
    'Run that across a planning cycle. The cost is leadership belief doing work that evidence should have done already.'
  ],
  Velocity_Clarity: [
    'Picture a real week.',
    'A decision is obvious by Tuesday. It waits for the founder on Thursday. It moves the following Monday. Seven days. The signal was free. The seven days were not.',
    'For a small business, a week of delay usually becomes another week where the same person has to be in the room.',
    'Run that across a quarter. The cost is not slow process. It is senior attention being spent twice.'
  ],
  Velocity_Traction: [
    'Picture a real week.',
    'A channel softens on a Tuesday. Your numbers show it by Thursday. It reaches the meeting the following Wednesday. The decision lands the Monday after that. Eleven days. The signal was free. The eleven days were not.',
    'For a business with your momentum, a decision eleven days late is not late by eleven days. It is late by a whole growth cycle.',
    'Run that across a year of weeks. That is the real cost. It never shows up as a line item.'
  ],
  Velocity_Scale: [
    'Picture a real quarter.',
    'The evidence is clear in week two. It becomes a deck in week four, a steering conversation in week six and a decision in week eight. Six weeks. Nobody was idle. The wiring was slow.',
    'For a scaled business, six weeks is enough for margin, inventory or customer behaviour to move on without you.',
    'Run that across a year. The cost is not one late decision. It is a business learning slower than the market.'
  ],
  Coherence_Clarity: [
    'Picture a real meeting.',
    'Finance brings one number. Digital brings another. Nobody is wrong, but twenty minutes go into working out which number the room is allowed to use. The decision is pushed to Friday.',
    'For a small team, that is not alignment work. It is the week being spent before the work starts.',
    'Run that across a quarter. The cost is not disagreement. It is every important question becoming a rebuild.'
  ],
  Coherence_Traction: [
    'Picture a real month.',
    'Three teams spot the same opportunity. Each builds its own version, with its own tool and its own definition of success. Four weeks later, the overlap appears in a post-mortem.',
    'For a business with momentum, four weeks is long enough for separate progress to become expensive confusion.',
    'Run that across a year of pilots. The cost is not lack of energy. It is energy that does not add up.'
  ],
  Coherence_Scale: [
    'Picture a real quarter.',
    'Each function has its own AI work, its own owner and its own risk logic. The work looks productive until dependencies collide. Eight weeks pass before the centre can see what connects, overlaps or should stop.',
    'For a scaled business, eight weeks is not coordination noise. It is fragmentation growing faster than the value of the AI itself.',
    'Run that across the AI work. The cost is a fleet under power, sailing different charts.'
  ]
};

export const COST_HERO = {
  Visibility: {
    Clarity: 'Five days a week, steering by *guess*.',
    Traction: "Good money, chasing numbers you *can't trust*.",
    Scale: 'A whole quarter, waiting for proof to *catch up*.'
  },
  Velocity: {
    Clarity: 'The same call, made twice, a *week apart*.',
    Traction: 'Every good move, *eleven days* late.',
    Scale: 'The market turns. You turn *six weeks* later.'
  },
  Coherence: {
    Clarity: 'Every week starts by *rebuilding the picture*.',
    Traction: 'Three teams, three answers, one *missed window*.',
    Scale: 'A fleet under power, sailing *different charts*.'
  }
};

export const COST_COMPOUND = {
  Clarity: 'The habit is still small enough to change before the business grows around it.',
  Traction: 'Momentum turns the leak into missed margin before it shows as a line item.',
  Scale: 'At this size, the cost moves through confidence, capital and margin.'
};

export const COST_BILL = {
  Visibility_Clarity: {
    metric: 'Five days',
    line: 'before the number can be trusted.'
  },
  Visibility_Traction: {
    metric: 'Three weeks',
    line: 'before payback catches spend.'
  },
  Visibility_Scale: {
    metric: 'Six weeks',
    line: 'before proof catches conviction.'
  },
  Velocity_Clarity: {
    metric: 'Seven days',
    line: 'between signal and action.'
  },
  Velocity_Traction: {
    metric: 'Eleven days',
    line: 'between signal and action.'
  },
  Velocity_Scale: {
    metric: 'Six weeks',
    line: 'between evidence and decision.'
  },
  Coherence_Clarity: {
    metric: 'One meeting',
    line: 'spent rebuilding the picture.'
  },
  Coherence_Traction: {
    metric: 'Four weeks',
    line: 'before overlap appears.'
  },
  Coherence_Scale: {
    metric: 'Eight weeks',
    line: 'before the centre sees the split.'
  }
};

export const MOVE_BODY = {
  Visibility: 'Bring the number the room still has to defend. Our CEO maps its source, owner, trust rule and the decision it can change this week.',
  Velocity: 'Bring the late decision. Our CEO maps the signal, first wait, owner, deadline and the rule that releases it before the window closes.',
  Coherence: 'Bring the decision teams split around. Our CEO maps the source, definition, owner and the tie-break rule before the next meeting starts.'
};

export const QUOTE_SOWHAT = {
  Visibility: 'The pattern is not more data. It is trust: source, owner and decision.',
  Velocity: 'The pattern is not effort. It is the wait between signal and action.',
  Coherence: 'The pattern is not team quality. It is three teams carrying three pictures.'
};

export const MONDAY_FORWARD = 'That is the session: one decision path, written before another week leaks.';
export const SESSION_OFFER = 'Thirty minutes with our CEO. Not a pitch. Bring the decision this reveal found. Leave with the first rule to fix it.';

export const ANSWER_OPTIONS = {
  Q2: [
    'Customer economics, payback, P&L by channel and what keeps working across channels.',
    'Channel, region and store/eCommerce splits. No view of what keeps working across channels.',
    'Top-line only. Sales, traffic, sell-through, spend.',
    'Revenue and scattered figures. No clear picture.'
  ],
  Q3: [
    'Precise payback by channel, region and customer type, used weekly.',
    'A rough estimate. Not precise enough to act on.',
    'We track ROAS or CAC, not actual payback.',
    'We do not track this or cannot answer it.'
  ],
  Q4: [
    'Almost always. Forecasts hold inside a tight band.',
    'Most quarters. Some drift, no surprises.',
    'Mixed. We re-baseline mid-quarter to keep it credible.',
    'Often off. Reality and the plan diverge mid-quarter.'
  ],
  Q5: [
    'It finds us quickly. Anomalies arrive with context and clear recommendations.',
    'Routine lands clean. Surprises arrive later but the analysis is always high quality.',
    'The team pulls most of it. Reports land somewhat on time but thin on recommendation.',
    'Nothing lands unless we ask. What lands is light on insight and lighter on recommendation.'
  ],
  Q6: [
    'Early. We recognise the pattern before it shows in the numbers.',
    'In time. We catch most patterns before the opportunity window closes.',
    'Late. We name the pattern after the impact has already landed.',
    'Not at all. Every repeat feels like the first time.'
  ],
  Q7: [
    'A few days for both strategy and operations.',
    'One to two weeks. The signal deserved faster.',
    'Slowly. Analysis takes longer than the opportunity window allows.',
    'Very slowly. Even obvious signals sit for weeks before action starts.'
  ],
  Q8: [
    'Reliably. Open questions get closed inside the week.',
    'Usually. Bigger calls land with analytics behind them. Smaller ones occasionally slip.',
    'Inconsistently. Analytics support is patchy, so decisions stall in threads and reschedules.',
    'Rarely. Most outcomes are decided by drift, with no analytics in the room.'
  ],
  Q9: [
    "The routine holds. Pressure doesn't break it.",
    'Mostly holds. One meeting slips, the rest still run.',
    'The routine breaks first. The week turns reactive.',
    'There is no routine to break. Every week starts cold.'
  ],
  Q10: [
    'Never. One source, aligned definitions, one story.',
    'Very rarely. Small discrepancies from data quality, not method.',
    'Often. Different sources, different definitions, recurring disagreement in the room.',
    'Always. Two separate pictures of the business, reconciled by hand.'
  ],
  Q11: [
    'One. Cross-domain data is fully integrated and in-house teams can read it fluently.',
    'Two or three. Data flows cleanly between them and the team knows where to look.',
    'Three or more. Manual stitching every time or skilled people on fragmented data.',
    'Three or more. Every question becomes a project. Tools or talent, one side is missing.'
  ],
  Q12: [
    'The full knowledge base. Processes and expertise live in shared systems.',
    'Core processes documented. Nuances live with specific people.',
    'Mostly tribal. Docs exist but are stale or untrusted.',
    "In people's heads. When someone leaves, the knowledge leaves."
  ],
  Q13: [
    "Rarely. Teams see each other's calls early and can plan accordingly.",
    'Sometimes. One person usually connects the dots.',
    'Often. Conflicts surface weeks or months later in post-mortem.',
    'Constantly. Everyone is right in their lane. The P&L suffers for it.'
  ]
};

export const QUESTION_STEMS = {
  Q2: 'Weekly performance pack',
  Q3: 'Customer payback precision',
  Q4: 'Forecast vs reality',
  Q5: 'Operational signal to leadership',
  Q6: 'Repeat-pattern recognition',
  Q7: 'Signal-to-action speed',
  Q8: 'Decision closure',
  Q9: 'Operating routine under pressure',
  Q10: 'One number across Finance and Digital',
  Q11: 'Cost of answering performance questions',
  Q12: 'Knowledge capture',
  Q13: 'Cross-team decision conflict'
};

export const RECEIPT_PROOFS = {
  Q2: 'Whether leadership has a decision-grade commercial picture.',
  Q3: 'Whether growth can be judged by payback, not proxy metrics.',
  Q4: 'Whether planning confidence survives contact with the week.',
  Q5: 'Whether signal reaches leadership early enough to change action.',
  Q6: 'Whether the business learns from repeat patterns before impact.',
  Q7: 'Whether clear evidence can move before its window closes.',
  Q8: 'Whether decisions have a path, not just a conversation.',
  Q9: 'Whether operating rhythm survives pressure.',
  Q10: 'Whether teams enter the room with one source of truth.',
  Q11: 'How much labour is spent before the answer can be used.',
  Q12: 'Whether the business depends on system memory or individual memory.',
  Q13: 'Whether teams can act separately without creating hidden drag.'
};

export const MULTI_COPY = {
  SP: [
    'Siloed data across systems and teams',
    'Reporting and analytics maturity is thin',
    'No clear AI strategy or roadmap',
    'AI fluency is missing at the leadership level',
    'AI fluency is missing at the operational level',
    'Technical debt and legacy systems',
    'Data quality is uneven and trust is low',
    'Change management and team adoption are unresolved',
    'Budget is the constraint',
    'The business case is not yet clear',
    'Regulatory, compliance or brand risk concerns',
    'None of the above. We are not blocked, we are moving.'
  ]
};

export const SAFE_TO_QUOTE = {
  Q2: [0, 1, 2],
  Q3: [0, 1, 2],
  Q4: [0, 1, 2, 3],
  Q5: [0, 1, 2],
  Q6: [0, 1, 2, 3],
  Q7: [0, 1, 2, 3],
  Q8: [0, 1, 2, 3],
  Q9: [0, 1, 2, 3],
  Q10: [0, 1, 2],
  Q11: [0, 1, 2],
  Q12: [0, 1, 2],
  Q13: [0, 1, 2]
};

export const CARD6_IMPLICATIONS = {
  Q2: 'You selected that about the numbers leadership uses. It means the business is still deciding from a picture that needs work.',
  Q3: 'You selected that about payback. It means growth may be moving faster than the proof underneath it.',
  Q4: 'You selected that about forecasting. It means the plan and the week are not staying close enough.',
  Q5: 'You selected that about signal reaching leadership. It means insight still has to be pulled, not received.',
  Q6: 'You selected that about repeat patterns. It means the business is still paying for lessons it has already seen.',
  Q7: 'You selected that about your own business. Read it once more. It means the work is good and it is finished after it mattered.',
  Q8: 'You selected that about decisions. It means the decision is not missing because nobody cares. It is missing because the path is weak.',
  Q9: 'You selected that about the week under pressure. It means the routine works until the business needs it most.',
  Q10: 'You selected that about Finance and Digital. It means the meeting starts before the business agrees what it is looking at.',
  Q11: 'You selected that about performance questions. It means the answer still costs too much work before anyone can act.',
  Q12: 'You selected that about knowledge. It means the business still depends on memory where it needs a system.',
  Q13: 'You selected that about teams working against each other. It means the cost of disagreement arrives after the decision has already moved.'
};

export const RECEIPT_IMPLICATIONS = {
  Q2_0: 'Your weekly pack can show customer economics and channel P&L. That is a real strength.',
  Q2_1: 'Your weekly pack shows the splits, but not yet what deserves more money.',
  Q2_2: 'Top-line reporting can make movement look clearer than it is.',
  Q2_3: 'Revenue and scattered figures are present, but not yet a picture leadership can run.',
  Q3_0: 'Payback is precise enough to use weekly.',
  Q3_1: 'Payback is still a rough estimate, so action is carrying guesswork.',
  Q3_2: 'Ad return and acquisition cost can hide whether the customer ever pays back.',
  Q3_3: 'If payback is not tracked, growth decisions are being made without the number that should govern them.',
  Q4_0: 'Forecasts holding inside a tight band give the business a stable read.',
  Q4_1: 'Some forecast drift is manageable, but it still asks the team to translate reality back into the plan.',
  Q4_2: 'Re-baselining mid-quarter means the business keeps renegotiating reality.',
  Q4_3: 'When plan and reality diverge mid-quarter, leadership is steering from a moving picture.',
  Q5_0: 'Anomalies arriving with context and recommendations is a real operating advantage.',
  Q5_1: 'Routine reporting lands cleanly, but surprises still arrive after the useful moment.',
  Q5_2: 'When the team has to pull the signal, leadership is already waiting.',
  Q5_3: 'When nothing lands unless leadership asks, the business is running without a live feed.',
  Q6_0: 'The team can recognise patterns before they show in the numbers.',
  Q6_1: 'The team catches most patterns in time, but the window is already narrowing.',
  Q6_2: 'Naming the pattern after impact lands means the business keeps paying for old lessons.',
  Q6_3: 'When every repeat feels new, the business cannot learn from its own experience.',
  Q7_0: 'A clear signal can become action in days.',
  Q7_1: 'One to two weeks is enough for a clear signal to lose value.',
  Q7_2: 'A clear signal takes longer to act on than the opportunity stays open.',
  Q7_3: 'Even obvious signals sit long enough to become yesterday\'s opportunity.',
  Q8_0: 'Open questions can close inside the week.',
  Q8_1: 'Big calls usually land, but smaller calls still leak through the week.',
  Q8_2: 'Decisions stall in threads and reschedules when the analytics are not quite there.',
  Q8_3: 'When outcomes are decided by drift, the business has accepted delay as process.',
  Q9_0: 'The routine holds when the week gets pressured.',
  Q9_1: 'The routine mostly holds, though pressure can still move the week around.',
  Q9_2: 'When the week gets pressured, the routine is the first thing to break.',
  Q9_3: 'If every week starts cold, the business has no rhythm for turning signal into action.',
  Q10_0: 'Finance and Digital share one source and one story.',
  Q10_1: 'Small discrepancies are contained, not structural.',
  Q10_2: 'Different sources and definitions mean the room has to reconcile before it can decide.',
  Q10_3: 'Two separate pictures mean the meeting starts with repair work.',
  Q11_0: 'One integrated source can answer performance questions.',
  Q11_1: 'The team knows where to look, even if the picture still crosses tools.',
  Q11_2: 'Manual stitching turns every performance question into hidden labour.',
  Q11_3: 'When every question becomes a project, decision speed is being spent before the decision starts.',
  Q12_0: 'Processes and expertise live in shared systems.',
  Q12_1: 'Core process is documented, but the nuance still depends on specific people.',
  Q12_2: 'Stale or untrusted documentation means the real system is still tribal.',
  Q12_3: 'When knowledge leaves with people, the business cannot reliably repeat what it knows.',
  Q13_0: 'Teams see each other\'s calls early enough to plan around them.',
  Q13_1: 'One person still has to connect the dots across teams.',
  Q13_2: 'Conflicts surfacing in post-mortem means teams learn about the split after it has cost them.',
  Q13_3: 'When everyone is right in their lane, the P&L can still lose.'
};

export const SP_TO_HURDLE = {
  0: 'Coherence',
  1: 'Visibility',
  2: null,
  3: null,
  4: 'Velocity',
  5: 'Coherence',
  6: 'Visibility',
  7: 'Velocity',
  8: null,
  9: null,
  10: 'Coherence',
  11: null
};

export const SP_GAP_COPY = {
  // Convergent bodies open on the harder question; the lede and calibration rows
  // already cover "you named it", so restating it here read as an echo.
  convergent: {
    Visibility: 'The harder question is not whether you can see the problem. It is what the unclear picture is already costing.',
    Velocity: 'The harder question is not whether you can see the delay. It is what the delay is already costing.',
    Coherence: 'The harder question is not whether teams disagree. It is what the disagreement is already costing.'
  },
  fallback: {
    Visibility: 'That blocker is real, but it is not where the earliest cost shows up. Your answers point to Visibility: the numbers are not yet strong enough to carry the decisions being asked of them.',
    Velocity: 'That blocker is real, but it is not where the earliest cost shows up. Your answers point to Velocity: the business is slow between seeing and acting.',
    Coherence: 'That blocker is real, but it is not where the earliest cost shows up. Your answers point to Coherence: teams are not yet working from one picture.'
  },
  none: {
    Visibility: 'That does not mean the business is stuck. It means the first drag is hiding underneath the numbers leadership already uses. If those numbers are unclear, every stronger AI move inherits that uncertainty.',
    Velocity: 'That does not mean the business is stuck. It means the first drag is hiding in the path from signal to action. If useful evidence waits too long, stronger AI only helps the business notice the delay faster.',
    Coherence: 'That does not mean the business is stuck. It means the first drag is hiding between teams, tools and definitions. If the picture splits before the decision, stronger AI can make the split move faster.'
  }
};
