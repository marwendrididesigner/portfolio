// Personal details and copy. Sources: Marwen's written profile (Oct 2026) and the PDF (pages 1–2).
// Text that differs between /en/ and /fr/ lives in `copy` (English is the source); everything else is shared.
import type { Lang } from '../i18n/ui';

export const person = {
  name: 'Marwen Dridi',
  experience: '8+',
  email: 'marwendridi431@gmail.com',
  phoneDisplay: '+216 90 130 645',
  whatsapp: 'https://wa.me/21690130645',
  portfolioPdf: 'https://drive.google.com/file/d/1jRl5cFLPCZ_LX-N8IH4f5x87k8VcqsdH/view?usp=sharing',
};

// Social proof strip — figures supplied by Marwen (Oct 2026). The "+" is always a suffix.
export const metrics = ['8', '100', '65', '15']; // labels: copy[lang].metrics, same order

export const tools = [
  {
    group: 0, // copy[lang].toolGroups[0]
    items: ['Adobe Photoshop', 'Adobe Illustrator', 'Adobe InDesign', 'Adobe After Effects', 'Adobe Premiere Pro', 'Adobe Lightroom', 'Adobe Audition', 'Figma', 'Microsoft PowerPoint'],
  },
  {
    // PDF p.2
    group: 1,
    items: ['ChatGPT', 'Claude', 'Gemini', 'GPT Image 2', 'Nano Banana Pro', 'Midjourney', 'Adobe Firefly'],
  },
  {
    // PDF p.2
    group: 2,
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

// Certificate names and issuers stay in English (official titles); dates are formatted per language.
export const copy = {
  en: {
    role: 'Senior Graphic Designer',
    location: 'Tunis, Tunisia',
    whatsappMessage: 'Hello Marwen, I saw your portfolio and would like to discuss a design project.',
    hero: {
      statement: ['Brand Identity.', 'Editorial Design.', 'Digital Communication.'],
      support:
        '8+ years designing brand identities, visual guidelines, presentations, and marketing materials for startups, agencies, and organizations across international markets.',
    },
    metrics: ['Years of experience', 'Projects completed', 'Clients', 'Countries served'],
    toolGroups: ['Design software', 'AI · Image & text', 'AI · Video & motion'],
    languages: [
      { name: 'Arabic', level: 'Native / bilingual' },
      { name: 'English', level: 'Conversational' },
      { name: 'French', level: 'Conversational' },
    ],
    contact: {
      heading: 'Have a design project in mind?',
      text: 'Available for freelance projects and collaborations in brand identity, presentation design, editorial publications, and digital communication.',
    },
  },
  fr: {
    role: 'Graphiste senior',
    location: 'Tunis, Tunisie',
    whatsappMessage: 'Bonjour Marwen, j’ai consulté votre portfolio et j’aimerais discuter d’un projet de design.',
    hero: {
      statement: ['Identité de marque.', 'Design éditorial.', 'Communication digitale.'],
      support:
        'Plus de 8 ans d’expérience dans la création d’identités de marque, de chartes graphiques, de présentations et de supports marketing pour des startups, des agences et des organisations sur les marchés internationaux.',
    },
    metrics: ['Années d’expérience', 'Projets réalisés', 'Clients', 'Pays couverts'],
    toolGroups: ['Logiciels de design', 'IA · Image & texte', 'IA · Vidéo & motion'],
    languages: [
      { name: 'Arabe', level: 'Langue maternelle / bilingue' },
      { name: 'Anglais', level: 'Niveau conversationnel' },
      { name: 'Français', level: 'Niveau conversationnel' },
    ],
    contact: {
      heading: 'Un projet de design en tête ?',
      text: 'Disponible pour des projets freelance et des collaborations en identité de marque, design de présentations, publications éditoriales et communication digitale.',
    },
  },
} satisfies Record<Lang, unknown>;

// "Jan 2026" (as written in the profile) / "janv. 2026"
export const certDate = (lang: Lang, c: { date: string; iso: string }) =>
  lang === 'en' ? c.date : new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${c.iso}-01T00:00:00Z`));
