import fs from 'node:fs'
import assert from 'node:assert'

// 1. config.mjs
const cfg = fs.readFileSync('C:/dsh-ecosystem/plugins/kanye-pet/lib/src/config.mjs', 'utf8')
assert(cfg.includes('desktopNotificationEnabled: true'), 'DEFAULTS must have desktopNotificationEnabled')
assert(cfg.includes('desktopNotificationEnabled: z.boolean()'), 'buildSchema must have desktopNotificationEnabled')

// 2. ui-kanye-pet bundle
const kanyeClient = fs.readFileSync('C:/dsh-ecosystem/plugins/ui-kanye-pet/lib/client.js', 'utf8')
assert(kanyeClient.includes('desktopNotificationEnabled'), 'kanye client bundle must include desktopNotificationEnabled')
assert(kanyeClient.includes('桌面端通知'), 'kanye client bundle must include 桌面端通知')

// 3. session-title bundle
const stcClient = fs.readFileSync('C:/dsh-ecosystem/plugins/dsh-session-title-custom/lib/client.js', 'utf8')
assert(stcClient.includes('stc-button[data-tone="primary"]:disabled'), 'stc client must include primary disabled style')

// 4. ui-theme-custom bundle
const themeClient = fs.readFileSync('C:/dsh-ecosystem/plugins/ui-theme-custom/lib/client.js', 'utf8')
assert(themeClient.includes('button[data-tone="primary"]'), 'theme client bundle must separate primary button')
assert(themeClient.includes('button:not([data-tone="primary"])'), 'theme client bundle must separate secondary button')

console.log('All verification assertions passed!')
