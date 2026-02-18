export function getEvents(g) {
  const base = [
    {
      name: "Flooding in the North",
      text: "Infrastructure damage and displaced families.",
      options: [
        { label: "Send aid (-150)", apply: (x) => { x.stats.money -= 150; x.stats.happiness += 3; x.stats.stability += 2; } },
        { label: "Leave it to local gov", apply: (x) => { x.stats.happiness -= 4; x.stats.stability -= 3; } },
      ],
    },
    {
      name: "Global Market Wobble",
      text: "Exports slow down. Businesses hesitate.",
      options: [
        { label: "Do nothing", apply: (x) => { x.stats.jobs -= 3; x.stats.happiness -= 1; } },
        { label: "Emergency stimulus (-120)", apply: (x) => { x.stats.money -= 120; x.stats.jobs += 2; } },
      ],
    },
    {
      name: "Corruption Rumors",
      text: "Media reports suspicious contracts.",
      options: [
        { label: "Investigate", apply: (x) => { x.stats.corruption -= 6; x.stats.stability -= 1; } },
        { label: "Deny & move on", apply: (x) => { x.stats.happiness -= 2; x.stats.corruption += 4; } },
      ],
    },
  ];

  const triggered = [];
  if (g.stats.happiness < 30) {
    triggered.push({
      name: "Protest Wave",
      text: "Large demonstrations spread across major cities.",
      options: [
        { label: "Negotiate (-80)", apply: (x) => { x.stats.money -= 80; x.stats.happiness += 5; x.stats.stability += 2; } },
        { label: "Crack down", apply: (x) => { x.stats.security += 4; x.stats.happiness -= 7; x.stats.stability -= 4; } },
      ],
    });
  }

  return [...triggered, ...base];
}
