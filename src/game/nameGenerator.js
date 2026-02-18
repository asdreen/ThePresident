// Simple but expandable name generator

const FIRST_NAMES = [
  "Alexander","Michael","Daniel","Samuel","David","Robert","Thomas","James",
  "Lukas","Mark","Victor","Andrei","Ivan","Nikolai","Emil","Arben","Ilir",
  "Ahmed","Omar","Yusuf","Hassan","Karim","Ali",
  "Jean","Pierre","Luc","Antoine","Louis",
  "Maria","Anna","Elena","Sara","Maya","Nina","Sofia","Laura","Eva",
];

const LAST_NAMES = [
  "Novak","Silva","Moreau","Dupont","Schmidt","Müller","Weber","Kovač",
  "Petrov","Ivanov","Smirnov","Popescu","Ionescu","Hoxha","Berisha",
  "Rossi","Bianchi","Conti",
  "Khan","Hassan","Rahman","Abdullah",
  "Johnson","Brown","Miller","Taylor",
];

const TRAITS = [
  "Negotiator",
  "Hardliner",
  "Technocrat",
  "Party Loyalist",
  "Media Star",
  "Idealist",
  "Opportunist",
];

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generatePerson(role = "official") {
  return {
    id: crypto.randomUUID(),
    name: `${rand(FIRST_NAMES)} ${rand(LAST_NAMES)}`,
    skill: randInt(1, 5),
    loyalty: randInt(1, 5),
    trait: rand(TRAITS),
    role,
  };
}

export function generatePeople(count, role) {
  return Array.from({ length: count }, () => generatePerson(role));
}
