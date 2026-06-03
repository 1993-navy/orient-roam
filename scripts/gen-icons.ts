/**
 * Generates PWA PNG icons from an inline SVG compass mark.
 * Run with: npx tsx scripts/gen-icons.ts
 */
import sharp from "sharp";
import { join } from "node:path";

const svg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#e11d48"/>
      <stop offset="1" stop-color="#f97316"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#g)"/>
  <circle cx="256" cy="256" r="150" fill="none" stroke="#ffffff" stroke-width="16" opacity="0.95"/>
  <polygon points="256,120 298,256 256,256" fill="#ffffff"/>
  <polygon points="256,120 214,256 256,256" fill="#ffe4e6"/>
  <polygon points="256,392 298,256 256,256" fill="#fecaca"/>
  <polygon points="256,392 214,256 256,256" fill="#fb7185"/>
  <circle cx="256" cy="256" r="20" fill="#ffffff"/>
</svg>`;

const pub = join(process.cwd(), "public");

async function main() {
  const buf = Buffer.from(svg);
  await sharp(buf).resize(192, 192).png().toFile(join(pub, "icon-192.png"));
  await sharp(buf).resize(512, 512).png().toFile(join(pub, "icon-512.png"));
  // Maskable: same art (content sits within the safe zone).
  await sharp(buf).resize(512, 512).png().toFile(join(pub, "icon-maskable-512.png"));
  // Apple touch icon (180) + favicon-ish.
  await sharp(buf).resize(180, 180).png().toFile(join(pub, "apple-touch-icon.png"));
  console.log("✓ icons written to public/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
