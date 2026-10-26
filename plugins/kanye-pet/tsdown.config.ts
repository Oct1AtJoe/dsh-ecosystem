import { clientBundle } from '../tsdown.client.ts'

// Two halves, one package. The Node host half ships by hand as `lib/index.mjs`
// (see package.json `exports["."]`) and is never emitted by tsdown; `src/index.ts`
// is a placeholder library face so the shared preset has something to build, and
// its artifacts stay out of `files`. The browser settings card is the real output.
export default clientBundle('dsh-kanye-pet', ['src/index.ts'])
