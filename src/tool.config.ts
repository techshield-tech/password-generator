// Per-tool metadata. This is the ONE file (together with `src/tool/`,
// `index.html`'s fallback <title>, and this repo's README) that changes
// when this template is copied to a new tool repo.

// Imports from '@mmoall/tool-kit/config' (a plain-JS-backed subpath), not
// the main '@mmoall/tool-kit' barrel — this file is also reachable from
// vite.config.ts's config-load chain, which cannot load the main barrel's
// .ts source from inside node_modules. See '@mmoall/tool-kit/config's
// source comment for why.
import { defineToolConfig } from '@mmoall/tool-kit/config';

export const toolConfig = defineToolConfig({
  slug: 'password-generator',
  name: 'Password & Token Generator',
  description:
    'Generate strong random passwords, tokens, and passphrases, and analyse password strength — fast, free, and 100% client-side.',
  category: 'Crypto',
  keywords: [
    'password generator',
    'random password',
    'token generator',
    'api key generator',
    'passphrase generator',
    'diceware',
    'password strength checker',
    'password entropy',
    'crack time estimator',
  ],
});
