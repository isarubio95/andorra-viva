import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const vercelUrl = process.env.VERCEL_URL;
const siteUrl =
  vercelUrl != null && vercelUrl.length > 0
    ? `https://${vercelUrl}`
    : 'https://example.com';

const config: Config = {
  title: 'Andorra Viva',
  tagline: 'Documentación técnica del proyecto',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  /** En producción junto a Vite: documentación en /docs/ (ver scripts/merge-docusaurus-into-dist.mjs). */
  url: siteUrl,
  baseUrl: '/docs/',

  organizationName: 'andorra-viva',
  projectName: 'andorra-viva',

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'es',
    locales: ['es'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          /** Evita URLs /docs/docs/... cuando baseUrl ya es /docs/ */
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Andorra Viva',
      logo: {
        alt: 'Andorra Viva',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentación',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentación',
          items: [
            {
              label: 'Introducción',
              to: '/intro',
            },
            {
              label: 'Visitas y métricas',
              to: '/visitas-y-metricas',
            },
            {
              label: 'Reseñas',
              to: '/resenas-y-comentarios',
            },
          ],
        },
      ],
      copyright: `Andorra Viva · ${new Date().getFullYear()}`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
