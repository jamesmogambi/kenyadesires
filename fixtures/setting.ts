import { practices } from "./practice";

export const variantSettings = {
  age: [
    {
      name: "Moms",
    },
    {
      name: "Teens",
    },
    {
      name: "Mature",
    },
    {
      name: "Loita",
    },
  ],

  breast: [
    {
      name: "Small",
    },
    {
      name: "Medium",
    },
    {
      name: "Big Boobs",
    },
  ],
  character: [
    {
      name: "Chubby Mama",
    },

    {
      name: "Blonde",
    },
    {
      name: "Skinny Girl",
    },
  ],

  hairColor: [
    {
      name: "Black",
    },
    {
      name: "Brunnette",
    },
  ],

  nationality: [
    {
      name: "Kenyan",
      flag: "KE",
    },
  ],

  experience: [
    {
      name: "Newbie",
    },
    {
      name: "Experienced",
    },
    {
      name: "Professional",
    },
  ],
  languages: [
    {
      name: "English",
      flag: "US",
    },
    {
      name: "French",
      flag: "FR",
    },

    {
      name: "Japanese",
      flag: "JP",
    },
    {
      name: "Swahili",
      flag: "KE",
    },
  ],
  availability: ["Incall", "outcall", "Both"],
  categories: ["Sex", "Massages", "BDSM"],
  practices: Array.from({ length: 40 }, (_, i) => ({
    id: i + 1,
    name: `practice ${i + 1}`,
  })),

  bdsm: Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    name: `bdsm ${i + 1}`,
  })),

  massage: Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    name: `massage ${i + 1}`,
  })),
};
