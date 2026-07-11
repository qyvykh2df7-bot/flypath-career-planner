import type { ChallengeStep, Drill, ExerciseContent, Transmission } from "./content";

const THOUSAND_WORDS: Record<number, string> = {
  1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six",
  7: "seven", 8: "eight", 9: "nine", 10: "ten", 11: "eleven", 12: "twelve", 13: "thirteen",
};

/**
 * Converts a round-thousand or thousand-plus-500 altitude value (e.g. 2000, 3500)
 * to its grouped spoken form ("two thousand", "three thousand five hundred").
 * Returns null for values outside this shape — voice matching then relies on
 * digit-by-digit normalization instead.
 */
function altitudeSpokenForm(feet: number): string | null {
  const thousands = Math.floor(feet / 1000);
  const hundreds = feet % 1000;
  if (!THOUSAND_WORDS[thousands] || (hundreds !== 0 && hundreds !== 500)) return null;
  return hundreds === 500 ? `${THOUSAND_WORDS[thousands]} thousand five hundred` : `${THOUSAND_WORDS[thousands]} thousand`;
}

/** Accepted readback variants for isolated Numbers practice — no callsign. */
function withNumberVariants(expected: string): string[] {
  const variants = new Set<string>([expected]);
  const fl = expected.match(/^(Climb|Descend|Maintain) FL(\d+)$/);
  if (fl) {
    variants.add(`${fl[1]} flight level ${fl[2]}`);
  }
  const alt = expected.match(/^(Climb to|Descend to|Maintain) (\d+) feet$/);
  if (alt) {
    const spoken = altitudeSpokenForm(parseInt(alt[2], 10));
    if (spoken) variants.add(`${alt[1]} ${spoken} feet`);
  }
  return [...variants];
}

function nr(atc: string, expected: string, feedback: string): Drill {
  return { atc, expected, feedback, acceptedVariants: withNumberVariants(expected) };
}

function ns(instruction: string, atc: string, expected: string): ChallengeStep {
  return { kind: "readback", instruction, atc, expected, acceptedVariants: withNumberVariants(expected) };
}

function s(x: string) {
  return x.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
const step = (mod: string, topic: string, title: string) => `${mod}.${s(topic)}.${s(title)}`;
const drill = (mod: string, group: string, k: number) => `${mod}.${s(group)}.drill-${k}`;
const flat = (mod: string, type: string, title: string) => `${mod}.${type}.${s(title)}`;

const u = (prompt: string, expected: string): Transmission => ({ speaker: "user", prompt, expected });
const a = (text: string): Transmission => ({ speaker: "atc", text });

export const CADET_BANK: Record<string, ExerciseContent> = {};
const B = CADET_BANK;

const RF = "radio-fundamentals";

// Full ICAO spelling alphabet (letter, word). Shared by ICAO Alphabet topic drills.
const ICAO_LETTERS: ReadonlyArray<readonly [string, string]> = [
  ["A", "Alfa"], ["B", "Bravo"], ["C", "Charlie"], ["D", "Delta"], ["E", "Echo"],
  ["F", "Foxtrot"], ["G", "Golf"], ["H", "Hotel"], ["I", "India"], ["J", "Juliett"],
  ["K", "Kilo"], ["L", "Lima"], ["M", "Mike"], ["N", "November"], ["O", "Oscar"],
  ["P", "Papa"], ["Q", "Quebec"], ["R", "Romeo"], ["S", "Sierra"], ["T", "Tango"],
  ["U", "Uniform"], ["V", "Victor"], ["W", "Whiskey"], ["X", "X-ray"], ["Y", "Yankee"],
  ["Z", "Zulu"],
];

// Build a 4-option letter-identification drill for a given ICAO word.
function letterDrill(index: number): Drill {
  const [letter, word] = ICAO_LETTERS[index];
  const options = [ICAO_LETTERS[(index + 1) % 26][0], ICAO_LETTERS[(index + 7) % 26][0], ICAO_LETTERS[(index + 13) % 26][0]];
  options.splice(index % 4, 0, letter); // rotate the correct answer's position
  return { atc: word, options, correct: letter, feedback: `Correct. ${word} represents the letter ${letter}.` };
}

/* ---- ICAO Alphabet ---- */
B[step(RF, "ICAO Alphabet", "Learn the Alphabet")] = {
  interactive: "alphabet",
  lessonBody:
    "Pilots use standard spelling words to avoid confusion on the radio. Instead of saying \"A\", pilots say \"Alfa\". Tap any letter to hear it and see its pronunciation.",
  examples: ["A = Alfa", "B = Bravo", "C = Charlie", "D = Delta", "E = Echo"],
  buttonLabel: "Continue to listening",
};
B[step(RF, "ICAO Alphabet", "Listen and Identify Letters")] = {
  instruction: "Listen to the ICAO word and select the correct letter.",
  drills: ICAO_LETTERS.map((_, i) => letterDrill(i)),
};
B[step(RF, "ICAO Alphabet", "Repeat Letters by Voice")] = {
  instruction: "Recall and say the ICAO word for each letter.",
  drills: ICAO_LETTERS.map(([letter, word]) => ({ cue: letter, prompt: word, expected: word, feedback: `Good. Clear and steady - ${word} for ${letter}.` })),
};
B[step(RF, "ICAO Alphabet", "Decode Callsigns")] = {
  instruction: "Listen to a callsign spelled with ICAO words and select the correct callsign.",
  drills: [
    { atc: "Echo Charlie Alfa Bravo Charlie", options: ["EC-ABC", "EC-ACB", "EA-ABC", "EC-BCA"], correct: "EC-ABC", feedback: "Echo Charlie Alfa Bravo Charlie = EC-ABC." },
    { atc: "Golf Alfa Bravo Charlie Delta", options: ["G-ABCD", "G-ACBD", "GA-BCD", "G-ABDC"], correct: "G-ABCD", feedback: "Golf Alfa Bravo Charlie Delta = G-ABCD." },
    { atc: "Delta Echo Foxtrot Golf Alfa", options: ["D-EFGA", "D-EFAG", "D-FEGA", "D-EGFA"], correct: "D-EFGA", feedback: "Delta Echo Foxtrot Golf Alfa = D-EFGA." },
    { atc: "November One Two Tree Alfa Bravo", options: ["N123AB", "N132AB", "N123BA", "N213AB"], correct: "N123AB", feedback: "November One Two Tree Alfa Bravo = N123AB." },
    { atc: "Foxtrot Golf Kilo Lima Mike", options: ["F-GKLM", "F-GLKM", "F-KGLM", "F-GKML"], correct: "F-GKLM", feedback: "Foxtrot Golf Kilo Lima Mike = F-GKLM." },
    { atc: "Echo India Delta Uniform Bravo", options: ["EI-DUB", "EI-DBU", "EI-UDB", "IE-DUB"], correct: "EI-DUB", feedback: "Echo India Delta Uniform Bravo = EI-DUB." },
    { atc: "Echo Charlie Mike Alfa Delta", options: ["EC-MAD", "EC-MDA", "EC-AMD", "EA-MAD"], correct: "EC-MAD", feedback: "Echo Charlie Mike Alfa Delta = EC-MAD." },
  ],
};
B[step(RF, "ICAO Alphabet", "Spell a Callsign")] = {
  instruction: "Spell the displayed callsign using ICAO words.",
  drills: [
    {
      display: "EC-ABC",
      expected: "Echo Charlie Alfa Bravo Charlie",
      feedback: "Correct structure. Keep a steady rhythm.",
      acceptedVariants: ["echo charlie alpha bravo charlie"],
    },
    {
      display: "G-ABCD",
      expected: "Golf Alfa Bravo Charlie Delta",
      feedback: "Good spelling sequence.",
      acceptedVariants: ["golf alpha bravo charlie delta"],
    },
    {
      display: "D-EFGA",
      expected: "Delta Echo Foxtrot Golf Alfa",
      feedback: "Good. Each letter is clear.",
      acceptedVariants: ["delta echo foxtrot golf alpha"],
    },
    {
      display: "N123AB",
      expected: "November One Two Tree Alfa Bravo",
      feedback: "Numbers and letters are in the correct order.",
      acceptedVariants: ["november one two tree alpha bravo", "november 1 2 3 alfa bravo", "november 1 2 3 alpha bravo"],
    },
    {
      display: "F-GKLM",
      expected: "Foxtrot Golf Kilo Lima Mike",
      feedback: "Good. Steady, separated letters.",
      acceptedVariants: [],
    },
    {
      display: "EI-DUB",
      expected: "Echo India Delta Uniform Bravo",
      feedback: "Good steady spelling.",
      acceptedVariants: [],
    },
    {
      display: "EC-MAD",
      expected: "Echo Charlie Mike Alfa Delta",
      feedback: "Good. Clear and readable.",
      acceptedVariants: ["echo charlie mike alpha delta"],
    },
  ],
};
B[step(RF, "ICAO Alphabet", "Mini Radio Challenge")] = {
  instruction: "Complete a short mixed ICAO challenge.",
  challengeSteps: [
    { kind: "listening", instruction: "Select the letter you heard.", atc: "Delta", options: ["D", "B", "E", "T"], correct: "D", feedback: "Delta = D." },
    { kind: "listening", instruction: "Select the letter you heard.", atc: "Whiskey", options: ["W", "V", "U", "M"], correct: "W", feedback: "Whiskey = W." },
    { kind: "listening", instruction: "Identify the callsign.", atc: "Echo Charlie Alfa Bravo Charlie", options: ["EC-ABC", "EC-ACB", "EA-ABC", "EC-BCA"], correct: "EC-ABC", feedback: "Echo Charlie Alfa Bravo Charlie = EC-ABC." },
    { kind: "listening", instruction: "Identify the callsign.", atc: "Echo India Delta Uniform Bravo", options: ["EI-DUB", "EI-DBU", "EI-UDB", "IE-DUB"], correct: "EI-DUB", feedback: "Echo India Delta Uniform Bravo = EI-DUB." },
    { kind: "speaking", instruction: "Spell the callsign using ICAO words.", display: "EC-MAD", expected: "Echo Charlie Mike Alfa Delta", feedback: "Good spelling sequence." },
    { kind: "speaking", instruction: "Say the callsign again clearly.", display: "EC-MAD", expected: "Echo Charlie Mike Alfa Delta", feedback: "Good. Keep a steady pace." },
  ],
};

/* ---- Numbers ---- */
B[step(RF, "Numbers", "Basic Numbers")] = {
  interactive: "numbers",
  lessonBody:
    "On the radio, numbers are spoken digit by digit so they are never confused. Three is said \"tree\", five is said \"fife\" and nine is said \"niner\". Tap a number to hear it and see how it is pronounced.",
  examples: ["3 = tree", "5 = fife", "9 = niner", "090 = zero niner zero"],
  buttonLabel: "Continue to headings",
};
B[step(RF, "Numbers", "Headings")] = {
  intro: {
    text: "Headings are spoken as three digits, one digit at a time.",
    rule: "Always say all three digits. Use zero at the start when needed.",
    cards: [
      { value: "090", spoken: "zero niner zero", pronunciation: "ZE-ro NIN-er ZE-ro" },
      { value: "270", spoken: "two seven zero", pronunciation: "TOO SEV-en ZE-ro" },
    ],
  },
  instruction: "Listen to the heading and select the correct value. Headings are always spoken as three digits.",
  drills: [
    { atc: "Turn heading zero niner zero", options: ["090", "190", "009", "900"], correct: "090", feedback: "Headings are spoken digit by digit as three digits: zero niner zero." },
    { atc: "Turn heading one eight zero", options: ["180", "108", "018", "280"], correct: "180", feedback: "One eight zero - a southerly heading, spoken as three digits." },
    { atc: "Turn heading two seven zero", options: ["270", "207", "720", "170"], correct: "270", feedback: "Two seven zero - heading west, spoken as three digits." },
    { atc: "Turn heading tree six zero", options: ["360", "306", "063", "260"], correct: "360", feedback: "Three six zero - due north, spoken as three digits." },
    { atc: "Turn heading zero tree zero", options: ["030", "300", "003", "130"], correct: "030", feedback: "Zero three zero - note the leading zero is always spoken." },
    { atc: "Turn heading one fife zero", options: ["150", "105", "510", "115"], correct: "150", feedback: "One five zero - spoken digit by digit." },
    { atc: "Turn heading two two zero", options: ["220", "202", "022", "200"], correct: "220", feedback: "Two two zero - repeated digits are still spoken individually." },
    { atc: "Turn heading tree one zero", options: ["310", "301", "130", "311"], correct: "310", feedback: "Three one zero - spoken as three digits." },
    { atc: "Turn heading zero six zero", options: ["060", "600", "006", "160"], correct: "060", feedback: "Zero six zero - the leading zero is always spoken." },
    { atc: "Turn heading two four zero", options: ["240", "204", "420", "140"], correct: "240", feedback: "Two four zero - spoken digit by digit." },
  ],
};
B[step(RF, "Numbers", "Altitudes")] = {
  intro: {
    text: "Altitudes are spoken in feet. Whole thousands are normally spoken using the number of thousands followed by \"thousand\".",
    rule: "ICAO training standard: for 10,000 ft and above, pronounce the thousands as digits before \"thousand\". In real-world ops, grouped forms like \"ten thousand\" may also be heard.",
    cards: [
      { value: "2000 ft", spoken: "two thousand feet", pronunciation: "TOO TOU-sand feet" },
      { value: "3500 ft", spoken: "tree thousand fife hundred feet", pronunciation: "TREE TOU-sand FIFE HUN-dred feet" },
      { value: "13000 ft", spoken: "one tree thousand feet", pronunciation: "WUN TREE TOU-sand feet" },
    ],
    note: "Common real-world variant: thirteen thousand feet",
  },
  instruction: "Listen to the altitude instruction and read it back clearly.",
  drills: [
    nr("Climb to two thousand feet",          "Climb to 2000 feet",         "Round thousands are spoken as a whole number: two thousand."),
    nr("Descend to three thousand five hundred feet", "Descend to 3500 feet", "Read back the full altitude including five hundred."),
    nr("Maintain four thousand feet",         "Maintain 4000 feet",        "Confirm the level by reading back the altitude."),
    nr("Climb to six thousand feet",          "Climb to 6000 feet",        "Six thousand spoken as a whole number."),
    nr("Descend to one thousand five hundred feet", "Descend to 1500 feet",   "One thousand five hundred - read it back in full."),
    nr("Climb to five thousand feet",         "Climb to 5000 feet",        "Five thousand spoken as a whole number."),
    nr("Maintain two thousand five hundred feet", "Maintain 2500 feet",    "Include the five hundred in your readback."),
    nr("Descend to three thousand feet",      "Descend to 3000 feet",      "Three thousand spoken as a whole number."),
    nr("Climb to four thousand five hundred feet", "Climb to 4500 feet",    "Read back the full altitude including five hundred."),
    nr("Maintain five thousand five hundred feet", "Maintain 5500 feet",   "Five thousand five hundred - read it back in full."),
  ],
};
B[step(RF, "Numbers", "Flight Levels")] = {
  intro: {
    text: "A flight level is spoken as \"flight level\" followed by the digits.",
    rule: "ICAO standard: read the digits after FL. Do not say \"hundred\" for FL100 / FL200 in the ICAO training standard.",
    cards: [
      { value: "FL100", spoken: "flight level one zero zero", pronunciation: "flight level WUN ZE-ro ZE-ro" },
      { value: "FL200", spoken: "flight level two zero zero", pronunciation: "flight level TOO ZE-ro ZE-ro" },
      { value: "FL120", spoken: "flight level one two zero", pronunciation: "flight level WUN TOO ZE-ro" },
    ],
    note: "UK variation: you may hear \"flight level one hundred / two hundred\"; AeroComms uses the ICAO standard.",
  },
  instruction: "Listen to the flight level instruction and read it back. Flight levels are spoken digit by digit.",
  drills: [
    nr("Climb flight level seven zero",    "Climb FL70",    "FL70 is spoken seven zero, digit by digit."),
    nr("Descend flight level one two zero", "Descend FL120", "FL120 is spoken one two zero."),
    nr("Maintain flight level eight zero",  "Maintain FL80", "FL80 is spoken eight zero."),
    nr("Climb flight level one fife zero",  "Climb FL150",  "FL150 is spoken one five zero."),
    nr("Climb flight level one zero zero",  "Climb FL100",   "FL100 is spoken one zero zero, not one hundred."),
    nr("Descend flight level niner zero",   "Descend FL90", "FL90 - nine is spoken niner."),
    nr("Maintain flight level one one zero", "Maintain FL110", "FL110 is spoken one one zero."),
    nr("Climb flight level two zero zero",  "Climb FL200",  "FL200 is spoken two zero zero."),
    nr("Climb flight level one tree zero",  "Climb FL130",   "FL130 is spoken one three zero."),
    nr("Maintain flight level one four zero", "Maintain FL140", "FL140 is spoken one four zero."),
  ],
};
B[step(RF, "Numbers", "Squawks")] = {
  intro: {
    text: "Squawk codes are read digit by digit.",
    rule: "Never group squawk codes into hundreds or thousands.",
    cards: [
      { value: "4215", spoken: "four two one fife", pronunciation: "FOW-er TOO WUN FIFE" },
      { value: "7000", spoken: "seven zero zero zero", pronunciation: "SEV-en ZE-ro ZE-ro ZE-ro" },
    ],
  },
  instruction: "Listen to the squawk code and read it back digit by digit.",
  drills: [
    nr("Squawk four two one fife",  "Squawk 4215",   "Squawk codes are always read digit by digit."),
    nr("Squawk seven zero zero zero", "Squawk 7000",  "Each zero is spoken separately."),
    nr("Squawk two tree fife six",  "Squawk 2356",  "Read each digit individually."),
    nr("Squawk one zero zero one",  "Squawk 1001",  "One zero zero one - digit by digit."),
    nr("Squawk tree six four two",  "Squawk 3642",   "Read each digit individually."),
    nr("Squawk fife fife two one",  "Squawk 5521",  "Five is spoken fife - read each digit separately."),
    nr("Squawk zero two zero zero", "Squawk 0200",  "Leading and repeated zeros are all spoken."),
    nr("Squawk six one four tree",  "Squawk 6143",  "Read each digit individually."),
    nr("Squawk four six two seven", "Squawk 4627",   "Read each digit individually."),
    nr("Squawk one two tree four",  "Squawk 1234",  "One two three four - digit by digit."),
  ],
};
B[step(RF, "Numbers", "Times")] = {
  intro: {
    text: "Aviation time uses the 24-hour clock. Full time is spoken digit by digit, but when the hour is obvious, only the minutes may be transmitted.",
    rule: "Use full four-digit time when clarity matters. If the hour is understood, ATC may transmit only the minutes.",
    cards: [
      { value: "0915", spoken: "zero niner one fife", pronunciation: "ZE-ro NIN-er WUN FIFE", meaning: "full time" },
      { value: "1415", spoken: "one four one fife", pronunciation: "WUN FOW-er WUN FIFE", meaning: "full time" },
      { value: "15", spoken: "one fife", pronunciation: "WUN FIFE", meaning: "minutes only when the hour is obvious" },
    ],
  },
  instruction: "Listen to the time and select the correct value. Times are spoken digit by digit.",
  drills: [
    { atc: "Time one two tree zero", options: ["1230", "1320", "2130", "1203"], correct: "1230", feedback: "One two three zero = 1230 (half past twelve)." },
    { atc: "Time zero eight four fife", options: ["0845", "0854", "1845", "0840"], correct: "0845", feedback: "Zero eight four five = 0845. The leading zero is spoken." },
    { atc: "Expect departure one fife one zero", options: ["1510", "1150", "5110", "1501"], correct: "1510", feedback: "One five one zero = 1510." },
    { atc: "Report at two zero zero zero", options: ["2000", "0200", "2200", "2020"], correct: "2000", feedback: "Two zero zero zero = 2000." },
    { atc: "Time zero seven one fife", options: ["0715", "0751", "1715", "0705"], correct: "0715", feedback: "Zero seven one five = 0715." },
    { atc: "Time one niner four fife", options: ["1945", "1954", "0945", "1940"], correct: "1945", feedback: "One niner four five = 1945. Nine is spoken niner." },
    { atc: "Expect approach one one tree zero", options: ["1130", "1310", "1113", "1103"], correct: "1130", feedback: "One one three zero = 1130." },
    { atc: "Report at zero six zero zero", options: ["0600", "0060", "6000", "0606"], correct: "0600", feedback: "Zero six zero zero = 0600." },
    { atc: "Time one four tree zero", options: ["1430", "1340", "1043", "1403"], correct: "1430", feedback: "One four three zero = 1430." },
    { atc: "Report at zero niner tree zero", options: ["0930", "0903", "0390", "9030"], correct: "0930", feedback: "Zero niner three zero = 0930. Nine is spoken niner." },
  ],
};
B[step(RF, "Numbers", "Say the Number")] = {
  instruction: "Say the displayed value in aviation format.",
  drills: [
    { cue: "090", expected: "zero niner zero",                  feedback: "Good. Headings are three digits: zero niner zero.",        acceptedVariants: ["zero nine zero"] },
    { cue: "180", expected: "one eight zero",                   feedback: "Good. One eight zero." },
    { cue: "270", expected: "two seven zero",                   feedback: "Good. Two seven zero." },
    { cue: "360", expected: "tree six zero",                    feedback: "Three six zero. Three is spoken tree in aviation.",        acceptedVariants: ["three six zero"] },
    { cue: "030", expected: "zero tree zero",                   feedback: "Leading zeros are always spoken: zero tree zero.",         acceptedVariants: ["zero three zero"] },
    { cue: "FL120", expected: "flight level one two zero",      feedback: "Good. Flight levels are spoken digit by digit.",           acceptedVariants: ["flight level 120"] },
    { cue: "FL80",  expected: "flight level eight zero",        feedback: "Good. FL80 is spoken eight zero.",                         acceptedVariants: ["flight level 80"] },
    { cue: "2000",  expected: "two thousand feet",              feedback: "Good. Round thousands are grouped: two thousand feet.",    acceptedVariants: ["two thousand"] },
    { cue: "3500",  expected: "tree thousand fife hundred feet", feedback: "Three thousand five hundred feet.",                      acceptedVariants: ["three thousand five hundred feet", "three thousand five hundred"] },
    { cue: "7700",  expected: "seven seven zero zero",          feedback: "Good. Squawk codes are digit by digit: seven seven zero zero.", acceptedVariants: ["seven thousand seven hundred"] },
  ],
};
B[step(RF, "Numbers", "Mini Challenge")] = {
  instruction: "Complete mixed number recognition and readback.",
  challengeSteps: [
    { kind: "listening", instruction: "Identify the heading.", atc: "Turn heading two seven zero", options: ["270", "207", "720", "170"], correct: "270", feedback: "Headings are spoken as three digits: two seven zero." },
    ns("Read back the altitude.",    "Climb to three thousand feet",      "Climb to 3000 feet"),
    ns("Read back the squawk.",       "Squawk four two one fife",          "Squawk 4215"),
    { kind: "listening", instruction: "Identify the time.", atc: "Time one two tree zero", options: ["1230", "1320", "2130", "1203"], correct: "1230", feedback: "One two three zero = 1230." },
    ns("Read back the flight level.", "Climb flight level one two zero",   "Climb FL120"),
  ],
};

/* ---- Callsigns ---- */
B[step(RF, "Callsigns", "Callsign Basics")] = {
  lessonBody:
    "A callsign tells ATC who is transmitting. It can be an airline callsign, such as Iberia 325, or an aircraft registration, such as EC-ABC.",
};
B[step(RF, "Callsigns", "Airline Callsigns")] = {
  instruction: "Listen to the airline callsign and select what you heard.",
  drills: [
    { atc: "Iberia tree two fife", options: ["Iberia 325", "Iberia 352", "Iberia 235", "Iberia 523"], correct: "Iberia 325" },
    { atc: "Ryanair four six seven", options: ["Ryanair 467", "Ryanair 476", "Ryanair 647", "Ryanair 764"], correct: "Ryanair 467" },
    { atc: "Vueling two one eight", options: ["Vueling 218", "Vueling 281", "Vueling 128", "Vueling 812"], correct: "Vueling 218" },
    { atc: "Speedbird one zero two", options: ["Speedbird 102", "Speedbird 120", "Speedbird 012", "Speedbird 201"], correct: "Speedbird 102" },
    { atc: "Air France seven four tree", options: ["Air France 743", "Air France 734", "Air France 473", "Air France 740"], correct: "Air France 743" },
    { atc: "Lufthansa fife fife one", options: ["Lufthansa 551", "Lufthansa 515", "Lufthansa 155", "Lufthansa 550"], correct: "Lufthansa 551" },
  ],
};
B[step(RF, "Callsigns", "Aircraft Registrations")] = {
  instruction: "Listen to the registration callsign and select the correct registration.",
  drills: [
    { atc: "Echo Charlie Alfa Bravo Charlie", options: ["EC-ABC", "EC-ACB", "EA-ABC", "EC-BCA"], correct: "EC-ABC" },
    { atc: "Golf Alfa Bravo Charlie Delta", options: ["G-ABCD", "G-ACBD", "GA-BCD", "G-ABDC"], correct: "G-ABCD" },
    { atc: "November One Two Tree Alfa Bravo", options: ["N123AB", "N132AB", "N123BA", "N213AB"], correct: "N123AB" },
    { atc: "Echo Charlie Delta Lima Mike", options: ["EC-DLM", "EC-DML", "ED-CLM", "EC-LDM"], correct: "EC-DLM" },
  ],
};
B[step(RF, "Callsigns", "Callsign Structure Challenge")] = {
  instruction: "Complete the callsign challenge.",
  challengeSteps: [
    {
      kind: "listening",
      instruction: "Airline callsign or registration callsign?",
      situation: "Iberia 325",
      options: ["Airline callsign", "Registration callsign"],
      correct: "Airline callsign",
      feedback: "Iberia 325 uses an airline callsign plus a flight number.",
    },
    {
      kind: "listening",
      instruction: "What did you hear?",
      atc: "Speedbird one zero two",
      options: ["Speedbird 102", "Speedbird 120", "Speedbird 012", "Speedbird 201"],
      correct: "Speedbird 102",
      feedback: "One zero two = 102. Speedbird is the British Airways callsign.",
    },
    {
      kind: "listening",
      instruction: "What registration did you hear?",
      atc: "Echo Charlie Alfa Bravo Charlie",
      options: ["EC-ABC", "EC-ACB", "EA-ABC", "EC-BAC"],
      correct: "EC-ABC",
      feedback: "Echo Charlie Alfa Bravo Charlie = EC-ABC.",
    },
    {
      kind: "listening",
      instruction: "Which full callsign is correct for airline Iberia, flight 325?",
      situation: "Airline: Iberia · Flight: 325",
      options: ["Iberia 325", "Iberia 352", "IBE 325", "EC-325"],
      correct: "Iberia 325",
      feedback: "Airline callsigns combine the airline name and the flight number.",
    },
    {
      kind: "listening",
      instruction: "What type of callsign is being used?",
      situation: "\"Iberia 325, standby\"",
      options: ["Airline callsign", "Registration callsign"],
      correct: "Airline callsign",
      feedback: "Iberia 325 is an airline callsign used in a radio instruction.",
    },
  ],
};

/* ---- Frequencies ---- */
B[step(RF, "Frequencies", "Frequency Basics")] = {
  lessonBody: "Frequencies are used to move from one controller to another. They must be read back accurately.",
  examples: ["118.100 = one one eight decimal one", "121.700 = one two one decimal seven"],
};
B[step(RF, "Frequencies", "Visual Frequency Demo")] = {
  instruction: "Watch the digits light up as the frequency is spoken.",
  lessonBody: "Each frequency is read digit by digit, with the word decimal for the frequency separator.",
  examples: [
    "118.100 = one one eight decimal one",
    "121.700 = one two one decimal seven",
    "124.875 = one two four decimal eight seven fife",
    "130.450 = one tree zero decimal four fife zero",
  ],
  buttonLabel: "Continue to repeat",
};
B[step(RF, "Frequencies", "Listen and Repeat Frequencies")] = {
  instruction: "Say this frequency in aviation format.",
  drills: [
    { prompt: "118.100", expected: "one one eight decimal one",               acceptedVariants: ["one one eight point one", "one one eight decimal one zero zero"] },
    { prompt: "121.700", expected: "one two one decimal seven",               acceptedVariants: ["one two one point seven", "one two one decimal seven zero zero"] },
    { prompt: "124.875", expected: "one two four decimal eight seven fife",   acceptedVariants: ["one two four decimal eight seven five", "one two four point eight seven five"] },
    { prompt: "130.450", expected: "one tree zero decimal four fife zero",    acceptedVariants: ["one three zero decimal four five zero", "one three zero point four five zero", "one tree zero decimal four five zero"] },
  ],
};
// Foundations-level frequency recognition only: isolated frequency, no callsign,
// no "contact"/"monitor", no full ATC instruction, no readback. The spoken phrase
// (atc) is played; the student selects the matching numeric frequency.
B[step(RF, "Frequencies", "Frequency Listening Challenge")] = {
  instruction: "Listen to the frequency and select the one you heard.",
  drills: [
    { atc: "one one eight decimal one",            options: ["118.100", "118.700", "119.100", "121.100"],  correct: "118.100", feedback: "one one eight decimal one = 118.100." },
    { atc: "one two one decimal seven",            options: ["121.700", "121.900", "122.700", "120.700"], correct: "121.700", feedback: "one two one decimal seven = 121.700." },
    { atc: "one two one decimal seven five zero",  options: ["121.750", "121.705", "127.150", "121.570"], correct: "121.750", feedback: "one two one decimal seven five zero = 121.750." },
    { atc: "one two two decimal niner eight five", options: ["122.985", "122.895", "129.285", "122.958"], correct: "122.985", feedback: "one two two decimal niner eight five = 122.985." },
    { atc: "one tree zero decimal four five zero", options: ["130.450", "134.050", "130.540", "103.450"], correct: "130.450", feedback: "one tree zero decimal four five zero = 130.450." },
    { atc: "one two four decimal eight seven fife", options: ["124.875", "124.785", "125.875", "124.857"], correct: "124.875", feedback: "one two four decimal eight seven fife = 124.875." },
  ],
};

/* ---- Basic Acknowledgements ---- */
// All four terms taught together on one lesson page. The session UI renders
// them as compact definition cards via the "acknowledgements" flag.
B[step(RF, "Basic Acknowledgements", "Basic Acknowledgements")] = {
  buttonLabel: "Continue to practice",
};
B[step(RF, "Basic Acknowledgements", "Acknowledgement Practice")] = {
  instruction: "Choose the correct acknowledgement for each situation.",
  challengeSteps: [
    { kind: "listening", instruction: "Which acknowledgement?", situation: "ATC gives you traffic information only, no action needed.", options: ["Roger", "Wilco", "Affirm", "Negative"], correct: "Roger", feedback: "Information received, no action needed: Roger." },
    { kind: "listening", instruction: "Which acknowledgement?", situation: "ATC instructs you to hold position and you will comply.", options: ["Wilco", "Roger", "Affirm", "Negative"], correct: "Wilco", feedback: "You understand and will comply: Wilco." },
    { kind: "listening", instruction: "Which acknowledgement?", situation: "ATC asks: are you ready for departure?", options: ["Affirm", "Negative", "Roger", "Wilco"], correct: "Affirm", feedback: "Yes, you are ready: Affirm." },
    { kind: "listening", instruction: "Which acknowledgement?", situation: "ATC asks: can you accept immediate departure? You cannot.", options: ["Negative", "Affirm", "Roger", "Wilco"], correct: "Negative", feedback: "No, you cannot: Negative." },
    { kind: "listening", instruction: "Which acknowledgement?", situation: "ATC says: report ready for startup.", options: ["Wilco", "Roger", "Affirm", "Negative"], correct: "Wilco", feedback: "You will comply: Wilco." },
    { kind: "listening", instruction: "Which acknowledgement?", situation: "ATC passes a weather advisory. No readback required.", options: ["Roger", "Wilco", "Affirm", "Negative"], correct: "Roger", feedback: "Advisory received, no action: Roger." },
    { kind: "listening", instruction: "Which acknowledgement?", situation: "ATC asks: do you have the field in sight?", options: ["Affirm", "Negative", "Roger", "Wilco"], correct: "Affirm", feedback: "Yes, field in sight: Affirm." },
    { kind: "listening", instruction: "Which acknowledgement?", situation: "ATC asks: are you ready to copy?", options: ["Affirm", "Roger", "Wilco", "Negative"], correct: "Affirm", feedback: "Yes, ready to copy: Affirm." },
    { kind: "listening", instruction: "Which acknowledgement?", situation: "ATC asks: can you maintain VFR? You cannot.", options: ["Negative", "Affirm", "Wilco", "Roger"], correct: "Negative", feedback: "No, you cannot: Negative." },
    { kind: "listening", instruction: "Which acknowledgement?", situation: "ATC says: taxi to holding point Alfa One.", options: ["Wilco", "Roger", "Affirm", "Negative"], correct: "Wilco", feedback: "You understand and will comply: Wilco." },
    { kind: "listening", instruction: "Which acknowledgement?", situation: "ATC gives a complex clearance and asks you to standby. You echo it.", options: ["Standby", "Roger", "Wilco", "Unable"], correct: "Standby", feedback: "Standby: wait, ATC will come back to you." },
    { kind: "listening", instruction: "Which acknowledgement?", situation: "ATC asks you to report airborne. You need a moment before responding.", options: ["Standby", "Wilco", "Roger", "Affirm"], correct: "Standby", feedback: "Standby buys you a moment without going silent." },
    { kind: "listening", instruction: "Which acknowledgement?", situation: "ATC requests immediate takeoff but you are not ready and cannot comply.", options: ["Unable", "Negative", "Standby", "Roger"], correct: "Unable", feedback: "Unable: I cannot comply with that instruction." },
    { kind: "listening", instruction: "Which acknowledgement?", situation: "ATC asks if you can fly a specific route. It is outside your capability.", options: ["Unable", "Negative", "Wilco", "Standby"], correct: "Unable", feedback: "Unable means you cannot comply — more specific than Negative." },
  ],
};

/* ---- Clarification & Correction ---- */
// Teaches four beginner-friendly phrases: Say again, Confirm, Correction, Speak slower.
B[step(RF, "Clarification & Correction", "Clarification & Correction")] = {
  buttonLabel: "Continue to practice",
};
B[step(RF, "Clarification & Correction", "Say the Phrase")] = {
  instruction: "Say the correct clarification phrase for the situation.",
  drills: [
    {
      cue: "Missed the call",
      expected: "Say again.",
      feedback: "Good. Say again asks ATC to repeat the transmission.",
      acceptedVariants: ["say again please", "say again"],
    },
    {
      cue: "ATC too fast",
      expected: "Speak slower.",
      feedback: "Good. Speak slower asks ATC to reduce their pace.",
      acceptedVariants: ["speak more slowly", "speak slow"],
    },
    {
      cue: "Correct yourself",
      expected: "Correction.",
      feedback: "Say Correction to signal you are fixing what you just said.",
      acceptedVariants: ["correction"],
    },
    {
      cue: "Heard runway 27?",
      expected: "Confirm runway 27?",
      feedback: "Good. Confirm then repeat the specific item you want verified.",
      acceptedVariants: ["confirm runway 27", "confirm runway two seven"],
    },
  ],
};
B[step(RF, "Clarification & Correction", "Clarification Practice")] = {
  instruction: "Choose the correct clarification phrase for each situation.",
  challengeSteps: [
    // Say again — 3 steps
    { kind: "listening", instruction: "Which phrase?", situation: "ATC gave an instruction but you did not hear it.", options: ["Say again.", "Roger.", "Wilco.", "Negative."], correct: "Say again.", feedback: "Say again asks ATC to repeat the transmission." },
    { kind: "listening", instruction: "Which phrase?", situation: "Static on the radio made you miss the last call.", options: ["Say again.", "Affirm.", "Standby.", "Unable."], correct: "Say again.", feedback: "Say again is the standard request for repetition." },
    { kind: "listening", instruction: "Which phrase is correct?", situation: "Which phrase do you use to ask ATC to repeat something?", options: ["Say again.", "Correction.", "Speak slower.", "Confirm."], correct: "Say again.", feedback: "Say again: ask for the transmission to be repeated." },
    // Confirm — 2 steps
    { kind: "listening", instruction: "Which phrase?", situation: "ATC gave you frequency 121.805. You want to confirm it.", options: ["Confirm frequency 121.805?", "Say again.", "Roger.", "Wilco."], correct: "Confirm frequency 121.805?", feedback: "Confirm asks ATC to verify that specific information is correct." },
    { kind: "listening", instruction: "Which phrase?", situation: "ATC mentioned runway 27. You are not sure that is correct.", options: ["Confirm runway 27?", "Say again.", "Affirm.", "Negative."], correct: "Confirm runway 27?", feedback: "Confirm checks that the detail you heard is correct." },
    // Correction — 2 steps
    { kind: "listening", instruction: "Which phrase?", situation: "You said stand 24 but you are actually at stand 12.", options: ["Correction, stand 12.", "Say again.", "Negative.", "Unable."], correct: "Correction, stand 12.", feedback: "Correction signals you are fixing what you just said." },
    { kind: "listening", instruction: "Which phrase?", situation: "You read back the wrong squawk code.", options: ["Correction, squawk 4215.", "Say again squawk.", "Roger.", "Affirm."], correct: "Correction, squawk 4215.", feedback: "Correction: announce the error then say the correct value." },
    // Speak slower — 2 steps
    { kind: "listening", instruction: "Which phrase?", situation: "ATC is speaking very fast and you cannot keep up.", options: ["Speak slower.", "Say again.", "Affirm.", "Standby."], correct: "Speak slower.", feedback: "Speak slower politely asks ATC to reduce their speech rate." },
    { kind: "listening", instruction: "Which phrase?", situation: "You understand the words but the pace is too fast for you to write them down.", options: ["Speak slower.", "Confirm.", "Roger.", "Wilco."], correct: "Speak slower.", feedback: "Speak slower is always acceptable. It keeps communication safe." },
    // Mixed — 1 step
    { kind: "listening", instruction: "Mixed: choose the correct phrase.", situation: "ATC gives a clearance. You heard most of it but missed the frequency.", options: ["Say again frequency.", "Correction.", "Speak slower.", "Wilco."], correct: "Say again frequency.", feedback: "Be specific: ask only for what you missed." },
  ],
};

/* ================= FIRST CONTACT ================= */
const FC = "first-contact";

/* ---- The 4 Ws ----
 * One unified section that teaches the structure of a first radio call:
 * Who am I calling (station) + Who am I (callsign) + Where am I (position) +
 * What do I want (request). Callsigns/frequencies/radio checks are NOT re-taught
 * here - they live in Radio Fundamentals / Core Practice. */
// Single consolidated lesson for all four parts. Callsigns are NOT re-taught here.
// No examples array — the custom lesson template renders the 4 W rows directly.
B[step(FC, "The 4 Ws", "The 4 Ws")] = {
  lessonBody: "Every first call follows the same formula: Station + Callsign + Position + Request.",
  buttonLabel: "Practice",
};
// Build the Call — 10 rounds, options manually shuffled (never in the correct answer order).
B[step(FC, "The 4 Ws", "Build the Call")] = {
  instruction: "Tap the parts in the correct order: station, callsign, position, request.",
  drills: [
    { situation: "You are EC-ABC at stand 12 and need startup from Madrid Ground.", options: ["at stand 12", "request startup", "Madrid Ground", "EC-ABC"], expected: "Madrid Ground, EC-ABC, at stand 12, request startup" },
    { situation: "You are Iberia 325 at stand 8 and need clearance before departure.", options: ["at stand 8", "Madrid Delivery", "request clearance", "Iberia 325"], expected: "Madrid Delivery, Iberia 325, at stand 8, request clearance" },
    { situation: "You are EC-ABC at the apron and need taxi from Valencia Ground.", options: ["Valencia Ground", "request taxi", "EC-ABC", "at the apron"], expected: "Valencia Ground, EC-ABC, at the apron, request taxi" },
    { situation: "You are EC-ABC at holding point Alfa One, ready for departure at Barcelona Tower.", options: ["holding point Alfa One", "ready for departure", "Barcelona Tower", "EC-ABC"], expected: "Barcelona Tower, EC-ABC, holding point Alfa One, ready for departure" },
    { situation: "You are EC-ABC inbound from the north and need information from Valencia Information.", options: ["EC-ABC", "inbound from the north", "Valencia Information", "request information"], expected: "Valencia Information, EC-ABC, inbound from the north, request information" },
    { situation: "You are Iberia 325 descending towards the airport and calling Madrid Approach.", options: ["descending", "Madrid Approach", "request approach information", "Iberia 325"], expected: "Madrid Approach, Iberia 325, descending, request approach information" },
    { situation: "You are EC-ABC at stand C3 and need startup from Madrid Ground.", options: ["request startup", "EC-ABC", "at stand C3", "Madrid Ground"], expected: "Madrid Ground, EC-ABC, at stand C3, request startup" },
    { situation: "You are Ryanair 467 at holding point Bravo and ready for departure at Madrid Tower.", options: ["Madrid Tower", "holding point Bravo", "Ryanair 467", "ready for departure"], expected: "Madrid Tower, Ryanair 467, holding point Bravo, ready for departure" },
    { situation: "You are EC-ABC 5 miles final and need landing clearance from Madrid Tower.", options: ["5 miles final", "request landing", "EC-ABC", "Madrid Tower"], expected: "Madrid Tower, EC-ABC, 5 miles final, request landing" },
    { situation: "You are Iberia 325 at the apron and need taxi from Sevilla Ground.", options: ["request taxi", "Iberia 325", "Sevilla Ground", "at the apron"], expected: "Sevilla Ground, Iberia 325, at the apron, request taxi" },
  ],
};
B[step(FC, "The 4 Ws", "Speak the Call")] = {
  instruction: "Say the complete first call: station, callsign, position, request.",
  drills: [
    { situation: "You are EC-ABC at stand 12 and need startup from Madrid Ground.", expected: "Madrid Ground, EC-ABC, at stand 12, request startup." },
    { situation: "You are Iberia 325 at holding point Alfa One, ready for departure.", expected: "Madrid Tower, Iberia 325, holding point Alfa One, ready for departure." },
    { situation: "You are EC-ABC inbound from the north and need information.", expected: "Valencia Information, EC-ABC, inbound from the north, request information." },
    { situation: "You are Iberia 325 descending and need to call Madrid Approach.", expected: "Madrid Approach, Iberia 325, descending, request approach information." },
  ],
};

/* ---- Radio Check & Readability ---- */
B[step(FC, "Radio Check & Readability", "What is a Radio Check")] = {
  lessonBody:
    "A radio check is a short call used to check if the station can hear you clearly. ATC replies with a readability number: 1 unreadable · 2 readable now and then · 3 readable with difficulty · 4 readable · 5 loud and clear. In Cadet, focus on readability five.",
  examples: [
    "Madrid Ground, Iberia 325, radio check.",
    "Iberia 325, readability five.",
  ],
  buttonLabel: "Continue to practice",
};
B[step(FC, "Radio Check & Readability", "Identify a Radio Check")] = {
  instruction: "Choose the correct radio check call.",
  drills: [
    {
      situation: "Which of these is a correct radio check call?",
      options: ["Madrid Ground, Iberia 325, radio check.", "Iberia 325, radio check!", "Radio check, please.", "Ground, check radio."],
      correct: "Madrid Ground, Iberia 325, radio check.",
      feedback: "Station, callsign, then 'radio check'.",
    },
    {
      situation: "You want to check your radio with Barcelona Ground as EC-ABC. Which call is correct?",
      options: ["Barcelona Ground, EC-ABC, radio check.", "Radio check, Barcelona.", "EC-ABC radio check Barcelona.", "Barcelona, is my radio working?"],
      correct: "Barcelona Ground, EC-ABC, radio check.",
      feedback: "Station first, then callsign, then radio check.",
    },
    {
      situation: "Which is a correct radio check for Ryanair 467 calling Madrid Ground?",
      options: ["Madrid Ground, Ryanair 467, radio check.", "Ryanair 467, radio check, Ground.", "Madrid Ground, radio check, Ryanair 467.", "Radio check, Ryanair 467."],
      correct: "Madrid Ground, Ryanair 467, radio check.",
      feedback: "Station, callsign, then request.",
    },
  ],
};
B[step(FC, "Radio Check & Readability", "Build the Radio Check Call")] = {
  instruction: "Tap the parts in order to build the radio check call.",
  drills: [
    {
      situation: "Call Madrid Ground for a radio check as Iberia 325.",
      options: ["Madrid Ground", "Iberia 325", "radio check"],
      expected: "Madrid Ground, Iberia 325, radio check",
    },
    {
      situation: "Call Barcelona Ground for a radio check as EC-ABC.",
      options: ["EC-ABC", "Barcelona Ground", "radio check"],
      expected: "Barcelona Ground, EC-ABC, radio check",
    },
    {
      situation: "Call Valencia Ground for a radio check as Ryanair 467.",
      options: ["radio check", "Valencia Ground", "Ryanair 467"],
      expected: "Valencia Ground, Ryanair 467, radio check",
    },
    {
      situation: "Call Madrid Tower for a radio check as EC-ABC.",
      options: ["radio check", "EC-ABC", "Madrid Tower"],
      expected: "Madrid Tower, EC-ABC, radio check",
    },
  ],
};
B[step(FC, "Radio Check & Readability", "Readability Scale")] = {
  instruction: "Choose the correct answer about the readability scale.",
  drills: [
    {
      situation: "What does readability five mean?",
      options: ["Loud and clear.", "Readable with difficulty.", "Readable now and then.", "Unreadable."],
      correct: "Loud and clear.",
      feedback: "Readability five = loud and clear. It is the best result.",
    },
    {
      situation: "ATC replies 'Iberia 325, readability five.' What does this tell you?",
      options: ["Your transmission is loud and clear.", "ATC can barely hear you.", "Your radio has a problem.", "You need to say again."],
      correct: "Your transmission is loud and clear.",
      feedback: "Readability five is the highest number — your radio is working perfectly.",
    },
    {
      situation: "On the readability scale, which number means the best transmission quality?",
      options: ["Five", "Four", "One", "Three"],
      correct: "Five",
      feedback: "Five is the top of the scale: perfectly readable, loud and clear.",
    },
    {
      situation: "Which ATC reply format is correct after a radio check from Iberia 325?",
      options: ["Iberia 325, readability five.", "Readability five, Iberia 325.", "Good signal, Iberia 325.", "Roger, Iberia 325."],
      correct: "Iberia 325, readability five.",
      feedback: "Callsign first, then readability number.",
    },
  ],
};
B[step(FC, "Radio Check & Readability", "Ask for a Radio Check")] = {
  instruction: "Say the complete radio check call.",
  drills: [
    {
      situation: "You are Iberia 325, calling Madrid Ground. Ask for a radio check.",
      expected: "Madrid Ground, Iberia 325, radio check.",
      feedback: "Station, callsign, radio check.",
      acceptedVariants: ["madrid ground iberia 325 radio check", "madrid ground iberia three two five radio check"],
    },
    {
      situation: "You are EC-ABC, calling Barcelona Ground. Ask for a radio check.",
      expected: "Barcelona Ground, EC-ABC, radio check.",
      feedback: "Station first, then callsign.",
      acceptedVariants: ["barcelona ground ec abc radio check", "barcelona ground ec-abc radio check"],
    },
    {
      situation: "You are Ryanair 467, calling Valencia Ground. Ask for a radio check.",
      expected: "Valencia Ground, Ryanair 467, radio check.",
      feedback: "Same structure every time: station, callsign, radio check.",
      acceptedVariants: ["valencia ground ryanair 467 radio check", "valencia ground ryanair four six seven radio check"],
    },
    {
      situation: "You are Iberia 325, calling Madrid Tower. Ask for a radio check.",
      expected: "Madrid Tower, Iberia 325, radio check.",
      feedback: "Good. Clear and standard.",
      acceptedVariants: ["madrid tower iberia 325 radio check", "madrid tower iberia three two five radio check"],
    },
  ],
};
B[step(FC, "Radio Check & Readability", "Say the Radio Check")] = {
  instruction: "Say the complete radio check call.",
  drills: [
    {
      cue: "Iberia 325 → Madrid Ground",
      expected: "Madrid Ground, Iberia 325, radio check.",
      feedback: "Good. Station, callsign, radio check.",
      acceptedVariants: [
        "madrid ground iberia 325 radio check",
        "madrid ground iberia three two five radio check",
        "madrid ground iberia three hundred twenty five radio check",
      ],
    },
    {
      cue: "EC-ABC → Barcelona Ground",
      expected: "Barcelona Ground, EC-ABC, radio check.",
      feedback: "Good. Same structure every time.",
      acceptedVariants: [
        "barcelona ground ec abc radio check",
        "barcelona ground ec-abc radio check",
        "barcelona ground echo charlie alfa bravo charlie radio check",
      ],
    },
    {
      cue: "Ryanair 467 → Valencia Ground",
      expected: "Valencia Ground, Ryanair 467, radio check.",
      feedback: "Good. Station, callsign, radio check.",
      acceptedVariants: [
        "valencia ground ryanair 467 radio check",
        "valencia ground ryanair four six seven radio check",
        "valencia ground ryanair four hundred sixty seven radio check",
      ],
    },
    {
      cue: "Iberia 325 → Madrid Tower",
      expected: "Madrid Tower, Iberia 325, radio check.",
      feedback: "Good. Clear and standard.",
      acceptedVariants: [
        "madrid tower iberia 325 radio check",
        "madrid tower iberia three two five radio check",
      ],
    },
  ],
};
B[step(FC, "Radio Check & Readability", "Radio Check Mini Challenge")] = {
  instruction: "Handle a complete radio check exchange.",
  challengeSteps: [
    {
      kind: "listening",
      instruction: "Choose the correct radio check call.",
      situation: "You are Iberia 325, calling Madrid Ground. Which radio check call is correct?",
      options: [
        "Madrid Ground, Iberia 325, radio check.",
        "Iberia 325, radio check, Madrid.",
        "Radio check, Madrid Ground, Iberia 325.",
        "Madrid Ground, radio check.",
      ],
      correct: "Madrid Ground, Iberia 325, radio check.",
      feedback: "Station, callsign, radio check.",
    },
    {
      kind: "speaking",
      instruction: "Ask for a radio check.",
      prompt: "You are Iberia 325, calling Madrid Ground. Ask for a radio check.",
      expected: "Madrid Ground, Iberia 325, radio check.",
      acceptedVariants: ["madrid ground iberia 325 radio check", "madrid ground iberia three two five radio check"],
    },
    {
      kind: "listening",
      instruction: "What does this ATC reply mean?",
      situation: "ATC says: 'Iberia 325, readability five.' What does this mean?",
      options: ["Loud and clear.", "Weak signal.", "Unreadable.", "Try again."],
      correct: "Loud and clear.",
      feedback: "Readability five means your transmission is loud and clear.",
    },
    {
      kind: "speaking",
      instruction: "Acknowledge the readability five reply.",
      prompt: "ATC said: 'Iberia 325, readability five.' You are Iberia 325. Acknowledge.",
      expected: "Readability five, Iberia 325.",
      acceptedVariants: ["readability 5 iberia 325", "readability five iberia three two five"],
    },
  ],
};

/* ---- Basic ATIS & QNH ---- */
B[step(FC, "Basic ATIS & QNH", "What is ATIS and QNH")] = {
  lessonBody:
    "ATIS broadcasts airport information before departure or arrival. Each update has a letter: Alfa, Bravo, Charlie and so on. Saying 'Information Bravo' tells ATC you have listened to version Bravo. QNH is the pressure setting given by ATC or ATIS. In Cadet, just recognise it and read it back.",
  examples: [
    "Information Bravo.",
    "QNH 1016.",
    "QNH 1016, Iberia 325.",
    "Madrid Ground, Iberia 325, information Bravo, request startup.",
  ],
  buttonLabel: "Continue to practice",
};
B[step(FC, "Basic ATIS & QNH", "Information Bravo")] = {
  instruction: "Choose the correct answer.",
  drills: [
    {
      situation: "A pilot says 'I have information Bravo'. What does this tell ATC?",
      options: [
        "The pilot has the current ATIS update labelled Bravo.",
        "The pilot is requesting runway Bravo.",
        "The pilot needs airport information.",
        "Bravo is a special clearance.",
      ],
      correct: "The pilot has the current ATIS update labelled Bravo.",
      feedback: "Information Bravo means the pilot listened to ATIS version Bravo.",
    },
    {
      situation: "Why do pilots mention information Bravo before requesting startup?",
      options: [
        "To tell ATC they have the current airport information.",
        "To request runway Bravo.",
        "To confirm they are ready for takeoff.",
        "To request a frequency change.",
      ],
      correct: "To tell ATC they have the current airport information.",
      feedback: "This tells ATC you are up to date — they don't need to read all conditions again.",
    },
    {
      situation: "Which phrase correctly tells ATC you have the current ATIS before startup?",
      options: [
        "Madrid Ground, Iberia 325, information Bravo, request startup.",
        "Madrid Ground, Iberia 325, request startup, Bravo.",
        "Information Bravo, request startup.",
        "Iberia 325, confirm Bravo.",
      ],
      correct: "Madrid Ground, Iberia 325, information Bravo, request startup.",
      feedback: "Station, callsign, information letter, then request.",
    },
    {
      situation: "Which phrase includes information Bravo in a taxi request?",
      options: [
        "Madrid Ground, Iberia 325, information Bravo, request taxi.",
        "Madrid Ground, Iberia 325, request taxi, Bravo.",
        "Information Bravo, taxi, Iberia 325.",
        "Madrid Ground, taxi, information Bravo.",
      ],
      correct: "Madrid Ground, Iberia 325, information Bravo, request taxi.",
      feedback: "Same structure: station, callsign, information letter, then request.",
    },
  ],
};
B[step(FC, "Basic ATIS & QNH", "What is QNH?")] = {
  instruction: "Choose the correct answer.",
  drills: [
    {
      situation: "What is QNH?",
      options: ["A pressure setting given by ATC or ATIS.", "A runway identifier.", "A squawk code.", "A frequency number."],
      correct: "A pressure setting given by ATC or ATIS.",
      feedback: "QNH is the altimeter pressure setting. You receive it from ATC or ATIS.",
    },
    {
      situation: "ATC says 'QNH 1016'. What should you do at Cadet level?",
      options: ["Recognise and read it back.", "Ignore it.", "Request it again.", "Ask ATC to repeat it in words."],
      correct: "Recognise and read it back.",
      feedback: "At Cadet level, just recognise QNH and read it back correctly.",
    },
    {
      situation: "Where do pilots receive QNH before departure?",
      options: ["From ATC or ATIS.", "From the captain.", "From the flight plan.", "From the runway controller."],
      correct: "From ATC or ATIS.",
      feedback: "QNH is provided by ATC or included in the ATIS broadcast.",
    },
  ],
};
B[step(FC, "Basic ATIS & QNH", "QNH Readback")] = {
  instruction: "Build or speak the QNH readback.",
  drills: [
    {
      situation: "ATC gives you QNH 1016. Read it back as Iberia 325.",
      expected: "QNH 1016, Iberia 325.",
      feedback: "QNH value, then your callsign.",
      acceptedVariants: ["qnh 1016 iberia 325", "qnh one zero one six iberia 325", "qnh one zero one six iberia three two five"],
    },
    {
      situation: "Build the QNH readback for Iberia 325.",
      options: ["QNH 1016", "Iberia 325"],
      expected: "QNH 1016, Iberia 325",
    },
    {
      situation: "ATC gives EC-ABC QNH 1013. Read it back.",
      expected: "QNH 1013, EC-ABC.",
      feedback: "QNH value, then callsign.",
      acceptedVariants: ["qnh 1013 ec abc", "qnh one zero one three ec abc", "qnh one zero one three echo charlie alfa bravo charlie"],
    },
    {
      situation: "Build the QNH readback for EC-ABC at QNH 1019.",
      options: ["EC-ABC", "QNH 1019"],
      expected: "QNH 1019, EC-ABC",
    },
  ],
};
B[step(FC, "Basic ATIS & QNH", "Startup with Information Bravo")] = {
  instruction: "Say the complete startup request including Information Bravo.",
  drills: [
    {
      situation: "You are Iberia 325 at stand A12, calling Madrid Ground. You have information Bravo. Request startup.",
      expected: "Madrid Ground, Iberia 325, stand A12, information Bravo, request startup.",
      feedback: "Station, callsign, stand, information, request.",
      acceptedVariants: [
        "madrid ground iberia 325 stand a12 information bravo request startup",
        "madrid ground iberia three two five stand a12 information bravo request startup",
      ],
    },
    {
      situation: "You are EC-ABC at stand 5, calling Barcelona Ground. You have information Alfa. Request startup.",
      expected: "Barcelona Ground, EC-ABC, stand 5, information Alfa, request startup.",
      feedback: "Good. All parts included.",
      acceptedVariants: [
        "barcelona ground ec abc stand 5 information alfa request startup",
        "barcelona ground echo charlie alfa bravo charlie stand 5 information alfa request startup",
      ],
    },
  ],
};
B[step(FC, "Basic ATIS & QNH", "Say the QNH Readback")] = {
  instruction: "Read back the QNH given by ATC.",
  drills: [
    {
      cue: "QNH 1016 → Iberia 325",
      expected: "QNH 1016, Iberia 325.",
      feedback: "Good. QNH value then callsign.",
      acceptedVariants: [
        "qnh 1016 iberia 325",
        "qnh one zero one six iberia three two five",
        "qnh one zero one six iberia 325",
        "q n h one zero one six iberia three two five",
      ],
    },
    {
      cue: "QNH 1013 → Iberia 325",
      expected: "QNH 1013, Iberia 325.",
      feedback: "Good. QNH value then callsign.",
      acceptedVariants: [
        "qnh 1013 iberia 325",
        "qnh one zero one three iberia three two five",
        "qnh one zero one three iberia 325",
      ],
    },
    {
      cue: "QNH 1019 → EC-ABC",
      expected: "QNH 1019, EC-ABC.",
      feedback: "Good. Same format with a registration callsign.",
      acceptedVariants: [
        "qnh 1019 ec abc",
        "qnh one zero one nine echo charlie alfa bravo charlie",
        "qnh one zero one nine ec abc",
        "qnh one zero one nine ec-abc",
      ],
    },
    {
      cue: "QNH 1022 → Iberia 325",
      expected: "QNH 1022, Iberia 325.",
      feedback: "Good. Always read back exactly what ATC gave you.",
      acceptedVariants: [
        "qnh 1022 iberia 325",
        "qnh one zero two two iberia three two five",
        "qnh one zero two two iberia 325",
      ],
    },
  ],
};
B[step(FC, "Basic ATIS & QNH", "ATIS and QNH Mini Challenge")] = {
  instruction: "Handle a pre-departure exchange with Information Bravo and QNH.",
  challengeSteps: [
    {
      kind: "listening",
      instruction: "What does 'Information Bravo' mean?",
      situation: "A pilot says 'I have information Bravo'. What does this tell ATC?",
      options: [
        "The pilot has the current ATIS update.",
        "The pilot is on runway Bravo.",
        "The pilot requests a Bravo clearance.",
        "The pilot needs weather information.",
      ],
      correct: "The pilot has the current ATIS update.",
      feedback: "Information Bravo tells ATC the pilot has listened to ATIS version Bravo.",
    },
    {
      kind: "listening",
      instruction: "What is QNH?",
      situation: "ATC says 'startup approved, QNH 1016'. What is QNH?",
      options: ["A pressure setting.", "A frequency.", "A squawk code.", "A taxi route."],
      correct: "A pressure setting.",
      feedback: "QNH is the altimeter pressure setting given by ATC or ATIS.",
    },
    {
      kind: "speaking",
      instruction: "Make a startup request with Information Bravo.",
      prompt: "You are Iberia 325 at stand A12, calling Madrid Ground. You have information Bravo. Request startup.",
      expected: "Madrid Ground, Iberia 325, stand A12, information Bravo, request startup.",
    },
    {
      kind: "phraseology",
      instruction: "Build the QNH readback.",
      situation: "ATC said: 'Iberia 325, QNH 1016.' Build the QNH readback.",
      buildOptions: ["QNH 1016", "Iberia 325"],
      expected: "QNH 1016, Iberia 325",
    },
  ],
};

/* ---- Basic Requests ---- */
B[step(FC, "Basic Requests", "Request Startup")] = {
  instruction: "Build or speak the request.",
  drills: [
    { situation: "You are Iberia 325 at stand A12, calling Madrid Ground. Ready for startup.", expected: "Madrid Ground, Iberia 325, stand A12, request startup.", acceptedVariants: ["madrid ground iberia 325 stand a12 request startup"] },
    { situation: "You are Iberia 325 at stand A12, calling Madrid Ground. You have information Bravo. Request startup.", expected: "Madrid Ground, Iberia 325, stand A12, information Bravo, request startup.", acceptedVariants: ["madrid ground iberia 325 stand a12 information bravo request startup"] },
    { situation: "Build the startup request.", options: ["Madrid Ground", "Iberia 325", "stand A12", "request startup"], expected: "Madrid Ground, Iberia 325, stand A12, request startup" },
    // QNH (pressure setting) is given by ATC with startup approval; at Cadet level just read it back.
    { situation: "ATC: Iberia 325, startup approved, QNH one zero one six. Read it back.", expected: "Startup approved, QNH 1016, Iberia 325.", acceptedVariants: ["startup approved qnh 1016 iberia 325", "startup approved qnh one zero one six iberia 325"] },
  ],
};
B[step(FC, "Basic Requests", "Request Taxi")] = {
  instruction: "Build or speak the request.",
  drills: [
    { situation: "You are Iberia 325, calling Madrid Ground. Ready to taxi.", expected: "Madrid Ground, Iberia 325, request taxi." },
    { situation: "You are Iberia 325, calling Madrid Ground. You have information Bravo. Request taxi.", expected: "Madrid Ground, Iberia 325, information Bravo, request taxi." },
    { situation: "You are Iberia 325, calling Madrid Ground. Request taxi to the holding point.", expected: "Madrid Ground, Iberia 325, request taxi to holding point." },
    { situation: "Build the taxi request.", options: ["Madrid Ground", "Iberia 325", "request taxi", "radio check"], expected: "Madrid Ground, Iberia 325, request taxi" },
  ],
};
B[step(FC, "Basic Requests", "Request Information")] = {
  instruction: "Build or speak the request.",
  drills: [
    { situation: "You are Iberia 325, calling Madrid Information. Request flight information.", expected: "Madrid Information, Iberia 325, request flight information." },
    { situation: "You are Iberia 325, calling Madrid Information. Request the current weather.", expected: "Madrid Information, Iberia 325, request weather information." },
    { situation: "You are Iberia 325, calling Madrid Information. Request the runway in use.", expected: "Madrid Information, Iberia 325, request runway in use." },
    { situation: "Build the information request.", options: ["Madrid Information", "Iberia 325", "request flight information", "radio check"], expected: "Madrid Information, Iberia 325, request flight information" },
    { situation: "You are Iberia 325. Acknowledge information Bravo received.", expected: "Information Bravo, Iberia 325." },
  ],
};
B[step(FC, "Basic Requests", "Mixed Request Challenge")] = {
  instruction: "Pick and build the right request.",
  challengeSteps: [
    { kind: "phraseology", instruction: "Build a startup request.", situation: "At stand A12, ready for startup.", buildOptions: ["Madrid Ground", "Iberia 325", "stand A12", "request startup"], expected: "Madrid Ground, Iberia 325, stand A12, request startup" },
    { kind: "speaking", instruction: "Speak a taxi request.", prompt: "You are Iberia 325. Request taxi from Madrid Ground.", expected: "Madrid Ground, Iberia 325, request taxi." },
    { kind: "listening", instruction: "Pick the correct radio check.", situation: "Which call is a correct radio check?", options: ["Madrid Ground, Iberia 325, radio check.", "Iberia 325, radio check Ground.", "Radio check, Madrid Ground.", "Ground, radio check 325."], correct: "Madrid Ground, Iberia 325, radio check.", feedback: "Correct. Station + callsign + request." },
    { kind: "phraseology", instruction: "Build an information request.", situation: "Request flight information.", buildOptions: ["Madrid Information", "Iberia 325", "request flight information", "radio check"], expected: "Madrid Information, Iberia 325, request flight information" },
  ],
};
B[step(FC, "Basic Requests", "Speak the Request")] = {
  instruction: "Make the complete request to ATC.",
  drills: [
    {
      cue: "Iberia 325 · stand A12 → Madrid Ground (startup)",
      expected: "Madrid Ground, Iberia 325, stand A12, request startup.",
      feedback: "Good. Station, callsign, position, request.",
      acceptedVariants: [
        "madrid ground iberia 325 stand a12 request startup",
        "madrid ground iberia three two five stand a12 request startup",
        "madrid ground iberia 325 at stand a12 request startup",
      ],
    },
    {
      cue: "Iberia 325 → Madrid Ground (taxi)",
      expected: "Madrid Ground, Iberia 325, request taxi.",
      feedback: "Good. Station, callsign, request.",
      acceptedVariants: [
        "madrid ground iberia 325 request taxi",
        "madrid ground iberia three two five request taxi",
      ],
    },
    {
      cue: "Iberia 325 · Info Bravo → Madrid Ground (startup)",
      expected: "Madrid Ground, Iberia 325, information Bravo, request startup.",
      feedback: "Good. Include the information letter before the request.",
      acceptedVariants: [
        "madrid ground iberia 325 information bravo request startup",
        "madrid ground iberia three two five information bravo request startup",
      ],
    },
    {
      cue: "Iberia 325 · Info Bravo → Madrid Ground (taxi)",
      expected: "Madrid Ground, Iberia 325, information Bravo, request taxi.",
      feedback: "Good. Information letter then request.",
      acceptedVariants: [
        "madrid ground iberia 325 information bravo request taxi",
        "madrid ground iberia three two five information bravo request taxi",
      ],
    },
  ],
};

/* ---- Frequency Changes ---- */
B[step(FC, "Frequency Changes", "Contact vs Monitor")] = {
  lessonBody: "Contact means call the next frequency. Monitor means listen on the next frequency. Both must be read back.",
  buttonLabel: "Continue",
};
B[step(FC, "Frequency Changes", "Frequency Readback")] = {
  instruction: "Listen to the frequency change and read it back.",
  drills: [
    { atc: "Iberia 325, contact Tower 118.100.", atcSpoken: "Iberia three two five, contact Tower one one eight decimal one.", expected: "Contact Tower 118.100, Iberia 325.", acceptedVariants: ["contact tower one one eight decimal one iberia 325", "contact tower one one eight point one iberia 325"] },
    { atc: "Iberia 325, contact Ground 121.700.", atcSpoken: "Iberia three two five, contact Ground one two one decimal seven.", expected: "Contact Ground 121.700, Iberia 325.", acceptedVariants: ["contact ground one two one decimal seven iberia 325", "contact ground one two one point seven iberia 325"] },
    { atc: "Iberia 325, monitor Tower 118.100.", atcSpoken: "Iberia three two five, monitor Tower one one eight decimal one.", expected: "Monitor Tower 118.100, Iberia 325.", acceptedVariants: ["monitor tower one one eight decimal one iberia 325"] },
    { atc: "EC-ABC, contact Approach 124.875.", atcSpoken: "Echo Charlie Alfa Bravo Charlie, contact Approach one two four decimal eight seven fife.", expected: "Contact Approach 124.875, EC-ABC.", acceptedVariants: ["contact approach one two four decimal eight seven five ec abc"] },
    { atc: "Iberia 325, contact Director 119.500.", atcSpoken: "Iberia three two five, contact Director one one niner decimal fife.", expected: "Contact Director 119.500, Iberia 325.", acceptedVariants: ["contact director one one nine decimal five iberia 325"] },
    { atc: "Iberia 325, contact Radar 120.900.", atcSpoken: "Iberia three two five, contact Radar one two zero decimal niner.", expected: "Contact Radar 120.900, Iberia 325.", acceptedVariants: ["contact radar one two zero decimal nine iberia 325"] },
  ],
};
B[step(FC, "Frequency Changes", "First Call on New Frequency")] = {
  instruction: "Make your first call on the new frequency.",
  drills: [
    { situation: "You are Iberia 325. You have changed to Madrid Tower frequency. Make your first call.", expected: "Madrid Tower, Iberia 325.", acceptedVariants: ["madrid tower iberia 325", "madrid tower iberia three two five"] },
    { situation: "You are EC-ABC. You have changed to Madrid Approach frequency. Make your first call.", expected: "Madrid Approach, EC-ABC.", acceptedVariants: ["madrid approach ec abc", "madrid approach echo charlie alfa bravo charlie"] },
    { situation: "You are Iberia 325. You have changed to Madrid Tower, ready for departure. Make your first call.", expected: "Madrid Tower, Iberia 325, ready for departure.", acceptedVariants: ["madrid tower iberia 325 ready for departure"] },
    { situation: "You are Ryanair 467. You have changed to Madrid Radar frequency. Make your first call.", expected: "Madrid Radar, Ryanair 467.", acceptedVariants: ["madrid radar ryanair 467", "madrid radar ryanair four six seven"] },
  ],
};
B[step(FC, "Frequency Changes", "Mini Challenge")] = {
  instruction: "Handle a full frequency change.",
  challengeSteps: [
    { kind: "readback", instruction: "Read back the frequency change.", atc: "Iberia 325, contact Tower one one eight decimal one.", expected: "Contact Tower 118.100, Iberia 325.", acceptedVariants: ["contact tower one one eight decimal one iberia 325", "contact tower one one eight point one iberia 325"] },
    { kind: "speaking", instruction: "Make your first call on the new frequency.", prompt: "You are Iberia 325. Call Madrid Tower.", expected: "Madrid Tower, Iberia 325.", acceptedVariants: ["madrid tower iberia 325", "madrid tower iberia three two five"] },
    { kind: "listening", instruction: "Contact or monitor?", situation: "ATC says: monitor Tower 118.100.", options: ["Change and call", "Change and listen only", "Stay on frequency", "Squawk standby"], correct: "Change and listen only", feedback: "Monitor means change and listen, do not call." },
    { kind: "readback", instruction: "Read back the next change.", atc: "Iberia 325, contact Ground one two one decimal seven.", expected: "Contact Ground 121.700, Iberia 325.", acceptedVariants: ["contact ground one two one decimal seven iberia 325", "contact ground one two one point seven iberia 325"] },
    { kind: "speaking", instruction: "Make your first call to Ground.", prompt: "You are Iberia 325. Call Madrid Ground after vacating.", expected: "Madrid Ground, Iberia 325.", acceptedVariants: ["madrid ground iberia 325", "madrid ground iberia three two five"] },
  ],
};
B[step(FC, "Frequency Changes", "Speak First Call")] = {
  instruction: "Make your first call on the new frequency.",
  drills: [
    {
      cue: "Iberia 325 → Madrid Tower",
      expected: "Madrid Tower, Iberia 325.",
      feedback: "Good. Short check-in: station then callsign.",
      acceptedVariants: [
        "madrid tower iberia 325",
        "madrid tower iberia three two five",
      ],
    },
    {
      cue: "EC-ABC → Madrid Approach",
      expected: "Madrid Approach, EC-ABC.",
      feedback: "Good. Station then callsign.",
      acceptedVariants: [
        "madrid approach ec abc",
        "madrid approach echo charlie alfa bravo charlie",
        "madrid approach echo charlie alpha bravo charlie",
      ],
    },
    {
      cue: "Iberia 325 → Madrid Tower (ready for departure)",
      expected: "Madrid Tower, Iberia 325, ready for departure.",
      feedback: "Good. Include your status when relevant.",
      acceptedVariants: [
        "madrid tower iberia 325 ready for departure",
        "madrid tower iberia three two five ready for departure",
      ],
    },
    {
      cue: "Ryanair 467 → Madrid Radar",
      expected: "Madrid Radar, Ryanair 467.",
      feedback: "Good. Station then callsign.",
      acceptedVariants: [
        "madrid radar ryanair 467",
        "madrid radar ryanair four six seven",
      ],
    },
  ],
};

/* ================= LISTENING MODULE (30 drills) =================
 * Six distinct pools per group — one per Level. Each level is harder than the
 * previous by adding at least one difficulty lever: distractor similarity,
 * transmission length, embedded target, registration callsigns, confusable pairs,
 * or meaning-based understanding. IDs are unchanged (drill-1..6 per group).
 * useDrillSet still shuffles and caps each pool to 10 rounds per attempt. */
const LIS = "cadet-listening";
type LisDrill = { atc: string; atcSpoken?: string; options: string[]; correct: string; feedback?: string };

// ─── CALLSIGN RECOGNITION ─────────────────────────────────────────────────────
// L1: clearly different callsigns, short calls.
// L2: same airline, transposed digits.
// L3: callsign embedded mid-transmission, not leading.
// L4: ICAO registration callsigns spelled out.
// L5: longer calls + digit/airline confusables.
// L6: two similar callsigns in the same transmission — identify which ATC addresses.
const csL1: LisDrill[] = [
  { atc: "Iberia 325, hold position.", atcSpoken: "Iberia three two five, hold position.", options: ["Iberia 325", "Ryanair 467", "Vueling 218", "Speedbird 102"], correct: "Iberia 325", feedback: "ATC addressed Iberia 325." },
  { atc: "Ryanair 467, contact Tower.", atcSpoken: "Ryanair four six seven, contact Tower.", options: ["Ryanair 467", "Iberia 325", "Speedbird 102", "Air France 743"], correct: "Ryanair 467", feedback: "ATC addressed Ryanair 467." },
  { atc: "Vueling 218, cleared to land runway two four.", atcSpoken: "Vueling two one eight, cleared to land runway two four.", options: ["Vueling 218", "Ryanair 218", "Iberia 218", "Speedbird 218"], correct: "Vueling 218", feedback: "ATC addressed Vueling 218." },
  { atc: "Speedbird 102, report ready for departure.", atcSpoken: "Speedbird one zero two, report ready for departure.", options: ["Speedbird 102", "Ryanair 102", "Iberia 102", "Air France 102"], correct: "Speedbird 102", feedback: "ATC addressed Speedbird 102." },
  { atc: "Air France 743, line up and wait.", atcSpoken: "Air France seven four three, line up and wait.", options: ["Air France 743", "Lufthansa 743", "Iberia 743", "Speedbird 743"], correct: "Air France 743", feedback: "ATC addressed Air France 743." },
  { atc: "Lufthansa 551, taxi to holding point Alfa One.", atcSpoken: "Lufthansa five five one, taxi to holding point Alfa One.", options: ["Lufthansa 551", "Speedbird 551", "Air France 551", "Ryanair 551"], correct: "Lufthansa 551", feedback: "ATC addressed Lufthansa 551." },
];
const csL2: LisDrill[] = [
  { atc: "Iberia 325, hold position.", atcSpoken: "Iberia three two five, hold position.", options: ["Iberia 325", "Iberia 352", "Iberia 235", "Iberia 532"], correct: "Iberia 325", feedback: "ATC addressed Iberia 325, not 352 or 235." },
  { atc: "Ryanair 467, contact Tower.", atcSpoken: "Ryanair four six seven, contact Tower.", options: ["Ryanair 467", "Ryanair 476", "Ryanair 764", "Ryanair 647"], correct: "Ryanair 467", feedback: "ATC addressed Ryanair 467." },
  { atc: "Vueling 218, line up and wait.", atcSpoken: "Vueling two one eight, line up and wait.", options: ["Vueling 218", "Vueling 281", "Vueling 128", "Vueling 812"], correct: "Vueling 218", feedback: "ATC addressed Vueling 218." },
  { atc: "Speedbird 102, squawk four two one fife.", atcSpoken: "Speedbird one zero two, squawk four two one fife.", options: ["Speedbird 102", "Speedbird 120", "Speedbird 201", "Speedbird 012"], correct: "Speedbird 102", feedback: "ATC addressed Speedbird 102." },
  { atc: "Air France 743, taxi to holding point Alfa One.", atcSpoken: "Air France seven four three, taxi to holding point Alfa One.", options: ["Air France 743", "Air France 734", "Air France 473", "Air France 374"], correct: "Air France 743", feedback: "ATC addressed Air France 743." },
  { atc: "Lufthansa 551, report ready for departure.", atcSpoken: "Lufthansa five five one, report ready for departure.", options: ["Lufthansa 551", "Lufthansa 515", "Lufthansa 155", "Lufthansa 511"], correct: "Lufthansa 551", feedback: "ATC addressed Lufthansa 551." },
];
const csL3: LisDrill[] = [
  { atc: "After the Ryanair 467, Vueling 218, taxi to holding point Alfa One.", atcSpoken: "After the Ryanair four six seven, Vueling two one eight, taxi to holding point Alfa One.", options: ["Vueling 218", "Ryanair 467", "Vueling 281", "Iberia 218"], correct: "Vueling 218", feedback: "ATC addressed Vueling 218. Ryanair 467 is the traffic ahead." },
  { atc: "Behind the Iberia 325, Air France 743, continue taxi.", atcSpoken: "Behind the Iberia three two five, Air France seven four three, continue taxi.", options: ["Air France 743", "Iberia 325", "Air France 734", "Iberia 743"], correct: "Air France 743", feedback: "ATC addressed Air France 743. Iberia 325 is the aircraft ahead." },
  { atc: "Watch for the traffic, Ryanair 467, hold short of runway two four.", atcSpoken: "Watch for the traffic, Ryanair four six seven, hold short of runway two four.", options: ["Ryanair 467", "Ryanair 476", "Iberia 467", "Vueling 467"], correct: "Ryanair 467", feedback: "ATC addressed Ryanair 467." },
  { atc: "Caution wake turbulence, Speedbird 102, line up and wait.", atcSpoken: "Caution wake turbulence, Speedbird one zero two, line up and wait.", options: ["Speedbird 102", "Speedbird 120", "Iberia 102", "Ryanair 102"], correct: "Speedbird 102", feedback: "ATC addressed Speedbird 102." },
  { atc: "Traffic on your right, Iberia 325, give way.", atcSpoken: "Traffic on your right, Iberia three two five, give way.", options: ["Iberia 325", "Iberia 352", "Vueling 325", "Ryanair 325"], correct: "Iberia 325", feedback: "ATC addressed Iberia 325." },
  { atc: "Hold short of runway two four, Lufthansa 551, traffic on approach.", atcSpoken: "Hold short of runway two four, Lufthansa five five one, traffic on approach.", options: ["Lufthansa 551", "Lufthansa 515", "Speedbird 551", "Air France 551"], correct: "Lufthansa 551", feedback: "ATC addressed Lufthansa 551." },
];
const csL4: LisDrill[] = [
  { atc: "Golf Alfa Bravo Charlie Delta, cross runway two four.", options: ["G-ABCD", "G-ACBD", "G-ABDC", "G-BACD"], correct: "G-ABCD", feedback: "Golf Alfa Bravo Charlie Delta = G-ABCD." },
  { atc: "Echo India Delta Uniform Bravo, continue approach.", options: ["EI-DUB", "EI-DBU", "EI-UDB", "IE-DUB"], correct: "EI-DUB", feedback: "Echo India Delta Uniform Bravo = EI-DUB." },
  { atc: "Echo Charlie Alfa Bravo Charlie, contact Ground.", options: ["EC-ABC", "EC-ACB", "EC-BCA", "EA-ABC"], correct: "EC-ABC", feedback: "Echo Charlie Alfa Bravo Charlie = EC-ABC." },
  { atc: "Golf Bravo Charlie Delta Echo, hold position.", options: ["G-BCDE", "G-BDCE", "G-CBDE", "G-CDBE"], correct: "G-BCDE", feedback: "Golf Bravo Charlie Delta Echo = G-BCDE." },
  { atc: "Echo India Uniform Delta Bravo, cleared to land runway two four.", options: ["EI-UDB", "EI-UBD", "EI-DUB", "IE-UDB"], correct: "EI-UDB", feedback: "Echo India Uniform Delta Bravo = EI-UDB." },
  { atc: "Echo Charlie Delta Echo Foxtrot, report ready.", options: ["EC-DEF", "EC-DFE", "EC-EDF", "CE-DEF"], correct: "EC-DEF", feedback: "Echo Charlie Delta Echo Foxtrot = EC-DEF." },
];
const csL5: LisDrill[] = [
  { atc: "Air France 743, after the landing traffic clears, taxi to holding point Alfa One via Bravo.", atcSpoken: "Air France seven four three, after the landing traffic clears, taxi to holding point Alfa One via Bravo.", options: ["Air France 743", "Air France 734", "Air France 473", "Lufthansa 743"], correct: "Air France 743", feedback: "ATC addressed Air France 743." },
  { atc: "Wizz Air 312, hold short of runway two four, traffic on short final.", atcSpoken: "Wizz Air three one two, hold short of runway two four, traffic on short final.", options: ["Wizz Air 312", "Wizz Air 321", "Wizz Air 132", "Wizz Air 213"], correct: "Wizz Air 312", feedback: "ATC addressed Wizz Air 312." },
  { atc: "Lufthansa 551, cleared to land runway two four, wind two two zero at one two.", atcSpoken: "Lufthansa five five one, cleared to land runway two four, wind two two zero at one two.", options: ["Lufthansa 551", "Lufthansa 515", "Lufthansa 155", "Air France 551"], correct: "Lufthansa 551", feedback: "ATC addressed Lufthansa 551." },
  { atc: "Speedbird 102, behind the Vueling on the parallel taxiway, continue taxi.", atcSpoken: "Speedbird one zero two, behind the Vueling on the parallel taxiway, continue taxi.", options: ["Speedbird 102", "Speedbird 120", "Speedbird 201", "Ryanair 102"], correct: "Speedbird 102", feedback: "ATC addressed Speedbird 102." },
  { atc: "Echo India Delta Uniform Bravo, wind two seven zero at one fife, cleared to land runway two four.", options: ["EI-DUB", "EI-DBU", "EI-UDB", "IE-DUB"], correct: "EI-DUB", feedback: "ATC addressed EI-DUB." },
  { atc: "Echo Charlie Alfa Bravo Charlie, taxi to apron via Golf, caution for the pushback in progress.", options: ["EC-ABC", "EC-ACB", "EC-BCA", "EA-ABC"], correct: "EC-ABC", feedback: "ATC addressed EC-ABC." },
];
const csL6: LisDrill[] = [
  { atc: "Air France 734, behind the Air France 743 that is holding, continue taxi.", atcSpoken: "Air France seven three four, behind the Air France seven four three that is holding, continue taxi.", options: ["Air France 734", "Air France 743", "Air France 374", "Air France 473"], correct: "Air France 734", feedback: "ATC addressed Air France 734 (the leading callsign). Air France 743 is the traffic ahead, not the aircraft being spoken to." },
  { atc: "Iberia 325, caution, the Iberia 352 is on your left, give way.", atcSpoken: "Iberia three two five, caution, the Iberia three five two is on your left, give way.", options: ["Iberia 325", "Iberia 352", "Iberia 235", "Iberia 532"], correct: "Iberia 325", feedback: "ATC addressed Iberia 325. Iberia 352 is the other traffic." },
  { atc: "Speedbird 201, hold position. Speedbird 102 has just vacated.", atcSpoken: "Speedbird two zero one, hold position. Speedbird one zero two has just vacated.", options: ["Speedbird 201", "Speedbird 102", "Speedbird 120", "Speedbird 210"], correct: "Speedbird 201", feedback: "ATC gave the instruction to Speedbird 201. Speedbird 102 was mentioned, not addressed." },
  { atc: "Ryanair 476, follow the Ryanair 467 ahead, taxi via Bravo.", atcSpoken: "Ryanair four seven six, follow the Ryanair four six seven ahead, taxi via Bravo.", options: ["Ryanair 476", "Ryanair 467", "Ryanair 764", "Ryanair 647"], correct: "Ryanair 476", feedback: "ATC addressed Ryanair 476. Ryanair 467 is the aircraft to follow." },
  { atc: "Vueling 128, the Vueling 218 is ahead of you at Alfa One, hold short.", atcSpoken: "Vueling one two eight, the Vueling two one eight is ahead of you at Alfa One, hold short.", options: ["Vueling 128", "Vueling 218", "Vueling 281", "Vueling 182"], correct: "Vueling 128", feedback: "ATC addressed Vueling 128. Vueling 218 is the aircraft ahead." },
  { atc: "Lufthansa 515, cleared for takeoff runway two four, Lufthansa 551 has just departed.", atcSpoken: "Lufthansa five one five, cleared for takeoff runway two four, Lufthansa five five one has just departed.", options: ["Lufthansa 515", "Lufthansa 551", "Lufthansa 155", "Lufthansa 511"], correct: "Lufthansa 515", feedback: "ATC cleared Lufthansa 515 for takeoff. Lufthansa 551 already departed." },
];
B[drill(LIS, "Callsign Recognition", 1)] = { instruction: "Listen and select the callsign ATC addressed.", drills: csL1 };
B[drill(LIS, "Callsign Recognition", 2)] = { instruction: "Listen carefully. The digits sound similar. Select the exact callsign ATC addressed.", drills: csL2 };
B[drill(LIS, "Callsign Recognition", 3)] = { instruction: "The callsign is not always at the start. Listen carefully and select who ATC addressed.", drills: csL3 };
B[drill(LIS, "Callsign Recognition", 4)] = { instruction: "Registration callsigns are spelled using ICAO letters. Select the correct registration.", drills: csL4 };
B[drill(LIS, "Callsign Recognition", 5)] = { instruction: "Listen to the full call. Similar callsigns are in the options. Select the one ATC addressed.", drills: csL5 };
B[drill(LIS, "Callsign Recognition", 6)] = { instruction: "Two similar callsigns are mentioned. Select the one ATC is directly addressing.", drills: csL6 };

// ─── FREQUENCY RECOGNITION ────────────────────────────────────────────────────
// L1: well-separated options, first 3 digits differ.
// L2: close options, same first 3 digits, trailing zero groups.
// L3: 5-figure frequencies with digit-transposition distractors.
// L4: frequency embedded in a fuller instruction.
// L5: frequency in a busy call with distracting context.
// L6: frequency buried in a complex multi-part call containing other numbers.
const frL1: LisDrill[] = [
  { atc: "Iberia 325, contact Tower one one eight decimal one.", atcSpoken: "Iberia three two five, contact Tower one one eight decimal one.", options: ["118.100", "121.700", "124.875", "119.500"], correct: "118.100", feedback: "The frequency was 118.100." },
  { atc: "Ryanair 467, contact Ground one two one decimal seven.", atcSpoken: "Ryanair four six seven, contact Ground one two one decimal seven.", options: ["121.700", "118.100", "124.875", "119.500"], correct: "121.700", feedback: "The frequency was 121.700." },
  { atc: "Contact Approach one two four decimal fife.", options: ["124.500", "118.100", "121.700", "119.500"], correct: "124.500", feedback: "The frequency was 124.500." },
  { atc: "Contact Radar one two zero decimal niner.", options: ["120.900", "118.100", "121.700", "124.875"], correct: "120.900", feedback: "The frequency was 120.900." },
  { atc: "Contact Information one two fife decimal two fife.", options: ["125.250", "118.100", "121.700", "120.900"], correct: "125.250", feedback: "The frequency was 125.250." },
  { atc: "Contact Director one one niner decimal fife.", options: ["119.500", "121.700", "118.100", "124.875"], correct: "119.500", feedback: "The frequency was 119.500." },
];
const frL2: LisDrill[] = [
  { atc: "Iberia 325, contact Tower one one eight decimal one.", atcSpoken: "Iberia three two five, contact Tower one one eight decimal one.", options: ["118.100", "118.700", "118.150", "118.010"], correct: "118.100", feedback: "The frequency was 118.100." },
  { atc: "Ryanair 467, contact Ground one two one decimal seven.", atcSpoken: "Ryanair four six seven, contact Ground one two one decimal seven.", options: ["121.700", "121.900", "122.700", "120.700"], correct: "121.700", feedback: "The frequency was 121.700." },
  { atc: "Monitor Tower one one eight decimal one.", options: ["118.100", "118.150", "119.100", "118.010"], correct: "118.100", feedback: "The frequency was 118.100." },
  { atc: "Contact Approach one two zero decimal niner.", options: ["120.900", "120.090", "121.900", "120.950"], correct: "120.900", feedback: "The frequency was 120.900." },
  { atc: "Contact Radar one one niner decimal fife.", options: ["119.500", "119.050", "118.500", "119.550"], correct: "119.500", feedback: "The frequency was 119.500." },
  { atc: "Return to Ground one two one decimal seven.", options: ["121.700", "121.750", "122.700", "121.070"], correct: "121.700", feedback: "The frequency was 121.700." },
];
const frL3: LisDrill[] = [
  { atc: "Contact Approach one two four decimal eight seven fife.", options: ["124.875", "124.785", "125.875", "124.857"], correct: "124.875", feedback: "The frequency was 124.875." },
  { atc: "Monitor Approach one tree two decimal one fife.", options: ["132.150", "132.510", "131.150", "132.050"], correct: "132.150", feedback: "The frequency was 132.150." },
  { atc: "Contact Tower one one eight decimal six fife.", options: ["118.650", "118.560", "119.650", "118.605"], correct: "118.650", feedback: "The frequency was 118.650." },
  { atc: "Contact Information one two fife decimal two fife.", options: ["125.250", "125.520", "124.250", "125.025"], correct: "125.250", feedback: "The frequency was 125.250." },
  { atc: "Contact Director one one niner decimal tree fife.", options: ["119.350", "119.530", "118.350", "119.305"], correct: "119.350", feedback: "The frequency was 119.350." },
  { atc: "Contact Radar one two zero decimal eight seven fife.", options: ["120.875", "120.785", "120.857", "121.875"], correct: "120.875", feedback: "The frequency was 120.875." },
];
const frL4: LisDrill[] = [
  { atc: "After departure, contact Radar one two zero decimal niner.", options: ["120.900", "120.090", "121.900", "120.950"], correct: "120.900", feedback: "The frequency was 120.900." },
  { atc: "Vacate runway, then contact Ground one two one decimal seven.", options: ["121.700", "121.070", "122.700", "121.750"], correct: "121.700", feedback: "The frequency was 121.700." },
  { atc: "At the holding point, monitor Information one two fife decimal two fife.", options: ["125.250", "125.520", "124.250", "125.025"], correct: "125.250", feedback: "The frequency was 125.250." },
  { atc: "After crossing, contact Tower one one eight decimal one.", options: ["118.100", "118.010", "119.100", "118.700"], correct: "118.100", feedback: "The frequency was 118.100." },
  { atc: "On Bravo, contact Apron one two one decimal niner.", options: ["121.900", "121.090", "122.900", "121.950"], correct: "121.900", feedback: "The frequency was 121.900." },
  { atc: "When airborne, contact Departure one two zero decimal tree.", options: ["120.300", "120.030", "121.300", "120.350"], correct: "120.300", feedback: "The frequency was 120.300." },
];
const frL5: LisDrill[] = [
  { atc: "Iberia 325, after vacating via Alfa, cross Golf and contact Ground one two one decimal seven.", atcSpoken: "Iberia three two five, after vacating via Alfa, cross Golf and contact Ground one two one decimal seven.", options: ["121.700", "121.750", "122.700", "121.070"], correct: "121.700", feedback: "The frequency was 121.700." },
  { atc: "After the Ryanair clears the runway, Vueling 218, monitor Tower one one eight decimal one for landing clearance.", atcSpoken: "After the Ryanair clears the runway, Vueling two one eight, monitor Tower one one eight decimal one for landing clearance.", options: ["118.100", "118.010", "119.100", "118.150"], correct: "118.100", feedback: "The frequency was 118.100." },
  { atc: "Speedbird 102, caution wake turbulence, contact Approach one two four decimal eight seven fife.", atcSpoken: "Speedbird one zero two, caution wake turbulence, contact Approach one two four decimal eight seven fife.", options: ["124.875", "124.785", "124.857", "125.875"], correct: "124.875", feedback: "The frequency was 124.875." },
  { atc: "Air France 743, hold at Alfa One, when traffic moves contact Director one one niner decimal fife.", atcSpoken: "Air France seven four three, hold at Alfa One, when traffic moves contact Director one one niner decimal fife.", options: ["119.500", "119.050", "118.500", "119.550"], correct: "119.500", feedback: "The frequency was 119.500." },
  { atc: "Echo India Delta Uniform Bravo, cross runway two four, then contact Ground one two one decimal seven, taxi to apron via Hotel.", options: ["121.700", "121.750", "120.700", "121.070"], correct: "121.700", feedback: "The frequency was 121.700." },
  { atc: "After departure runway two four, turn left heading zero niner zero, contact Radar one two zero decimal niner.", options: ["120.900", "120.090", "120.950", "121.900"], correct: "120.900", feedback: "The frequency was 120.900." },
];
const frL6: LisDrill[] = [
  { atc: "Vacate via Alfa, cross Golf, contact Ground one two one decimal seven, and report on stand.", options: ["121.700", "121.750", "122.700", "121.070"], correct: "121.700", feedback: "The frequency was 121.700. Other instructions contained no frequencies." },
  { atc: "Runway two four, wind zero niner zero at one zero, cleared to land, contact Tower one one eight decimal one after landing.", options: ["118.100", "118.010", "119.100", "118.700"], correct: "118.100", feedback: "The frequency was 118.100. Do not be distracted by the runway number or wind." },
  { atc: "Turn right heading two four zero, climb to four thousand feet, contact Departure one two zero decimal tree.", options: ["120.300", "120.030", "121.300", "120.350"], correct: "120.300", feedback: "The frequency was 120.300. Do not confuse with the heading or altitude." },
  { atc: "Hold at Alfa One, squawk seven zero zero zero, then contact Approach one two four decimal eight seven fife when ready.", options: ["124.875", "124.785", "124.857", "125.875"], correct: "124.875", feedback: "The frequency was 124.875. Seven thousand is the squawk code, not a frequency." },
  { atc: "Taxi to holding point Alfa One runway two four via Bravo, monitor Information one two fife decimal two fife.", options: ["125.250", "125.520", "124.250", "125.025"], correct: "125.250", feedback: "The frequency was 125.250." },
  { atc: "After the Airbus vacates, cross runway two four, monitor Ground one two one decimal seven, report on apron.", options: ["121.700", "121.750", "120.700", "121.070"], correct: "121.700", feedback: "The frequency was 121.700." },
];
B[drill(LIS, "Frequency Recognition", 1)] = { instruction: "Listen and select the correct frequency.", drills: frL1 };
B[drill(LIS, "Frequency Recognition", 2)] = { instruction: "Listen carefully. The frequency digits are similar. Select the correct one.", drills: frL2 };
B[drill(LIS, "Frequency Recognition", 3)] = { instruction: "Listen carefully. Select the exact frequency.", drills: frL3 };
B[drill(LIS, "Frequency Recognition", 4)] = { instruction: "The frequency is inside a longer call. Listen carefully and select it.", drills: frL4 };
B[drill(LIS, "Frequency Recognition", 5)] = { instruction: "Listen to the full call. Pick out the frequency from the surrounding words.", drills: frL5 };
B[drill(LIS, "Frequency Recognition", 6)] = { instruction: "A busy call contains a frequency. Ignore other numbers and select the correct one.", drills: frL6 };

// ─── CLEARANCE RECOGNITION ────────────────────────────────────────────────────
// L1: most distinct clearances (takeoff / landing / hold short / cross / line up / hold pos).
// L2: commonly confused pairs — takeoff vs line up, continue approach vs cleared to land.
// L3: ground-movement clearances around the runway.
// L4: approach/landing clearances including go-around, with qualifying words.
// L5: clearance embedded with runway, weather, or extra context words.
// L6: meaning check — what does the clearance require you to do?
const clL1: LisDrill[] = [
  { atc: "Cleared for takeoff runway two four.", options: ["Cleared for takeoff", "Cleared to land", "Hold short", "Line up and wait"], correct: "Cleared for takeoff", feedback: "That is a takeoff clearance." },
  { atc: "Cleared to land runway two four.", options: ["Cleared to land", "Cleared for takeoff", "Continue approach", "Go around"], correct: "Cleared to land", feedback: "That is a landing clearance." },
  { atc: "Hold short of runway two four.", options: ["Hold short", "Cross runway", "Line up and wait", "Hold position"], correct: "Hold short", feedback: "Stop before the runway." },
  { atc: "Cross runway two four.", options: ["Cross runway", "Hold short", "Backtrack", "Vacate runway"], correct: "Cross runway", feedback: "You may cross the runway." },
  { atc: "Line up and wait runway two four.", options: ["Line up and wait", "Cleared for takeoff", "Hold short", "Backtrack"], correct: "Line up and wait", feedback: "Enter the runway and wait. No takeoff clearance yet." },
  { atc: "Hold position.", options: ["Hold position", "Hold short", "Line up and wait", "Give way"], correct: "Hold position", feedback: "Stop and stay where you are." },
];
const clL2: LisDrill[] = [
  { atc: "Line up and wait runway two four.", options: ["Line up and wait", "Cleared for takeoff", "Hold short", "Backtrack"], correct: "Line up and wait", feedback: "Line up and wait is NOT a takeoff clearance. Wait on the runway." },
  { atc: "Cleared for takeoff runway two four.", options: ["Cleared for takeoff", "Line up and wait", "Cleared to land", "Continue approach"], correct: "Cleared for takeoff", feedback: "Cleared for takeoff — you may depart now." },
  { atc: "Continue approach.", options: ["Continue approach", "Cleared to land", "Go around", "Hold"], correct: "Continue approach", feedback: "Continue approach means keep flying. No landing clearance yet." },
  { atc: "Go around, I say again, go around.", options: ["Go around", "Continue approach", "Cleared to land", "Hold"], correct: "Go around", feedback: "Discontinue the approach and climb." },
  { atc: "Backtrack runway two four.", options: ["Backtrack", "Line up and wait", "Vacate runway", "Cross runway"], correct: "Backtrack", feedback: "Taxi back along the runway." },
  { atc: "Vacate runway via Alfa.", options: ["Vacate runway", "Cross runway", "Hold short", "Continue taxi"], correct: "Vacate runway", feedback: "Leave the runway via Alfa." },
];
const clL3: LisDrill[] = [
  { atc: "Hold short of runway two four.", options: ["Hold short", "Cross runway", "Line up and wait", "Cleared to land"], correct: "Hold short", feedback: "Stop before the runway." },
  { atc: "Cross runway two four.", options: ["Cross runway", "Hold short", "Backtrack", "Vacate runway"], correct: "Cross runway", feedback: "You may cross the runway." },
  { atc: "Backtrack runway two four.", options: ["Backtrack", "Line up and wait", "Vacate runway", "Cross runway"], correct: "Backtrack", feedback: "Taxi back along the runway." },
  { atc: "Vacate runway via Alfa.", options: ["Vacate runway", "Cross runway", "Hold short", "Continue taxi"], correct: "Vacate runway", feedback: "Leave the runway via Alfa." },
  { atc: "Hold position, landing traffic.", options: ["Hold position", "Hold short", "Line up and wait", "Give way"], correct: "Hold position", feedback: "Stop and stay where you are." },
  { atc: "Continue approach, expect late landing clearance.", options: ["Continue approach", "Cleared to land", "Go around", "Hold"], correct: "Continue approach", feedback: "Keep flying the approach. Clearance will follow." },
];
const clL4: LisDrill[] = [
  { atc: "Go around, I say again, go around.", options: ["Go around", "Continue approach", "Cleared to land", "Hold"], correct: "Go around", feedback: "Discontinue the approach and climb." },
  { atc: "Continue approach.", options: ["Continue approach", "Go around", "Cleared to land", "Hold"], correct: "Continue approach", feedback: "Keep flying the approach, expect later clearance." },
  { atc: "Cleared to land runway two four.", options: ["Cleared to land", "Cleared for takeoff", "Continue approach", "Go around"], correct: "Cleared to land", feedback: "That is a landing clearance." },
  { atc: "Cleared for takeoff, wind calm.", options: ["Cleared for takeoff", "Line up and wait", "Cleared to land", "Continue approach"], correct: "Cleared for takeoff", feedback: "Cleared for takeoff — you may depart." },
  { atc: "Line up and wait, number two.", options: ["Line up and wait", "Cleared for takeoff", "Hold short", "Backtrack"], correct: "Line up and wait", feedback: "Enter the runway and wait. Not yet cleared for takeoff." },
  { atc: "Hold short runway two four, traffic on final.", options: ["Hold short", "Cross runway", "Continue approach", "Hold position"], correct: "Hold short", feedback: "Stop before the runway." },
];
const clL5: LisDrill[] = [
  { atc: "Behind the landing traffic, line up and wait runway two four.", options: ["Line up and wait", "Cleared for takeoff", "Hold short", "Backtrack"], correct: "Line up and wait", feedback: "Line up and wait — not a takeoff clearance." },
  { atc: "After the Airbus clears, cross runway two four.", options: ["Cross runway", "Hold short", "Backtrack", "Vacate runway"], correct: "Cross runway", feedback: "Cross the runway after the Airbus." },
  { atc: "Wind zero niner zero at one zero, cleared to land runway two four.", options: ["Cleared to land", "Cleared for takeoff", "Continue approach", "Go around"], correct: "Cleared to land", feedback: "That is a landing clearance, with wind info added." },
  { atc: "Continue approach, runway in sight, expect landing clearance shortly.", options: ["Continue approach", "Cleared to land", "Go around", "Hold"], correct: "Continue approach", feedback: "You are not cleared to land yet. Continue approach." },
  { atc: "Vacate runway via Alfa, contact Ground one two one decimal seven.", options: ["Vacate runway", "Cross runway", "Continue taxi", "Hold short"], correct: "Vacate runway", feedback: "Vacate the runway, then contact Ground." },
  { atc: "Behind the Vueling at Alfa One, backtrack runway two four.", options: ["Backtrack", "Line up and wait", "Vacate runway", "Cross runway"], correct: "Backtrack", feedback: "Taxi back along the runway." },
];
const clL6: LisDrill[] = [
  { atc: "Continue approach.", options: ["Keep flying, expect landing clearance later", "Land immediately", "Go around now", "Hold and wait"], correct: "Keep flying, expect landing clearance later", feedback: "Continue approach means keep flying. The landing clearance will follow." },
  { atc: "Line up and wait runway two four.", options: ["Enter the runway and wait for takeoff clearance", "Take off immediately", "Hold before the runway", "Cross the runway"], correct: "Enter the runway and wait for takeoff clearance", feedback: "Line up and wait — on the runway but NOT cleared to take off." },
  { atc: "Cleared for takeoff.", options: ["Take off now", "Line up on the runway", "Enter the runway", "Hold short"], correct: "Take off now", feedback: "Cleared for takeoff means you may depart immediately." },
  { atc: "Go around.", options: ["Climb away, do not land", "Land on the runway", "Hold on the runway", "Continue the approach"], correct: "Climb away, do not land", feedback: "Go around means abandon the approach and climb away." },
  { atc: "Hold short of runway two four.", options: ["Stop before the runway", "Enter the runway", "Cross the runway", "Taxi onto the runway"], correct: "Stop before the runway", feedback: "Hold short means stop before the runway threshold." },
  { atc: "Backtrack runway two four.", options: ["Taxi the opposite direction along the runway", "Cross the runway", "Vacate the runway", "Hold on the runway"], correct: "Taxi the opposite direction along the runway", feedback: "Backtrack means taxi back along the runway in the opposite direction." },
];
B[drill(LIS, "Clearance Recognition", 1)] = { instruction: "Listen and select the clearance type.", drills: clL1 };
B[drill(LIS, "Clearance Recognition", 2)] = { instruction: "These clearances sound similar. Listen carefully and select the correct one.", drills: clL2 };
B[drill(LIS, "Clearance Recognition", 3)] = { instruction: "Listen and select the clearance type.", drills: clL3 };
B[drill(LIS, "Clearance Recognition", 4)] = { instruction: "Listen and select the correct clearance.", drills: clL4 };
B[drill(LIS, "Clearance Recognition", 5)] = { instruction: "Listen to the full call and select the clearance.", drills: clL5 };
B[drill(LIS, "Clearance Recognition", 6)] = { instruction: "Select what this clearance requires you to do.", drills: clL6 };

// ─── INSTRUCTION RECOGNITION ──────────────────────────────────────────────────
// L1: common ground instructions (taxi / hold / give way).
// L2: transponder and frequency-action instructions (squawk / contact / monitor).
// L3: clarification, standby, and report instructions.
// L4: contact vs monitor distinction — same instruction type, different action required.
// L5: instruction embedded in a longer call with secondary context.
// L6: meaning check — what does this instruction actually require?
const inL1: LisDrill[] = [
  { atc: "Taxi to holding point Alfa One.", options: ["Taxi", "Hold position", "Cross runway", "Give way"], correct: "Taxi", feedback: "That is a taxi instruction." },
  { atc: "Hold position.", options: ["Hold position", "Taxi", "Line up and wait", "Give way"], correct: "Hold position", feedback: "Stop and stay where you are." },
  { atc: "Give way to traffic on your left.", options: ["Give way", "Hold position", "Follow traffic", "Continue"], correct: "Give way", feedback: "Let the other traffic go first." },
  { atc: "Continue taxi, follow the Airbus.", options: ["Continue taxi", "Hold position", "Give way", "Cross runway"], correct: "Continue taxi", feedback: "Keep taxiing behind the Airbus." },
  { atc: "Taxi to apron via Golf.", options: ["Taxi", "Hold position", "Cross runway", "Squawk"], correct: "Taxi", feedback: "That is a taxi instruction." },
  { atc: "Hold short of runway two four.", options: ["Hold short", "Taxi", "Cross runway", "Give way"], correct: "Hold short", feedback: "Stop before the runway." },
];
const inL2: LisDrill[] = [
  { atc: "Squawk four two one fife.", options: ["Squawk", "Contact Tower", "Say again", "Report ready"], correct: "Squawk", feedback: "Set the transponder code." },
  { atc: "Contact Tower one one eight decimal one.", options: ["Contact Tower", "Monitor Ground", "Contact Approach", "Squawk"], correct: "Contact Tower", feedback: "Change frequency and call Tower." },
  { atc: "Monitor Ground one two one decimal seven.", options: ["Monitor Ground", "Contact Ground", "Contact Tower", "Squawk"], correct: "Monitor Ground", feedback: "Change and listen only, do not call." },
  { atc: "Squawk seven zero zero zero.", options: ["Squawk", "Contact", "Report", "Standby"], correct: "Squawk", feedback: "Set the transponder to 7000." },
  { atc: "Contact Approach one two four decimal eight seven fife.", options: ["Contact Approach", "Monitor Approach", "Squawk", "Report ready"], correct: "Contact Approach", feedback: "Change frequency and call Approach." },
  { atc: "Monitor Tower one one eight decimal one.", options: ["Monitor Tower", "Contact Tower", "Squawk", "Report ready"], correct: "Monitor Tower", feedback: "Change to Tower and listen only." },
];
const inL3: LisDrill[] = [
  { atc: "Say again your callsign.", options: ["Say again", "Standby", "Report ready", "Wilco"], correct: "Say again", feedback: "ATC is asking you to say again." },
  { atc: "Standby.", options: ["Standby", "Wilco", "Say again", "Report ready"], correct: "Standby", feedback: "Wait, ATC will call you back." },
  { atc: "Report ready for departure.", options: ["Report ready", "Standby", "Say again", "Hold"], correct: "Report ready", feedback: "Tell ATC when you are ready." },
  { atc: "Say again all after ground.", options: ["Say again", "Standby", "Report", "Confirm"], correct: "Say again", feedback: "ATC wants you to repeat from after ground." },
  { atc: "Report established on ILS.", options: ["Report established", "Report ready", "Standby", "Say again"], correct: "Report established", feedback: "Tell ATC when you are on the ILS." },
  { atc: "Confirm squawk code.", options: ["Confirm", "Say again", "Standby", "Wilco"], correct: "Confirm", feedback: "ATC wants you to verify your squawk." },
];
const inL4: LisDrill[] = [
  { atc: "Contact Tower one one eight decimal one.", options: ["Contact Tower", "Monitor Tower", "Squawk", "Report ready"], correct: "Contact Tower", feedback: "Contact means change and call." },
  { atc: "Monitor Ground one two one decimal seven.", options: ["Monitor Ground", "Contact Ground", "Contact Tower", "Squawk"], correct: "Monitor Ground", feedback: "Monitor means change and listen only, do not call." },
  { atc: "Contact Approach one two four decimal eight seven fife.", options: ["Contact Approach", "Monitor Approach", "Monitor Ground", "Squawk"], correct: "Contact Approach", feedback: "Contact means change and call." },
  { atc: "Monitor Approach one tree two decimal one fife.", options: ["Monitor Approach", "Contact Approach", "Contact Tower", "Squawk"], correct: "Monitor Approach", feedback: "Monitor means listen only." },
  { atc: "Contact Director one one niner decimal fife.", options: ["Contact Director", "Monitor Director", "Contact Tower", "Squawk"], correct: "Contact Director", feedback: "Contact means change and call." },
  { atc: "Monitor Information one two fife decimal two fife.", options: ["Monitor Information", "Contact Information", "Contact Ground", "Report ready"], correct: "Monitor Information", feedback: "Monitor means change and listen only." },
];
const inL5: LisDrill[] = [
  { atc: "Give way to traffic on your left, then continue taxi.", options: ["Give way", "Continue taxi", "Hold position", "Cross runway"], correct: "Give way", feedback: "Give way first, then continue taxi." },
  { atc: "After the landing traffic clears, cross runway two four.", options: ["Cross runway", "Hold short", "Continue taxi", "Hold position"], correct: "Cross runway", feedback: "Cross the runway after the landing traffic clears." },
  { atc: "Taxi to holding point Alfa One via Bravo, hold short of runway.", options: ["Taxi to holding point", "Hold short of runway", "Cross runway", "Report ready"], correct: "Taxi to holding point", feedback: "Taxi first, then hold short at the runway." },
  { atc: "Squawk four two one fife, and report when ready for departure.", options: ["Squawk", "Report ready", "Contact Tower", "Hold position"], correct: "Squawk", feedback: "Squawk first, then report ready." },
  { atc: "Contact Ground one two one decimal seven when clear of the runway.", options: ["Contact Ground", "Monitor Ground", "Squawk", "Taxi"], correct: "Contact Ground", feedback: "Contact Ground after clearing the runway." },
  { atc: "Standby, I will call you in two minutes.", options: ["Standby", "Say again", "Roger", "Wilco"], correct: "Standby", feedback: "Wait, ATC will contact you." },
];
const inL6: LisDrill[] = [
  { atc: "Monitor Ground one two one decimal seven.", options: ["Change to 121.700 and listen, do not call", "Call Ground on 121.700", "Stay on current frequency", "Call Ground on current frequency"], correct: "Change to 121.700 and listen, do not call", feedback: "Monitor means change frequency and listen only. Do not make a call." },
  { atc: "Continue taxi, follow the Airbus, hold short of runway two four.", options: ["Stop before the runway after following the Airbus", "Cross the runway", "Follow the Airbus onto the runway", "Stop immediately"], correct: "Stop before the runway after following the Airbus", feedback: "Follow the Airbus and hold short of the runway — do not enter the runway." },
  { atc: "Say again your callsign.", options: ["Repeat your callsign", "Change your callsign", "Confirm your squawk", "Wait for ATC"], correct: "Repeat your callsign", feedback: "Say again means repeat what you said." },
  { atc: "Squawk seven zero zero zero.", options: ["Set 7000 on the transponder", "Tune 7000 on the radio", "Report at 7000 feet", "Contact 7000 on the radio"], correct: "Set 7000 on the transponder", feedback: "Squawk means set the transponder code to 7000." },
  { atc: "Standby.", options: ["Wait, ATC will call you back", "Call ATC back in one minute", "Change frequency", "Report when ready"], correct: "Wait, ATC will call you back", feedback: "Standby means wait — ATC is busy and will call you." },
  { atc: "Report established on ILS.", options: ["Call ATC when on the ILS approach path", "Report when the runway is in sight", "Confirm ILS frequency", "Contact Tower on ILS"], correct: "Call ATC when on the ILS approach path", feedback: "Report established means tell ATC when you are on the ILS." },
];
B[drill(LIS, "Instruction Recognition", 1)] = { instruction: "Listen and select the instruction ATC gave.", drills: inL1 };
B[drill(LIS, "Instruction Recognition", 2)] = { instruction: "Listen and select the instruction type.", drills: inL2 };
B[drill(LIS, "Instruction Recognition", 3)] = { instruction: "Listen and select the instruction ATC gave.", drills: inL3 };
B[drill(LIS, "Instruction Recognition", 4)] = { instruction: "Contact means call them. Monitor means listen only. Select the correct instruction.", drills: inL4 };
B[drill(LIS, "Instruction Recognition", 5)] = { instruction: "Listen to the full call and select the primary instruction.", drills: inL5 };
B[drill(LIS, "Instruction Recognition", 6)] = { instruction: "Select what this instruction means.", drills: inL6 };

// ─── MIXED ATC LISTENING ──────────────────────────────────────────────────────
// Each mixed level samples the matching difficulty tier from all four categories
// (3 items each = 12 per pool). useDrillSet caps to 10 per attempt.
const mxL1: LisDrill[] = [...csL1.slice(0, 3), ...frL1.slice(0, 3), ...clL1.slice(0, 3), ...inL1.slice(0, 3)];
const mxL2: LisDrill[] = [...csL2.slice(0, 3), ...frL2.slice(0, 3), ...clL2.slice(0, 3), ...inL2.slice(0, 3)];
const mxL3: LisDrill[] = [...csL3.slice(0, 3), ...frL3.slice(0, 3), ...clL3.slice(0, 3), ...inL3.slice(0, 3)];
const mxL4: LisDrill[] = [...csL4.slice(0, 3), ...frL4.slice(0, 3), ...clL4.slice(0, 3), ...inL4.slice(0, 3)];
const mxL5: LisDrill[] = [...csL5.slice(0, 3), ...frL5.slice(0, 3), ...clL5.slice(0, 3), ...inL5.slice(0, 3)];
const mxL6: LisDrill[] = [...csL6.slice(0, 3), ...frL6.slice(0, 3), ...clL6.slice(0, 3), ...inL6.slice(0, 3)];
B[drill(LIS, "Mixed ATC Listening", 1)] = { instruction: "Mixed ATC calls. Select the correct answer.", drills: mxL1 };
B[drill(LIS, "Mixed ATC Listening", 2)] = { instruction: "Mixed ATC calls. Select the correct answer.", drills: mxL2 };
B[drill(LIS, "Mixed ATC Listening", 3)] = { instruction: "Mixed ATC calls. Select the correct answer.", drills: mxL3 };
B[drill(LIS, "Mixed ATC Listening", 4)] = { instruction: "Mixed ATC calls. Listen carefully and select the correct answer.", drills: mxL4 };
B[drill(LIS, "Mixed ATC Listening", 5)] = { instruction: "Mixed ATC calls. These are challenging. Select the correct answer.", drills: mxL5 };
B[drill(LIS, "Mixed ATC Listening", 6)] = { instruction: "Final mixed challenge. Listen carefully and select the correct answer.", drills: mxL6 };

/* ================= READBACKS MODULE (30 drills) =================
 * Six distinct pools per group — one per Level. Each level is harder than the
 * previous by adding at least one difficulty lever: station variety,
 * contact/monitor distinction, 5-figure frequencies, ident, registration
 * callsigns, or a short two-item readback. IDs are unchanged (drill-1..6).
 * useDrillSet still shuffles and caps each pool to 10 rounds per attempt. */
const RB = "cadet-readbacks";
type RbDrill = { atc: string; atcSpoken?: string; expected: string; feedback?: string; acceptedVariants?: string[] };

/**
 * Expands a numeric altitude like "2000" to its spoken form "two thousand"
 * for use in acceptedVariants on altitude readback drills. Reuses the shared
 * altitudeSpokenForm() so Numbers and Cadet Readbacks stay consistent.
 */
function rbWithSpokenAlt(d: RbDrill): RbDrill {
  const spokenExpected = d.expected.replace(/\b(\d{4})\b/g, (m) => altitudeSpokenForm(parseInt(m, 10)) ?? m);
  if (spokenExpected === d.expected) return d; // no altitude found – no change
  const variant = spokenExpected.toLowerCase().replace(/,/g, "").replace(/\s+/g, " ").trim();
  return { ...d, acceptedVariants: [...(d.acceptedVariants ?? []), variant] };
}

// ─── FREQUENCY CHANGES ────────────────────────────────────────────────────────
// L1: contact Tower/Ground only, 118.100/121.700, airline callsigns.
// L2: extended stations (Approach/Departure/Radar), standard frequencies.
// L3: contact vs monitor distinction introduced.
// L4: 5-figure frequencies + Director/Information/Radar stations.
// L5: registration callsigns + less common stations.
// L6: two-item readback (e.g. vacate + frequency, or frequency + report).
const fcL1: RbDrill[] = [
  { atc: "Iberia 325, contact Tower one one eight decimal one.", atcSpoken: "Iberia three two five, contact Tower one one eight decimal one.", expected: "Contact Tower 118.100, Iberia 325" },
  { atc: "Ryanair 467, contact Ground one two one decimal seven.", atcSpoken: "Ryanair four six seven, contact Ground one two one decimal seven.", expected: "Contact Ground 121.700, Ryanair 467" },
  { atc: "Vueling 218, contact Tower one one eight decimal one.", atcSpoken: "Vueling two one eight, contact Tower one one eight decimal one.", expected: "Contact Tower 118.100, Vueling 218" },
  { atc: "Speedbird 102, contact Ground one two one decimal seven.", atcSpoken: "Speedbird one zero two, contact Ground one two one decimal seven.", expected: "Contact Ground 121.700, Speedbird 102" },
  { atc: "Air France 743, contact Tower one one eight decimal one.", atcSpoken: "Air France seven four three, contact Tower one one eight decimal one.", expected: "Contact Tower 118.100, Air France 743" },
  { atc: "Wizz Air 312, contact Ground one two one decimal seven.", atcSpoken: "Wizz Air three one two, contact Ground one two one decimal seven.", expected: "Contact Ground 121.700, Wizz Air 312" },
];
const fcL2: RbDrill[] = [
  { atc: "Iberia 325, contact Approach one two zero decimal niner.", atcSpoken: "Iberia three two five, contact Approach one two zero decimal niner.", expected: "Contact Approach 120.900, Iberia 325" },
  { atc: "Ryanair 467, contact Departure one two zero decimal tree.", atcSpoken: "Ryanair four six seven, contact Departure one two zero decimal tree.", expected: "Contact Departure 120.300, Ryanair 467" },
  { atc: "Vueling 218, contact Radar one one niner decimal fife.", atcSpoken: "Vueling two one eight, contact Radar one one niner decimal fife.", expected: "Contact Radar 119.500, Vueling 218" },
  { atc: "Speedbird 102, contact Tower one one eight decimal one.", atcSpoken: "Speedbird one zero two, contact Tower one one eight decimal one.", expected: "Contact Tower 118.100, Speedbird 102" },
  { atc: "Air France 743, contact Approach one two zero decimal niner.", atcSpoken: "Air France seven four three, contact Approach one two zero decimal niner.", expected: "Contact Approach 120.900, Air France 743" },
  { atc: "Lufthansa 551, return to Ground one two one decimal seven.", atcSpoken: "Lufthansa five five one, return to Ground one two one decimal seven.", expected: "Return to Ground 121.700, Lufthansa 551" },
];
const fcL3: RbDrill[] = [
  { atc: "Iberia 325, monitor Tower one one eight decimal one.", atcSpoken: "Iberia three two five, monitor Tower one one eight decimal one.", expected: "Monitor Tower 118.100, Iberia 325" },
  { atc: "Ryanair 467, contact Tower one one eight decimal one.", atcSpoken: "Ryanair four six seven, contact Tower one one eight decimal one.", expected: "Contact Tower 118.100, Ryanair 467" },
  { atc: "Vueling 218, monitor Ground one two one decimal seven.", atcSpoken: "Vueling two one eight, monitor Ground one two one decimal seven.", expected: "Monitor Ground 121.700, Vueling 218" },
  { atc: "Speedbird 102, contact Approach one two zero decimal niner.", atcSpoken: "Speedbird one zero two, contact Approach one two zero decimal niner.", expected: "Contact Approach 120.900, Speedbird 102" },
  { atc: "Air France 743, monitor Approach one two zero decimal niner.", atcSpoken: "Air France seven four three, monitor Approach one two zero decimal niner.", expected: "Monitor Approach 120.900, Air France 743" },
  { atc: "Lufthansa 551, contact Departure one two zero decimal tree.", atcSpoken: "Lufthansa five five one, contact Departure one two zero decimal tree.", expected: "Contact Departure 120.300, Lufthansa 551" },
];
const fcL4: RbDrill[] = [
  { atc: "Iberia 325, contact Director one one niner decimal tree fife.", atcSpoken: "Iberia three two five, contact Director one one niner decimal tree fife.", expected: "Contact Director 119.350, Iberia 325" },
  { atc: "Ryanair 467, contact Information one two fife decimal two fife.", atcSpoken: "Ryanair four six seven, contact Information one two fife decimal two fife.", expected: "Contact Information 125.250, Ryanair 467" },
  { atc: "Vueling 218, monitor Approach one two four decimal eight seven fife.", atcSpoken: "Vueling two one eight, monitor Approach one two four decimal eight seven fife.", expected: "Monitor Approach 124.875, Vueling 218" },
  { atc: "Speedbird 102, contact Radar one two zero decimal eight seven fife.", atcSpoken: "Speedbird one zero two, contact Radar one two zero decimal eight seven fife.", expected: "Contact Radar 120.875, Speedbird 102" },
  { atc: "Air France 743, monitor Tower one one eight decimal six fife.", atcSpoken: "Air France seven four three, monitor Tower one one eight decimal six fife.", expected: "Monitor Tower 118.650, Air France 743" },
  { atc: "Lufthansa 551, contact Director one one niner decimal fife.", atcSpoken: "Lufthansa five five one, contact Director one one niner decimal fife.", expected: "Contact Director 119.500, Lufthansa 551" },
];
const fcL5: RbDrill[] = [
  { atc: "G-ABCD, contact Ground one two one decimal seven.", atcSpoken: "Golf Alfa Bravo Charlie Delta, contact Ground one two one decimal seven.", expected: "Contact Ground 121.700, G-ABCD" },
  { atc: "EI-DUB, contact Tower one one eight decimal one.", atcSpoken: "Echo India Delta Uniform Bravo, contact Tower one one eight decimal one.", expected: "Contact Tower 118.100, EI-DUB" },
  { atc: "EC-ABC, monitor Approach one two four decimal eight seven fife.", atcSpoken: "Echo Charlie Alfa Bravo Charlie, monitor Approach one two four decimal eight seven fife.", expected: "Monitor Approach 124.875, EC-ABC" },
  { atc: "G-BCDE, contact Director one one niner decimal fife.", atcSpoken: "Golf Bravo Charlie Delta Echo, contact Director one one niner decimal fife.", expected: "Contact Director 119.500, G-BCDE" },
  { atc: "EI-UDB, contact Radar one two zero decimal niner.", atcSpoken: "Echo India Uniform Delta Bravo, contact Radar one two zero decimal niner.", expected: "Contact Radar 120.900, EI-UDB" },
  { atc: "EC-DEF, monitor Ground one two one decimal seven.", atcSpoken: "Echo Charlie Delta Echo Foxtrot, monitor Ground one two one decimal seven.", expected: "Monitor Ground 121.700, EC-DEF" },
];
const fcL6: RbDrill[] = [
  { atc: "Iberia 325, vacate via Alfa, contact Ground one two one decimal seven.", atcSpoken: "Iberia three two five, vacate via Alfa, contact Ground one two one decimal seven.", expected: "Vacate via Alfa, contact Ground 121.700, Iberia 325" },
  { atc: "Ryanair 467, cross runway two four, contact Tower one one eight decimal one.", atcSpoken: "Ryanair four six seven, cross runway two four, contact Tower one one eight decimal one.", expected: "Cross runway two four, contact Tower 118.100, Ryanair 467" },
  { atc: "Vueling 218, contact Approach one two four decimal eight seven fife, report final.", atcSpoken: "Vueling two one eight, contact Approach one two four decimal eight seven fife, report final.", expected: "Contact Approach 124.875, report final, Vueling 218" },
  { atc: "Speedbird 102, monitor Tower one one eight decimal one, report when ready.", atcSpoken: "Speedbird one zero two, monitor Tower one one eight decimal one, report when ready.", expected: "Monitor Tower 118.100, report when ready, Speedbird 102" },
  { atc: "Air France 743, contact Radar one two zero decimal niner, report established.", atcSpoken: "Air France seven four three, contact Radar one two zero decimal niner, report established.", expected: "Contact Radar 120.900, report established, Air France 743" },
  { atc: "Lufthansa 551, contact Director one one niner decimal fife, report airborne.", atcSpoken: "Lufthansa five five one, contact Director one one niner decimal fife, report airborne.", expected: "Contact Director 119.500, report airborne, Lufthansa 551" },
];
B[drill(RB, "Frequency Changes", 1)] = { instruction: "Read back the frequency change with your callsign.", drills: fcL1 };
B[drill(RB, "Frequency Changes", 2)] = { instruction: "Read back the frequency change with your callsign.", drills: fcL2 };
B[drill(RB, "Frequency Changes", 3)] = { instruction: "Contact means call them. Monitor means listen only. Read back with your callsign.", drills: fcL3 };
B[drill(RB, "Frequency Changes", 4)] = { instruction: "Read back the frequency change with your callsign.", drills: fcL4 };
B[drill(RB, "Frequency Changes", 5)] = { instruction: "Read back the frequency change with your callsign.", drills: fcL5 };
B[drill(RB, "Frequency Changes", 6)] = { instruction: "Two items to read back. Echo both, then add your callsign.", drills: fcL6 };

// ─── SQUAWK INSTRUCTIONS ──────────────────────────────────────────────────────
// L1: simple 4-digit codes, varied airline callsigns.
// L2: special/common codes (7000 / 2000 / 1200), airline callsigns.
// L3: confusable digit groups, airline callsigns.
// L4: squawk + ident, airline callsigns.
// L5: registration callsigns + varied codes.
// L6: squawk + second instruction (contact or report).
const sqL1: RbDrill[] = [
  { atc: "Iberia 325, squawk four two one fife.", atcSpoken: "Iberia three two five, squawk four two one fife.", expected: "Squawk 4215, Iberia 325" },
  { atc: "Ryanair 467, squawk one two tree four.", atcSpoken: "Ryanair four six seven, squawk one two tree four.", expected: "Squawk 1234, Ryanair 467" },
  { atc: "Vueling 218, squawk six zero zero one.", atcSpoken: "Vueling two one eight, squawk six zero zero one.", expected: "Squawk 6001, Vueling 218" },
  { atc: "Speedbird 102, squawk tree four two one.", atcSpoken: "Speedbird one zero two, squawk tree four two one.", expected: "Squawk 3421, Speedbird 102" },
  { atc: "Air France 743, squawk two one four tree.", atcSpoken: "Air France seven four three, squawk two one four tree.", expected: "Squawk 2143, Air France 743" },
  { atc: "Lufthansa 551, squawk fife zero one four.", atcSpoken: "Lufthansa five five one, squawk fife zero one four.", expected: "Squawk 5014, Lufthansa 551" },
];
const sqL2: RbDrill[] = [
  { atc: "Iberia 325, squawk seven zero zero zero.", atcSpoken: "Iberia three two five, squawk seven zero zero zero.", expected: "Squawk 7000, Iberia 325" },
  { atc: "Ryanair 467, squawk two zero zero zero.", atcSpoken: "Ryanair four six seven, squawk two zero zero zero.", expected: "Squawk 2000, Ryanair 467" },
  { atc: "Vueling 218, squawk seven zero zero zero.", atcSpoken: "Vueling two one eight, squawk seven zero zero zero.", expected: "Squawk 7000, Vueling 218" },
  { atc: "Speedbird 102, squawk one two zero zero.", atcSpoken: "Speedbird one zero two, squawk one two zero zero.", expected: "Squawk 1200, Speedbird 102" },
  { atc: "Air France 743, squawk two zero zero zero.", atcSpoken: "Air France seven four three, squawk two zero zero zero.", expected: "Squawk 2000, Air France 743" },
  { atc: "Lufthansa 551, squawk seven zero zero zero.", atcSpoken: "Lufthansa five five one, squawk seven zero zero zero.", expected: "Squawk 7000, Lufthansa 551" },
];
const sqL3: RbDrill[] = [
  { atc: "Iberia 325, squawk two four one fife.", atcSpoken: "Iberia three two five, squawk two four one fife.", expected: "Squawk 2415, Iberia 325" },
  { atc: "Ryanair 467, squawk four six zero one.", atcSpoken: "Ryanair four six seven, squawk four six zero one.", expected: "Squawk 4601, Ryanair 467" },
  { atc: "Vueling 218, squawk fife fife two zero.", atcSpoken: "Vueling two one eight, squawk fife fife two zero.", expected: "Squawk 5520, Vueling 218" },
  { atc: "Speedbird 102, squawk tree six four two.", atcSpoken: "Speedbird one zero two, squawk tree six four two.", expected: "Squawk 3642, Speedbird 102" },
  { atc: "Air France 743, squawk two two zero zero.", atcSpoken: "Air France seven four three, squawk two two zero zero.", expected: "Squawk 2200, Air France 743" },
  { atc: "Lufthansa 551, squawk four fife six tree.", atcSpoken: "Lufthansa five five one, squawk four fife six tree.", expected: "Squawk 4563, Lufthansa 551" },
];
const sqL4: RbDrill[] = [
  { atc: "Iberia 325, squawk four six zero one, ident.", atcSpoken: "Iberia three two five, squawk four six zero one, ident.", expected: "Squawk 4601, ident, Iberia 325" },
  { atc: "Ryanair 467, squawk two four one fife, ident.", atcSpoken: "Ryanair four six seven, squawk two four one fife, ident.", expected: "Squawk 2415, ident, Ryanair 467" },
  { atc: "Vueling 218, squawk fife fife two zero, ident.", atcSpoken: "Vueling two one eight, squawk fife fife two zero, ident.", expected: "Squawk 5520, ident, Vueling 218" },
  { atc: "Speedbird 102, squawk tree six four two, ident.", atcSpoken: "Speedbird one zero two, squawk tree six four two, ident.", expected: "Squawk 3642, ident, Speedbird 102" },
  { atc: "Air France 743, squawk seven zero zero zero, ident.", atcSpoken: "Air France seven four three, squawk seven zero zero zero, ident.", expected: "Squawk 7000, ident, Air France 743" },
  { atc: "Lufthansa 551, squawk two two zero zero, ident.", atcSpoken: "Lufthansa five five one, squawk two two zero zero, ident.", expected: "Squawk 2200, ident, Lufthansa 551" },
];
const sqL5: RbDrill[] = [
  { atc: "G-ABCD, squawk seven zero zero zero.", atcSpoken: "Golf Alfa Bravo Charlie Delta, squawk seven zero zero zero.", expected: "Squawk 7000, G-ABCD" },
  { atc: "EI-DUB, squawk four two one fife.", atcSpoken: "Echo India Delta Uniform Bravo, squawk four two one fife.", expected: "Squawk 4215, EI-DUB" },
  { atc: "EC-ABC, squawk two four one fife.", atcSpoken: "Echo Charlie Alfa Bravo Charlie, squawk two four one fife.", expected: "Squawk 2415, EC-ABC" },
  { atc: "G-BCDE, squawk fife fife two zero.", atcSpoken: "Golf Bravo Charlie Delta Echo, squawk fife fife two zero.", expected: "Squawk 5520, G-BCDE" },
  { atc: "EI-UDB, squawk tree six four two.", atcSpoken: "Echo India Uniform Delta Bravo, squawk tree six four two.", expected: "Squawk 3642, EI-UDB" },
  { atc: "EC-DEF, squawk two zero zero zero.", atcSpoken: "Echo Charlie Delta Echo Foxtrot, squawk two zero zero zero.", expected: "Squawk 2000, EC-DEF" },
];
const sqL6: RbDrill[] = [
  { atc: "Iberia 325, squawk two two zero zero, contact Tower one one eight decimal one.", atcSpoken: "Iberia three two five, squawk two two zero zero, contact Tower one one eight decimal one.", expected: "Squawk 2200, contact Tower 118.100, Iberia 325" },
  { atc: "Ryanair 467, squawk seven zero zero zero, report ready for departure.", atcSpoken: "Ryanair four six seven, squawk seven zero zero zero, report ready for departure.", expected: "Squawk 7000, report ready for departure, Ryanair 467" },
  { atc: "Vueling 218, squawk four two one fife, contact Ground one two one decimal seven.", atcSpoken: "Vueling two one eight, squawk four two one fife, contact Ground one two one decimal seven.", expected: "Squawk 4215, contact Ground 121.700, Vueling 218" },
  { atc: "Speedbird 102, squawk two four one fife, report airborne.", atcSpoken: "Speedbird one zero two, squawk two four one fife, report airborne.", expected: "Squawk 2415, report airborne, Speedbird 102" },
  { atc: "Air France 743, squawk tree six four two, contact Departure one two zero decimal tree.", atcSpoken: "Air France seven four three, squawk tree six four two, contact Departure one two zero decimal tree.", expected: "Squawk 3642, contact Departure 120.300, Air France 743" },
  { atc: "Lufthansa 551, squawk six zero zero one, contact Approach one two four decimal eight seven fife.", atcSpoken: "Lufthansa five five one, squawk six zero zero one, contact Approach one two four decimal eight seven fife.", expected: "Squawk 6001, contact Approach 124.875, Lufthansa 551" },
];
B[drill(RB, "Squawk Instructions", 1)] = { instruction: "Read back the squawk code with your callsign.", drills: sqL1 };
B[drill(RB, "Squawk Instructions", 2)] = { instruction: "Read back the squawk code with your callsign.", drills: sqL2 };
B[drill(RB, "Squawk Instructions", 3)] = { instruction: "Read back the squawk code with your callsign.", drills: sqL3 };
B[drill(RB, "Squawk Instructions", 4)] = { instruction: "Read back the squawk code and ident with your callsign.", drills: sqL4 };
B[drill(RB, "Squawk Instructions", 5)] = { instruction: "Read back the squawk code with your callsign.", drills: sqL5 };
B[drill(RB, "Squawk Instructions", 6)] = { instruction: "Two items to read back. Echo both, then add your callsign.", drills: sqL6 };

// ─── HEADING INSTRUCTIONS ─────────────────────────────────────────────────────
// L1: "turn heading X", no direction qualifier, common values, airline callsigns.
// L2: "fly heading X", no direction qualifier, different values, airline callsigns.
// L3: left/right direction included in ATC and readback.
// L4: non-cardinal headings with leading zeros + direction.
// L5: registration callsigns + varied headings.
// L6: heading + one extra simple item.
const hdL1: RbDrill[] = [
  { atc: "Iberia 325, turn heading zero niner zero.", atcSpoken: "Iberia three two five, turn heading zero niner zero.", expected: "Heading 090, Iberia 325" },
  { atc: "Ryanair 467, turn heading one eight zero.", atcSpoken: "Ryanair four six seven, turn heading one eight zero.", expected: "Heading 180, Ryanair 467" },
  { atc: "Vueling 218, turn heading two seven zero.", atcSpoken: "Vueling two one eight, turn heading two seven zero.", expected: "Heading 270, Vueling 218" },
  { atc: "Speedbird 102, turn heading tree six zero.", atcSpoken: "Speedbird one zero two, turn heading tree six zero.", expected: "Heading 360, Speedbird 102" },
  { atc: "Air France 743, turn heading one two zero.", atcSpoken: "Air France seven four three, turn heading one two zero.", expected: "Heading 120, Air France 743" },
  { atc: "Lufthansa 551, turn heading two one zero.", atcSpoken: "Lufthansa five five one, turn heading two one zero.", expected: "Heading 210, Lufthansa 551" },
];
const hdL2: RbDrill[] = [
  { atc: "Iberia 325, fly heading one fife zero.", atcSpoken: "Iberia three two five, fly heading one fife zero.", expected: "Heading 150, Iberia 325" },
  { atc: "Ryanair 467, fly heading two four zero.", atcSpoken: "Ryanair four six seven, fly heading two four zero.", expected: "Heading 240, Ryanair 467" },
  { atc: "Vueling 218, fly heading tree zero zero.", atcSpoken: "Vueling two one eight, fly heading tree zero zero.", expected: "Heading 300, Vueling 218" },
  { atc: "Speedbird 102, fly heading zero six zero.", atcSpoken: "Speedbird one zero two, fly heading zero six zero.", expected: "Heading 060, Speedbird 102" },
  { atc: "Air France 743, fly heading tree tree zero.", atcSpoken: "Air France seven four three, fly heading tree tree zero.", expected: "Heading 330, Air France 743" },
  { atc: "Lufthansa 551, fly heading zero tree zero.", atcSpoken: "Lufthansa five five one, fly heading zero tree zero.", expected: "Heading 030, Lufthansa 551" },
];
const hdL3: RbDrill[] = [
  { atc: "Iberia 325, turn left heading tree six zero.", atcSpoken: "Iberia three two five, turn left heading tree six zero.", expected: "Left heading 360, Iberia 325" },
  { atc: "Ryanair 467, turn right heading zero niner zero.", atcSpoken: "Ryanair four six seven, turn right heading zero niner zero.", expected: "Right heading 090, Ryanair 467" },
  { atc: "Vueling 218, turn left heading two seven zero.", atcSpoken: "Vueling two one eight, turn left heading two seven zero.", expected: "Left heading 270, Vueling 218" },
  { atc: "Speedbird 102, turn right heading one eight zero.", atcSpoken: "Speedbird one zero two, turn right heading one eight zero.", expected: "Right heading 180, Speedbird 102" },
  { atc: "Air France 743, turn left heading two one zero.", atcSpoken: "Air France seven four three, turn left heading two one zero.", expected: "Left heading 210, Air France 743" },
  { atc: "Lufthansa 551, turn right heading one two zero.", atcSpoken: "Lufthansa five five one, turn right heading one two zero.", expected: "Right heading 120, Lufthansa 551" },
];
const hdL4: RbDrill[] = [
  { atc: "Iberia 325, turn right heading zero four fife.", atcSpoken: "Iberia three two five, turn right heading zero four fife.", expected: "Right heading 045, Iberia 325" },
  { atc: "Ryanair 467, turn left heading zero tree zero.", atcSpoken: "Ryanair four six seven, turn left heading zero tree zero.", expected: "Left heading 030, Ryanair 467" },
  { atc: "Vueling 218, turn right heading zero six zero.", atcSpoken: "Vueling two one eight, turn right heading zero six zero.", expected: "Right heading 060, Vueling 218" },
  { atc: "Speedbird 102, turn left heading zero two fife.", atcSpoken: "Speedbird one zero two, turn left heading zero two fife.", expected: "Left heading 025, Speedbird 102" },
  { atc: "Air France 743, turn right heading zero eight zero.", atcSpoken: "Air France seven four three, turn right heading zero eight zero.", expected: "Right heading 080, Air France 743" },
  { atc: "Lufthansa 551, fly heading zero one fife.", atcSpoken: "Lufthansa five five one, fly heading zero one fife.", expected: "Heading 015, Lufthansa 551" },
];
const hdL5: RbDrill[] = [
  { atc: "G-ABCD, fly heading one fife zero.", atcSpoken: "Golf Alfa Bravo Charlie Delta, fly heading one fife zero.", expected: "Heading 150, G-ABCD" },
  { atc: "EI-DUB, turn right heading zero niner zero.", atcSpoken: "Echo India Delta Uniform Bravo, turn right heading zero niner zero.", expected: "Right heading 090, EI-DUB" },
  { atc: "EC-ABC, turn left heading two seven zero.", atcSpoken: "Echo Charlie Alfa Bravo Charlie, turn left heading two seven zero.", expected: "Left heading 270, EC-ABC" },
  { atc: "G-BCDE, fly heading tree tree zero.", atcSpoken: "Golf Bravo Charlie Delta Echo, fly heading tree tree zero.", expected: "Heading 330, G-BCDE" },
  { atc: "EI-UDB, turn right heading two four zero.", atcSpoken: "Echo India Uniform Delta Bravo, turn right heading two four zero.", expected: "Right heading 240, EI-UDB" },
  { atc: "EC-DEF, turn left heading one two zero.", atcSpoken: "Echo Charlie Delta Echo Foxtrot, turn left heading one two zero.", expected: "Left heading 120, EC-DEF" },
];
const hdL6: RbDrill[] = [
  { atc: "Iberia 325, turn right heading zero six zero, report established.", atcSpoken: "Iberia three two five, turn right heading zero six zero, report established.", expected: "Right heading 060, report established, Iberia 325" },
  { atc: "Ryanair 467, fly heading zero niner zero, contact Departure one two zero decimal tree.", atcSpoken: "Ryanair four six seven, fly heading zero niner zero, contact Departure one two zero decimal tree.", expected: "Heading 090, contact Departure 120.300, Ryanair 467" },
  { atc: "Vueling 218, turn left heading two seven zero, report runway in sight.", atcSpoken: "Vueling two one eight, turn left heading two seven zero, report runway in sight.", expected: "Left heading 270, report runway in sight, Vueling 218" },
  { atc: "Speedbird 102, fly heading one eight zero, contact Approach one two four decimal eight seven fife.", atcSpoken: "Speedbird one zero two, fly heading one eight zero, contact Approach one two four decimal eight seven fife.", expected: "Heading 180, contact Approach 124.875, Speedbird 102" },
  { atc: "Air France 743, turn right heading one two zero, report turning.", atcSpoken: "Air France seven four three, turn right heading one two zero, report turning.", expected: "Right heading 120, report turning, Air France 743" },
  { atc: "Lufthansa 551, turn left heading two four zero, contact Radar one two zero decimal niner.", atcSpoken: "Lufthansa five five one, turn left heading two four zero, contact Radar one two zero decimal niner.", expected: "Left heading 240, contact Radar 120.900, Lufthansa 551" },
];
B[drill(RB, "Heading Instructions", 1)] = { instruction: "Read back the heading with your callsign.", drills: hdL1 };
B[drill(RB, "Heading Instructions", 2)] = { instruction: "Read back the heading with your callsign.", drills: hdL2 };
B[drill(RB, "Heading Instructions", 3)] = { instruction: "Include the turn direction in your readback.", drills: hdL3 };
B[drill(RB, "Heading Instructions", 4)] = { instruction: "Include the turn direction in your readback.", drills: hdL4 };
B[drill(RB, "Heading Instructions", 5)] = { instruction: "Read back the heading with your callsign.", drills: hdL5 };
B[drill(RB, "Heading Instructions", 6)] = { instruction: "Two items to read back. Echo both, then add your callsign.", drills: hdL6 };

// ─── ALTITUDE INSTRUCTIONS ────────────────────────────────────────────────────
// L1: simple climb, round thousands, airline callsigns.
// L2: simple descend, round thousands, airline callsigns.
// L3: maintain phrasing, airline callsigns.
// L4: hundreds + thousands combos, mixed climb/descend/maintain.
// L5: registration callsigns + varied verbs.
// L6: altitude + one extra item (contact or report).
const alL1: RbDrill[] = [
  { atc: "Iberia 325, climb to two thousand feet.", atcSpoken: "Iberia three two five, climb to two thousand feet.", expected: "Climb to 2000 feet, Iberia 325" },
  { atc: "Ryanair 467, climb to three thousand feet.", atcSpoken: "Ryanair four six seven, climb to three thousand feet.", expected: "Climb to 3000 feet, Ryanair 467" },
  { atc: "Vueling 218, climb to four thousand feet.", atcSpoken: "Vueling two one eight, climb to four thousand feet.", expected: "Climb to 4000 feet, Vueling 218" },
  { atc: "Speedbird 102, climb to two thousand feet.", atcSpoken: "Speedbird one zero two, climb to two thousand feet.", expected: "Climb to 2000 feet, Speedbird 102" },
  { atc: "Air France 743, climb to five thousand feet.", atcSpoken: "Air France seven four three, climb to five thousand feet.", expected: "Climb to 5000 feet, Air France 743" },
  { atc: "Lufthansa 551, climb to three thousand feet.", atcSpoken: "Lufthansa five five one, climb to three thousand feet.", expected: "Climb to 3000 feet, Lufthansa 551" },
];
const alL2: RbDrill[] = [
  { atc: "Iberia 325, descend to two thousand feet.", atcSpoken: "Iberia three two five, descend to two thousand feet.", expected: "Descend to 2000 feet, Iberia 325" },
  { atc: "Ryanair 467, descend to three thousand feet.", atcSpoken: "Ryanair four six seven, descend to three thousand feet.", expected: "Descend to 3000 feet, Ryanair 467" },
  { atc: "Vueling 218, descend to four thousand feet.", atcSpoken: "Vueling two one eight, descend to four thousand feet.", expected: "Descend to 4000 feet, Vueling 218" },
  { atc: "Speedbird 102, descend to one thousand feet.", atcSpoken: "Speedbird one zero two, descend to one thousand feet.", expected: "Descend to 1000 feet, Speedbird 102" },
  { atc: "Air France 743, descend to five thousand feet.", atcSpoken: "Air France seven four three, descend to five thousand feet.", expected: "Descend to 5000 feet, Air France 743" },
  { atc: "Lufthansa 551, descend to two thousand feet.", atcSpoken: "Lufthansa five five one, descend to two thousand feet.", expected: "Descend to 2000 feet, Lufthansa 551" },
];
const alL3: RbDrill[] = [
  { atc: "Iberia 325, maintain two thousand five hundred feet.", atcSpoken: "Iberia three two five, maintain two thousand five hundred feet.", expected: "Maintain 2500 feet, Iberia 325" },
  { atc: "Ryanair 467, maintain three thousand feet.", atcSpoken: "Ryanair four six seven, maintain three thousand feet.", expected: "Maintain 3000 feet, Ryanair 467" },
  { atc: "Vueling 218, maintain four thousand five hundred feet.", atcSpoken: "Vueling two one eight, maintain four thousand five hundred feet.", expected: "Maintain 4500 feet, Vueling 218" },
  { atc: "Speedbird 102, maintain two thousand feet.", atcSpoken: "Speedbird one zero two, maintain two thousand feet.", expected: "Maintain 2000 feet, Speedbird 102" },
  { atc: "Air France 743, maintain three thousand five hundred feet.", atcSpoken: "Air France seven four three, maintain three thousand five hundred feet.", expected: "Maintain 3500 feet, Air France 743" },
  { atc: "Lufthansa 551, maintain five thousand feet.", atcSpoken: "Lufthansa five five one, maintain five thousand feet.", expected: "Maintain 5000 feet, Lufthansa 551" },
];
const alL4: RbDrill[] = [
  { atc: "Iberia 325, descend to one thousand five hundred feet.", atcSpoken: "Iberia three two five, descend to one thousand five hundred feet.", expected: "Descend to 1500 feet, Iberia 325" },
  { atc: "Ryanair 467, climb to two thousand five hundred feet.", atcSpoken: "Ryanair four six seven, climb to two thousand five hundred feet.", expected: "Climb to 2500 feet, Ryanair 467" },
  { atc: "Vueling 218, descend to three thousand five hundred feet.", atcSpoken: "Vueling two one eight, descend to three thousand five hundred feet.", expected: "Descend to 3500 feet, Vueling 218" },
  { atc: "Speedbird 102, climb to four thousand five hundred feet.", atcSpoken: "Speedbird one zero two, climb to four thousand five hundred feet.", expected: "Climb to 4500 feet, Speedbird 102" },
  { atc: "Air France 743, maintain one thousand five hundred feet.", atcSpoken: "Air France seven four three, maintain one thousand five hundred feet.", expected: "Maintain 1500 feet, Air France 743" },
  { atc: "Lufthansa 551, descend to two thousand five hundred feet.", atcSpoken: "Lufthansa five five one, descend to two thousand five hundred feet.", expected: "Descend to 2500 feet, Lufthansa 551" },
];
const alL5: RbDrill[] = [
  { atc: "G-ABCD, climb to three thousand feet.", atcSpoken: "Golf Alfa Bravo Charlie Delta, climb to three thousand feet.", expected: "Climb to 3000 feet, G-ABCD" },
  { atc: "EI-DUB, descend to two thousand feet.", atcSpoken: "Echo India Delta Uniform Bravo, descend to two thousand feet.", expected: "Descend to 2000 feet, EI-DUB" },
  { atc: "EC-ABC, maintain two thousand five hundred feet.", atcSpoken: "Echo Charlie Alfa Bravo Charlie, maintain two thousand five hundred feet.", expected: "Maintain 2500 feet, EC-ABC" },
  { atc: "G-BCDE, climb to four thousand feet.", atcSpoken: "Golf Bravo Charlie Delta Echo, climb to four thousand feet.", expected: "Climb to 4000 feet, G-BCDE" },
  { atc: "EI-UDB, descend to three thousand five hundred feet.", atcSpoken: "Echo India Uniform Delta Bravo, descend to three thousand five hundred feet.", expected: "Descend to 3500 feet, EI-UDB" },
  { atc: "EC-DEF, maintain three thousand feet.", atcSpoken: "Echo Charlie Delta Echo Foxtrot, maintain three thousand feet.", expected: "Maintain 3000 feet, EC-DEF" },
];
const alL6: RbDrill[] = [
  { atc: "Iberia 325, climb to four thousand feet, contact Radar one two zero decimal niner.", atcSpoken: "Iberia three two five, climb to four thousand feet, contact Radar one two zero decimal niner.", expected: "Climb to 4000 feet, contact Radar 120.900, Iberia 325" },
  { atc: "Ryanair 467, descend to two thousand feet, report final.", atcSpoken: "Ryanair four six seven, descend to two thousand feet, report final.", expected: "Descend to 2000 feet, report final, Ryanair 467" },
  { atc: "Vueling 218, maintain two thousand five hundred feet, contact Tower one one eight decimal one.", atcSpoken: "Vueling two one eight, maintain two thousand five hundred feet, contact Tower one one eight decimal one.", expected: "Maintain 2500 feet, contact Tower 118.100, Vueling 218" },
  { atc: "Speedbird 102, descend to one thousand five hundred feet, report established.", atcSpoken: "Speedbird one zero two, descend to one thousand five hundred feet, report established.", expected: "Descend to 1500 feet, report established, Speedbird 102" },
  { atc: "Air France 743, climb to three thousand five hundred feet, contact Departure one two zero decimal tree.", atcSpoken: "Air France seven four three, climb to three thousand five hundred feet, contact Departure one two zero decimal tree.", expected: "Climb to 3500 feet, contact Departure 120.300, Air France 743" },
  { atc: "Lufthansa 551, maintain four thousand feet, report established.", atcSpoken: "Lufthansa five five one, maintain four thousand feet, report established.", expected: "Maintain 4000 feet, report established, Lufthansa 551" },
];
B[drill(RB, "Altitude Instructions", 1)] = { instruction: "Read back the altitude instruction with your callsign.", drills: alL1.map(rbWithSpokenAlt) };
B[drill(RB, "Altitude Instructions", 2)] = { instruction: "Read back the altitude instruction with your callsign.", drills: alL2.map(rbWithSpokenAlt) };
B[drill(RB, "Altitude Instructions", 3)] = { instruction: "Read back the altitude instruction with your callsign.", drills: alL3.map(rbWithSpokenAlt) };
B[drill(RB, "Altitude Instructions", 4)] = { instruction: "Read back the altitude instruction with your callsign.", drills: alL4.map(rbWithSpokenAlt) };
B[drill(RB, "Altitude Instructions", 5)] = { instruction: "Read back the altitude instruction with your callsign.", drills: alL5.map(rbWithSpokenAlt) };
B[drill(RB, "Altitude Instructions", 6)] = { instruction: "Two items to read back. Echo both, then add your callsign.", drills: alL6.map(rbWithSpokenAlt) };

// ─── MIXED READBACKS ──────────────────────────────────────────────────────────
// Each mixed level samples the matching difficulty tier from all four readback topics
// (3 items each = 12 per pool). useDrillSet caps to 10 per attempt.
const mxRbL1: RbDrill[] = [...fcL1.slice(0, 3), ...sqL1.slice(0, 3), ...hdL1.slice(0, 3), ...alL1.slice(0, 3).map(rbWithSpokenAlt)];
const mxRbL2: RbDrill[] = [...fcL2.slice(0, 3), ...sqL2.slice(0, 3), ...hdL2.slice(0, 3), ...alL2.slice(0, 3).map(rbWithSpokenAlt)];
const mxRbL3: RbDrill[] = [...fcL3.slice(0, 3), ...sqL3.slice(0, 3), ...hdL3.slice(0, 3), ...alL3.slice(0, 3).map(rbWithSpokenAlt)];
const mxRbL4: RbDrill[] = [...fcL4.slice(0, 3), ...sqL4.slice(0, 3), ...hdL4.slice(0, 3), ...alL4.slice(0, 3).map(rbWithSpokenAlt)];
const mxRbL5: RbDrill[] = [...fcL5.slice(0, 3), ...sqL5.slice(0, 3), ...hdL5.slice(0, 3), ...alL5.slice(0, 3).map(rbWithSpokenAlt)];
const mxRbL6: RbDrill[] = [...fcL6.slice(0, 3), ...sqL6.slice(0, 3), ...hdL6.slice(0, 3), ...alL6.slice(0, 3).map(rbWithSpokenAlt)];
B[drill(RB, "Mixed Readbacks", 1)] = { instruction: "Read back the instruction with your callsign.", drills: mxRbL1 };
B[drill(RB, "Mixed Readbacks", 2)] = { instruction: "Read back the instruction with your callsign.", drills: mxRbL2 };
B[drill(RB, "Mixed Readbacks", 3)] = { instruction: "Read back the instruction with your callsign.", drills: mxRbL3 };
B[drill(RB, "Mixed Readbacks", 4)] = { instruction: "Read back the instruction with your callsign.", drills: mxRbL4 };
B[drill(RB, "Mixed Readbacks", 5)] = { instruction: "Read back the instruction with your callsign.", drills: mxRbL5 };
B[drill(RB, "Mixed Readbacks", 6)] = { instruction: "Final mixed readback challenge. Two items in some calls — echo everything, then add your callsign.", drills: mxRbL6 };

/* ================= PHRASEOLOGY MODULE =================
 * 4 thematic groups, 5 levels each. Standard ladder across all topics:
 * L1 MCQ recognition → L2 Build with chips → L3 Speak → L4 Audio+Choice → L5 Mixed.
 * Callsign always provided in situation/prompt. Multi-word chips throughout to
 * avoid unnatural comma-joined phrases. Frequencies in canonical display form. */
const PH = "cadet-phraseology";

// ─── 1. BASIC RADIO PHRASES ──────────────────────────────────────────────────
// Covers: radio check, readability, roger/wilco, affirm/negative, standby.
// L1: MCQ — choose the correct phrase.
B[drill(PH, "Basic Radio Phrases", 1)] = {
  instruction: "Choose the correct response.",
  drills: [
    { situation: "You are Iberia 325. ATC gave you information only, no action required. What do you say?", options: ["Roger, Iberia 325.", "Wilco, Iberia 325.", "Affirm, Iberia 325.", "Standby, Iberia 325."], correct: "Roger, Iberia 325.", feedback: "Roger means you received the information." },
    { situation: "You are Iberia 325. ATC told you to report ready for startup. You will comply. What do you say?", options: ["Wilco, Iberia 325.", "Roger, Iberia 325.", "Affirm, Iberia 325.", "Standby, Iberia 325."], correct: "Wilco, Iberia 325.", feedback: "Wilco means received and will comply." },
    { situation: "You are Iberia 325. ATC asks if you are ready for departure. You are ready. What do you say?", options: ["Affirm, Iberia 325.", "Roger, Iberia 325.", "Wilco, Iberia 325.", "Ready, Iberia 325."], correct: "Affirm, Iberia 325.", feedback: "Affirm means yes." },
    { situation: "You are Iberia 325. ATC asks if you can accept immediate departure. You cannot. What do you say?", options: ["Negative, Iberia 325.", "Affirm, Iberia 325.", "Unable, Iberia 325.", "Roger, Iberia 325."], correct: "Negative, Iberia 325.", feedback: "Negative means no." },
    { situation: "You are EC-ABC. ATC says: readability five. What do you reply?", options: ["Readability five, EC-ABC.", "Roger, readability five.", "Affirm, EC-ABC.", "Five, EC-ABC."], correct: "Readability five, EC-ABC.", feedback: "Echo the readability back with your callsign." },
    { situation: "You are Iberia 325. ATC gives you a complex clearance and you need a moment to write it. What do you say?", options: ["Standby, Iberia 325.", "Roger, Iberia 325.", "Wilco, Iberia 325.", "Unable, Iberia 325."], correct: "Standby, Iberia 325.", feedback: "Standby buys you a moment without breaking communication." },
  ],
};
// L2: Build — tap chips in order.
B[drill(PH, "Basic Radio Phrases", 2)] = {
  instruction: "Tap the parts in the correct order.",
  drills: [
    { situation: "You are Iberia 325. Build a radio check call to Ground.", options: ["Madrid Ground", "Iberia 325", "radio check", "request taxi"], expected: "Madrid Ground, Iberia 325, radio check" },
    { situation: "You are EC-ABC. Build a radio check call to Approach.", options: ["Madrid Approach", "EC-ABC", "radio check", "request startup"], expected: "Madrid Approach, EC-ABC, radio check" },
    { situation: "You are Iberia 325. Build a readability five acknowledgement.", options: ["Readability five", "Iberia 325", "roger", "affirm"], expected: "Readability five, Iberia 325" },
    { situation: "You are Iberia 325. Build a wilco response.", options: ["Wilco", "Iberia 325", "roger", "affirm"], expected: "Wilco, Iberia 325" },
  ],
};
// L3: Speak — hold to speak.
B[drill(PH, "Basic Radio Phrases", 3)] = {
  instruction: "Speak the correct call.",
  drills: [
    { situation: "You are Iberia 325. Call Ground for a radio check.", expected: "Madrid Ground, Iberia 325, radio check." },
    { situation: "You are Iberia 325. Call Tower for a radio check.", expected: "Madrid Tower, Iberia 325, radio check." },
    { situation: "You are EC-ABC. Call Approach for a radio check.", expected: "Madrid Approach, EC-ABC, radio check." },
    { situation: "You are Iberia 325. ATC says: readability five. Acknowledge.", expected: "Readability five, Iberia 325." },
    { situation: "You are Iberia 325. ATC gave you information only, no action required.", expected: "Roger, Iberia 325." },
    { situation: "You are Iberia 325. ATC told you to report ready for startup. You will comply.", expected: "Wilco, Iberia 325." },
  ],
};
// L4: Audio+Choice — hear ATC then choose your response.
B[drill(PH, "Basic Radio Phrases", 4)] = {
  instruction: "Listen to ATC then choose the correct response.",
  drills: [
    { atc: "Iberia 325, Madrid Ground, readability five.", atcSpoken: "Iberia three two five, Madrid Ground, readability five.", options: ["Readability five, Iberia 325.", "Roger, Iberia 325.", "Wilco, Iberia 325.", "Affirm, Iberia 325."], correct: "Readability five, Iberia 325.", feedback: "Echo the readability back with your callsign." },
    { atc: "EC-ABC, report ready for startup.", atcSpoken: "Echo Charlie Alfa Bravo Charlie, report ready for startup.", options: ["Wilco, EC-ABC.", "Roger, EC-ABC.", "Affirm, EC-ABC.", "Standby, EC-ABC."], correct: "Wilco, EC-ABC.", feedback: "Report ready is an instruction — Wilco." },
    { atc: "Iberia 325, report when ready for departure.", atcSpoken: "Iberia three two five, report when ready for departure.", options: ["Wilco, Iberia 325.", "Roger, Iberia 325.", "Affirm, Iberia 325.", "Ready, Iberia 325."], correct: "Wilco, Iberia 325.", feedback: "Wilco: you acknowledge and will comply." },
    { atc: "Iberia 325, can you accept immediate departure?", atcSpoken: "Iberia three two five, can you accept immediate departure?", options: ["Affirm, Iberia 325.", "Roger, Iberia 325.", "Wilco, Iberia 325.", "Ready, Iberia 325."], correct: "Affirm, Iberia 325.", feedback: "ATC is asking a yes/no question — Affirm." },
    { atc: "EC-ABC, Madrid Ground, readability four.", atcSpoken: "Echo Charlie Alfa Bravo Charlie, Madrid Ground, readability four.", options: ["Readability four, EC-ABC.", "Roger, EC-ABC.", "Say again, EC-ABC.", "Four, EC-ABC."], correct: "Readability four, EC-ABC.", feedback: "Echo the readability report back." },
    { atc: "Iberia 325, negative immediate departure, report when ready.", atcSpoken: "Iberia three two five, negative immediate departure, report when ready.", options: ["Wilco, Iberia 325.", "Roger, Iberia 325.", "Affirm, Iberia 325.", "Unable, Iberia 325."], correct: "Wilco, Iberia 325.", feedback: "ATC gave an instruction — Wilco confirms you will comply." },
  ],
};
// L5: Mixed — MCQ + Build + Speak challenge.
B[drill(PH, "Basic Radio Phrases", 5)] = {
  instruction: "Mixed basic phrases challenge. Choose, build or speak the correct call.",
  drills: [
    { situation: "You are Iberia 325. ATC says: 'negative immediate departure, report when ready.' What do you say?", options: ["Wilco, Iberia 325.", "Roger, Iberia 325.", "Affirm, Iberia 325.", "Unable, Iberia 325."], correct: "Wilco, Iberia 325.", feedback: "ATC gave an instruction — Wilco confirms you will comply." },
    { situation: "You are EC-ABC. ATC asks: 'can you accept immediate departure?' You can. What do you say?", options: ["Affirm, EC-ABC.", "Wilco, EC-ABC.", "Roger, EC-ABC.", "Ready, EC-ABC."], correct: "Affirm, EC-ABC.", feedback: "ATC is asking a yes/no question — Affirm means yes." },
    { situation: "You are Iberia 325. Build a radio check call to Tower.", options: ["Madrid Tower", "Iberia 325", "radio check", "standby"], expected: "Madrid Tower, Iberia 325, radio check" },
    { situation: "You are EC-ABC. Build a readability five acknowledgement.", options: ["Readability five", "EC-ABC", "roger", "wilco"], expected: "Readability five, EC-ABC" },
    { situation: "You are EC-ABC. Call Ground for a radio check.", expected: "Madrid Ground, EC-ABC, radio check." },
    { situation: "You are Iberia 325. ATC gave information only. Acknowledge.", expected: "Roger, Iberia 325." },
  ],
};

// ─── 2. WHEN YOU DON'T UNDERSTAND ────────────────────────────────────────────
// Covers: say again, say again frequency/squawk/QNH, speak slower, confirm, correction.
// Standard ladder: L1 MCQ → L2 Build → L3 Speak → L4 contextual choice → L5 mixed.
// L1: MCQ — choose the right clarification.
B[drill(PH, "When You Don't Understand", 1)] = {
  instruction: "Choose the correct clarification.",
  drills: [
    { situation: "You are Iberia 325. ATC gave a full instruction but you missed all of it.", options: ["Say again, Iberia 325.", "Correction, Iberia 325.", "Standby, Iberia 325.", "Unable, Iberia 325."], correct: "Say again, Iberia 325.", feedback: "Say again: ask ATC to repeat the full message." },
    { situation: "You are Iberia 325. ATC gave a frequency but you did not catch the number.", options: ["Say again frequency, Iberia 325.", "Say again, Iberia 325.", "Correction, Iberia 325.", "Confirm frequency, Iberia 325."], correct: "Say again frequency, Iberia 325.", feedback: "Ask specifically for what you missed." },
    { situation: "You are Iberia 325. ATC gave a squawk code but you missed it.", options: ["Say again squawk, Iberia 325.", "Say again, Iberia 325.", "Confirm squawk, Iberia 325.", "Correction, Iberia 325."], correct: "Say again squawk, Iberia 325.", feedback: "Be specific: say again squawk." },
    { situation: "You are EC-ABC. ATC spoke very fast and you did not understand.", options: ["Speak slower, EC-ABC.", "Say again, EC-ABC.", "Say again all, EC-ABC.", "Correction, EC-ABC."], correct: "Speak slower, EC-ABC.", feedback: "Speak slower asks ATC to reduce their pace." },
    { situation: "You are Iberia 325. You made an error in your last readback.", options: ["Correction, Iberia 325.", "Say again, Iberia 325.", "Negative, Iberia 325.", "Unable, Iberia 325."], correct: "Correction, Iberia 325.", feedback: "Correction acknowledges an error and signals you will correct it." },
    { situation: "You are Iberia 325. You need to verify the taxi clearance you received.", options: ["Confirm taxi clearance, Iberia 325.", "Say again, Iberia 325.", "Roger, Iberia 325.", "Wilco, Iberia 325."], correct: "Confirm taxi clearance, Iberia 325.", feedback: "Confirm asks ATC to verify what they told you." },
  ],
};
// L2: Build — tap chips to build the clarification (multi-word chips avoid comma artefacts).
B[drill(PH, "When You Don't Understand", 2)] = {
  instruction: "Tap the parts in the correct order.",
  drills: [
    { situation: "You are Iberia 325. Build a 'say again frequency' request.", options: ["Say again frequency", "Iberia 325", "contact Tower", "report ready"], expected: "Say again frequency, Iberia 325" },
    { situation: "You are Iberia 325. Build a 'say again squawk' request.", options: ["Say again squawk", "Iberia 325", "report ready", "contact Tower"], expected: "Say again squawk, Iberia 325" },
    { situation: "You are EC-ABC. Build a 'speak slower' request.", options: ["Speak slower", "EC-ABC", "say again", "correction"], expected: "Speak slower, EC-ABC" },
    { situation: "You are Iberia 325. Build a 'say again QNH' request.", options: ["Say again QNH", "Iberia 325", "confirm", "contact Tower"], expected: "Say again QNH, Iberia 325" },
  ],
};
// L3: Speak — say the clarification with full context.
B[drill(PH, "When You Don't Understand", 3)] = {
  instruction: "Speak the correct clarification.",
  drills: [
    { situation: "You are Iberia 325. You missed the full instruction from ATC.", expected: "Say again, Iberia 325." },
    { situation: "You are Iberia 325. You missed the frequency ATC gave you.", expected: "Say again frequency, Iberia 325." },
    { situation: "You are EC-ABC. ATC spoke too fast.", expected: "Speak slower, EC-ABC." },
    { situation: "You are Iberia 325. You missed the squawk code.", expected: "Say again squawk, Iberia 325." },
    { situation: "You are Iberia 325. You missed the QNH.", expected: "Say again QNH, Iberia 325." },
    { situation: "You are Iberia 325. You made an error in your readback.", expected: "Correction, Iberia 325." },
    { situation: "You are EC-ABC. You missed the taxi instructions.", expected: "Say again taxi instructions, EC-ABC." },
  ],
};
// L4: Contextual choice — pick the right clarification based on what was missed.
B[drill(PH, "When You Don't Understand", 4)] = {
  instruction: "Choose the correct clarification for each situation.",
  drills: [
    { situation: "You are Iberia 325. ATC said 'Iberia 325, squawk' then the transmission cut out.", options: ["Say again squawk, Iberia 325.", "Affirm, Iberia 325.", "Correction, Iberia 325.", "Wilco, Iberia 325."], correct: "Say again squawk, Iberia 325.", feedback: "The squawk code was cut off — ask specifically." },
    { situation: "You are EC-ABC. ATC gave taxi instructions but you missed the holding point.", options: ["Say again taxi instructions, EC-ABC.", "Say again, EC-ABC.", "Confirm clearance, EC-ABC.", "Wilco, EC-ABC."], correct: "Say again taxi instructions, EC-ABC.", feedback: "Ask specifically for what you missed." },
    { situation: "You are Iberia 325. You read back the wrong squawk and noticed before ATC did.", options: ["Correction, Iberia 325.", "Say again squawk, Iberia 325.", "Negative, Iberia 325.", "Unable, Iberia 325."], correct: "Correction, Iberia 325.", feedback: "Announce the correction proactively." },
    { situation: "You are Iberia 325. ATC gave a QNH but static made the digits unclear.", options: ["Say again QNH, Iberia 325.", "Say again, Iberia 325.", "Confirm QNH, Iberia 325.", "Standby, Iberia 325."], correct: "Say again QNH, Iberia 325.", feedback: "Be specific about what you need repeated." },
    { situation: "You are EC-ABC. ATC confirmed a clearance but you want to double-check you understood correctly.", options: ["Confirm clearance, EC-ABC.", "Roger, EC-ABC.", "Say again, EC-ABC.", "Correction, EC-ABC."], correct: "Confirm clearance, EC-ABC.", feedback: "Confirm asks ATC to verify the clearance." },
    { situation: "You are Iberia 325. ATC gave a clearance limit but you missed the altitude.", options: ["Say again altitude, Iberia 325.", "Say again, Iberia 325.", "Correction, Iberia 325.", "Confirm altitude, Iberia 325."], correct: "Say again altitude, Iberia 325.", feedback: "Ask specifically for the missed item." },
  ],
};
// L5: Mixed clarification challenge — speak + MCQ.
B[drill(PH, "When You Don't Understand", 5)] = {
  instruction: "Use the correct clarification.",
  drills: [
    { situation: "You are Iberia 325. You missed the full ATC message.", expected: "Say again, Iberia 325." },
    { situation: "You are EC-ABC. ATC spoke too fast.", expected: "Speak slower, EC-ABC." },
    { situation: "You are Iberia 325. You missed the taxi instructions.", expected: "Say again taxi instructions, Iberia 325." },
    { situation: "You are EC-ABC. ATC gave you a clearance you need to verify.", options: ["Confirm clearance, EC-ABC.", "Roger, EC-ABC.", "Say again, EC-ABC.", "Wilco, EC-ABC."], correct: "Confirm clearance, EC-ABC." },
    { situation: "You are Iberia 325. You made an error in your readback.", options: ["Correction, Iberia 325.", "Say again, Iberia 325.", "Negative, Iberia 325.", "Unable, Iberia 325."], correct: "Correction, Iberia 325." },
    { situation: "You are EC-ABC. ATC gave a QNH but you could not hear clearly.", options: ["Say again QNH, EC-ABC.", "Affirm, EC-ABC.", "Say again, EC-ABC.", "Roger, EC-ABC."], correct: "Say again QNH, EC-ABC." },
  ],
};

// ─── 3. REPORTING & FREQUENCY PHRASES ────────────────────────────────────────
// Covers: contact, monitor, readback, first call, position report.
// Standard ladder: L1 MCQ → L2 Build → L3 Speak → L4 Audio+Choice → L5 mixed.
// L1: MCQ — choose the correct readback or first call.
B[drill(PH, "Reporting & Frequency Phrases", 1)] = {
  instruction: "Choose the correct response.",
  drills: [
    { situation: "You are Iberia 325. ATC says: 'contact Tower 118.100'. What do you read back?", options: ["Contact Tower 118.100, Iberia 325.", "Tower 118.100, Iberia 325.", "Affirm, Iberia 325.", "Wilco, Iberia 325."], correct: "Contact Tower 118.100, Iberia 325.", feedback: "Full readback: contact + station + frequency + callsign." },
    { situation: "You are Iberia 325. ATC says: 'monitor Ground 121.700'. What do you say?", options: ["Monitor Ground 121.700, Iberia 325.", "Contact Ground 121.700, Iberia 325.", "Roger, Iberia 325.", "Wilco, Iberia 325."], correct: "Monitor Ground 121.700, Iberia 325.", feedback: "Monitor means listen only — read it back fully." },
    { situation: "You are EC-ABC. You just switched to Tower. What is your first call?", options: ["Madrid Tower, EC-ABC.", "Tower, EC-ABC.", "Madrid Tower, EC-ABC, radio check.", "Roger, EC-ABC."], correct: "Madrid Tower, EC-ABC.", feedback: "Station name + your callsign." },
    { situation: "You are Iberia 325. ATC asked you to report ready. You will comply.", options: ["Wilco, Iberia 325.", "Roger, Iberia 325.", "Affirm, Iberia 325.", "Ready, Iberia 325."], correct: "Wilco, Iberia 325.", feedback: "Wilco confirms you will comply." },
    { situation: "You are Iberia 325. You have changed to Tower, at holding point Alfa One, ready for departure. First call?", options: ["Madrid Tower, Iberia 325, holding point Alfa One, ready for departure.", "Madrid Tower, Iberia 325, ready.", "Tower, Iberia 325, Alfa One.", "Iberia 325, holding point Alfa One."], correct: "Madrid Tower, Iberia 325, holding point Alfa One, ready for departure.", feedback: "Full first call: station + callsign + position + status." },
  ],
};
// L2: Build — tap chips to build contact/monitor/first-call phrases (multi-word chips).
B[drill(PH, "Reporting & Frequency Phrases", 2)] = {
  instruction: "Tap the parts in the correct order.",
  drills: [
    { situation: "You are Iberia 325. Build a 'contact Tower' readback.", options: ["Contact Tower 118.100", "Iberia 325", "monitor Ground", "say again"], expected: "Contact Tower 118.100, Iberia 325" },
    { situation: "You are EC-ABC. Build a 'monitor Ground' readback.", options: ["Monitor Ground 121.700", "EC-ABC", "contact Tower", "say again"], expected: "Monitor Ground 121.700, EC-ABC" },
    { situation: "You are Iberia 325. Build your first call on Tower, ready for departure.", options: ["Madrid Tower", "Iberia 325", "ready for departure", "radio check"], expected: "Madrid Tower, Iberia 325, ready for departure" },
    { situation: "You are Iberia 325. Build a full holding point call, ready for departure.", options: ["Madrid Tower", "Iberia 325", "holding point Alfa One", "ready for departure"], expected: "Madrid Tower, Iberia 325, holding point Alfa One, ready for departure" },
  ],
};
// L3: Speak — readbacks, first calls, and callsign-first position reports.
B[drill(PH, "Reporting & Frequency Phrases", 3)] = {
  instruction: "Speak the correct readback or first call.",
  drills: [
    { situation: "You are Iberia 325. ATC says: contact Tower 118.100. Read back.", expected: "Contact Tower 118.100, Iberia 325." },
    { situation: "You are Iberia 325. ATC says: monitor Ground 121.700. Read back.", expected: "Monitor Ground 121.700, Iberia 325." },
    { situation: "You are Iberia 325. Make your first call on Tower.", expected: "Madrid Tower, Iberia 325." },
    { situation: "You are Iberia 325. Make your first call on Tower, ready for departure.", expected: "Madrid Tower, Iberia 325, ready for departure." },
    { situation: "You are EC-ABC. Make your first call on Approach.", expected: "Madrid Approach, EC-ABC." },
    { situation: "You are Iberia 325. Report passing final.", expected: "Wilco, Iberia 325." },
    { situation: "You are EC-ABC. Report established on the ILS.", expected: "EC-ABC, established on the ILS." },
  ],
};
// L4: Audio+Choice — hear ATC frequency instruction, choose the correct readback.
// Distinguishes contact vs monitor and varies station/frequency.
B[drill(PH, "Reporting & Frequency Phrases", 4)] = {
  instruction: "Listen to ATC then choose the correct readback.",
  drills: [
    { atc: "Iberia 325, contact Tower one one eight decimal one.", atcSpoken: "Iberia three two five, contact Tower one one eight decimal one.", options: ["Contact Tower 118.100, Iberia 325.", "Roger, Iberia 325.", "Wilco, Iberia 325.", "118.100, Iberia 325."], correct: "Contact Tower 118.100, Iberia 325.", feedback: "Full readback: contact + station + frequency + callsign." },
    { atc: "EC-ABC, monitor Ground one two one decimal seven.", atcSpoken: "Echo Charlie Alfa Bravo Charlie, monitor Ground one two one decimal seven.", options: ["Monitor Ground 121.700, EC-ABC.", "Contact Ground 121.700, EC-ABC.", "Roger, EC-ABC.", "Wilco, EC-ABC."], correct: "Monitor Ground 121.700, EC-ABC.", feedback: "Monitor means listen only — read it back fully." },
    { atc: "Iberia 325, contact Approach one two four decimal eight seven fife.", atcSpoken: "Iberia three two five, contact Approach one two four decimal eight seven fife.", options: ["Contact Approach 124.875, Iberia 325.", "Roger, Iberia 325.", "Wilco, Iberia 325.", "Approach 124.875, Iberia 325."], correct: "Contact Approach 124.875, Iberia 325.", feedback: "Full readback: contact + station + frequency + callsign." },
    { atc: "EC-ABC, report ready for departure.", atcSpoken: "Echo Charlie Alfa Bravo Charlie, report ready for departure.", options: ["Wilco, EC-ABC.", "Roger, EC-ABC.", "Affirm, EC-ABC.", "Ready, EC-ABC."], correct: "Wilco, EC-ABC.", feedback: "Report ready is an instruction — Wilco." },
    { atc: "Iberia 325, contact Ground one two one decimal seven.", atcSpoken: "Iberia three two five, contact Ground one two one decimal seven.", options: ["Contact Ground 121.700, Iberia 325.", "Monitor Ground 121.700, Iberia 325.", "Roger, Iberia 325.", "Wilco, Iberia 325."], correct: "Contact Ground 121.700, Iberia 325.", feedback: "Contact: change and call." },
    { atc: "Iberia 325, monitor Director one one niner decimal fife.", atcSpoken: "Iberia three two five, monitor Director one one niner decimal fife.", options: ["Monitor Director 119.500, Iberia 325.", "Contact Director 119.500, Iberia 325.", "Roger, Iberia 325.", "Wilco, Iberia 325."], correct: "Monitor Director 119.500, Iberia 325.", feedback: "Monitor: change and listen only, do not call." },
  ],
};
// L5: Mixed — speak + MCQ + build, covering contact/monitor/first-call/report.
B[drill(PH, "Reporting & Frequency Phrases", 5)] = {
  instruction: "Use the correct reporting or frequency phrase.",
  drills: [
    { situation: "You are Iberia 325. ATC says: contact Director 119.500. Read back.", expected: "Contact Director 119.500, Iberia 325." },
    { situation: "You are Iberia 325. Report established on the ILS.", expected: "Iberia 325, established on the ILS." },
    { situation: "You are Iberia 325. ATC says: 'monitor Approach 124.875'. What do you read back?", options: ["Monitor Approach 124.875, Iberia 325.", "Contact Approach 124.875, Iberia 325.", "Roger, Iberia 325.", "Wilco, Iberia 325."], correct: "Monitor Approach 124.875, Iberia 325." },
    { situation: "You are EC-ABC. You just checked in on Radar. What is your first call?", options: ["Madrid Radar, EC-ABC.", "Radar, EC-ABC.", "Madrid Radar, EC-ABC, radio check.", "EC-ABC, checking in."], correct: "Madrid Radar, EC-ABC." },
    { situation: "You are EC-ABC. Build a 'contact Approach' readback.", options: ["Contact Approach 124.875", "EC-ABC", "monitor Tower", "say again"], expected: "Contact Approach 124.875, EC-ABC" },
    { situation: "You are Iberia 325. Build a wilco response to a report-ready instruction.", options: ["Wilco", "Iberia 325", "Roger", "Affirm"], expected: "Wilco, Iberia 325" },
  ],
};

// ─── 4. MIXED PHRASEOLOGY CHALLENGE ──────────────────────────────────────────
// Combines all topics: basic phrases, clarifications, contact/monitor/report.
// Standard ladder: L1 MCQ → L2 Build → L3 Audio+Choice → L4 Speak → L5 Mixed capstone.
// L1: MCQ — mixed recognition across all categories.
B[drill(PH, "Mixed Phraseology Challenge", 1)] = {
  instruction: "Choose the correct response.",
  drills: [
    { situation: "You are Iberia 325. ATC gave you information only, no action required.", options: ["Roger, Iberia 325.", "Wilco, Iberia 325.", "Affirm, Iberia 325.", "Standby, Iberia 325."], correct: "Roger, Iberia 325." },
    { situation: "You are Iberia 325. You missed the frequency ATC gave you.", options: ["Say again frequency, Iberia 325.", "Say again, Iberia 325.", "Correction, Iberia 325.", "Confirm frequency, Iberia 325."], correct: "Say again frequency, Iberia 325." },
    { situation: "You are EC-ABC. ATC says: 'contact Tower 118.100'. What do you read back?", options: ["Contact Tower 118.100, EC-ABC.", "Tower 118.100, EC-ABC.", "Affirm, EC-ABC.", "Wilco, EC-ABC."], correct: "Contact Tower 118.100, EC-ABC." },
    { situation: "You are Iberia 325. ATC asks you to report ready for departure. You will comply.", options: ["Wilco, Iberia 325.", "Roger, Iberia 325.", "Affirm, Iberia 325.", "Ready, Iberia 325."], correct: "Wilco, Iberia 325." },
    { situation: "You are EC-ABC. ATC spoke too fast and you missed part of the message.", options: ["Speak slower, EC-ABC.", "Say again, EC-ABC.", "Correction, EC-ABC.", "Unable, EC-ABC."], correct: "Speak slower, EC-ABC." },
    { situation: "You are Iberia 325. You made an error in your last readback.", options: ["Correction, Iberia 325.", "Say again, Iberia 325.", "Negative, Iberia 325.", "Unable, Iberia 325."], correct: "Correction, Iberia 325." },
  ],
};
// L2: Build — mixed phrases from all categories.
B[drill(PH, "Mixed Phraseology Challenge", 2)] = {
  instruction: "Tap the parts in the correct order.",
  drills: [
    { situation: "You are Iberia 325. Build a radio check call to Ground.", options: ["Madrid Ground", "Iberia 325", "radio check", "request startup"], expected: "Madrid Ground, Iberia 325, radio check" },
    { situation: "You are Iberia 325. Build a 'say again frequency' request.", options: ["Say again frequency", "Iberia 325", "contact Tower", "report ready"], expected: "Say again frequency, Iberia 325" },
    { situation: "You are EC-ABC. Build a 'contact Tower' readback.", options: ["Contact Tower 118.100", "EC-ABC", "monitor Ground", "say again"], expected: "Contact Tower 118.100, EC-ABC" },
    { situation: "You are Iberia 325. Build a wilco response.", options: ["Wilco", "Iberia 325", "Roger", "Affirm"], expected: "Wilco, Iberia 325" },
    { situation: "You are EC-ABC. Build a 'speak slower' clarification.", options: ["Speak slower", "EC-ABC", "Say again", "Correction"], expected: "Speak slower, EC-ABC" },
  ],
};
// L3: Audio+Choice — hear ATC then pick the correct response.
B[drill(PH, "Mixed Phraseology Challenge", 3)] = {
  instruction: "Listen to ATC then choose the correct response.",
  drills: [
    { atc: "Iberia 325, Madrid Ground, readability five.", atcSpoken: "Iberia three two five, Madrid Ground, readability five.", options: ["Readability five, Iberia 325.", "Roger, Iberia 325.", "Wilco, Iberia 325.", "Affirm, Iberia 325."], correct: "Readability five, Iberia 325.", feedback: "Echo the readability report back." },
    { atc: "EC-ABC, contact Tower one one eight decimal one.", atcSpoken: "Echo Charlie Alfa Bravo Charlie, contact Tower one one eight decimal one.", options: ["Contact Tower 118.100, EC-ABC.", "Roger, EC-ABC.", "Wilco, EC-ABC.", "118.100, EC-ABC."], correct: "Contact Tower 118.100, EC-ABC.", feedback: "Full readback for a contact instruction." },
    { atc: "Iberia 325, report ready for departure.", atcSpoken: "Iberia three two five, report ready for departure.", options: ["Wilco, Iberia 325.", "Roger, Iberia 325.", "Affirm, Iberia 325.", "Ready, Iberia 325."], correct: "Wilco, Iberia 325.", feedback: "Report ready is an instruction — Wilco." },
    { atc: "EC-ABC, monitor Ground one two one decimal seven.", atcSpoken: "Echo Charlie Alfa Bravo Charlie, monitor Ground one two one decimal seven.", options: ["Monitor Ground 121.700, EC-ABC.", "Contact Ground 121.700, EC-ABC.", "Roger, EC-ABC.", "Wilco, EC-ABC."], correct: "Monitor Ground 121.700, EC-ABC.", feedback: "Monitor: change and listen, do not call." },
    { atc: "Iberia 325, can you accept immediate departure?", atcSpoken: "Iberia three two five, can you accept immediate departure?", options: ["Affirm, Iberia 325.", "Roger, Iberia 325.", "Wilco, Iberia 325.", "Ready, Iberia 325."], correct: "Affirm, Iberia 325.", feedback: "ATC is asking a yes/no question — Affirm." },
    { atc: "EC-ABC, report when ready for startup.", atcSpoken: "Echo Charlie Alfa Bravo Charlie, report when ready for startup.", options: ["Wilco, EC-ABC.", "Roger, EC-ABC.", "Affirm, EC-ABC.", "Standby, EC-ABC."], correct: "Wilco, EC-ABC.", feedback: "Report when ready is an instruction — Wilco." },
  ],
};
// L4: Speak — mixed calls from all categories.
B[drill(PH, "Mixed Phraseology Challenge", 4)] = {
  instruction: "Speak the correct call.",
  drills: [
    { situation: "You are Iberia 325. Call Ground for a radio check.", expected: "Madrid Ground, Iberia 325, radio check." },
    { situation: "You are Iberia 325. ATC gave information only, no action required.", expected: "Roger, Iberia 325." },
    { situation: "You are EC-ABC. ATC spoke too fast.", expected: "Speak slower, EC-ABC." },
    { situation: "You are Iberia 325. ATC says: contact Tower 118.100. Read back.", expected: "Contact Tower 118.100, Iberia 325." },
    { situation: "You are Iberia 325. Make your first call on Tower, ready for departure.", expected: "Madrid Tower, Iberia 325, ready for departure." },
    { situation: "You are EC-ABC. ATC says: readability five. Acknowledge.", expected: "Readability five, EC-ABC." },
    { situation: "You are Iberia 325. You missed the full ATC instruction.", expected: "Say again, Iberia 325." },
  ],
};
// L5: Capstone mixed challenge — MCQ + Build + Speak + Audio with closer distractors.
B[drill(PH, "Mixed Phraseology Challenge", 5)] = {
  instruction: "Final phraseology challenge. Use the correct phrase for each situation.",
  drills: [
    { situation: "You are Iberia 325. ATC says: 'negative immediate departure, report when ready.' What do you say?", options: ["Wilco, Iberia 325.", "Roger, Iberia 325.", "Affirm, Iberia 325.", "Unable, Iberia 325."], correct: "Wilco, Iberia 325.", feedback: "ATC gave an instruction — Wilco confirms you will comply." },
    { situation: "You are EC-ABC. ATC gave a QNH but static made the digits unclear.", options: ["Say again QNH, EC-ABC.", "Say again, EC-ABC.", "Confirm QNH, EC-ABC.", "Standby, EC-ABC."], correct: "Say again QNH, EC-ABC.", feedback: "Be specific about what you missed." },
    { situation: "You are Iberia 325. Build a 'contact Tower' readback.", options: ["Contact Tower 118.100", "Iberia 325", "monitor Ground", "say again"], expected: "Contact Tower 118.100, Iberia 325" },
    { situation: "You are EC-ABC. Build a radio check call to Ground.", options: ["Madrid Ground", "EC-ABC", "radio check", "request startup"], expected: "Madrid Ground, EC-ABC, radio check" },
    { situation: "You are Iberia 325. ATC says: monitor Approach 124.875. Read back.", expected: "Monitor Approach 124.875, Iberia 325." },
    { situation: "You are EC-ABC. Make your first call on Approach.", expected: "Madrid Approach, EC-ABC." },
    { atc: "Iberia 325, contact Ground one two one decimal seven.", atcSpoken: "Iberia three two five, contact Ground one two one decimal seven.", options: ["Contact Ground 121.700, Iberia 325.", "Monitor Ground 121.700, Iberia 325.", "Roger, Iberia 325.", "Wilco, Iberia 325."], correct: "Contact Ground 121.700, Iberia 325.", feedback: "Contact: change and call." },
    { atc: "EC-ABC, report ready for startup.", atcSpoken: "Echo Charlie Alfa Bravo Charlie, report ready for startup.", options: ["Wilco, EC-ABC.", "Roger, EC-ABC.", "Affirm, EC-ABC.", "Standby, EC-ABC."], correct: "Wilco, EC-ABC.", feedback: "Report ready is an instruction — Wilco." },
  ],
};

/* ================= SCENARIOS =================
 * 4 guided micro-scenario groups, 3 situations each. Rendered as a one-screen
 * chat-style radio exchange (ScenarioChatScreen): `instruction` is the TASK card,
 * `transmissions` is the ordered conversation script (a() = ATC bubble, u() = pilot
 * bubble revealed by the simulated mic). Cadet-level only.
 * Callsign EC-ABC is always visible in the TASK or an ATC message.
 * These prepare the user for a future ATC Sim "First Solo Radio Mission".
 *
 * CADET SCENARIO BOUNDARY CONTRACT
 * These are guided micro-readbacks with a task card. They must not behave like ATC
 * Sim missions. Target: 3–4 pilot responses, basic Cadet phraseology only.
 * PROHIBITED in Cadet Scenarios: traffic sequencing ("number two", "follow the ...",
 * "traffic in sight"), multi-aircraft complexity, circuit legs, charts/visuals,
 * and any workload that belongs to Student Pilot or ATC Sim.
 * ATC Sim Missions handle: briefing, longer continuous operation, score, transcript.
 * Student Pilot handles: VFR local ops, taxi/circuit/arrival with real traffic. */
const SC = "cadet-scenarios";

/* ---- Taxi Basics ---- */
// Request Taxi: taxi request with info Bravo → QNH + taxi clearance → hold short.
// Removed: radio check/readability (trained in First Contact) and give way (untaught).
B[step(SC, "Taxi Basics", "Request Taxi")] = {
  instruction: "You are EC-ABC at stand 12. You have information Bravo. Request taxi from Ground and read back all instructions.",
  transmissions: [
    u("Call Madrid Ground and request taxi.", "Ground, EC-ABC, stand 12, information Bravo, request taxi."),
    a("EC-ABC, QNH one zero one six, runway 24. Taxi to holding point Alfa One via Alfa."),
    u("Read back QNH and taxi route.", "QNH 1016, runway 24, taxi to holding point Alfa One via Alfa, EC-ABC."),
    a("EC-ABC, hold short of runway 24."),
    u("Read back hold short.", "Hold short runway 24, EC-ABC."),
  ],
};
// Taxi to Holding Point: taxi route readback → hold position → hold short runway 24.
// Replaced "give way" (untaught) with "hold position" (trained in Hold Position scenario).
B[step(SC, "Taxi Basics", "Taxi to Holding Point")] = {
  instruction: "You are EC-ABC taxiing. Follow ATC instructions to the holding point.",
  transmissions: [
    a("EC-ABC, taxi to holding point Alfa One via Bravo."),
    u("Read back the taxi clearance.", "Taxi to holding point Alfa One via Bravo, EC-ABC."),
    a("EC-ABC, hold position."),
    { speaker: "user", prompt: "Acknowledge.", expected: "Holding position, EC-ABC.", acceptedVariants: ["Hold position, EC-ABC"] },
    a("EC-ABC, continue taxi, hold short runway 24."),
    u("Read back continue and hold short.", "Continue taxi, hold short runway 24, EC-ABC."),
  ],
};
// Hold Position: hold ack → confirm stand → continue taxi readback.
B[step(SC, "Taxi Basics", "Hold Position")] = {
  instruction: "You are EC-AMT taxiing. ATC asks you to hold position, then continues the exchange.",
  transmissions: [
    a("EC-AMT, hold position."),
    { speaker: "user", prompt: "Acknowledge.", expected: "Holding position, EC-AMT.", acceptedVariants: ["Hold position, EC-AMT."] },
    a("EC-AMT, confirm stand number."),
    u("Confirm your stand number.", "Stand 12, EC-AMT."),
    a("EC-AMT, taxi to holding point Alfa One."),
    u("Read back continue taxi.", "Taxi to holding point Alfa One, EC-AMT."),
  ],
};

/* ---- Departure Basics ---- */
// Ready for Departure: freq change → first call on Tower → ready report → standby → Wilco.
// Back-to-back u() at positions 2+3 is the "readback → first call on new frequency" allowed exception.
B[step(SC, "Departure Basics", "Ready for Departure")] = {
  instruction: "You are EC-BIG at holding point Alfa One. Ground tells you to contact Tower. Change frequency and report ready.",
  transmissions: [
    a("EC-BIG, contact Tower one one eight decimal one."),
    u("Read back the frequency change.", "Contact Tower 118.100, EC-BIG."),
    u("Make your first call on Tower.", "Madrid Tower, EC-BIG."),
    a("EC-BIG, Madrid Tower, go ahead."),
    { speaker: "user", prompt: "Report holding point, ready for departure.", expected: "Madrid Tower, EC-BIG, holding point Alfa One, ready for departure.", acceptedVariants: ["EC-BIG, holding point Alfa One, ready for departure."] },
    a("EC-BIG, Roger, standby."),
    { speaker: "user", prompt: "Acknowledge.", expected: "Standing by, EC-BIG.", acceptedVariants: ["Standby, EC-BIG"] },
  ],
};
// Line Up and Wait: hold short with traffic → traffic clear LUAW → confirm ready.
B[step(SC, "Departure Basics", "Line Up and Wait")] = {
  instruction: "You are EC-FAT at holding point Alfa One. There is traffic on final. Follow the departure sequence.",
  transmissions: [
    a("EC-FAT, hold short runway 24, traffic on final."),
    { speaker: "user", prompt: "Acknowledge hold short.", expected: "Hold short runway 24, EC-FAT.", acceptedVariants: ["Holding short runway 24, EC-FAT"] },
    a("EC-FAT, line up and wait runway 24."),
    u("Read back line up and wait.", "Line up and wait runway 24, EC-FAT."),
    a("EC-FAT, confirm you are ready for departure."),
    { speaker: "user", prompt: "Confirm ready.", expected: "Affirm, EC-FAT.", acceptedVariants: ["Ready for departure, EC-FAT"] },
  ],
};
// Cleared for Takeoff: LUAW → wind + takeoff clearance → departure frequency.
B[step(SC, "Departure Basics", "Cleared for Takeoff")] = {
  instruction: "You are EC-JFB at holding point Alfa One. ATC will clear you to line up, then give takeoff clearance.",
  transmissions: [
    a("EC-JFB, line up and wait runway 24."),
    u("Read back line up and wait.", "Line up and wait runway 24, EC-JFB."),
    a("EC-JFB, wind 240 degrees 10 knots, runway 24, cleared for takeoff."),
    { speaker: "user", prompt: "Read back the takeoff clearance.", expected: "Runway 24, cleared for takeoff, EC-JFB.", acceptedVariants: ["Cleared for takeoff runway 24, EC-JFB"] },
    a("EC-JFB, contact Approach one two four decimal eight seven fife when airborne."),
    { speaker: "user", prompt: "Read back the departure frequency.", expected: "When airborne contact Approach 124.875, EC-JFB.", acceptedVariants: ["Contact Approach 124.875 when airborne, EC-JFB"] },
  ],
};

/* ---- Landing Basics ---- */
// Report Final: instruction readback → position report → landing clearance.
// Removed traffic sequencing block ("number two, follow the Airbus", "traffic in sight"):
// that workload belongs to Student Pilot circuit ops and ATC Sim Arrival missions.
// TODO (Student Pilot / ATC Sim): reuse the sequencing block here for a SP circuit
//   scenario or an ATC Sim "Arrival & Landing" mission step.
// Back-to-back u() at positions 2+3: readback then pilot-initiated report final (allowed exception).
B[step(SC, "Landing Basics", "Report Final")] = {
  instruction: "You are EC-LVV on approach to runway 24. ATC asks you to report final. Complete the landing sequence.",
  transmissions: [
    a("EC-LVV, report final runway 24."),
    { speaker: "user", prompt: "Read back the instruction.", expected: "Report final runway 24, EC-LVV.", acceptedVariants: ["Wilco, EC-LVV"] },
    { speaker: "user", prompt: "Make the final position report.", expected: "EC-LVV, final runway 24.", acceptedVariants: ["Final runway 24, EC-LVV"] },
    a("EC-LVV, runway 24, cleared to land."),
    { speaker: "user", prompt: "Read back landing clearance.", expected: "Runway 24, cleared to land, EC-LVV.", acceptedVariants: ["Cleared to land Runway 24, EC-LVV"] },
  ],
};
// Cleared to Land: landing clearance → vacate Wilco → contact Ground.
B[step(SC, "Landing Basics", "Cleared to Land")] = {
  instruction: "You are EC-MBC on final for runway 24. ATC will clear you to land and give post-landing instructions.",
  transmissions: [
    a("EC-MBC, wind 240 degrees 8 knots, runway 24, cleared to land."),
    { speaker: "user", prompt: "Read back landing clearance.", expected: "Runway 24, cleared to land, EC-MBC.", acceptedVariants: ["Cleared to land Runway 24, EC-MBC"] },
    a("EC-MBC, vacate via Alfa when able."),
    { speaker: "user", prompt: "Acknowledge vacate instruction.", expected: "Wilco, EC-MBC.", acceptedVariants: ["Vacate via Alfa, EC-MBC."] },
    a("EC-MBC, contact Ground one two one decimal seven when vacated."),
    { speaker: "user", prompt: "Read back the frequency change.", expected: "When vacated contact Ground 121.700, EC-MBC.", acceptedVariants: ["Contact Ground 121.700 when vacated, EC-MBC"] },
  ],
};
// Runway Vacated: vacate + freq → first call on Ground → taxi to stand.
// Removed trailing "give way" exchange (untaught). 3 pilot turns is the right Cadet endpoint.
// Back-to-back u() at positions 2+3: readback then first call on new frequency (allowed exception).
B[step(SC, "Landing Basics", "Runway Vacated")] = {
  instruction: "You are EC-BEA on the runway after landing. ATC will clear you to vacate and change to Ground frequency.",
  transmissions: [
    a("EC-BEA, vacate runway when able, contact Ground one two one decimal seven."),
    { speaker: "user", prompt: "Read back vacate and frequency.", expected: "Vacating runway, contact Ground 121.700, EC-BEA.", acceptedVariants: ["Vacate runway and contact Ground 121.700, EC-BEA"] },
    { speaker: "user", prompt: "Make your first call on Ground.", expected: "Madrid Ground, EC-BEA, runway vacated.", acceptedVariants: ["Madrid Ground, EC-BEA."] },
    a("EC-BEA, welcome back. Taxi to stand 12 via Alfa."),
    u("Read back taxi to stand.", "Taxi to stand 12 via Alfa, EC-BEA."),
  ],
};

/* ---- Taxi Back Basics ---- */
// Taxi to Parking: taxi to stand → hold position → continue.
// Replaced "give way to the company Airbus" (untaught, multi-aircraft) with "hold position"
// (trained in Taxi Basics topic), which is the correct Cadet-level equivalent.
B[step(SC, "Taxi Back Basics", "Taxi to Parking")] = {
  instruction: "You are EC-MAR taxiing after landing. Follow ATC instructions to stand 12.",
  transmissions: [
    a("EC-MAR, taxi to stand 12 via Alfa."),
    u("Read back taxi to stand.", "Taxi to stand 12 via Alfa, EC-MAR."),
    a("EC-MAR, hold position."),
    { speaker: "user", prompt: "Acknowledge.", expected: "Holding position, EC-MAR.", acceptedVariants: ["Hold position, EC-MAR"] },
    a("EC-MAR, stand 12 is clear, continue."),
    { speaker: "user", prompt: "Acknowledge continue.", expected: "Wilco, EC-MAR.", acceptedVariants: ["Continue, EC-MAR"] },
  ],
};
// Frequency Change After Landing: freq change → first call → taxi → follow marshaller.
// Back-to-back u() at positions 2+3: readback then first call on new frequency (allowed exception).
B[step(SC, "Taxi Back Basics", "Frequency Change After Landing")] = {
  instruction: "You are EC-CVR after landing. Change to Ground frequency and complete the taxi exchange.",
  transmissions: [
    a("EC-CVR, contact Ground one two one decimal seven."),
    u("Read back the frequency change.", "Contact Ground 121.700, EC-CVR."),
    u("Make your first call on Ground.", "Madrid Ground, EC-CVR."),
    a("EC-CVR, Madrid Ground, taxi to stand 12."),
    u("Read back taxi to stand.", "Taxi to stand 12, EC-CVR."),
    a("EC-CVR, follow the marshaller into stand 12."),
    { speaker: "user", prompt: "Acknowledge.", expected: "Wilco, EC-CVR.", acceptedVariants: ["Follow the marshaller into stand 12, EC-CVR"] },
  ],
};
// Parking Complete: continue to stand → hold position → no further radio.
// Replaced "give way to vehicle crossing" (untaught) with "hold position" (trained).
B[step(SC, "Taxi Back Basics", "Parking Complete")] = {
  instruction: "You are EC-POL approaching stand 12. Follow ATC to complete the flight.",
  transmissions: [
    a("EC-POL, continue to stand 12."),
    { speaker: "user", prompt: "Acknowledge.", expected: "Wilco, EC-POL.", acceptedVariants: ["Continue to stand 12, EC-POL"] },
    a("EC-POL, hold position."),
    { speaker: "user", prompt: "Acknowledge.", expected: "Holding position, EC-POL.", acceptedVariants: ["Hold position, EC-POL"] },
    a("EC-POL, stand 12, no further radio required."),
    { speaker: "user", prompt: "Acknowledge radio-off.", expected: "Stand 12, Roger, EC-POL.", acceptedVariants: ["Stand 12, EC-POL"] },
  ],
};

/* ================= MICRO MISSIONS (5) ================= */
const MM = "cadet-micro-missions";
B[flat(MM, "mission", "First Radio Call")] = {
  briefing: "Make your first radio call and complete a basic radio check.",
  skills: "Phraseology - Confidence - Radio check",
  requirements: ["Radio Checks", "Who am I calling?"],
  transmissions: [
    a("Madrid Ground, information Bravo current, QNH one zero one six."),
    u("Call Ground for a radio check.", "Madrid Ground, Iberia 325, radio check."),
    a("Iberia 325, Madrid Ground, readability five."),
    u("Acknowledge the radio check.", "Readability five, Iberia 325."),
    a("Iberia 325, report when ready for startup."),
    u("Tell Ground you are ready for startup.", "Ready for startup, Iberia 325."),
  ],
};
B[flat(MM, "mission", "Request Startup")] = {
  briefing: "Request startup from Ground and read back the approval.",
  skills: "Phraseology - Readbacks - Confidence",
  requirements: ["Basic Requests", "Basic Startup Readback"],
  transmissions: [
    u("Call Ground and request startup from stand A12.", "Madrid Ground, Iberia 325, stand A12, request startup."),
    a("Iberia 325, startup approved, QNH one zero one six."),
    u("Read back the approval.", "Startup approved, QNH 1016, Iberia 325."),
    a("Iberia 325, squawk 4215."),
    u("Read back the squawk.", "Squawk 4215, Iberia 325."),
    a("Call for taxi when ready."),
    u("Acknowledge.", "Call for taxi, Iberia 325."),
  ],
};
B[flat(MM, "mission", "Request Taxi")] = {
  briefing: "Request taxi and read back a basic taxi instruction.",
  skills: "Listening - Readbacks - Phraseology",
  requirements: ["Request Taxi", "Basic Taxi Readback"],
  transmissions: [
    u("Request taxi.", "Madrid Ground, Iberia 325, request taxi."),
    a("Taxi to holding point Alfa One via Alfa, hold short runway two four."),
    u("Read back the taxi route and hold short.", "Taxi to holding point Alfa One via Alfa, hold short runway 24, Iberia 325."),
    a("Give way to the company Airbus from your left."),
    u("Acknowledge.", "Give way, Iberia 325."),
    a("Report ready at holding point Alfa One."),
    u("Acknowledge.", "Wilco, Iberia 325."),
  ],
};
B[flat(MM, "mission", "Contact Tower")] = {
  briefing: "Change to Tower and make your first call on the new frequency.",
  skills: "Readbacks - Phraseology - Confidence",
  requirements: ["Frequency Changes", "Contact Tower"],
  transmissions: [
    a("Iberia 325, contact Tower one one eight decimal one."),
    u("Read back the frequency.", "Contact Tower 118.100, Iberia 325."),
    u("Call Tower on the new frequency.", "Madrid Tower, Iberia 325."),
    a("Iberia 325, Madrid Tower, holding point Alfa One, report ready for departure."),
    u("Report ready for departure.", "Holding point Alfa One, ready for departure, Iberia 325."),
    a("Iberia 325, line up and wait runway two four."),
    u("Read back line up and wait.", "Line up and wait runway 24, Iberia 325."),
  ],
};
B[flat(MM, "mission", "Landing Clearance")] = {
  briefing: "Listen for landing clearance and read it back correctly.",
  skills: "Listening - Readbacks - Confidence",
  requirements: ["Readback Radio Checks", "Basic Taxi Readback"],
  transmissions: [
    a("Iberia 325, number two, follow the Airbus on short final."),
    u("Acknowledge the traffic.", "Number two, traffic in sight, Iberia 325."),
    a("Iberia 325, wind 240 degrees 8 knots, runway two four cleared to land."),
    u("Read back the landing clearance.", "Runway 24 cleared to land, Iberia 325."),
    a("Vacate left when able, contact Ground one two one decimal seven."),
    u("Read back the vacate and frequency.", "Vacate left, Ground 121.700, Iberia 325."),
  ],
};

