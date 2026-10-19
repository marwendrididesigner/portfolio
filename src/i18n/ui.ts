// Interface text for the two public versions (/en/ and /fr/). One site, one portfolio.json: only the
// words change. English is the source; French is written for agencies, companies and institutions.
// Portfolio data (projects, boards, Selected Work) is shared and edited only through /admin/.

export const langs = ['en', 'fr'] as const;
export type Lang = (typeof langs)[number];

// The language of the page being rendered, from its URL (/portfolio/fr/… → fr; everything else → en).
export const langOf = (url: URL): Lang => (/\/fr(\/|$)/.test(url.pathname) ? 'fr' : 'en');

const en = {
  htmlLang: 'en',
  ogLocale: 'en_US',
  meta: {
    title: 'Marwen Dridi — Senior Graphic Designer | Brand Identity, Editorial & Presentation Design',
    description:
      'Marwen Dridi is a senior graphic designer in Tunis with 8+ years of experience in brand identities, bilingual Arabic/Latin brand guidelines, company profiles, pitch decks, reports and social media campaigns for clients in 15 countries.',
    ogAlt: 'Marwen Dridi — portfolio cover with portrait',
  },
  skip: 'Skip to work',
  header: {
    home: 'back to top',
    menu: 'Menu',
    mainNav: 'Main',
    work: 'Work',
    credentials: 'Credentials',
    contact: 'Contact',
    newTab: '(opens in a new tab)',
    language: 'Language',
  },
  hero: {
    contactDetails: 'Contact details',
    years: 'years of experience',
    viewWork: 'View work',
    contact: 'Contact',
    portraitAlt: 'Portrait of Marwen Dridi in black and white, wearing a black T-shirt',
  },
  proof: { label: 'Key figures' },
  catnav: { label: 'Portfolio categories', selected: 'Selected Work' },
  selected: {
    title: 'Selected Work',
    // Joined into the introduction sentence; packaging only appears once it has featured work
    lede: (packaging: boolean) =>
      `A selection of brand identities, campaigns, editorial design,${packaging ? ' packaging,' : ''} and AI-powered visuals.`,
    explore: (title: string) => `Explore all ${title} projects`,
    fullTitle: 'Full Portfolio',
    fullLede: 'Explore the complete collection of projects.',
  },
  work: {
    label: 'Portfolio',
    deliverables: 'Deliverables',
    open: 'Open larger view',
    close: 'Close viewer',
    prev: 'Previous image',
    next: 'Next image',
  },
  credentials: {
    eyebrow: 'Credentials',
    title: 'Tools, certifications & languages',
    software: 'Software & platforms',
    certifications: 'Certifications',
    languages: 'Languages',
  },
  contact: {
    eyebrow: 'Contact',
    email: 'Email',
    opensWhatsApp: ' (opens WhatsApp)',
    pdf: 'Download the full PDF',
    pdfHint: ' (Google Drive, opens in a new tab)',
    sendEmail: 'Send an email',
    quick: 'Quick message on WhatsApp',
    newTab: ' (opens in a new tab)',
  },
  toTop: 'Back to top',
  whatsapp: {
    label: 'Message me on WhatsApp',
    short: 'Message me',
    message: 'Hello Marwen, I visited your portfolio and would like to discuss a design project.',
  },
};

type Dict = typeof en;

const fr: Dict = {
  htmlLang: 'fr',
  ogLocale: 'fr_FR',
  meta: {
    title: 'Marwen Dridi — Graphiste senior | Identité de marque, design éditorial & présentations',
    description:
      'Marwen Dridi est graphiste senior à Tunis, avec plus de 8 ans d’expérience en identités de marque, chartes graphiques bilingues arabe/latin, plaquettes institutionnelles, pitch decks, rapports et campagnes sur les réseaux sociaux, pour des clients dans 15 pays.',
    ogAlt: 'Marwen Dridi — couverture du portfolio avec portrait',
  },
  skip: 'Aller aux projets',
  header: {
    home: 'retour en haut de page',
    menu: 'Menu',
    mainNav: 'Navigation principale',
    work: 'Projets',
    credentials: 'Compétences',
    contact: 'Contact',
    newTab: '(s’ouvre dans un nouvel onglet)',
    language: 'Langue',
  },
  hero: {
    contactDetails: 'Coordonnées',
    years: 'ans d’expérience',
    viewWork: 'Voir les projets',
    contact: 'Contact',
    portraitAlt: 'Portrait en noir et blanc de Marwen Dridi, vêtu d’un T-shirt noir',
  },
  proof: { label: 'Chiffres clés' },
  catnav: { label: 'Catégories du portfolio', selected: 'Sélection' },
  selected: {
    title: 'Sélection de projets',
    lede: (packaging: boolean) =>
      `Une sélection d’identités de marque, de campagnes, de design éditorial${packaging ? ', de packaging' : ''} et de visuels créés avec l’IA.`,
    explore: (title: string) => `Voir tous les projets « ${title} »`,
    fullTitle: 'Portfolio complet',
    fullLede: 'Découvrez l’ensemble des projets.',
  },
  work: {
    label: 'Portfolio',
    deliverables: 'Livrables',
    open: 'Agrandir l’image',
    close: 'Fermer la visionneuse',
    prev: 'Image précédente',
    next: 'Image suivante',
  },
  credentials: {
    eyebrow: 'Compétences',
    title: 'Outils, certifications & langues',
    software: 'Logiciels & plateformes',
    certifications: 'Certifications',
    languages: 'Langues',
  },
  contact: {
    eyebrow: 'Contact',
    email: 'E-mail',
    opensWhatsApp: ' (ouvre WhatsApp)',
    pdf: 'Télécharger le PDF complet',
    pdfHint: ' (Google Drive, s’ouvre dans un nouvel onglet)',
    sendEmail: 'Envoyer un e-mail',
    quick: 'Message rapide sur WhatsApp',
    newTab: ' (s’ouvre dans un nouvel onglet)',
  },
  toTop: 'Retour en haut de page',
  whatsapp: {
    label: 'Contactez-moi sur WhatsApp',
    short: 'Écrivez-moi',
    message: 'Bonjour Marwen, j’ai consulté votre portfolio et j’aimerais discuter d’un projet de design.',
  },
};

export const ui: Record<Lang, Dict> = { en, fr };

// ---- Portfolio wording (category titles, deliverables, project metadata) -------------------------
// portfolio.json (edited in /admin/) holds the English titles; French comes from these maps, keyed by
// the stable category / group id. Anything not listed (e.g. a category added later) falls back to
// the English text, so the French site never breaks.

const chapterFr: Record<string, string> = {
  social: 'Réseaux sociaux & campagnes digitales',
  identity: 'Identité de marque & création de logos',
  guidelines: 'Chartes graphiques',
  editorial: 'Design éditorial & présentations',
  collateral: 'Supports marketing & impression',
  packaging: 'Design de packaging',
  ai: 'Création visuelle assistée par l’IA',
};
const groupFr: Record<string, string> = {
  social: 'Réseaux sociaux & campagnes digitales',
  identity: 'Identité de marque, logos & chartes graphiques',
  editorial: 'Présentations & design éditorial',
  packaging: 'Design de packaging',
  ai: 'Création visuelle assistée par l’IA',
};
// Short labels for the sticky category bar
const navShort: Record<Lang, Record<string, string>> = {
  en: {
    social: 'Social Media', identity: 'Brand Identity', guidelines: 'Brand Guidelines',
    editorial: 'Presentation & Editorial', collateral: 'Marketing & Print', packaging: 'Packaging Design', ai: 'AI-Powered Work',
  },
  fr: {
    social: 'Réseaux sociaux', identity: 'Identité de marque', guidelines: 'Chartes graphiques',
    editorial: 'Éditorial & présentations', collateral: 'Marketing & print', packaging: 'Packaging', ai: 'Création IA',
  },
};

export const chapterTitle = (lang: Lang, id: string, title: string) => (lang === 'fr' ? chapterFr[id] ?? title : title);
export const groupTitle = (lang: Lang, id: string, title: string) => (lang === 'fr' ? groupFr[id] ?? title : title);
export const navLabel = (lang: Lang, id: string, title: string) => navShort[lang][id] ?? chapterTitle(lang, id, title);

export const deliverables: Record<Lang, Record<string, readonly string[]>> = {
  // English: Marwen's profile (Oct 2026), keyed by chapter id
  en: {
    social: ['Social media posts', 'Story templates', 'Advertising creatives', 'Digital campaigns', 'Key visuals'],
    identity: ['Logo suites', 'Color systems', 'Typography systems', 'Stationery', 'Corporate identity', 'Branded applications'],
    guidelines: ['Comprehensive brand books', 'Identity usage rules', 'Typography and color specifications', 'Arabic/English bilingual visual systems'],
    editorial: ['Company profiles', 'Pitch decks', 'Business presentations', 'Annual & impact reports', 'Brochures', 'Magazines & catalogs', 'Multi-page publications'],
    collateral: ['Roll-up banners', 'Event badges', 'Merchandise', 'Menus', 'Promotional materials', 'Print-ready production files'],
    motion: ['Branded animations', 'Motion graphics', 'Promotional videos', 'Compositing & transitions', 'Post-production'],
    packaging: ['Packaging concepts', 'Product labels', 'Box design', 'Product mockups', 'Packaging systems'],
    ai: ['AI-assisted visual production', 'Image development', 'Branded imagery', 'AI-assisted creative workflows'],
  },
  fr: {
    social: ['Publications pour les réseaux sociaux', 'Modèles de stories', 'Créations publicitaires', 'Campagnes digitales', 'Visuels clés'],
    identity: ['Déclinaisons de logo', 'Systèmes chromatiques', 'Systèmes typographiques', 'Papeterie', 'Identité institutionnelle', 'Applications de marque'],
    guidelines: ['Chartes graphiques complètes', 'Règles d’utilisation de l’identité', 'Spécifications typographiques et chromatiques', 'Systèmes visuels bilingues arabe/anglais'],
    editorial: ['Plaquettes institutionnelles', 'Pitch decks', 'Présentations professionnelles', 'Rapports annuels & d’impact', 'Brochures', 'Magazines & catalogues', 'Publications multipages'],
    collateral: ['Roll-ups', 'Badges événementiels', 'Objets promotionnels', 'Menus', 'Supports promotionnels', 'Fichiers prêts pour l’impression'],
    motion: ['Animations de marque', 'Motion design', 'Vidéos promotionnelles', 'Compositing & transitions', 'Postproduction'],
    packaging: ['Concepts de packaging', 'Étiquettes produit', 'Design de boîtes', 'Mockups produit', 'Systèmes de packaging'],
    ai: ['Production visuelle assistée par l’IA', 'Développement d’images', 'Imagerie de marque', 'Workflows créatifs assistés par l’IA'],
  },
};

// Project metadata: services are " · "-separated labels; countries are names. Unknown values stay as entered.
const serviceFr: Record<string, string> = {
  'social media design': 'Design pour les réseaux sociaux',
  'digital brand assets': 'Supports de marque digitaux',
  'ad creatives': 'Créations publicitaires',
  'brand identity': 'Identité de marque',
  'logo design': 'Création de logo',
  'brand guidelines': 'Charte graphique',
  'report design': 'Conception de rapport',
  'journal note book design': 'Conception de carnet',
  'company profile design': 'Plaquette institutionnelle',
  'brochure design': 'Conception de brochure',
  'presentation design': 'Design de présentation',
  'journal design': 'Conception de journal',
  'packaging design': 'Design de packaging',
};
const countryFr: Record<string, string> = {
  kenya: 'Kenya', uganda: 'Ouganda', rwanda: 'Rwanda', usa: 'États-Unis', india: 'Inde', kuwait: 'Koweït',
  tunisia: 'Tunisie', uae: 'Émirats arabes unis', france: 'France', qatar: 'Qatar', jordan: 'Jordanie',
  egypt: 'Égypte', turkey: 'Turquie', canada: 'Canada', libya: 'Libye', 'saudi arabia': 'Arabie saoudite',
  switzerland: 'Suisse', morocco: 'Maroc', algeria: 'Algérie', germany: 'Allemagne', 'united kingdom': 'Royaume-Uni',
  uk: 'Royaume-Uni', italy: 'Italie', spain: 'Espagne', belgium: 'Belgique', oman: 'Oman', bahrain: 'Bahreïn',
  lebanon: 'Liban', nigeria: 'Nigeria', tanzania: 'Tanzanie', 'south africa': 'Afrique du Sud',
};
export const services = (lang: Lang, s: string) =>
  lang === 'fr' ? s.split(' · ').map((x) => serviceFr[x.trim().toLowerCase()] ?? x).join(' · ') : s;
export const country = (lang: Lang, c: string) => (lang === 'fr' ? countryFr[c.trim().toLowerCase()] ?? c : c);

// Descriptive project titles (not client or brand names) shown in French; anything else — client
// names, product direction names, titles added later in /admin/ — is shown exactly as entered.
const titleFr: Record<string, string> = {
  'Event & Facebook covers': 'Couvertures d’événement & Facebook',
  'Event roll-up banners': 'Roll-ups d’événement',
  'Branded polo shirts & business cards': 'Polos personnalisés & cartes de visite',
  'Tote bag — “Ancestral Practices”': 'Tote bag — « Ancestral Practices »',
  'Company brochure': 'Brochure institutionnelle',
  'Event badges & speaker cards': 'Badges d’événement & cartes d’intervenants',
  'Event badges': 'Badges d’événement',
  'Hoodie & notebook': 'Sweat à capuche & carnet',
  'Poster campaign': 'Campagne d’affichage',
  'Brochure & roll-up banners': 'Brochure & roll-ups',
  'Event badges & tote bag': 'Badges d’événement & tote bag',
  'Employee ID badges': 'Badges d’identification du personnel',
  'Event flags & staff polo shirts': 'Drapeaux d’événement & polos du staff',
  'Event print & signage': 'Impressions & signalétique d’événement',
  'Event report & certificates': 'Rapport d’événement & certificats',
  'Instagram feed imagery': 'Visuels pour le feed Instagram',
  'Product imagery': 'Visuels produit',
  'Brand imagery': 'Imagerie de marque',
  'Imagery shoot': 'Shooting visuel',
  '5-in-1 professional hair-styling set': 'Coffret de coiffage professionnel 5 en 1',
  'Face shapewear': 'Gaine visage',
  'Bodysuits': 'Bodys gainants',
  'Imagery': 'Visuels',
  'Packaging imagery': 'Visuels de packaging',
  'Shapewear product review shots': 'Photos d’avis produit — lingerie gainante',
  'Shapewear website product shoot': 'Shooting produit pour site web — lingerie gainante',
};
export const projectText = (lang: Lang, s: string) => (lang === 'fr' ? titleFr[s] ?? s : s);
