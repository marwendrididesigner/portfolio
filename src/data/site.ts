// Personal details and copy. Sources: Marwen's written profile (Oct 2026) and the PDF (pages 1–2).

export const person = {
  name: 'Marwen Dridi',
  role: 'Senior Graphic Designer',
  experience: '8+',
  email: 'marwendridi431@gmail.com',
  phoneDisplay: '+216 90 130 645',
  whatsapp: 'https://wa.me/21690130645',
  location: 'Tunis, Tunisia',
  portfolioPdf: 'https://drive.google.com/file/d/1jRl5cFLPCZ_LX-N8IH4f5x87k8VcqsdH/view?usp=sharing',
};

export const hero = {
  statement: ['Brand Identity.', 'Editorial Design.', 'Digital Communication.'],
  support:
    '8+ years designing brand identities, visual guidelines, presentations, and marketing materials for startups, agencies, and organizations across international markets.',
};

export const about = {
  heading: 'Design expertise across branding, editorial, and digital communication.',
  paragraphs: [
    'Senior graphic designer with 8+ years of experience specializing in brand identities, brand guidelines, and presentation design for startups, agencies, and organizations.',
    // Regions: the 15 countries include India (Vijay Sales, PDF p.14), hence "Asia".
    'I’ve designed for clients in 15 countries across Africa, the Middle East, Europe, Asia, and North America — from logo systems and bilingual Arabic/Latin brand guidelines to company profiles, impact reports, pitch decks, and social media campaigns.',
  ],
};

// Key numbers — verified only:
// - 8+ years: PDF p.1 + Marwen's profile.
// - 15 countries: distinct "Country" labels on PDF project pages (Canada, Egypt, France, India,
//   Jordan, Kenya, Kuwait, Libya, Qatar, Rwanda, Tunisia, Turkey, UAE, Uganda, USA).
// - 5 certifications: listed below.
export const metrics = [
  { value: '8+', label: 'Years of experience' },
  { value: '15', label: 'Countries in the client portfolio' },
  { value: '5', label: 'Professional certifications' },
];

export const tools = [
  {
    group: 'Design software',
    items: ['Adobe Photoshop', 'Adobe Illustrator', 'Adobe InDesign', 'Adobe After Effects', 'Adobe Premiere Pro', 'Adobe Lightroom', 'Adobe Audition', 'Figma', 'Microsoft PowerPoint'],
  },
  {
    // PDF p.2
    group: 'AI · Image & text',
    items: ['ChatGPT', 'Claude', 'Gemini', 'GPT Image 2', 'Nano Banana Pro', 'Midjourney', 'Adobe Firefly'],
  },
  {
    // PDF p.2
    group: 'AI · Video & motion',
    items: ['Google Flow', 'Veo', 'Runway', 'Kling AI', 'Higgsfield', 'Sora'],
  },
];

export const certifications = [
  { name: 'Generative AI for Everyone', issuer: 'DeepLearning.AI', date: 'Jan 2026', iso: '2026-01' },
  { name: 'Google AI Essentials', issuer: 'Google', date: 'Feb 2025', iso: '2025-02' },
  { name: 'Adobe Certified Professional in Print & Digital Media Publication Using Adobe InDesign', issuer: 'Adobe / Certiport', date: 'Jun 2023', iso: '2023-06' },
  { name: 'Adobe Certified Professional in Graphic Design & Illustration Using Adobe Illustrator', issuer: 'Adobe / Certiport', date: 'Apr 2022', iso: '2022-04' },
  { name: 'Microsoft Office Specialist: PowerPoint Associate (Microsoft 365 Apps)', issuer: 'Microsoft', date: 'Apr 2021', iso: '2021-04' },
];

export const languages = [
  { name: 'Arabic', level: 'Native / bilingual' },
  { name: 'English', level: 'Conversational' },
  { name: 'French', level: 'Conversational' },
];

export const contact = {
  heading: 'Have a design project in mind?',
  text: 'Available for freelance projects and collaborations in brand identity, presentation design, editorial publications, and digital communication.',
};
