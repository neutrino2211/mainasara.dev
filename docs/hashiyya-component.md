# Hashiyya Component

Use `Hashiyya` inside markdown content to render notes:

- inline on mobile
- side note on desktop

## Basic Usage

```md
Some paragraph text.

::Hashiyya{title="Hashiyya" side="right"}
This note appears in the right margin on desktop and inline on mobile.
::

Continue with the main text...
```

## Props

- `title` (optional): small label shown on the note card.
- `side` (optional): `"auto"`, `"left"` or `"right"` (default: `"auto"`).
  - `auto` alternates by note order on desktop (`odd=right`, `even=left`).

## Notes

- Keep notes short for better side-note readability.
- For portable `standard.site` publishing, keep the core meaning in normal markdown text and use hashiyya as an enhancement.
