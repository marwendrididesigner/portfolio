// Services & deliverables (Marwen's profile, Oct 2026). This numbering is the Services list's own;
// Work chapters keep the PDF divider numbering (see src/data/portfolio.ts).
// A service links to its Work chapter once that chapter has published projects — Motion (06) has none yet.
export const categories = [
  { id: 'identity', number: '01', title: 'Brand Identity & Logo Design', short: 'Brand Identity',
    deliverables: ['Logo suites', 'Color systems', 'Typography systems', 'Stationery', 'Corporate identity', 'Branded applications'] },
  { id: 'guidelines', number: '02', title: 'Brand Guidelines', short: 'Brand Guidelines',
    deliverables: ['Comprehensive, practical brand books', 'Identity usage rules', 'Arabic/English bilingual visual systems'] },
  { id: 'editorial', number: '03', title: 'Editorial & Presentation Design', short: 'Editorial',
    deliverables: ['Company profiles', 'Pitch decks', 'Business presentations', 'Annual & impact reports', 'Brochures', 'Magazines & catalogs', 'Multi-page publications'] },
  { id: 'social', number: '04', title: 'Social Media & Digital Campaigns', short: 'Social Media',
    deliverables: ['Social media posts', 'Story templates', 'Advertising creatives', 'Digital campaigns', 'Key visuals'] },
  { id: 'collateral', number: '05', title: 'Print & Event Collateral', short: 'Print & Event',
    deliverables: ['Roll-up banners', 'Event badges', 'Merchandise', 'Menus', 'Promotional materials', 'Print-ready production files'] },
  { id: 'motion', number: '06', title: 'Motion Graphics & Video Editing', short: 'Motion',
    deliverables: ['Branded animations', 'Motion graphics', 'Promotional videos', 'Compositing & transitions', 'Post-production'] },
  { id: 'ai', number: '07', title: 'AI-Powered Visual Design', short: 'AI Visuals',
    deliverables: ['AI-assisted visual production', 'Image development', 'Branded imagery', 'AI-assisted creative workflows'] },
] as const;

export type CategoryId = (typeof categories)[number]['id'];
