// Builds library.json from hand-written analysis of the initial inspo folder.
// Run: node seed/build-seed.js  (writes ../library.json only if it doesn't exist, or with --force)
const fs = require('fs');
const path = require('path');

const families = [
  {
    id: 'widget-desktop',
    name: 'Curated Widget Desktop',
    description:
      'Personalised macOS desktops treated as a mood board: a column of frosted-glass widgets (oversized clock, calendar, music player, photo tiles) floating over a full-bleed wallpaper, with custom folder/app icons that match the theme.',
    vocabulary: {
      typography: 'System sans (SF Pro) — one huge light-weight numeric clock, tiny uppercase or lowercase labels, occasional handwritten script overlay.',
      layout: 'Left-anchored 2–3 column widget stack, 12–20px radii, wallpaper left breathing on the right; dock as a horizontal anchor at the bottom.',
      color: 'Palette is derived from the wallpaper — one hue family, widgets are translucent/frosted versions of it.',
      texture: 'Frosted glass blur, soft drop shadows, photographic or painterly wallpaper, tiny 3D/figurine icons.',
      motion: 'Mostly static; music-player progress bars and subtle hover states only.'
    }
  },
  {
    id: 'scrapbook-collage',
    name: 'Scrapbook Collage',
    description:
      'Junk-journal style layouts: photos, polaroids, torn paper, washi tape, stickers and handwritten notes layered over lined or grid paper. Everything is slightly rotated and overlapping — the story is told through stacking.',
    vocabulary: {
      typography: 'One bold grotesk or hand-drawn display headline, then marker/handwriting for annotations, typewriter for captions; labels rotated a few degrees.',
      layout: 'Freeform, no grid — z-index collage; elements pinned with tape or paperclips; clusters with arrows and doodles connecting them.',
      color: 'Paper cream / notebook white as the base, one or two saturated accents (cherry red, bubblegum pink, sky blue).',
      texture: 'Paper grain, torn edges, tape translucency, sticker gloss, hard little drop shadows under every cut-out.',
      motion: 'Elements can drop in with slight rotation; hover lifts a piece; page-flip transitions.'
    }
  },
  {
    id: 'sticker-sheet',
    name: 'Sticker Sheet / Object Studies',
    description:
      'Collections of isolated cut-out objects (stars, bulldog clips, bows, flowers, stamps) arranged evenly on pure white like a sticker sheet or product catalogue. The appeal is material realism and repetition with variation.',
    vocabulary: {
      typography: 'None, or a single tiny caption; the objects are the type.',
      layout: 'Even scatter or loose grid, consistent object scale, generous white gutters, edges bleed off the frame.',
      color: 'Objects keep their true colours on #FFFFFF; the set reads as a palette (pastel + one primary).',
      texture: 'Photoreal materials — satin ribbon, enamel, chrome, sequins, denim, gingham.',
      motion: 'Objects can be draggable stickers; slight wobble on hover.'
    }
  },
  {
    id: 'blush-pastel',
    name: 'Blush & Milk Pastel',
    description:
      'Soft pink, cream and sage palettes with airy white space, lilies and orchids, gentle blurred gradients. Feminine and calm — "coquette" without lace.',
    vocabulary: {
      typography: 'Thin serif or light sans, small sizes, lots of tracking; hex codes and labels in lowercase.',
      layout: 'Airy, lots of white, rounded cards, content floats rather than fills.',
      color: '#F5E6EA blush, #FBF7F2 milk, #DDE0BC sage, #CE859A rose, #9CAD8C moss — always desaturated.',
      texture: 'Soft focus petals, matte paper, faint gingham/washi accents, no hard shadows.',
      motion: 'Slow fades, petals drifting, nothing snappy.'
    }
  },
  {
    id: 'painterly-texture',
    name: 'Painterly Textures',
    description:
      'Full-bleed organic textures used as wallpapers or hero backgrounds: oil-and-water bubbles, mosaic waves with gold flecks, impressionist brushwork, hand-drawn stars on navy, blurred thermal gradients. No UI — pure surface.',
    vocabulary: {
      typography: 'Not present; designed to sit under type with a high-contrast overlay.',
      layout: 'Edge-to-edge, no focal point, tileable or centred bloom.',
      color: 'Rich natural tones — olive, amber, teal, dusty rose, navy — with iridescent or metallic highlights.',
      texture: 'Visible brush strokes, glass refraction, glitter, paper flecks, grain.',
      motion: 'Slow parallax or subtle animated gradient; ideal for looping video backgrounds.'
    }
  },
  {
    id: 'soft-ui-cards',
    name: 'Cozy Soft UI',
    description:
      'Rounded, tactile interface cards in warm neutrals with a friendly lowercase voice — to-do widgets, "good afternoon" dashboards, paper-note icons. Skeuomorphic hints (lined paper, handwriting) inside a modern card system.',
    vocabulary: {
      typography: 'Rounded sans (SF Rounded, Nunito, Quicksand) in medium weights, lowercase headings; handwritten or marker font for user content.',
      layout: 'Card grid with 20–28px radii, 16–24px padding, checkboxes and pill buttons, everything centred in a floating panel.',
      color: 'Warm greige #E8E4DC, cream #FFF6E5, one pastel accent (butter yellow, blush pink, sage) and a single dark text colour.',
      texture: 'Matte, faint inner shadows, paper lines, slight card tilt for stacks.',
      motion: 'Springy check animations, cards that stack/peel, gentle bounce.'
    }
  },
  {
    id: 'moody-jewel',
    name: 'Moody Jewel Tones',
    description:
      'Deep burgundy, oxblood and midnight-navy backgrounds with cream, gold or glass accents. Romantic script typography, centred compositions, dark-mode desktops with warm photos glowing out of the dark.',
    vocabulary: {
      typography: 'High-contrast script (Pinyon, Great Vibes) paired with widely tracked small-caps sans; cream on dark.',
      layout: 'Centred, symmetrical, vertical stacking; a single framed object as hero.',
      color: '#5A1A22 burgundy, #2B3350 navy, #1A0F10 near-black, #F3E9DC cream, antique gold.',
      texture: 'Velvet matte, metallic foil, frosted glass, subtle vignette and glow.',
      motion: 'Slow reveals, objects sliding out of frames, cinematic easing.'
    }
  },
  {
    id: 'vintage-ephemera',
    name: 'Vintage Ephemera & Postal',
    description:
      'Stamps, postmarks, receipts, tickets, envelopes, wax seals and photo strips — designed pieces of paper that imply travel, mail and memory. Often the building blocks of the scrapbook family.',
    vocabulary: {
      typography: 'Typewriter mono, condensed sans for ticket numbers, script for signatures, letterpress-style serifs.',
      layout: 'Stacked documents, rotated, pinned or clipped; perforated edges and rounded stamp corners.',
      color: 'Sepia, cream, faded black ink, one accent (postal red, blush pink).',
      texture: 'Crumpled paper, ink bleed, perforation, foil seals, halftone photos.',
      motion: 'Stamp "thunk" animations, envelope flap opening, photostrip reveal.'
    }
  }
];

// helper to compose a brief from structured fields
function brief(o) {
  return [
    `# Design brief: ${o.title}`,
    '',
    `Build a complete website in this aesthetic. Overall feel: ${o.feel}`,
    '',
    `## Typography`,
    o.typography,
    '',
    `## Color palette`,
    o.palette,
    '',
    `## Layout`,
    o.layout,
    '',
    `## Spacing & shape`,
    o.spacing,
    '',
    `## Texture & imagery`,
    o.texture,
    '',
    `## Motion`,
    o.motion,
    '',
    `## Do / Don't`,
    o.rules
  ].join('\n');
}

const items = [
  {
    file: '035230926c90ca3ae8372bd0f2442053.jpg',
    title: '"Brain food" monthly scrapbook page',
    families: ['scrapbook-collage'],
    tags: ['lined notebook paper', 'bold grotesk headline', 'hand-drawn doodles', 'youtube card cut-outs', 'y2k tech icons', 'pixel cursor', 'washi tape', 'book cover collage', 'monthly recap'],
    imagePrompt:
      'Flat-lay scrapbook page on pale blue lined notebook paper, oversized black bold sans-serif headline at the top, collage of cut-out book covers, film posters and rounded video thumbnail cards taped down at slight angles, hand-drawn cloud doodles, stars and arrows in black ink, tiny pixel-art cursor and retro gadgets (CD player, cassette, CRT TV) as stickers, hard drop shadows under every cut-out, gingham washi tape strips, bright but paper-toned palette, high detail, top-down, no people faces prominent.',
    brief: brief({
      title: 'Brain food scrapbook',
      feel: 'a personal monthly recap that looks like a page torn out of a notebook — playful, dense, hand-made, a little nostalgic for 2000s tech.',
      typography: 'Headline: a heavy grotesk (Inter Black / Helvetica Neue Bold) at 96–140px, tight tracking, black. Sub-labels: hand-written marker font (Caveat / Gochi Hand) 16–18px for annotations and ratings. Body inside cards: system sans 13px. Never more than three faces on a page.',
      palette: 'Base #F4F6F8 notebook white with #BFD7EA horizontal rule lines every 32px and a single red margin line; black #111 ink; card backgrounds #121212 (dark video cards); accent yellow #F3C63B stars and red #D8433B heart. Colour comes from the collaged images, not from UI.',
      layout: 'Single scrolling page. A giant headline block, then a freeform collage grid: items absolutely positioned inside a 12-column canvas, each rotated -4° to 4°, overlapping by 10–20%. Group by clusters (books, videos, films). Small annotation strings placed beside items with hand-drawn arrows (SVG).',
      spacing: 'No consistent gutters on purpose; use a 32px baseline from the ruled lines. Cards have 6px radius, 1px black border, 4px 4px 0 #000 hard shadow. Tape strips are 48×14px rotated PNG/SVG overlays.',
      texture: 'Ruled-paper CSS background, subtle paper grain overlay (noise at 4% opacity), gingham tape SVG pattern, doodle cloud outlines as inline SVG. Imagery: covers, thumbnails, retro gadget stickers with transparent backgrounds.',
      motion: 'On load, items drop in staggered (translateY 20px + rotate) over 600ms. Hover lifts a card 4px and straightens rotation to 0. Doodles draw themselves with stroke-dashoffset.',
      rules: 'DO keep everything looking cut-and-pasted. DO mix media types. DON\'T use gradients, glassmorphism or rounded-corner-everything. DON\'T align to a strict grid.'
    })
  },
  {
    file: '1e02f3407554af728b47692f4b3b1ef8.jpg',
    title: 'Pink orchid MacBook desktop',
    families: ['widget-desktop', 'blush-pastel'],
    tags: ['macos widgets', 'oversized clock', 'white wallpaper', 'pink orchids', 'floating petals', 'frosted cards', 'music player widget', 'minimal dock', 'photographed screen'],
    imagePrompt:
      'Clean white desktop wallpaper with a single large pink orchid bloom in the lower right, a few loose pink lily petals scattered mid-air with soft shadows, high-key studio lighting, slight pink glow, lots of empty white space on the left for widgets, ultra-soft focus edges, 16:10 aspect ratio.',
    brief: brief({
      title: 'Orchid desktop',
      feel: 'quiet, feminine, high-key — a white room with one flower in it.',
      typography: 'SF Pro Display / Inter. Clock: 120px weight 300 in #C8A0AE. Day/date: 20px weight 500. Labels: 12px uppercase tracking 0.08em, colour #9A8A90.',
      palette: 'Background #FCFAFA; pink family #F4C6D2, #E9A3B7, #C8788F; text #3B3336; card fill rgba(255,255,255,0.55) with 24px backdrop blur; dark player card #2A2426 as the single contrast element.',
      layout: 'Left column of stacked widgets (clock 2×1, photo tile 1×1, petals row 2×1, music player 2×1) occupying 40% width; hero image anchored bottom-right at 55% width; nothing in the centre.',
      spacing: '16px gutters between widgets, 20px card radius, 24px inner padding. Page max-width none — full viewport.',
      texture: 'Frosted glass cards over a white photographic wallpaper; petals as floating PNGs with 30px blurred shadows.',
      motion: 'Petals drift 8px on a 6s sine loop; widgets fade in; player progress bar animates.',
      rules: 'DO leave 50% of the screen empty. DON\'T add borders or saturated colours. DON\'T use more than one photo subject.'
    })
  },
  {
    file: '310e5ce165698705099bf3b94a2a54ab.jpg',
    title: 'Oil-and-water bubble macro',
    families: ['painterly-texture'],
    tags: ['macro photography', 'oil bubbles', 'iridescent', 'earth tones', 'glass texture', 'organic cells', 'abstract wallpaper', 'refraction'],
    imagePrompt:
      'Extreme macro photograph of oil droplets floating on water, irregular rounded cells packed edge to edge, each cell a different muted colour — olive green, amber, dusty rose, teal, cream — with thin golden refractive rims, soft studio light, glossy glass-like surface, abstract, no text, vertical 9:16.',
    brief: brief({
      title: 'Oil bubble surface',
      feel: 'organic, jewel-like, calm; a living background that makes plain white type feel expensive.',
      typography: 'Type sits on top: a light geometric sans (Neue Haas / Inter 300) in cream #F5EFE6, 64–96px headlines with 0.02em tracking; small mono captions 12px.',
      palette: 'Olive #6B7A4C, amber #B8894A, blush #D9A28F, teal #3F6B66, cream #EFE6D6 — derive UI accents by sampling the image. Text always cream or near-black #1E1C18.',
      layout: 'Full-bleed hero texture with a centred glass panel (max-width 720px) holding the message; sections below alternate cream backgrounds with cropped slices of the texture as dividers.',
      spacing: 'Generous: 120px section padding, 32px radius on the glass panel, 1px hairline borders at 20% white.',
      texture: 'The macro photo is the texture; add backdrop-filter blur(20px) panels; avoid any additional pattern.',
      motion: 'Ken Burns slow zoom 1.0→1.08 over 30s; parallax at 0.3 on scroll; cells could subtly wobble in a canvas/WebGL version.',
      rules: 'DO let the image carry colour. DON\'T tint it with overlays stronger than 10%. DON\'T pair with rounded bubbly UI — keep UI crisp to contrast.'
    })
  },
  {
    file: '3546dbe19674323ad810fa33db2bf920.jpg',
    title: 'Jurrnel — digital junk-journal app',
    families: ['scrapbook-collage', 'soft-ui-cards'],
    tags: ['app ui', 'page fan carousel', 'navy background', 'digital scrapbook', 'sticker layering', 'circular icon buttons', 'about me page', 'kpop aesthetic', 'handwritten labels'],
    imagePrompt:
      'A fanned stack of digital journal pages floating over a dusty navy blue background, the front page a cute scrapbook "about me" spread with pastel stickers, washi tape, polaroids and bubble handwriting, pages behind peeking out at angles, soft drop shadow beneath the stack, minimal white circular icon buttons at the top and bottom, app UI mockup, 4:3.',
    brief: brief({
      title: 'Jurrnel app',
      feel: 'a cosy digital scrapbook — the chrome is calm and dark so the pages feel like paper glowing in the middle.',
      typography: 'UI: Inter / SF 600 for the journal title (28px white), 13px for metadata. Page content: hand-lettered display (e.g. "Bubblegum" style rounded outline font) + handwriting.',
      palette: 'Shell #3F4A6B navy, white #FFFFFF icons, shadow rgba(0,0,0,0.35). Page palette: cream paper #F6EFE4, baby blue #BFD5F0, pink #F4B8C8, mint #BFE3D0.',
      layout: 'Centre-stage carousel: the current page is 42% viewport wide, previous pages fanned left with -6°, -12°, -18° rotation and 24px offsets. Four circular 44px actions bottom-centre; two top-left, two top-right.',
      spacing: 'Circular buttons 44px with 12px gaps; page radius 8px; 80px vertical breathing room above/below the stack.',
      texture: 'Navy shell is flat with a soft radial vignette; pages have paper texture, stickers with 1px white outline and hard shadow.',
      motion: 'Swipe fans pages with spring physics; tapping a sticker wobbles it; page-turn uses 3D rotateY.',
      rules: 'DO keep the shell to two colours. DON\'T put UI chrome on the page itself. DO let user content be maximalist.'
    })
  },
  {
    file: '47d1abc76aa529b44222621c390130cd.jpg',
    title: 'Thermal-gradient dark MacBook desktop',
    families: ['widget-desktop', 'painterly-texture', 'moody-jewel'],
    tags: ['macos widgets', 'dark mode', 'thermal gradient wallpaper', 'orange purple blur', 'reminders widget', 'battery ring', 'album art tiles', 'lily photo', 'photographed laptop'],
    imagePrompt:
      'Abstract thermal-camera style wallpaper: a blurred radial gradient bloom of deep purple, magenta, burning orange and yellow fading into near-black edges, soft grain, no shapes, moody and warm, 16:10 desktop wallpaper.',
    brief: brief({
      title: 'Thermal bloom desktop',
      feel: 'warm dark mode — like a lava lamp seen through frosted glass; widgets are quiet black cards over the heat.',
      typography: 'SF Pro: clock 96px weight 300 in warm white #FFF3EA; labels 12px 500; body 14px in #E6DAD5.',
      palette: 'Wallpaper gradient stops #120814 → #5B1E5C → #C8462E → #F2A93B; cards rgba(18,10,16,0.62) with blur; accents: green #3DD68C battery ring, orange #F2A93B highlights.',
      layout: 'Widgets hug the left and right edges in two columns leaving the centre bloom clear; folders/icons in a 2×2 cluster; player card floats at lower left.',
      spacing: '16px grid, 18px radius, 14px padding, dock centred 56px.',
      texture: 'Grainy gradient (add 6% noise), glass cards, album-art photos with 1px inner glow.',
      motion: 'Gradient slowly rotates hue ±10° over 40s; battery ring animates on load.',
      rules: 'DO keep cards nearly opaque so text stays legible. DON\'T let the gradient go neon. DON\'T add borders.'
    })
  },
  {
    file: '4b825e30df7d221d25eec4d713462a38.jpg',
    title: 'Dark "Things to do Today" widget',
    families: ['soft-ui-cards', 'widget-desktop'],
    tags: ['to-do widget', 'dark card', 'checkboxes', 'strikethrough completed', 'date pill', 'rounded rectangle', 'thermal background', 'pill button', 'compact ui'],
    imagePrompt:
      'A single rounded-square widget mockup on a cream background: dark charcoal card with a top header bar showing a date pill and time, a short checklist with white checkboxes, completed items dimmed with strikethrough, a small pill button bottom-right, a blurred orange-and-black gradient peeking behind the header, clean product-shot lighting, 1:1.',
    brief: brief({
      title: 'Compact dark to-do widget',
      feel: 'a tiny, confident task card — Apple-widget clarity with a little warmth from the gradient header.',
      typography: 'SF Pro / Inter: title 17px weight 600 white; items 14px weight 400; done items #7C7C82 with line-through; date pill 12px 600.',
      palette: 'Card #1C1C1E, header gradient from #F26A2E to #1C1C1E, text #FFFFFF, muted #8E8E93, cream page #F3F1EC, pill button #2C2C2E.',
      layout: 'Card 320×320, header 56px with date pill left and "Done" right; list of 5 rows at 36px each with 18px checkbox; primary pill action bottom-right.',
      spacing: '24px card radius, 16px padding, 12px row gap, checkbox radius 4px.',
      texture: 'Flat with 1px rgba(255,255,255,0.06) border; header photo blurred 12px.',
      motion: 'Checkbox fills with a 150ms scale bounce; completed row fades to 50% and gets a strikethrough drawn left→right.',
      rules: 'DO keep it under 6 items visible. DON\'T add icons to every row. DO make the header the only colourful element.'
    })
  },
  {
    file: '5169b6f429da02a8cdabccd3c85dc0e9.jpg',
    title: 'Merona — collage scrapbook website template',
    families: ['scrapbook-collage', 'vintage-ephemera'],
    tags: ['website template', 'grid paper background', 'kraft paper section', 'cut-out photo collage', 'butterfly wings', 'ticker marquee', 'typewriter body text', 'serif headline', 'product cards', 'torn paper'],
    imagePrompt:
      'Full-page website mockup in a scrapbook style: top section on pale grid paper with a serif headline and a woman cut-out photo with butterfly wings collaged behind her, a blue marquee strip, a large kraft-paper section with taped paper notes, torn map pieces and a travel photo cut-out, then a row of three journal product photos, then a featured posts grid, warm cream palette, browser window frame, tall vertical composition.',
    brief: brief({
      title: 'Merona scrapbook site',
      feel: 'a travel-journal brand site — handmade, warm, editorial; the page itself feels like a desk covered in paper.',
      typography: 'Headlines: a sturdy transitional serif (Playfair Display / Fraunces) 44–56px, sentence case. Body and captions: typewriter mono (Special Elite / IBM Plex Mono) 13–14px. Marquee text in mono uppercase.',
      palette: 'Grid paper #F6F5F0 with #DCE3E8 lines; kraft #C89B6A; note paper #F3EEE2; ink #1C1B19; accent blue #8DB3C6 (marquee); black CTA #111.',
      layout: 'Sections stacked: hero (text left 45%, collage right 55%) → 40px marquee strip → kraft section with a taped note card centred and a story block left/photo right → 3-up product row → 4-up blog grid. Max-width 1100px.',
      spacing: '96px section padding; product cards 24px gap; sticky notes rotated ±2°; CTA button square (0 radius) 12×28px padding.',
      texture: 'Grid-paper CSS background, kraft paper photo texture, tape and torn-paper PNG edges, maps and stamps as decorative cut-outs, drop shadows 0 2px 6px rgba(0,0,0,.25).',
      motion: 'Marquee scrolls continuously; collage pieces parallax at different rates; hover on products tilts the journal.',
      rules: 'DO alternate paper types per section. DON\'T use rounded corners on anything but photos. DO keep CTAs black and square.'
    })
  },
  {
    file: '556b5774625bb98f29947228da211698.jpg',
    title: 'Three flowers on white (lily, hibiscus, plumeria)',
    families: ['sticker-sheet', 'blush-pastel'],
    tags: ['isolated flowers', 'white background', 'pink lily', 'yellow hibiscus', 'plumeria', 'product photo', 'trio composition', 'soft studio light'],
    imagePrompt:
      'Three flowers isolated on a pure white background, evenly spaced in a row: a pink stargazer lily, a pale yellow hibiscus with a pink centre, a cream plumeria, soft even studio lighting, faint contact shadow, photoreal, catalogue style, 16:9.',
    brief: brief({
      title: 'Flower trio',
      feel: 'a spare, botanical catalogue — objects on white with air around them.',
      typography: 'Light serif (Cormorant / EB Garamond 300) for names 20px; tiny mono for Latin names 11px tracking 0.1em.',
      palette: 'White #FFFFFF, petal pinks #F2B8C6 / #E58BA3, butter #F3E3A8, cream #FBF6E9, text #2E2A2A.',
      layout: '3-up and 4-up object rows with equal gaps; each object centred in a square cell with a caption below; no card backgrounds.',
      spacing: '48px gutters, 160px section padding, objects at max 320px.',
      texture: 'None — pure white; only the object\'s own shadow (0 12px 24px rgba(0,0,0,.08)).',
      motion: 'Fade + 8px rise on scroll; hover scales 1.03.',
      rules: 'DO isolate every image on white. DON\'T add backgrounds, borders or gradients. DO keep captions minimal.'
    })
  },
  {
    file: '69c4f1f4c4ace11b1e7a130eb9acc804.jpg',
    title: 'Interactive birthday website (Canva template)',
    families: ['scrapbook-collage', 'moody-jewel', 'vintage-ephemera'],
    tags: ['burgundy', 'kraft envelope hero', 'polaroid strips', 'gingham', 'balloon lettering', 'embroidered patch badges', 'mobile mockup', 'birthday site', 'checkered frame'],
    imagePrompt:
      'Mockup of a personal birthday website: on a laptop screen a kraft-paper envelope hero with red foil heart balloons, a disco ball and a puffy red balloon-letter "HAPPY BIRTHDAY"; beside it a phone showing a deep burgundy scrolling page with polaroid photos, red gingham frames, a vintage camera sticker and small typewriter captions; three embroidered red heart badges underneath, white paper-texture background, warm and nostalgic.',
    brief: brief({
      title: 'Burgundy birthday site',
      feel: 'a love letter as a website — dark cherry red, kraft paper, party stickers; sentimental but graphic.',
      typography: 'Display: a playful rounded hand-lettered font (e.g. Chewy / "balloon" style) in white with red outline for the greeting; section titles in a bouncy sans 22px; captions typewriter 12px cream.',
      palette: 'Burgundy #7A1F2B page, cherry #C8102E accents, kraft #C89B6A, cream #F4EBDD, gingham red/white pattern, white paper #F7F5F2 for the outer frame.',
      layout: 'Mobile-first single column; hero = envelope illustration with stickers; then a vertical timeline of memory cards, each a polaroid or photo strip rotated ±3° with a typewriter caption; music player pinned at bottom.',
      spacing: '24px page padding, 40px between memories, photo borders 8px white, gingham frame 6px.',
      texture: 'Paper grain page, embroidered badge SVG style, foil balloon gloss, polaroid drop shadows.',
      motion: 'Envelope flap opens on load; balloons bob; photos slide in from alternating sides; confetti burst on the final card.',
      rules: 'DO stay in one red family plus kraft/cream. DON\'T use pastel pinks here. DO make it feel like a physical card.'
    })
  },
  {
    file: '6f4fda7020c7502619c508f3ddc2c920.jpg',
    title: 'Eternal Sunshine ephemera flat-lay',
    families: ['vintage-ephemera', 'blush-pastel', 'scrapbook-collage'],
    tags: ['pink pinstripe background', 'receipt tracklist', 'photo booth strip', 'envelope with wax seal', 'license plate', 'postage stamp', 'enamel pin', 'polka dot', 'black and white photos', 'fan edit'],
    imagePrompt:
      'Flat-lay of pastel pink ephemera on a pale pink pinstripe background: a cream envelope with a pink wax heart seal and cursive "Love Letter", a crumpled white receipt printed with a tracklist, a black-and-white photo booth strip, a small vintage postage stamp, a New York license plate, a pink enamel hair-dryer pin, a silver compact camera, all slightly rotated and overlapping with soft shadows, top-down, 3:2.',
    brief: brief({
      title: 'Pink ephemera flat-lay',
      feel: 'a fan-made keepsake box — sweet, monochrome-pink, every element is a real paper object.',
      typography: 'Receipt: dot-matrix mono (e.g. "Fake Receipt" / Courier) 12px uppercase; envelope: brush script (Allura) 32px pink; captions typewriter.',
      palette: 'Pinstripe #F6E8EC/#FBF3F5, cream #F5F0E8, blush #E8B4C2, black #1A1A1A photos, silver #C9C9C9.',
      layout: 'A flat-lay grid: one hero object (photo) top-left, a vertical receipt centre, strip right — hand-placed, overlapping 15%; text content lives inside the objects (receipt = tracklist / menu, envelope = intro, stamp = date).',
      spacing: 'Objects rotated -8° to 8°; shadows 0 6px 14px rgba(0,0,0,.18); 64px page margins.',
      texture: 'Crumpled paper photo for the receipt, foil wax seal, halftone black-and-white photos, pinstripe CSS background.',
      motion: 'Objects can be dragged; receipt "prints" line-by-line on load; envelope flap opens on hover.',
      rules: 'DO put all copy inside paper objects. DON\'T introduce any colour outside pink/cream/black/silver. DO photograph, not illustrate.'
    })
  },
  {
    file: '753050bd73eee2ce7f8386a1df2f2da2.jpg',
    title: 'Hand-drawn stars on navy',
    families: ['painterly-texture', 'moody-jewel'],
    tags: ['navy blue', 'sketched stars', 'speckle', 'watercolour wash', 'nursery wallpaper', 'night sky pattern', 'tileable'],
    imagePrompt:
      'Seamless pattern of hand-sketched five-point stars in pencil-grey and silver on a mottled navy blue watercolour background, scattered tiny white speckles like paint flecks, stars in varied sizes, whimsical and vintage, wallpaper style, 16:10.',
    brief: brief({
      title: 'Navy star night',
      feel: 'a storybook night sky — cosy dark mode with a hand-drawn edge.',
      typography: 'Serif display with character (Fraunces / Libre Caslon) in silver #D9D6CF 56px; body Inter 16px #C9CCD6; small caps labels.',
      palette: 'Navy #1F2C5B / #2B3A6E, silver #CFCBC2, cream #F1EDE3, speckle white; accent warm gold #D9B36A sparingly.',
      layout: 'Pattern as full-page background with content on cream "paper" panels (max 760px) that float over the sky; footer and hero use the sky directly with silver type.',
      spacing: 'Panels 12px radius, 48px padding, 96px between; pattern tile ~600px.',
      texture: 'Watercolour mottling, pencil-stroke stars (SVG with rough stroke), paper panels with slight grain.',
      motion: 'Stars twinkle by opacity 0.6→1 at random 3–7s intervals; slow drift of the pattern (background-position) 1px/s.',
      rules: 'DO keep stars sketchy, not geometric. DON\'T use pure black. DON\'T over-animate — a few stars at a time.'
    })
  },
  {
    file: '84bea8610e0886ee948d5ccd9bf0c523.jpg',
    title: 'Mosaic wave texture with gold flecks',
    families: ['painterly-texture', 'blush-pastel'],
    tags: ['vertical waves', 'mosaic tiles', 'gold sequins', 'watercolour', 'peach sage cream', 'abstract', 'phone wallpaper', 'organic stripes'],
    imagePrompt:
      'Abstract vertical wavy stripes made of tiny watercolour mosaic tiles in cream, peach, sage green, dusty blue and beige, each stripe edged with a row of shimmering gold sequins and glass beads, soft painterly, luxurious but pastel, seamless texture, 9:16.',
    brief: brief({
      title: 'Mosaic waves',
      feel: 'soft luxury — a spa/wedding texture; pastel but with real sparkle.',
      typography: 'Elegant high-contrast serif (Cormorant Garamond / Bodoni Moda) 48–72px in #6B5E52; captions in a light sans 13px tracking 0.12em uppercase.',
      palette: 'Cream #F2EBDD, peach #E8B49A, sage #B7C4AE, dusty blue #9DB2BD, taupe #C9B9A4, gold #C9A24C.',
      layout: 'Texture used as side panels or as a hero backdrop behind a centred cream card; sections separated by thin gold rules; asymmetric two-column content with generous margins.',
      spacing: '120px section padding, 1px gold hairlines, 4px radius max.',
      texture: 'The mosaic image itself plus gold-foil accents (linear-gradient gold on buttons/rules); paper-white panels.',
      motion: 'Slow vertical drift of the texture; gold shimmer via a moving highlight gradient on hover.',
      rules: 'DO use gold as a thin accent only. DON\'T flatten the palette to one pink. DO keep type high-contrast serif.'
    })
  },
  {
    file: '86bb18e22ce2e51dda7165ac4dfe34e5.jpg',
    title: 'Oxblood red MacBook desktop',
    families: ['widget-desktop', 'moody-jewel'],
    tags: ['dark red wallpaper', 'macos widgets', 'leopard print tile', 'orange lilies', 'fashion editorial photo', 'gold jewellery', 'calendar widget', 'weather widget', 'french locale', 'photographed in dark room'],
    imagePrompt:
      'Solid deep oxblood red desktop wallpaper, matte velvet texture with a very subtle vignette, no objects, moody and luxurious, 16:10.',
    brief: brief({
      title: 'Oxblood editorial desktop',
      feel: 'fashion-magazine dark mode — red velvet with leopard, gold and lilies glowing out of it.',
      typography: 'SF Pro: date/temp 22px 600 warm white; labels 11px; editorial photo captions in a Didone serif (Bodoni) if used on web.',
      palette: 'Oxblood #6A1418 background, darker card #4E0F12 at 70%, warm white #F6EEE4, orange-lily #E3652C, gold #C99A4B, leopard tan/black pattern as an accent tile.',
      layout: 'Left column: weather, calendar, agenda, one big photo tile; right column: one large editorial photo + folder row + player; centre left empty for the wallpaper.',
      spacing: '16px grid, 16px radius, widgets 160px units; dock full-width.',
      texture: 'Velvet matte red, photographic tiles (leopard, gold hands, lilies), slight film grain over everything.',
      motion: 'Nearly static; photo tiles crossfade every 30s.',
      rules: 'DO limit imagery to warm tones. DON\'T use pure white. DON\'T mix in cool blues.'
    })
  },
  {
    file: '86de20ee79a998442e13ef377225286a.jpg',
    title: 'Strawberries & Matcha calendar palette',
    families: ['blush-pastel', 'soft-ui-cards'],
    tags: ['google calendar', 'colour palette', 'hex codes', 'pink and green', 'gingham washi', 'serif title', 'event blocks', 'stargazer lily', 'colour system'],
    imagePrompt:
      'A weekly calendar mockup filled with softly coloured event blocks in strawberry pink, rose, sage and matcha green, a green gingham washi tape strip on the corner, a serif title reading a palette name, a row of hex code swatches drawn with marker strokes below, and a pink stargazer lily photo in the corner, white background, clean, 4:3.',
    brief: brief({
      title: 'Strawberries & Matcha',
      feel: 'a colour system before it is a design — pink and green, soft, organised, a little cottagecore.',
      typography: 'Title: elegant serif (Playfair Display) 40px in two colours (pink + green words); UI text: Inter 13px #3C3C3C; hex codes in a rounded sans 18px coloured to match.',
      palette: 'Exactly: sage #9CAD8C, blush #E9B5BD, cherry #D2828B, rose #CE859A, pale sage #DDE0BC, pale pink #F0CBD7, off-white #ECE9E5. White base.',
      layout: 'Week/board grid with 1px #EDEDED lines; events are rounded 6px blocks tinted with the palette; a sidebar or footer shows the swatch legend as marker strokes.',
      spacing: '4px event radius, 8px event padding, 40px row height, 24px page gutters.',
      texture: 'Flat, except a gingham washi strip (CSS repeating-linear-gradient) and one botanical photo.',
      motion: 'Events slide/stretch smoothly when dragged; colour swatches "paint" in.',
      rules: 'DO use only these 7 colours + white. DON\'T add grey UI chrome heavier than #EDEDED. DO name colours playfully.'
    })
  },
  {
    file: '9fe0009de180f8d9ef51c0a005672375.jpg',
    title: 'Cream desktop with figs, sardine tin and Fleetwood Mac ticket',
    families: ['widget-desktop', 'blush-pastel', 'vintage-ephemera', 'sticker-sheet'],
    tags: ['cream wallpaper', 'custom icons', 'watercolour figs', 'concert ticket', 'sardine tin icon', 'sticky note to-do', 'pink illustration widget', 'mono handwriting font', 'flat icon set', 'macos'],
    imagePrompt:
      'Minimal cream-coloured desktop wallpaper with a large watercolour illustration of two halved figs in pink and pale green in the lower right corner, lots of empty warm off-white space, delicate botanical illustration style, 16:10.',
    brief: brief({
      title: 'Fig desktop',
      feel: 'a tidy analogue desk — cream paper, one watercolour illustration, a vintage ticket and tiny object icons.',
      typography: 'Clock: SF Rounded 40px #C97C8E pink. To-do note: a handwriting mono (e.g. "Kalam" / "Nanum Pen") 14px black on grey paper. Ticket: condensed grotesk + letterpress serif.',
      palette: 'Cream #F7F3EC, rose #C97C8E, pale peach #F6E9DC, grey note #E9E9E9, black ink #111, fig pink #E4A2B0, fig green #C9D3A3.',
      layout: 'Icons in a loose left column (each a tiny object photo: tin, star, butterfly); a sticky-note window top-left; two widgets bottom-left (illustration tile + clock); a rotated ticket stub; illustration anchored bottom-right.',
      spacing: 'Icon grid 96px, widgets 12px radius, note 1px black border, ticket rotated -1°.',
      texture: 'Flat cream, watercolour illustration, halftone ticket print, object icons with transparent backgrounds.',
      motion: 'Minimal; hover on icons bounces 2px.',
      rules: 'DO replace app icons with objects. DON\'T use gradients. DO keep one illustration as the only large image.'
    })
  },
  {
    file: 'a92c41f19e5ccea2cf6cf7ddc071faf7.jpg',
    title: 'Sprocket House — vintage textured agency site',
    families: ['vintage-ephemera', 'scrapbook-collage'],
    tags: ['damask wallpaper', 'torn paper', 'sepia', 'letterpress script', 'stamped labels', 'vintage photo', 'web 2.0 grunge', 'kraft', 'drop caps', 'paper layers'],
    imagePrompt:
      'Vintage website header composition: dark damask-patterned wallpaper background, a torn cream paper sheet laid over it with a hand-lettered script logo, a sepia photograph of an old storefront pinned top-right, a small stamped kraft label, rubber-stamp red text, letterpress serif body copy with a drop cap, sepia and cream palette, grungy realistic paper textures, 16:9.',
    brief: brief({
      title: 'Sprocket House vintage',
      feel: 'an old print shop online — layered paper over damask, ink stamps, sepia photos; 2010 "handmade web" energy.',
      typography: 'Logo/section titles: brush script or letterpress script (Kaushan / Sacramento) 36–48px; body: old-style serif (Georgia / Libre Baskerville) 15px with a 3-line drop cap; labels: rubber-stamp condensed (Special Elite / Rye) in red.',
      palette: 'Damask charcoal #2E2A26 / #3D3730, cream paper #EFE6D3, kraft #C8A878, sepia #8B7355, stamp red #B23A2F, link teal #2F7F8A.',
      layout: 'Wide paper sheet centred (max 960px) over the wallpaper; header split logo-left / photo-right; stacked paper strips for sections; a right sidebar of kraft labels for client list.',
      spacing: 'Torn edges 12–20px irregular; 0 radius; sections overlap by 16px; 32px paper padding.',
      texture: 'Damask SVG pattern, torn-paper PNG masks, coffee-stain and fold creases, halftone photos, stamp ink with rough edges.',
      motion: 'Almost none; paper strips can slide up on scroll; stamps thunk in.',
      rules: 'DO layer at least three paper types. DON\'T use flat colour blocks. DON\'T use modern sans-serif.'
    })
  },
  {
    file: 'ac4645d6dd668c2e1c9c676294703eb4.jpg',
    title: 'Monet water lilies (impressionist painting)',
    families: ['painterly-texture'],
    tags: ['impressionism', 'water lilies', 'blue green', 'brushwork', 'fine art wallpaper', 'pond', 'dappled light', 'canvas texture'],
    imagePrompt:
      'Impressionist oil painting of a lily pond, loose visible brushstrokes, blue-violet water reflecting sky, clusters of green lily pads with pink and white blossoms, soft dappled light, canvas texture, in the manner of late 19th-century French impressionism, 16:9.',
    brief: brief({
      title: 'Water-lily impressionist',
      feel: 'museum calm — a painting as hero, with restrained gallery typography.',
      typography: 'Gallery serif (Cormorant / Canela-like) 56px headlines in #1E2A44; captions in a small grotesk 12px uppercase tracking 0.15em #5A6273.',
      palette: 'Pond blue #5B7FB0, violet #7E7FB3, lily green #7FA36A, blossom pink #E8A0B0, cream wall #F4F1EA, ink #1E2A44.',
      layout: 'Full-bleed painting hero with a thin cream caption bar; content on cream "gallery wall" sections with wide margins and single-column reading width (640px); painting crops reappear as section headers.',
      spacing: '160px section padding, 0 radius, 1px hairline dividers #DCD7CC.',
      texture: 'Canvas weave overlay at 8% on painting crops; matte cream elsewhere.',
      motion: 'Very slow zoom on the hero; text fades; no hover effects on images.',
      rules: 'DO respect the painting — no filters. DON\'T put text over busy areas. DO use museum-label typography.'
    })
  },
  {
    file: 'ae3375ff509ae8911662c08f3fec9ee7.jpg',
    title: 'Pink lily cut-out',
    families: ['sticker-sheet', 'blush-pastel'],
    tags: ['isolated flower', 'pink lily', 'white background', 'soft focus', 'sticker', 'botanical'],
    imagePrompt:
      'A single pink stargazer lily bloom isolated on a pure white background, petals slightly translucent, soft studio light from above, faint speckled stamens, photoreal with a slightly airbrushed softness, 1:1.',
    brief: brief({
      title: 'Single lily',
      feel: 'one flower, all the space — a botanical sticker as brand mark.',
      typography: 'Thin serif (Cormorant Light) 48px in #B0788A; body Inter 15px #4A4446.',
      palette: 'White #FFFFFF, lily pink #F0A9C0 / #E07A9A, stamen red #C43A3A, cream #FBF7F4.',
      layout: 'Centred single-object hero, then generous single-column text; the lily reappears small as a bullet/sticker beside headings.',
      spacing: '200px hero padding, 720px content width.',
      texture: 'None; the soft-focus flower only.',
      motion: 'Lily fades/scales in 1.2s; petals sway 1° on hover.',
      rules: 'DO keep one object per view. DON\'T tile the flower. DON\'T add pattern.'
    })
  },
  {
    file: 'af96e4c5cc0565284cbbe4e3bc0bb093.jpg',
    title: 'Blush pink MacBook desktop with macarons',
    families: ['widget-desktop', 'blush-pastel'],
    tags: ['pink gradient wallpaper', 'macos widgets', 'macaron photo', 'coffee art tile', 'bible verse card', 'countdown widget', 'activity rings', 'sonny angel icons', 'calendar widget', 'photographed laptop'],
    imagePrompt:
      'Soft blush pink to dusty rose vertical gradient desktop wallpaper, very smooth, slight warm glow at the top, no objects, 16:10.',
    brief: brief({
      title: 'Macaron pink desktop',
      feel: 'girly, organised, soft — pastel pink everything with cream photo tiles.',
      typography: 'Clock: SF Pro 88px 300 white; date 16px uppercase 600 tracking 0.1em; card text 12px #6E5E63; a serif (EB Garamond) for the quote card.',
      palette: 'Gradient #F6D9E0 → #DDB7C1; cards rgba(255,255,255,0.7); dark player #2B2427; accents pink #E58BA3, green ring #3DD68C, yellow ring #F3C63B.',
      layout: 'Three-column widget grid: left (counters, photos), centre (clock + player + icon row), right (photo grid, activity, to-do, calendar). Symmetrical, almost full.',
      spacing: '12px gutters, 16px radius, photos 2×2 tiles with 6px white padding.',
      texture: 'Frosted white cards, photographic pastel tiles (macarons, latte, peonies), tiny 3D figurine icons.',
      motion: 'Rings animate on load; countdown ticks.',
      rules: 'DO keep everything pink/cream/white. DON\'T leave large empty areas — this one is intentionally full. DON\'T use black except the player.'
    })
  },
  {
    file: 'c71cf62f8194e89975baa5fb4d05c205.jpg',
    title: '"Lovely" lily postage stamp',
    families: ['vintage-ephemera', 'blush-pastel', 'sticker-sheet'],
    tags: ['postage stamp', 'perforated edge', 'postmark', 'pink lilies', 'helvetica', 'vertical text', 'grey stamp', 'sticker'],
    imagePrompt:
      'A designed postage stamp on white: light grey stamp with perforated edges, a rounded-rectangle frame containing two pink lilies, bold Helvetica denomination "150 cents" top-left, small sans text bottom-left, the word "LOVELY" running vertically along the right edge, a black circular postmark and wavy cancellation lines overlapping the corner, flat graphic style, 1:1.',
    brief: brief({
      title: 'Lily stamp',
      feel: 'Swiss-postal minimalism with a soft subject — grey, Helvetica, one pink flower.',
      typography: 'Helvetica / Inter: denomination 40px 700, secondary 16px 400, vertical label 18px uppercase tracking 0.3em rotated 90°.',
      palette: 'Stamp grey #EEEEEE, white #FFFFFF, black #111, pink #EFA3B8, postmark black at 80%.',
      layout: 'Components as stamps: every card is a perforated-edge rectangle with a rounded inner frame; a vertical label on the right edge; postmark as the interaction/“sent” state.',
      spacing: 'Perforation 6px radius circles every 12px (CSS mask); 4px inner frame offset; 24px inner padding.',
      texture: 'Flat, except the ink postmark (slightly rough SVG strokes).',
      motion: 'Postmark stamps down (scale 1.4→1, 120ms) when an action completes.',
      rules: 'DO use perforated edges as the signature shape. DON\'T add shadows. DO use one photo per stamp.'
    })
  },
  {
    file: 'd499e547773fb1a0ad568c3c58095c80.jpg',
    title: 'Soft grey MacBook desktop with handwriting',
    families: ['widget-desktop', 'soft-ui-cards'],
    tags: ['grey white wallpaper', 'macos widgets', 'handwritten affirmations', 'ocean photo tile', 'app folder widget', 'calendar month', 'weather row', 'beige neutrals', 'photographed laptop'],
    imagePrompt:
      'Abstract soft grey and white wallpaper like silk or blurred fog, gentle light gradient with a faint diagonal fold, very minimal and airy, 16:10.',
    brief: brief({
      title: 'Grey silk desktop',
      feel: 'neutral and serene — greys, whites, a few affirmations in cursive.',
      typography: 'Clock SF Pro 96px 300 #1F1F1F; date 18px; handwritten script (Homemade Apple / Caveat) 22px #3A3A3A for affirmations; calendar 13px.',
      palette: 'Silk grey #E9E9EA → #F5F5F5, white cards rgba(255,255,255,.85), dark grey #1F1F1F, muted #8A8A8E, tiny accent black.',
      layout: 'Left column stack: clock card with script note, rings, ocean photo, quote card, app folder, player; below: month calendar + weather row; wallpaper visible right.',
      spacing: '12px gutters, 14px radius, cards 200px units.',
      texture: 'Silk gradient wallpaper, black-and-white ocean photo, script written directly on the wallpaper.',
      motion: 'Script draws itself once (SVG stroke) on load; else static.',
      rules: 'DO stay monochrome. DON\'T add colour beyond app icons. DO use handwriting for warmth.'
    })
  },
  {
    file: 'd639cba71e5221f696184f4a1401c0fa.jpg',
    title: 'Daily — moodboard journal app',
    families: ['scrapbook-collage', 'soft-ui-cards'],
    tags: ['app ui', 'page fan carousel', 'navy background', 'moodboard spread', 'cursive annotations', 'colour swatch dots', 'photo grid', 'circular icon buttons'],
    imagePrompt:
      'A fanned stack of journal pages floating over a dusty navy background, the open front spread showing a clean moodboard of six landscape and portrait photos on white with cursive handwritten labels and arrows, a row of five small colour swatch circles, pages behind fanned out showing magazine covers and photos, white circular icon buttons top corners and bottom centre, app mockup, 4:3.',
    brief: brief({
      title: 'Daily moodboard app',
      feel: 'the calmer sibling of a scrapbook — white spreads, photos, cursive notes; navy chrome.',
      typography: 'Title Inter 600 28px white; cursive annotation font (Dancing Script / Homemade Apple) 18px #333 on the page; swatch labels 10px.',
      palette: 'Shell navy #3F4A6B, page white #FFFFFF, ink #333, swatch dots from the photos (dusty rose, slate, olive, navy).',
      layout: 'Spread = 2 columns of photos with masonry offsets, annotations in the margins with hand-drawn arrows, a swatch row bottom-right; carousel fans previous pages at -6°/-12°/-18°.',
      spacing: '16px photo gaps, 8px page radius, 44px circular buttons.',
      texture: 'Matte white page, soft shadow under the stack; no paper grain.',
      motion: 'Swipe fan with spring; swatches pop in; arrows draw.',
      rules: 'DO keep the page clean — annotations only in margins. DON\'T use stickers here. DO auto-extract palette dots from photos.'
    })
  },
  {
    file: 'd96888d88460f33e60eed886c6921dd6.jpg',
    title: 'Widgy "good afternoon" dashboard widget',
    families: ['soft-ui-cards'],
    tags: ['greige card', 'lowercase greeting', 'calendar grid', 'highlight pills', 'cream and pink', 'rounded sans', 'weather glyph', 'sunset time', 'ios widget'],
    imagePrompt:
      'A wide rounded widget mockup on a warm greige background: lowercase "good afternoon" greeting top-left with a weather icon and temperature top-right, a small monthly calendar in a taupe rounded block on the left, two highlight pills on the right in pale yellow and blush pink with simple black glyphs, warm neutral palette, soft flat design, 16:9.',
    brief: brief({
      title: 'Good afternoon widget',
      feel: 'a warm, lowercase morning dashboard — greige, butter, blush; friendly and unhurried.',
      typography: 'Rounded sans (SF Rounded / Nunito) — greeting 28px 600 lowercase #2B2622, section labels 18px 400, pill text 16px, calendar 12px.',
      palette: 'Page #EDE6E0, card #E4DED6, taupe block #C9BEA3, butter #FFF3D6, blush #FAD6DC, ink #2B2622, muted #7A7169.',
      layout: 'Wide card: header row (greeting | weather), then two columns — calendar block left (45%), stacked highlight pills right (55%).',
      spacing: '24px card radius, 20px padding, 12px pill radius, 14px pill padding, 10px gap.',
      texture: 'Flat matte; no shadows; today\'s date is a filled dark circle.',
      motion: 'Pills slide in from the right; greeting swaps with time of day via fade.',
      rules: 'DO keep everything lowercase. DON\'T use pure white or pure black. DO use glyph icons, not emoji.'
    })
  },
  {
    file: 'da7de56b9adccfa20019ece6140d38b0.jpg',
    title: 'Shopping-list sticky note app icon',
    families: ['soft-ui-cards'],
    tags: ['app icon', 'sticky note', 'butter yellow', 'blue handwriting', 'strikethrough item', 'stacked paper', 'rounded square', 'skeuomorphic'],
    imagePrompt:
      'A rounded-square app icon on light grey: butter yellow squircle background with two stacked cream paper notes slightly rotated, the top note lined with a small uppercase title and a short list handwritten in bright blue ink with one item crossed out, soft shadow between the sheets, clean skeuomorphic 3D-flat style, 4:3.',
    brief: brief({
      title: 'Sticky-note to-do',
      feel: 'a paper note in a modern squircle — cheerful yellow, blue ink, one thing crossed off.',
      typography: 'Title: rounded sans 12px uppercase tracking 0.1em #C9A54A; list items: handwritten marker font (Caveat / Permanent Marker light) 22px in ink blue #2457E6; strikethrough drawn by hand (SVG).',
      palette: 'Butter #F2D67A, cream note #FFF6E3, note lines #EFE3CC, ink blue #2457E6, page #F1F1F1, shadow rgba(0,0,0,.12).',
      layout: 'Squircle container (radius 22% ) holding two note sheets offset 6px and rotated -3°/+2°; list rows on 40px ruled lines; a "…" trailing row.',
      spacing: 'Note padding 24px, ruled lines 40px, sheet radius 8px.',
      texture: 'Matte paper, faint ruled lines, soft sheet shadow; no gloss.',
      motion: 'Adding an item writes in with a stroke animation; completing draws a squiggle strikethrough.',
      rules: 'DO use handwriting for user content and sans for system labels. DON\'T use checkboxes — strike-through is the check. DO keep one accent (blue).'
    })
  },
  {
    file: 'dd0cfc4b67c9fda4cb05ae9addadcaf6.jpg',
    title: '"Life lately" red scrapbook spread',
    families: ['scrapbook-collage', 'moody-jewel'],
    tags: ['dark red background', 'handwritten journaling', 'torn lined paper', 'matcha photo', 'sylvanian figures', 'sticker stars', 'photo strip', 'sanrio stickers', 'bandage sticker', 'multicolour lettering'],
    imagePrompt:
      'Scrapbook spread on a deep red textured background: a torn lined-paper note with a handwritten song list, a small grid of beach photos with black borders, stickers of stars, a lime slice, a matcha latte cup and small figurines, handwritten paragraphs in black pen wandering around the page, a big hand-lettered multicolour title bottom-left, washi tape and a bandage sticker, playful and dense, 4:3.',
    brief: brief({
      title: 'Life lately red',
      feel: 'a diary page that never stops — red base, handwriting everywhere, stickers in the gaps.',
      typography: 'Title: hand-lettered mixed-colour caps (each letter a different pastel) 64px; journaling: neat handwriting font (Patrick Hand / Indie Flower) 15px black; song list in the same handwriting on lined paper.',
      palette: 'Red #8C1F2A / #A32833 base, paper #FBF7EE, pen black #1A1A1A, sticker pastels (pink #F3B6C8, mint #BFE3D0, butter #F7E7A6), matcha green #7FA84A.',
      layout: 'Freeform: text blocks flow around stuck-down objects; photos in a 1×3 vertical strip on the right; a torn note top-centre; title bottom-left; stickers fill whitespace.',
      spacing: 'No gutters; objects rotated ±5°; photo borders 8px black; tape 40×12px.',
      texture: 'Textured red paper, torn edges, sticker gloss, hard shadows.',
      motion: 'Stickers peel on hover; handwriting appears line by line on scroll.',
      rules: 'DO use handwriting as body text. DON\'T use grid alignment. DO keep the red dark, not bright.'
    })
  },
  {
    file: 'de436e5526792007b89f593ac1d144bc.jpg',
    title: 'Star sticker collection',
    families: ['sticker-sheet'],
    tags: ['stars', 'sticker sheet', 'embroidered patch', 'sequins', 'chrome', 'denim', 'newspaper', 'pastel', 'material study', 'white background'],
    imagePrompt:
      'A sticker-sheet collection of about forty five-point stars on pure white, each made of a different real material — pink satin, embroidered denim, chrome, gold foil, sequins, newspaper, stained glass, plush, iridescent glass, gingham — evenly scattered, varied sizes, photoreal cut-outs with faint shadows, vertical 9:16.',
    brief: brief({
      title: 'Star materials',
      feel: 'one shape, forty materials — a catalogue that doubles as a sticker sheet.',
      typography: 'Tiny: a rounded mono (JetBrains Mono / Space Mono) 11px for material names; headline in a chunky rounded sans 40px only if needed.',
      palette: 'White #FFFFFF; stars supply the palette — bubblegum pink, denim blue, gold, chrome, lilac, mint; text #222.',
      layout: 'Dense scatter grid: CSS grid with random cell spans, items centred, rotated ±15°, sizes 48–140px; filter chips by material.',
      spacing: '24px gaps, edges bleed off; no card backgrounds.',
      texture: 'Photoreal object cut-outs with 0 2px 4px rgba(0,0,0,.15) shadows.',
      motion: 'Stars are draggable; hover wobbles ±3°; new items pop in with scale bounce.',
      rules: 'DO keep the white pure. DON\'T add borders or containers. DO vary rotation.'
    })
  },
  {
    file: 'download.png',
    title: 'Bulldog clips, pins and bows collection',
    families: ['sticker-sheet'],
    tags: ['bulldog clips', 'push pins', 'gingham bows', 'binder clips', 'wax seal', 'washi tape', 'stationery', 'pastel enamel', 'white background', 'object catalogue'],
    imagePrompt:
      'Sticker-sheet collection of stationery objects on pure white: pastel enamel bulldog clips in pink, mint, lilac, navy and red, brass and chrome binder clips, coloured push pins, gingham ribbon bows in red, green and blue, a pink wax seal, a strip of masking tape — evenly scattered, photoreal cut-outs, vertical 9:16.',
    brief: brief({
      title: 'Stationery objects',
      feel: 'a desk drawer emptied onto white — tactile, pastel, orderly chaos.',
      typography: 'Small mono captions 11px #444; a condensed grotesk for section labels; nothing large.',
      palette: 'White; enamel pastels — pink #F4B9C6, mint #BFDCC5, lilac #D9C4DC, navy #22406A, red #D63A2F, brass #B89A5A.',
      layout: 'Scatter grid; objects used as UI — bulldog clips "hold" cards at the top edge, pins mark items, bows decorate headings, tape strips as dividers.',
      spacing: 'Clips overhang cards by 24px; pins 32px; 32px gaps.',
      texture: 'Photoreal object PNGs with contact shadows; cards are plain paper #FAFAF7.',
      motion: 'Clip springs open/closed on hover; pins push in on click.',
      rules: 'DO use real objects as affordances. DON\'T illustrate them flat. DO keep the base white.'
    })
  },
  {
    file: 'f4a035a1c07aeb6a78b5da26e3e47724.jpg',
    title: 'Pink-and-green swirl desktop with Sonny Angels',
    families: ['widget-desktop', 'blush-pastel', 'painterly-texture'],
    tags: ['grainy gradient wallpaper', 'pink green swirl', 'macos widgets', 'vintage illustration tiles', 'pressed flower', 'tulip drawing', 'sonny angel icons', 'music player', 'dreamy'],
    imagePrompt:
      'Dreamy grainy wallpaper of soft pink and pale green blurred swirls, like coloured chalk smudged into a spiral, heavy film grain, faint yellow highlights, no objects, 16:10.',
    brief: brief({
      title: 'Chalk swirl desktop',
      feel: 'dreamy and vintage — pastel chalk swirls behind old-book illustrations and tiny figurines.',
      typography: 'Clock SF Pro 44px 400 white; date 12px; illustration captions in a hand-written script (Homemade Apple) 12px.',
      palette: 'Pink #E8B7C0, green #BFD3A6, cream #F3EAE0, yellow highlight #F2E1A0, ink #4A3B3B; player card dark #2A2426.',
      layout: 'Widgets clustered top-left in a 2-column stack (clock, art tiles, pressed flower, player, illustrated card), icon row of figurines beneath; the rest of the screen is the swirl.',
      spacing: '12px gutters, 14px radius, illustrated card 1px #D8B7C0 border.',
      texture: 'Heavy grain gradient, vintage illustration scans, pressed-flower photo, figurine icons.',
      motion: 'Swirl rotates 360° over 120s barely perceptibly; player progress.',
      rules: 'DO keep grain visible. DON\'T sharpen the gradient. DO use scanned/vintage illustrations rather than modern icons.'
    })
  },
  {
    file: 'Photo Booth Save the Date Template Animated Photostrip Reveal 20.mp4',
    title: 'Photo-booth save-the-date (animated photostrip reveal)',
    families: ['moody-jewel', 'vintage-ephemera', 'scrapbook-collage'],
    tags: ['burgundy', 'photostrip reveal', 'script typography', 'wedding invitation', 'mobile site', 'small caps', 'animated', 'cream on dark', 'photo booth slot'],
    imagePrompt:
      'Mobile wedding invitation mockup on a deep burgundy background: a vertical photo-booth slot rendered in soft rose-gold metallic 3D from which a black-and-white photostrip of a couple slides out, elegant white script names above, small spaced uppercase text "we are getting married", "you\'re invited" in script at the bottom, cinematic soft lighting, 9:16.',
    brief: brief({
      title: 'Photostrip save-the-date',
      feel: 'cinematic romance — a single object animating out of the dark; nothing else competes.',
      typography: 'Names: a flourished script (Pinyon Script / Great Vibes) 56px cream; supporting lines: sans small caps 12px tracking 0.35em cream; a serif 16px for details.',
      palette: 'Burgundy #5A1A22 / #4A1219, cream #F3E9DC, rose-gold gradient #C99A7A → #E6C2A8, photo black-and-white.',
      layout: 'Mobile single column, centred: eyebrow line → script names → hero object (photostrip slot) → script CTA → small caps button; everything vertically stacked with equal rhythm.',
      spacing: '32px between blocks, 24px page padding, hero object 60% height.',
      texture: 'Velvet matte background with vignette, metallic 3D slot with soft reflections, grainy B&W photos.',
      motion: 'On load: names fade, then the strip slides up out of the slot over 1.6s with ease-out, then CTA appears; scroll reveals details with slow fades.',
      rules: 'DO animate one hero object only. DON\'T use more than two type styles. DO keep the palette to burgundy + cream + rose-gold.'
    })
  }
];

const now = new Date().toISOString();
const lib = {
  version: 1,
  families,
  items: items.map((it, i) => ({
    id: require('crypto').createHash('sha1').update(it.file).digest('hex').slice(0, 12),
    file: it.file,
    title: it.title,
    families: it.families,
    tags: it.tags,
    imagePrompt: it.imagePrompt,
    brief: it.brief,
    notes: '',
    url: '',
    addedAt: now,
    analyzed: true,
    analyzedBy: 'claude (seed)'
  }))
};

const out = path.join(__dirname, '..', 'library.json');
if (fs.existsSync(out) && !process.argv.includes('--force')) {
  console.log('library.json exists; use --force to overwrite');
} else {
  fs.writeFileSync(out, JSON.stringify(lib, null, 2));
  console.log('wrote', out, lib.items.length, 'items,', families.length, 'families');
}
