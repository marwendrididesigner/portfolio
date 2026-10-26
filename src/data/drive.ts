// Google Drive video links (Motion Design & Video Editing). Only the file id matters: the public site
// embeds Drive's own player (/preview, shown in an iframe only after a click) and links to /view as a
// fallback. Nothing is streamed or downloaded from Drive, so the video must be shared as "Anyone with
// the link". Shared by the public build (src/data/portfolio.ts) and the admin page.

// Accepts the usual share forms:
//   https://drive.google.com/file/d/FILE_ID/view?usp=sharing   (also /preview, /edit, /u/0/file/d/…)
//   https://drive.google.com/open?id=FILE_ID · https://drive.google.com/uc?id=FILE_ID&export=download
// Anything else (folders, other hosts, a bare id) is rejected.
export function driveId(link: string): string | null {
  let u: URL;
  try { u = new URL(link.trim()); } catch { return null; }
  if (u.protocol !== 'https:' || !/^(drive|docs)\.google\.com$/.test(u.hostname)) return null;
  const id = /\/file\/(?:u\/\d+\/)?d\/([\w-]{10,})/.exec(u.pathname)?.[1]
    ?? (/^\/(?:open|uc)$/.test(u.pathname) ? u.searchParams.get('id') : null);
  return id && /^[\w-]{10,}$/.test(id) ? id : null;
}
export const driveView = (id: string) => `https://drive.google.com/file/d/${id}/view`;
export const drivePreview = (id: string) => `https://drive.google.com/file/d/${id}/preview`;

// Player frame proportions (width:height). Stored per video; the admin pre-selects the one closest to
// an uploaded thumbnail.
export const RATIOS = ['16:9', '9:16', '1:1', '4:5'] as const;
export type Ratio = (typeof RATIOS)[number];
export const ratioValue = (r: string) => { const [w, h] = r.split(':').map(Number); return w! / h!; };
