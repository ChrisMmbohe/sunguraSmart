// seeds/rabbit-breeds.ts  (or just copy-paste into a seeding script)

const rabbitBreeds = [
  {
    name: "new zealand white",
    description: "The most popular commercial meat rabbit worldwide. Fast growth, excellent feed conversion.",
    average_weight_kg: 4.5,
    breed_colors: ["white"],
    recommended_feed: "18% protein grower pellets + unlimited timothy hay",
    maturity_age_days: 98, // ~14 weeks for meat production
  },
  {
    name: "californian",
    description: "Large white rabbit with black points. Excellent meat breed, calm temperament.",
    average_weight_kg: 4.3,
    breed_colors: ["white with black nose, ears, feet, tail"],
    recommended_feed: "High-protein commercial pellets + greens",
    maturity_age_days: 105,
  },
  {
    name: "flemish giant",
    description: "The largest rabbit breed. Often kept as pet or for meat in small-scale farms.",
    average_weight_kg: 7.5,
    breed_colors: ["black", "blue", "fawn", "light gray", "sandy", "steel gray", "white"],
    recommended_feed: "16-18% protein + large amounts of hay (very high intake needed)",
    maturity_age_days: 180, // Slower maturing giant breed
  },
  {
    name: "rex",
    description: "Known for its plush, velvety fur. Dual-purpose (fur + meat).",
    average_weight_kg: 4.0,
    breed_colors: ["black", "blue", "castor", "chinchilla", "lilac", "lynx", "opal", "white", "broken"],
    recommended_feed: "17% protein pellets + hay",
    maturity_age_days: 120,
  },
  {
    name: "mini rex",
    description: "Smaller version of Rex with the same luxurious fur. Popular show and pet rabbit.",
    average_weight_kg: 2.0,
    breed_colors: ["black", "blue", "castor", "chocolate", "lilac", "lynx", "opal", "red", "white", "broken"],
    recommended_feed: "16% protein + unlimited hay",
    maturity_age_days: 150,
  },
  {
    name: "netherland dwarf",
    description: "One of the smallest rabbit breeds. Primarily kept as pets.",
    average_weight_kg: 1.0,
    breed_colors: ["black", "blue", "chocolate", "lilac", "otter", "sable", "tort", "himalayan", "orange", "fawn"],
    recommended_feed: "High-fiber, lower-protein diet (14-16%)",
    maturity_age_days: 180,
  },
  {
    name: "french lop",
    description: "Large lop-eared breed. Gentle giants, good for meat and pets.",
    average_weight_kg: 5.0,
    breed_colors: ["broken", "solid", "agouti", "self"],
    recommended_feed: "16-18% protein + lots of hay",
    maturity_age_days: 160,
  },
  {
    name: "champagne d'argent",
    description: "Heritage French breed. Beautiful silvering coat, excellent meat qualities.",
    average_weight_kg: 4.5,
    breed_colors: ["silver (champagne)"],
    recommended_feed: "Commercial 17% grower pellets",
    maturity_age_days: 112,
  },
  {
    name: "satin",
    description: "Known for glossy, sheen fur due to unique hair structure. Good meat breed.",
    average_weight_kg: 4.3,
    breed_colors: ["black", "blue", "chocolate", "copper", "red", "siamese", "white"],
    recommended_feed: "18% protein pellets",
    maturity_age_days: 105,
  },
  {
    name: "holland lop",
    description: "Most popular pet rabbit in many countries. Compact with lop ears.",
    average_weight_kg: 1.6,
    breed_colors: ["broken", "solid", "agouti", "tort", "pointed white"],
    recommended_feed: "16% protein + high fiber",
    maturity_age_days: 180,
  },
];

export default rabbitBreeds;