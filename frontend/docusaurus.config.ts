import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Physical AI & Humanoid Robotics Lab',
  tagline: 'A Complete Guide to Building Academic Robotics Infrastructure',
  favicon: 'img/favicon.ico',

  url: 'https://humanoid-robotics-textbook.netlify.app',
  baseUrl: '/',

  organizationName: 'hasanrafay',
  projectName: 'humanoid-robotics-textbook',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        // Yahan docs ko false hi rehne dein kyunke aap niche plugin use kar rahe hain
        docs: false, 
        blog: {
          showReadingTime: true,
        },
        theme: {
          customCss: ['./src/css/custom.css'],
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'Physical AI & Humanoid Robotics Lab',
      logo: {
        alt: 'Robotics Lab Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Curriculum',
          // Docs plugin ki ID match honi chahiye
          docsPluginId: 'tutorial',
        },
        {
          href: 'https://github.com/hasanrafay/humanoid-robotics-textbook',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Resources',
          items: [
            { label: 'ROS 2 Documentation', href: 'https://docs.ros.org/en/rolling/' },
            { label: 'NVIDIA Isaac Sim', href: 'https://developer.nvidia.com/isaac-sim' },
          ],
        },
        {
          title: 'Community',
          items: [
            { label: 'Stack Overflow', href: 'https://stackoverflow.com/questions/tagged/docusaurus' },
            { label: 'Discord', href: 'https://discordapp.com/invite/docusaurus' },
            { label: 'Twitter', href: 'https://twitter.com/docusaurus' },
          ],
        },
        {
          title: 'More',
          items: [
            { label: 'GitHub', href: 'https://github.com/hasanrafay/humanoid-robotics-textbook' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Hasan Rafay. Built with Docusaurus.`,
    },
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,

  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'tutorial', // Yeh ID navbar items mein use ho rahi hai
        path: 'docs',
        routeBasePath: '/', // Yeh docs ko home page bana dega
        sidebarPath: './sidebars.ts',
      },
    ],
  ],
};

export default config;