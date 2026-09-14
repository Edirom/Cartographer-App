import { defineUserConfig } from "vuepress";
import { viteBundler } from "@vuepress/bundler-vite";
import { defaultTheme } from "@vuepress/theme-default";

// Sidebar configuration
const EN_SIDEBAR = [
  {
    text: "User Documentation",
    collapsible: true,
    link: "/user/",
    children: [
      "/user/introduction.md",
      "/user/installation.md",
      "/user/UserInterface.md",
      "/user/actions.md",
    ]
  },
  {
    text: "Technical Documentation",
    collapsible: true,
    link: "/technical/README.md",
    children: [
      "/technical/Auth.md",
      {
        text: "Components",
        collapsible: true,
        children: [
          "/technical/AppFooterComponent.md",
          "/technical/AppHeaderComponent.md",
          "/technical/AppSidebarComponent.md",
          "/technical/ContentPreviewMdiv.md",
          "/technical/ContentPreviewMeasure.md",
          "/technical/ContentPreviewPane.md",
          "/technical/ImageMismatchModal.md",
          "/technical/ImageSelectionModal.md",
          "/technical/LoadGitModal.md",
          "/technical/LoadIIIFModal.md",
          "/technical/LoadLocalImage.md",
          "/technical/LoadXMLModal.md",
          "/technical/MainMenu.md",
          "/technical/MeasureModal.md",
          "/technical/MdivModal.md",
          "/technical/OsdComponent.md",
          "/technical/PageImportModal.md",
          "/technical/PagesListEntry.md",
          "/technical/PagesModal.md",
         "/technical/storeIndex.md" 
        ]
      },
      {
        text: "Store",
        collapsible: true,
        link: "/technical/store.md",
        children: ["/technical/storeIndex.md"]
      },
      {
        text: "Tools",
        collapsible: true,
        link: "/technical/tools.md",
        children: [
          "/technical/iiif.md",
          "/technical/meimapping.md"
        ]
      }
    ]
  }
];

export default defineUserConfig({
  base: '/myAppPlaceholder/docs/',

  head: [
    ['link', { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css' }]
  ],
  bundler: viteBundler(),

  locales: {
    '/': {
      lang: 'en-US',
      title: 'Cartographer App User and Technical Documentation',
      description: 'User and Technical Documentation',
    },
  },

  theme: defaultTheme({
    locales: {
      '/': {
        navbar: [
          { text: 'Home', link: '/' },                 // becomes /docs/ at build time, then replaced dynamically
          { text: 'User Docs', link: '/user/' },       // becomes /docs/user/
          { text: 'Technical Docs', link: '/technical/README.md' },
        ],
        sidebar: EN_SIDEBAR,
      },
    },
  }),
});

