# Design

## Visual Direction

Studio-energetic editorial UI with a playful edge and mature typography. The system combines warm paper-like backgrounds, confident ink-like text, and bright coral/cyan accents used as punctuation.

## Theme Strategy

- Default: light, warm, high readability for long-form reading.
- Dark: muted slate variant preserving contrast and tone.
- Color strategy: restrained-to-committed hybrid, where neutral surfaces dominate but key accents are bold and memorable.

## Color Tokens

- `--color-bg`: warm paper background
- `--color-text`: deep ink blue
- `--color-accent`: coral (light mode emphasis)
- `--color-card`: warm neutral panel
- `--color-card-muted`: softer neutral variant
- `--color-border`: tinted warm border
- Dark mode swaps preserve the same semantic roles with cooler neutrals and cyan accent.

## Typography

- Display: serif for major headings and editorial emphasis.
- Body: clean sans for long-form readability.
- Mono: technical inline/code content and small metadata accents.
- Hierarchy uses clear contrast in size and weight, avoiding flat scales.

## Layout & Spacing

- Reading width centered with generous line-height.
- Section rhythm alternates compact metadata with breathable content blocks.
- Use cards sparingly for previews and summaries, not as universal containers.
- Tag and note components should feel lightweight and tactile.

## Motion

- Medium motion profile.
- Subtle fade/slide reveals and hover transforms only.
- No bouncy or elastic movement.
- Motion should confirm interaction, not decorate it.

## Components

- Post cards: understated surface, strong typographic anchor, playful accent on hover.
- Tags: soft pill style with expressive accent transitions.
- Hashiyya notes: inline on mobile, side notes on desktop with compact annotation card style.
- Prose: editorial heading cadence, calm paragraph rhythm, strong but non-loud link emphasis.

## Constraints

- No gradient text.
- No heavy glassmorphism defaults.
- No side-stripe accent borders as primary motif.
- Keep playful details subordinate to reading clarity.
