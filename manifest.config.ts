import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  icons: {
    128: 'public/chubby-spartan-acm-cropped.png',
  },
  background: {
    service_worker: "background.ts"
  },
  action: {
    default_icon: {
      128: 'public/chubby-spartan-acm-cropped.png',
    },
    default_popup: 'src/popup/index.html',
  },
  permissions: [
    'sidePanel',
    'contentSettings',
    'identity',
    'storage',
  ],
  host_permissions: [
    "https://sheets.googleapis.com/*",
    "https://www.googleapis.com/*"
  ],
  oauth2: {
    client_id: '260025793068-lpb1c6ho8islv3786sjfp4ga4re6fga3.apps.googleusercontent.com',    //prob need to change this for production
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.file",
    ]

  },
  content_scripts: [{
    js: ['src/content/main.tsx'],
    matches: ['https://*/*'],
  }],
  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },
})
