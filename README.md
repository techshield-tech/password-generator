# Password & Token Generator

Generate strong random passwords, API tokens, and Diceware-style passphrases, and
analyse the strength of any password — fast, free, and 100% client-side. Randomness
comes from the browser's `crypto.getRandomValues` (unbiased rejection sampling, never
`Math.random`); nothing is ever sent over the network.

**Live:** https://techshield-tech.github.io/password-generator/

Part of [MMOALL Developer Tools](https://mmoall.com/tools).

## Features

### Password / Token

- Length 1–256 (slider or number input), live regeneration as options change.
- Character types: uppercase, lowercase, digits, symbols (all 32 printable ASCII symbols).
- **Exclude ambiguous** characters (`I l 1 | O 0 o B 8 S 5 Z 2` and quotes/backtick).
- **Exclude characters** — remove any characters you don't want.
- **Custom character set** — overrides the type toggles (e.g. hex, base32, digits only).
- **One of each type** — guarantees at least one character from every enabled type.
- Presets: Default, Alphanumeric 32, Hex 64, PIN 6.
- Shows the resulting character pool, entropy in bits, strength bar, and the average
  brute-force time.
- **Bulk** generation of up to 500 values, with *Copy all*.

### Passphrase

- 1–20 words from the [EFF Diceware wordlists](https://www.eff.org/dice): large
  (7,776 words, 12.9 bits/word) or short (1,296 words, 10.3 bits/word).
- Separator: hyphen, space, period, underscore, comma, none, or custom.
- Capitalisation: lower, Title, UPPER, or random per word.
- Optionally append a digit and/or a symbol to a random word.
- Entropy is computed assuming the attacker knows the wordlist and settings.
- Bulk generation of up to 100 passphrases.

### Strength analyser

- Length, detected character-set size, entropy (bits), and a 0–100 score.
- Five-level strength bar (Very weak → Very strong).
- Estimated crack time for four attack scenarios: online throttled (100/h), online
  unthrottled (10/s), offline slow hash (10k/s), and offline fast hash (10B/s).
- Warnings for common passwords (including simple leetspeak), short length, repeated
  characters, keyboard/alphabet sequences, years, and single-type passwords.
- Show/hide toggle; **Analyse** on the generator tabs sends the current value here.

### General

- Copy buttons on every output.
- Light/dark theme toggle (remembered in `localStorage`, defaults to the OS preference).
- Responsive layout, side-by-side panels on large screens.
- Embeddable in an iframe (see [Embedding](#embedding)).

## Tech stack

- [Vite 6](https://vite.dev/) + [React 19](https://react.dev/) + TypeScript
- [Tailwind CSS 4](https://tailwindcss.com/) (via `@tailwindcss/vite`)
- [Bun](https://bun.sh/) as package manager / script runner
- Web Crypto API (`crypto.getRandomValues`); no runtime dependencies besides React

## Project structure

```
src/
├── main.tsx               # Entry point
├── index.css              # Tailwind + theme tokens (light/dark)
├── tool.config.ts         # Tool metadata: slug, name, description, category
├── shell/                 # Shared MMOALL tool shell (same across tool repos)
│   ├── AppShell.tsx       # Header/footer, theme handling, embed mode
│   ├── embed.ts           # iframe embed contract (postMessage)
│   └── ui.tsx             # UI primitives and icons
└── tool/                  # Password-generator–specific code
    ├── Tool.tsx           # Tab switcher
    ├── PasswordTab.tsx    # Password / token generator UI
    ├── PassphraseTab.tsx  # Passphrase generator UI
    ├── StrengthTab.tsx    # Strength analyser UI
    ├── GeneratedOutput.tsx # Shared result panel (value, entropy, bulk list)
    ├── local-ui.tsx       # Text field, range field, strength meter, stat tile
    ├── random.ts          # Unbiased secure randomInt / shuffle
    ├── password.ts        # Charset building and password generation
    ├── passphrase.ts      # Passphrase generation and entropy
    ├── strength.ts        # Entropy, warnings, crack-time estimation
    └── wordlists.ts       # EFF Diceware wordlists (CC BY 3.0 US)
```

The EFF wordlists are © Electronic Frontier Foundation, licensed under
[CC BY 3.0 US](https://creativecommons.org/licenses/by/3.0/us/).

## Running locally

Requirements: [Bun](https://bun.sh/) 1.x (Node.js 20+ with npm also works).

```bash
git clone https://github.com/techshield-tech/password-generator.git
cd password-generator
bun install
bun dev
```

Open the URL Vite prints — by default **http://localhost:5173/password-generator/**
(note the `/password-generator/` path, see [Base path](#base-path)).

To serve from the root instead:

```bash
BASE_PATH=/ bun dev        # http://localhost:5173/
```

### Scripts

| Command           | Description                                          |
| ----------------- | ---------------------------------------------------- |
| `bun dev`         | Start the dev server with hot reload                 |
| `bun run build`   | Type-check (`tsc -b`) and build to `dist/`           |
| `bun run preview` | Serve the production build from `dist/` locally      |

With npm: `npm install`, `npm run dev`, `npm run build`, `npm run preview`.

### Base path

The asset base URL is chosen at build time in `vite.config.ts`:

| Condition               | `base`             | Used for                    |
| ----------------------- | ------------------ | --------------------------- |
| `BASE_PATH` is set      | value of `BASE_PATH` | Any custom host / sub-path |
| `VERCEL` is set         | `/`                | Vercel (set automatically)  |
| otherwise (default)     | `/password-generator/` | GitHub Pages                |

`BASE_PATH` should start and end with `/`, e.g. `/` or `/tools/password/`.

## Deployment

The build output is a fully static site in `dist/` — no server or environment
secrets required.

### Vercel

#### Option 1: Import from GitHub (recommended)

1. Go to [vercel.com/new](https://vercel.com/new) and import the
   `techshield-tech/password-generator` repository.
2. Vercel auto-detects the **Vite** preset and Bun (from `bun.lock`). Defaults are fine:

   | Setting          | Value           |
   | ---------------- | --------------- |
   | Framework Preset | Vite            |
   | Install Command  | `bun install`   |
   | Build Command    | `bun run build` |
   | Output Directory | `dist`          |

3. Click **Deploy**.

No environment variables are needed: Vercel sets `VERCEL=1` during the build, so the
app is built with `base: '/'`. Afterwards, every push to `main` deploys to production
and every pull request gets a preview URL.

#### Option 2: Vercel CLI

```bash
bun add -g vercel     # or: npm i -g vercel
vercel login
vercel link           # link the folder to a (new) Vercel project
vercel                # preview deployment
vercel --prod         # production deployment
```

The CLI builds on Vercel's infrastructure, so `VERCEL=1` is set there as well.
To build locally and upload only the output:

```bash
vercel build --prod
vercel deploy --prebuilt --prod
```

#### Custom domain

In the Vercel dashboard, open **Project → Settings → Domains** and add your domain.
If you serve the tool under a sub-path of another site (e.g. via a rewrite from
`example.com/tools/password/`), set the `BASE_PATH` environment variable in
**Settings → Environment Variables** to that path (e.g. `/tools/password/`) and redeploy.

> The app has no client-side routing, so no SPA rewrite rules (`vercel.json`) are
> needed.

### GitHub Pages

Deployment to GitHub Pages runs automatically via
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) on every push to
`main` (or manually via *Run workflow*). It installs with Bun, runs
`bun run build` with the default `/password-generator/` base, and publishes `dist/`.

To enable it on a fork: **Settings → Pages → Source: GitHub Actions**.

## Embedding

The tool can be embedded in an iframe, e.g. on mmoall.com. In embed mode it renders
only the tool itself (no header/footer) on a transparent background.

```html
<iframe
  id="password-generator"
  src="https://techshield-tech.github.io/password-generator/?embed=1&theme=dark"
  style="width: 100%; border: 0;"
  title="Password & Token Generator"
></iframe>

<script>
  const iframe = document.getElementById('password-generator');

  window.addEventListener('message', (event) => {
    const data = event.data;
    if (data?.slug !== 'password-generator') return;

    // Resize the iframe to fit its content.
    if (data.type === 'mmoall-tool:height') {
      iframe.style.height = `${data.height}px`;
    }
    if (data.type === 'mmoall-tool:ready') {
      // The tool has mounted and is ready.
    }
  });

  // Change the theme at runtime (only accepted from an allowed origin).
  iframe.contentWindow.postMessage({ type: 'mmoall-tool:theme', theme: 'light' }, '*');
</script>
```

### Contract

| Direction       | Message / parameter                                              | Notes |
| --------------- | ---------------------------------------------------------------- | ----- |
| URL             | `?embed=1`                                                       | Render only the tool, transparent background |
| URL             | `?theme=light` \| `?theme=dark`                                  | Initial theme; otherwise follows `prefers-color-scheme` |
| parent → iframe | `{ type: 'mmoall-tool:theme', theme: 'light' \| 'dark' }`        | Accepted only from `https://mmoall.com`, `https://www.mmoall.com`, `http://localhost:3000` |
| iframe → parent | `{ type: 'mmoall-tool:ready', slug: 'password-generator' }`          | Posted once on mount (embed mode only) |
| iframe → parent | `{ type: 'mmoall-tool:height', slug: 'password-generator', height }` | Posted whenever the document height changes (embed mode only) |

## License

MIT — see [LICENSE](./LICENSE).
