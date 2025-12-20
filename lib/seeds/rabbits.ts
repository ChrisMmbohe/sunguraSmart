// seeds/rabbits.ts

const rabbitSeedData = [
  // ========================
  // BREEDING BUCKS (Purchased Founders)
  // ========================
  {
    tag_id: "BUCK-001",
    name: "Apollo",
    gender: "Male",
    breed: "new zealand white",
    color: "white",
    date_of_birth: "2024-02-15",
    acquisition_type: "purchased",
    acquisition_date: "2024-03-20",
    source_farm: "Premier Rabbitry",
    cage_id: "B01",
    category: "breeder",
    notes: "Proven sire - excellent meat lines",
  },
  {
    tag_id: "BUCK-002",
    name: "Thunder",
    gender: "Male",
    breed: "californian",
    color: "white with black points",
    date_of_birth: "2024-03-01",
    acquisition_type: "purchased",
    acquisition_date: "2024-04-01",
    source_farm: "Golden State Rabbits",
    cage_id: "B02",
    category: "breeder",
  },
  {
    tag_id: "BUCK-003",
    name: "Titan",
    gender: "Male",
    breed: "flemish giant",
    color: "sandy",
    date_of_birth: "2023-10-01",
    acquisition_type: "purchased",
    acquisition_date: "2023-12-15",
    source_farm: "Flemish Legends Farm",
    cage_id: "GIANT-01",
    category: "breeder",
  },

  // ========================
  // BREEDING DOES (Purchased Founders)
  // ========================
  {
    tag_id: "DOE-001",
    name: "Luna",
    gender: "Female",
    breed: "new zealand white",
    color: "white",
    date_of_birth: "2024-01-10",
    acquisition_type: "purchased",
    acquisition_date: "2024-02-15",
    source_farm: "Premier Rabbitry",
    cage_id: "NEST-01", // Moved here because pregnant
    category: "breeder",
    is_pregnant: true,
    last_breeding_date: "2025-10-19",
    notes: "Pregnant - due ~ Nov 19-20, 2025 (31-day gestation)",
  },
  {
    tag_id: "DOE-002",
    name: "Snowball",
    gender: "Female",
    breed: "californian",
    color: "white with black points",
    date_of_birth: "2024-04-05",
    acquisition_type: "purchased",
    acquisition_date: "2024-05-10",
    source_farm: "West Coast Breeders",
    cage_id: "D02",
    category: "breeder",
  },
  {
    tag_id: "DOE-003",
    name: "Silver Queen",
    gender: "Female",
    breed: "champagne d'argent",
    color: "silver (champagne)",
    date_of_birth: "2024-05-20",
    acquisition_type: "purchased",
    acquisition_date: "2024-06-20",
    source_farm: "Heritage Rabbitry",
    cage_id: "D03",
    category: "breeder",
  },
  {
    tag_id: "DOE-004",
    name: "Velveteen",
    gender: "Female",
    breed: "rex",
    color: "black otter",
    date_of_birth: "2024-06-15",
    acquisition_type: "purchased",
    acquisition_date: "2024-07-20",
    source_farm: "Rex Excellence",
    cage_id: "NEST-02",
    category: "breeder",
  },

  // ========================
  // LITTER 1: NZW - Apollo × Luna - Born Aug 10, 2025 (101 days old - meat ready)
  // ========================
  ...Array.from({ length: 8 }, (_, i) => ({
    tag_id: `NZW-2508-${String(i + 1).padStart(2, "0")}`,
    name: null,
    gender: i < 4 ? "Male" : "Female",
    breed: "new zealand white",
    color: "white",
    date_of_birth: "2025-08-10",
    acquisition_type: "born",
    acquisition_date: "2025-08-10",
    sire_tag: "BUCK-001",
    dam_tag: "DOE-001",
    cage_id: i < 6 ? "A01" : "A02",
    category: "meat",
    notes: i < 4 ? "Potential future buck" : null,
  })),

  // ========================
  // LITTER 2: Californian Thunder × Snowball - Born Sep 25, 2025 (~55 days - fast growing)
  // ========================
  ...Array.from({ length: 8 }, (_, i) => ({
    tag_id: `CAL-2509-${String(i + 1).padStart(2, "0")}`,
    name: null,
    gender: i < 5 ? "Male" : "Female", // 5M 3F
    breed: "californian",
    color: "white with black points",
    date_of_birth: "2025-09-25",
    acquisition_type: "born",
    acquisition_date: "2025-09-25",
    sire_tag: "BUCK-002",
    dam_tag: "DOE-002",
    cage_id: "WEAN-01",
    category: "meat",
  })),

  // ========================
  // PET RABBITS (Bonded Holland Lop pair)
  // ========================
  {
    tag_id: "PET-HL-01",
    name: "Mocha",
    gender: "Male",
    breed: "holland lop",
    color: "chocolate tort",
    date_of_birth: "2024-08-01",
    acquisition_type: "purchased",
    acquisition_date: "2024-09-15",
    source_farm: "Lop Love Rabbitry",
    cage_id: "PET-01",
    category: "pet",
  },
  {
    tag_id: "PET-HL-02",
    name: "Latte",
    gender: "Female",
    breed: "holland lop",
    color: "cream",
    date_of_birth: "2024-08-05",
    acquisition_type: "purchased",
    acquisition_date: "2024-09-15",
    cage_id: "PET-01",
    category: "pet",
    notes: "Bonded pair with Mocha",
  },

  // ========================
  // QUARANTINE - New Mini Rex buck
  // ========================
  {
    tag_id: "MRX-001",
    name: "Shadow",
    gender: "Male",
    breed: "mini rex",
    color: "black",
    date_of_birth: "2025-05-01",
    acquisition_type: "purchased",
    acquisition_date: "2025-11-10",
    source_farm: "Mini Rex Elite",
    cage_id: "QUARANTINE",
    category: "breeder",
    notes: "In quarantine until Dec 1, 2025",
  },
];

export default rabbitSeedData;