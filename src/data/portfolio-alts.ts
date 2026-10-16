// Descriptive alt text per project, in visual order (desktop = boards; mobile entries are unused).
// Written from what is visibly on each design. Projects without an entry get a generic description.
export const alts: Record<string, { desktop?: string[]; mobile?: string[] }> = {
  'social-mzuriorganics': {
    desktop: [
      'MZURI Organics social media board: “Grow more from better soil” web banner, two product posts and the “Grow faster, greener, stronger” key visual with a farmer and a fertiliser bag',
    ],
    mobile: [
      'MZURI Organics web banner: “Grow more from better soil” with product packs',
      'MZURI Organics post: “Faster plant growth & greener leaves” with a hand holding a MZURI bottle',
      'MZURI Organics key visual: “Grow faster, greener, stronger” with a farmer holding soil beside a vermifrass bag',
      'MZURI Organics post: “Healthy soil leads to better farming” with a liquid fertiliser bottle and seedlings',
    ],
  },
  'social-kukupoultry': {
    desktop: [
      'Kuku Poultry social media board: “We raise food the right way” banner, “Because trust matters at the table” and “Kuku raises the bar” posts, and the “Choose better poultry today” key visual',
    ],
    mobile: [
      'Kuku Poultry banner: “We raise food the right way — fresh you can trust”',
      'Kuku Poultry post: “Because trust matters at the table” with a hen on a nest of eggs',
      'Kuku Poultry key visual: “Choose better poultry today” with fresh chicken and lemon',
      'Kuku Poultry post: “Breaking news! Kuku raises the bar”',
    ],
  },
  'social-eddykenzo': {
    desktop: [
      'Eddy Kenzo board 1: Martha Mukisa “Sisaaga” live concert poster, “Nyonyi Nyange” remix cover with Oma Afrikana and Eddy Kenzo, and the “Shakamo” video announcement',
      'Eddy Kenzo board 2: Eddy Kenzo Festival posters for Kololo Airstrip and the 9th African Descent Festival 2023 poster',
      'Eddy Kenzo board 3: Ecofest Sierra Leone 2021 “Rejuvenate” poster, Morgan Heritage “The Homeland” poster and the UG Billboard Charts “Artist of the month” feature',
    ],
    mobile: [
      'Martha Mukisa “Sisaaga” live concert poster',
      'Eddy Kenzo ft. Tribe Mark “Shakamo” — video dropping soon',
      '“Nyonyi Nyange” remix cover with Oma Afrikana and Eddy Kenzo',
      'Eddy Kenzo Festival “Today” poster — Kololo Airstrip',
      '9th African Descent Festival 2023 poster featuring Eddy Kenzo — English Bay Beach, 12–13 August',
      'Eddy Kenzo Festival poster — 12 November 2022, Kololo Airstrip',
      'Ecofest Sierra Leone 2021 “Rejuvenate” poster with Eddy Kenzo',
      'UG Billboard Charts “Artist of the month — July” feature on Eddy Kenzo',
      'Morgan Heritage “The Homeland” poster',
    ],
  },
};
