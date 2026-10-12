# Kaalaman

Learn math by doing. A free, Brilliant-style interactive learning site: short lessons made of steps, instant feedback, accounts, streaks and XP.

## Run it

```bash
npm install
npm run dev
```

## Accounts

Without configuration the site runs in **preview mode**: accounts and progress are saved in the browser only.

For real accounts, create a free [Supabase](https://supabase.com) project, run `supabase/schema.sql` in its SQL editor, and set:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

in a `.env` file locally, or as repository variables for the GitHub Pages deploy.

## AI tutor

Every step has an "Ask tutor" button. It calls the `tutor` Supabase Edge Function (`supabase/functions/tutor`), which keeps the Anthropic API key on the server, coaches with hints instead of answers, and caps each learner at 30 messages a day.

```bash
supabase secrets set ANTHROPIC_API_KEY=...
supabase functions deploy tutor
```

Set a monthly spend limit in the Anthropic Console. Until Supabase is connected the button shows that the tutor is off.

## Writing lessons

All content lives in `src/content/courses.ts`. A lesson is a list of steps:

- `explain`: text, optionally with a picture
- `choice`: multiple choice
- `number`: type a number
- `slider`: move a slider to change a picture (fraction bar, line graph, triangle)

Any step can show a `media` visual: an MP4 or GIF, for example an animation made in Canva and exported. Put the file in `public/` and use `{ kind: 'media', src: './my-animation.mp4', alt: '...' }`.

## Deploy

Pushing to `main` builds the site and publishes it to GitHub Pages (`.github/workflows/deploy.yml`). In the repo settings, set Pages → Source to "GitHub Actions".
