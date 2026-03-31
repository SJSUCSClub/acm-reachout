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
    service_worker: "src/background.ts",
    type: "module"
  },
  action: {
    default_icon: {
      128: 'public/chubby-spartan-acm-cropped.png',
    },
    default_popup: 'src/popup/index.html',
  },
  key: 'MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCwhLLT+mz6mJ/0pLWTqg6m21YsXzCwx0wUWD0h7AHleH30nzzPCv7mhfkiaqK4pmUSR90dgD7Ni32RMl9U5kn6KN6dkpEIExeRPWL/QuJ6O2LUIyOh1eWUKOiOWcEUeFjIPAPYZp5ukTh4qcxvYbYzAYMg3MZAcypcp7+Y+cOO9PknJGLNuEiQc4YmkJldBT5NLeCAv31fpJU2yNmIQTI7z+TBuKj5N14mYBRukjjlfUuMBwjXNAgmrrRYlakMSfZ5QuUPv1EMWJhlONL1h86Q6V6vFV+C4nlQYx8sEj/mGrCRD9fcyqJ5gnfXs8yxXdVXuUa12VqtB6jJ8Q5uZZkPAgMBAAECggEAFIPM8iH1WcffNI7n+M9s1dZBVPWDMn3BySOFh1RnLATYQ/6LEgJUeZ+HGDQ4e9QALyMMVF9ml9DnDmGXqXBSQgaknhTop32V4Zq2z1/gnmrEePnUgacwVWB5FqzhFGtK4N/zZR/CuKrxWzoGDnPWubrVQz56tAbZHNz0wZIAOQmXa6RXLOpRfNcoPBu6vobK9ePMT0os6v+WWpPl1zdMlE+UkgYct1SulZcLRxTDb3zwjBX1e7gLxZ+Z6MVdaP/bamb3wAs626zkywNjl+1x0FD3nv5XtV4R3tjzXcnM67j/uVKGV/samnxQUBSQRbv/fWLgMbp2VMS5DegkrOpLsQKBgQDe7tmSXL1hm+ESJzByX1/VPcqRcnmaKVkox8xgCV5cw6CJXUnP3kp9pwYaNb3vX+l3JqFh78DUEDeNKKAHvfqhHXVp3KXTomQAy9ekW2fvqaQRlW9ecKnzKpmz9s3NrVQhDfnehHUIka5DMjywk5p8bvHJlYj/btrQCLuEIclCxQKBgQDKs2eDNP27/A6HhC7fgP034E7G/Hzpg4l3ydDVh1FOqN66uZn6pQ/yXn4uLfud1LTVgR60FxpmM2+1DlQdRYdQiEpCvqmJXwd3LejWBxmEDRFGMz0McPcN0EbHXZsGgUPVlyG5+8RoFhGNNT5z/Iv7t4QxNqGxHCX5RL4ol3CZwwKBgEx6nlNy01lwE4eZwCoMhCDwoNTC8+qqMrcly/xKWn/ycNmPEmpodR+kNBi7xRwgyEQjEYw6pulZYuVfQX9GcnvhUk1t78mp1Srcw27UGNUEWo/Ztyor9nHAdJhjm/jqdIkedVEcGdZFvAW7b0yYZpA3s2UXkrcmfZSO2l2bBaONAoGBAKS135koiD4m9Y99A7GuWRT8ekcLiF0f+6aRIddBG/q1Ejfc9ZhMZIbn7dSMnPeFjmQnhdGFLHh7t3wCZqtagjgYZ2+RCqaLx786WQcBweQh0jWfES545OgepEUAdSZ2B68aHdfJE7IYrK5344XQY9dpKkvrPrxySREioPrPBDqNAoGAAk7rcPbo7taphxGe/ZVvtyJw8QKaent8lq0kFo9X+ANNxzYpeM+mV6AflFIUgyDgMFq1l6OY/bsYJzbJZCqGyviQFmzUuvhq3DDY/PKrB3vw3UkULn0D4cNaMIRX3U05Uwzwlq6ybhusXpjVZBimnB78WPIAGbnOn+LPY3wBfVc=',
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
    client_id: '444274203752-bdfba1da41ll96mbrhqob366l85io6k5.apps.googleusercontent.com',    //prob need to change this for production
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
