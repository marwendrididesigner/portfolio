import { defineConfig } from 'astro/config';

// GitHub Pages: set SITE_URL (e.g. https://username.github.io) and BASE_PATH
// (e.g. /portfolio for a project repo, or / for a username.github.io repo).
// The deploy workflow sets both automatically.
const site = process.env.SITE_URL ?? 'https://marwendrididesigner.github.io';
const base = process.env.BASE_PATH ?? '/portfolio/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  build: { inlineStylesheets: 'always' },
  image: {
    responsiveStyles: true,
  },
  devToolbar: { enabled: false },
});
