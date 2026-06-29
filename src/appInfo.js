// ─────────────────────────────────────────────────
//  ManSula BOS — App Version & Release Info
//  Edit ONLY this file when shipping a new update.
//  Everything in the UI reads from here automatically.
// ─────────────────────────────────────────────────

export const APP_NAME = 'ManSula BOS'
export const APP_VERSION = 'v1.7.5'

export const APP_BUILD_DATE = 'June 29, 2026'
export const LEGAL_LAST_UPDATED = 'June 2026'
/** What's New items for the current release.
 *  Each entry has:
 *    icon:   'analytics' | 'lightning' | 'check' | 'star' | 'wrench'
 *    label:  Short headline shown in the list
 *    detail: Full description shown when the user expands the item
 */
export const WHATS_NEW = [
  {
    icon: 'star',
    label: 'Professional Bill & Receipt Generator',
    detail:
      'Generate, preview, and download polished bills and receipts natively right from the POS or Order Records. Hand your customers a premium digital bill with your business branding intact.',
  },
  {
    icon: 'lightning',
    label: 'WhatsApp Invoice & Receipt Sharing',
    detail:
      'Instantly send professional transaction summaries or UPI payment requests directly to WhatsApp. Messages are auto-filled with order details and formatted beautifully for your customers.',
  },
  {
    icon: 'wrench',
    label: 'Premium Startup Experience',
    detail:
      'We\'ve revamped the Welcome screen with a sleek new aesthetic. Enjoy elevated audio chimes, a dynamic logo zoom-in animation, and your organization\'s branding proudly displayed on launch.',
  },
  {
    icon: 'check',
    label: 'Smart Customer Search & Fixes',
    detail:
      'Customer search by phone number is now much smarter, effortlessly handling varying formats and country codes. We also fixed a silent bug that prevented the customer list from loading properly on the Order Records screen.',
  },
]

/** Organization / Company Info */
export const ORG = {
  name: 'ManSula DivLabs & ManSula',
  tagline: 'Empowering Commerce with Smart Technology',
  website: 'https://mansulatech.netlify.app',
  support: 'mansula.rwt@gmail.com',
  phone1: '+919818013446',
  phone2: '+918851947954',
  copyright: `© 2024 - ${new Date().getFullYear()} ManSula DivLabs & ManSula. All rights reserved.`,
}
