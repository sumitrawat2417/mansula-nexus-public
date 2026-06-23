// ─────────────────────────────────────────────────
//  ManSula Nexus — App Version & Release Info
//  Edit ONLY this file when shipping a new update.
//  Everything in the UI reads from here automatically.
// ─────────────────────────────────────────────────

export const APP_NAME = 'ManSula Nexus'
export const APP_VERSION = 'v1.6.0-alpha'

export const APP_BUILD_DATE = 'June 24, 2025'

/** What's New items for the current release.
 *  Each entry has:
 *    icon:   'analytics' | 'lightning' | 'check' | 'star' | 'wrench'
 *    label:  Short headline shown in the list
 *    detail: Full description shown when the user expands the item
 */
export const WHATS_NEW = [
  {
    icon: 'analytics',
    label: 'Analytics Module',
    detail:
      'A full-featured Analytics dashboard has been added to ManSula Nexus. Track revenue trends, top-selling products, peak hours, and customer insights — all powered by your local data. The dashboard includes a Revenue Overview chart, a product performance Podium, and a Customer Leaderboard. AI-powered insights are coming in a future update.',
  },
  {
    icon: 'lightning',
    label: 'Faster POS',
    detail:
      'The Point of Sale screen has been significantly optimized. Product search is now instant, the cart renders faster, and the checkout flow has fewer taps. Barcode scanning is more reliable across devices. Order confirmation animations are smoother and the receipt preview loads in under 100ms.',
  },
  {
    icon: 'check',
    label: 'Bug Fixes',
    detail:
      'This release fixes several reported issues: offline sync edge cases, incorrect order totals when applying discounts on fractional quantities, a rare crash when switching themes mid-session, and a layout overflow bug on small screens. We also resolved an issue where the PWA update prompt sometimes did not appear after a new deployment.',
  },
]

/** Organization / Company Info */
export const ORG = {
  name: 'ManSula Technologies & ManSula DivLabs',
  tagline: 'Powering the next generation of offline-first business tools.',
  website: 'https://mansulatech.netlify.app',
  support: 'mansula.rwt@gmail.com',
  phone1: '+919818013446',
  phone2: '+918851947954',
  copyright: `© ${new Date().getFullYear()} ManSula Technologies & ManSula DivLabs. All rights reserved.`,
}
