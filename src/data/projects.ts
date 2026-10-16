// Deliverables shown in each Work chapter introduction (Marwen's profile, Oct 2026), keyed by PDF chapter id.
// Chapter order, numbering and titles come from the PDF via src/data/portfolio-inventory.json.
// Motion has no published work yet, so it is never rendered (empty chapters are dropped).
export const deliverables: Record<string, readonly string[]> = {
  social: ['Social media posts', 'Story templates', 'Advertising creatives', 'Digital campaigns', 'Key visuals'],
  identity: ['Logo suites', 'Color systems', 'Typography systems', 'Stationery', 'Corporate identity', 'Branded applications'],
  guidelines: ['Comprehensive brand books', 'Identity usage rules', 'Typography and color specifications', 'Arabic/English bilingual visual systems'],
  editorial: ['Company profiles', 'Pitch decks', 'Business presentations', 'Annual & impact reports', 'Brochures', 'Magazines & catalogs', 'Multi-page publications'],
  collateral: ['Roll-up banners', 'Event badges', 'Merchandise', 'Menus', 'Promotional materials', 'Print-ready production files'],
  motion: ['Branded animations', 'Motion graphics', 'Promotional videos', 'Compositing & transitions', 'Post-production'],
  ai: ['AI-assisted visual production', 'Image development', 'Branded imagery', 'AI-assisted creative workflows'],
};
