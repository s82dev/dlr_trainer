/* Englisch-Bank: alle Inhalte selbst formuliert. [Begriff/Satz, richtige Antwort, Distraktoren …, Stufe 1–3] */
(function () {
  'use strict';
  const DLR = window.DLR;

  const VOCAB = [ // [Wort, Bedeutung (englisch), Stufe]
    ['begin', 'to start', 1], ['huge', 'extremely large', 1], ['rapid', 'very fast', 1], ['weary', 'very tired', 1], ['fragile', 'easily broken', 1], ['tiny', 'extremely small', 1], ['route', 'the way taken from one place to another', 1], ['delay', 'to make something happen later than planned', 1],
    ['reliable', 'able to be trusted to work well', 2], ['reduce', 'to make smaller in amount', 2], ['obtain', 'to get something', 2], ['essential', 'absolutely necessary', 2], ['prevent', 'to stop something from happening', 2], ['ensure', 'to make certain that something happens', 2], ['gradually', 'slowly, in small steps', 2], ['reluctant', 'not willing to do something', 2], ['vital', 'extremely important for survival or success', 2], ['assume', 'to accept something as true without proof', 2], ['maintain', 'to keep something in good condition', 2], ['approximately', 'about, not exactly', 2],
    ['alleviate', 'to make a problem less severe', 3], ['imminent', 'about to happen very soon', 3], ['ambiguous', 'having more than one possible meaning', 3], ['mitigate', 'to reduce the seriousness of something', 3], ['compliance', 'the act of following a rule or request', 3], ['deteriorate', 'to become worse over time', 3], ['redundant', 'no longer needed because a spare exists', 3], ['scrutinize', 'to examine very carefully', 3], ['comprehensive', 'covering all or nearly all aspects', 3], ['negligible', 'so small that it can be ignored', 3], ['abrupt', 'sudden and unexpected', 3], ['pertinent', 'directly relevant to the matter', 3], ['dismiss', 'to decide that something is not worth considering', 3], ['sustain', 'to keep something going over a period', 3], ['hazardous', 'involving risk of harm or danger', 3],
  ];
  const AVIATION = [ // [Begriff, Definition, Stufe]
    ['runway', 'a strip of ground where aircraft take off and land', 1], ['apron', 'the area where aircraft park, board and refuel', 1], ['taxiway', 'a path that connects runways with parking areas', 1], ['cockpit', 'the compartment where the pilots sit', 1], ['fuselage', 'the main body of an aircraft', 1], ['throttle', 'the lever that controls engine power', 1], ['altitude', 'height above mean sea level', 1], ['landing gear', 'the wheels and struts that support an aircraft on the ground', 1],
    ['headwind', 'wind blowing against the direction of flight', 2], ['tailwind', 'wind blowing in the direction of flight', 2], ['crosswind', 'wind blowing across the runway or flight path', 2], ['aileron', 'a wing surface that makes the aircraft roll', 2], ['rudder', 'a tail surface used to yaw the aircraft', 2], ['flap', 'a movable wing surface that increases lift at low speed', 2], ['turbulence', 'irregular air movement that makes an aircraft shake', 2], ['clearance', 'official permission given by air traffic control', 2], ['go-around', 'an aborted landing followed by a climb', 2], ['threshold', 'the beginning of the usable part of a runway', 2], ['approach', 'the final descent phase towards the runway', 2],
    ['holding pattern', 'a racetrack-shaped path flown while waiting for clearance', 3], ['stall', 'a loss of lift caused by an excessive angle of attack', 3], ['glide path', 'the vertical descent path followed during an approach', 3], ['transponder', 'a device that sends an identification code to radar', 3], ['ceiling', 'the height of the lowest broken or overcast cloud layer', 3], ['alternate airport', 'an airport chosen in case landing at the destination is not possible', 3], ['squawk', 'to set a specific code on the transponder', 3], ['MAYDAY', 'the international radio call for grave and imminent danger', 3], ['PAN-PAN', 'the radio call for an urgent situation that is not yet life-threatening', 3], ['payload', 'the load an aircraft carries besides its fuel and crew', 3], ['ground speed', 'the speed of an aircraft relative to the ground', 3],
  ];
  const GRAMMAR = [ // [Satz mit ___, richtig, f1, f2, f3, Stufe, Regel]
    ['She ___ to the airport every morning.', 'goes', 'go', 'going', 'gone', 1, 'Third person singular takes -s.'],
    ['They ___ dinner when the phone rang.', 'were having', 'have', 'had had', 'are having', 2, 'Past continuous for an interrupted action.'],
    ['If it rains tomorrow, we ___ at home.', 'will stay', 'would stay', 'stayed', 'stay', 2, 'First conditional: if + present, will + verb.'],
    ['If I ___ more time, I would learn Spanish.', 'had', 'have', 'will have', 'would have', 2, 'Second conditional: if + past, would + verb.'],
    ['The report ___ by the team last week.', 'was finished', 'is finished', 'has finished', 'finished', 2, 'Passive voice in the past simple.'],
    ['He has worked here ___ 2019.', 'since', 'for', 'from', 'during', 2, 'Since + starting point.'],
    ['We have lived here ___ ten years.', 'for', 'since', 'from', 'during', 1, 'For + duration.'],
    ['She is interested ___ aviation.', 'in', 'on', 'at', 'for', 1, 'Interested in.'],
    ['I look forward ___ hearing from you.', 'to', 'for', 'at', 'on', 2, 'Look forward to + -ing.'],
    ['He suggested ___ the flight until Monday.', 'postponing', 'to postpone', 'postpone', 'postponed', 3, 'Suggest + -ing.'],
    ['By the time we arrived, the plane ___.', 'had already left', 'already left', 'has already left', 'was already leaving', 3, 'Past perfect: earlier past action.'],
    ['You ___ wear a seat belt during take-off. It is compulsory.', 'must', 'might', 'can', 'would', 2, 'Must expresses obligation.'],
    ['You ___ bring your passport; a valid ID card is enough.', "don't have to", "must not", "cannot", "should not", 3, "Don't have to = no obligation."],
    ['She asked me where ___.', 'I was going', 'was I going', 'am I going', 'I am going', 3, 'Indirect question: normal word order.'],
    ['There isn’t ___ fuel left.', 'much', 'many', 'a few', 'several', 1, 'Much with uncountable nouns.'],
    ['How ___ passengers are on board?', 'many', 'much', 'few', 'little', 1, 'Many with countable nouns.'],
    ['This is the ___ runway I have ever seen.', 'longest', 'longer', 'most long', 'more long', 2, 'Superlative of a short adjective.'],
    ['The weather is getting ___ every hour.', 'worse', 'bad', 'badder', 'worst', 2, 'Comparative: worse.'],
    ['I wish I ___ how to fly a helicopter.', 'knew', 'know', 'would know', 'had known', 3, 'Wish + past for present unreal situations.'],
    ['Not until the engine stopped ___ the noise.', 'did we notice', 'we noticed', 'we did notice', 'noticed we', 3, 'Inversion after negative adverbials.'],
    ['He denied ___ the mistake.', 'making', 'to make', 'make', 'made', 3, 'Deny + -ing.'],
    ['We ___ the meeting by the time you arrive.', 'will have finished', 'will finish', 'have finished', 'finished', 3, 'Future perfect.'],
    ['The pilot, ___ has 5,000 flight hours, will lead the check.', 'who', 'which', 'whom', 'whose', 2, 'Who for people.'],
    ['Please ___ me know as soon as you land.', 'let', 'make', 'get', 'have to', 1, 'Let someone know.'],
    ['The plane took off ___ schedule.', 'on', 'at', 'in', 'by', 2, 'On schedule.'],
    ['She apologized ___ being late.', 'for', 'of', 'to', 'with', 2, 'Apologize for.'],
    ['It’s the first time I ___ in a simulator.', 'have flown', 'flew', 'fly', 'am flying', 3, 'Present perfect after “the first time”.'],
    ['Would you mind ___ the window?', 'closing', 'to close', 'close', 'closed', 2, 'Would you mind + -ing.'],
    ['He is used to ___ early.', 'getting up', 'get up', 'got up', 'getting', 3, 'Be used to + -ing.'],
  ];
  const CLOZE = [ // Text mit {1}, {2}; blanks = [[richtig, f1, f2, f3], …], Stufe
    { t: 1, text: 'Before every flight, the crew checks the weather along the route. If the forecast {1} bad, they may choose a different path or wait until conditions {2}.', blanks: [['looks', 'look', 'is looking at', 'looked at'], ['improve', 'improving', 'improved', 'to improve']] },
    { t: 2, text: 'The new simulator was designed {1} pilots practise rare emergencies safely. It {2} very realistic, which makes training more effective.', blanks: [['to help', 'helping', 'helps', 'for help'], ['feels', 'is feeling', 'feel', 'felt like']] },
    { t: 2, text: 'Air traffic controllers must stay {1} at all times. A single {2} can have serious consequences.', blanks: [['alert', 'alertly', 'alertness', 'alerted'], ['mistake', 'mistaken', 'mistook', 'mistaking']] },
    { t: 3, text: 'Although the airline had to cancel several flights, it managed to {1} the impact on passengers. Rebooking {2} within two hours for most travellers.', blanks: [['minimise', 'maximise', 'ignore', 'duplicate'], ['was completed', 'has completing', 'completes', 'were completing']] },
    { t: 3, text: 'A pilot should never {1} a warning light, even if similar alerts turned out to be {2} in the past.', blanks: [['dismiss', 'consider', 'acquire', 'obtain'], ['harmless', 'harmful', 'harmony', 'harming']] },
    { t: 1, text: 'The airport is {1} the city centre. Many passengers take the train because it is {2} than the bus.', blanks: [['near', 'nearly', 'nearby of', 'closely'], ['faster', 'fastest', 'more fast', 'fast']] },
    { t: 2, text: 'Fuel planning requires careful calculation. Pilots always carry more fuel than the flight strictly {1}, {2} unexpected delays can occur.', blanks: [['requires', 'require', 'requiring', 'required for'], ['because', 'although', 'unless', 'so that not']] },
    { t: 3, text: 'The committee {1} the accident report thoroughly before it {2} its recommendations.', blanks: [['scrutinised', 'skipped', 'scribbled', 'scored'], ['published', 'was publishing', 'has publish', 'publishing']] },
  ];
  const READING = [ // Text + Fragen [[Frage, richtig, f1, f2, f3], …]
    { t: 1, text: 'Maria has worked as a flight attendant for six years. She enjoys meeting people from different countries, but she finds the irregular schedule tiring. Next month she will start a training course to become a purser.', qs: [['What does Maria find tiring?', 'The irregular schedule', 'Meeting people', 'The training course', 'Travelling by train'], ['What will Maria do next month?', 'Start a training course', 'Change her job', 'Move to another country', 'Take a holiday']] },
    { t: 2, text: 'Modern aircraft engines are much quieter than those of thirty years ago. Engineers have redesigned the fan blades and the shape of the air intake to reduce noise. Even so, residents near airports still complain, mostly about noise during the night.', qs: [['How did engineers reduce engine noise?', 'By redesigning fan blades and the air intake', 'By flying only during the day', 'By using smaller aircraft', 'By closing airports at night'], ['What do residents mostly complain about?', 'Night-time noise', 'Air pollution', 'Ticket prices', 'Traffic jams']] },
    { t: 2, text: 'When a thunderstorm blocks the planned route, pilots and controllers work together to find an alternative. The decision depends on fuel reserves, the size of the storm and the traffic in nearby airspace. Sometimes the safest option is simply to hold until the storm has moved on.', qs: [['What does the decision NOT depend on according to the text?', 'The colour of the aircraft', 'Fuel reserves', 'The size of the storm', 'Nearby traffic'], ['What is sometimes the safest option?', 'Holding until the storm passes', 'Flying through the storm', 'Landing immediately anywhere', 'Reducing the fuel load']] },
    { t: 3, text: 'Although automation has made flying safer, experts warn that pilots may lose manual flying skills if they rely on autopilots too much. For this reason, many airlines now encourage crews to hand-fly parts of the flight whenever conditions are safe. Critics argue that such policies increase workload, whereas supporters believe they keep skills sharp.', qs: [['Why do experts warn about automation?', 'Pilots may lose manual flying skills.', 'Autopilots are unsafe.', 'Aircraft have become too slow.', 'Pilots earn less money.'], ['What do critics say about hand-flying policies?', 'They increase workload.', 'They reduce safety.', 'They are illegal.', 'They save fuel.']] },
    { t: 3, text: 'The captain briefed the crew before departure: a fuel truck was delayed, so boarding would begin ten minutes late. Nevertheless, the airline expected to depart on time, because a faster taxi route had been approved by the tower. The first officer was asked to monitor the departure time closely.', qs: [['Why did the airline still expect an on-time departure?', 'A faster taxi route had been approved.', 'Fewer passengers were on board.', 'The fuel truck had arrived early.', 'The flight was shortened.'], ['Who was asked to monitor the departure time?', 'The first officer', 'The captain', 'The tower', 'The fuel truck driver']] },
    { t: 1, text: 'Tom is learning to fly. On Saturdays he goes to a small airfield near his home. His instructor is very patient and always explains every step before Tom tries it himself.', qs: [['When does Tom go to the airfield?', 'On Saturdays', 'Every day', 'Only in summer', 'On Sundays'], ['What does the instructor do before Tom tries something?', 'Explains every step', 'Leaves the airfield', 'Flies alone', 'Takes photos']] },
  ];

  // Wortliste für Funkphraseologie
  const CS_LETTERS = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India', 'Kilo', 'Lima', 'Mike', 'Oscar', 'Papa', 'Romeo', 'Sierra', 'Tango', 'Victor', 'Whiskey', 'Yankee', 'Zulu'];
  const FACILITIES = ['Munich Tower', 'Frankfurt Approach', 'Berlin Radar', 'Vienna Director', 'Zurich Ground', 'Hamburg Arrival'];

  DLR.data.englishBank = { VOCAB, AVIATION, GRAMMAR, CLOZE, READING, CS_LETTERS, FACILITIES };
})();
