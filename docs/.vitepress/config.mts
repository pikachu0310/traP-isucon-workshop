import { defineConfig } from 'vitepress'
import mathjax3 from 'markdown-it-mathjax3'

const customElements = ['mjx-container']
import markdownItContainer from 'markdown-it-container'

const containerMdExtend = require('./plugins/md/index.js')
import fs from 'fs'
import path from 'path'

const ogDescription = 'ISUCON workshop for beginners in traP'
const ogImage = '/assets/image/logo.png'
const ogTitle = 'ISUCON初心者向け講習会'
const ogUrl = 'https://vitepress-lecture-template.trap.show/'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'jp',
  title: ogTitle,
  description: ogDescription,
  head: [
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: ogTitle }],
    ['meta', { property: 'og:image', content: ogImage }],
    ['meta', { property: 'og:url', content: ogUrl }],
    ['meta', { property: 'og:description', content: ogDescription }],
  ],
  markdown: {
    lineNumbers: true,
    config: (md) => {
      md.use(markdownItContainer, 'spoiler', containerMdExtend(md))
      md.use(mathjax3)
    },
  },
  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => customElements.includes(tag),
      },
    },
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/text/Examples/01-image' },
    ], //画面右上の案内表示
    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }, //githubへのリンク表示ができます
    ],
    sidebar: generateSidebar('text', 'docs', 'chapter'),
    search: {
      provider: 'local',
    },
  },
})

interface SidebarItem {
  text: string;
  link?: string;
  items?: SidebarItem[];
}

function generateSidebar(
  dir: string,
  baseDir: string,
  priorityFolder: string,
): SidebarItem[] {
  const absoluteDir = path.resolve(baseDir, dir)
  const relativeDir = path.relative(baseDir, absoluteDir)

  const sidebar: SidebarItem[] = []

  // 優先フォルダのアイテムを格納する配列
  const priorityItems: SidebarItem[] = []

  // 通常のアイテムを格納する配列
  const normalItems: SidebarItem[] = []

  fs.readdirSync(absoluteDir).forEach((file: string) => {
    const filePath = path.join(absoluteDir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      const subDirItems = generateSidebar(
        filePath,
        baseDir,
        priorityFolder,
      )
      if (subDirItems.length > 0) {
        // 優先フォルダかどうかを判定し、対応する配列にアイテムを追加
        if (file.indexOf(priorityFolder) > -1) {
          if (file == 'chapter-0') {
            priorityItems.push({
              text: 'はじめに',
              items: subDirItems,
            })
          } else if (file == 'chapter-1') {
            priorityItems.push({
              text: '座学編-ISUCONの基礎知識',
              items: subDirItems,
            })
          } else if (file == 'chapter-2') {
            priorityItems.push({
              text: '実習編-PISCONで実践してみる',
              items: subDirItems,
            })
          } else if (file == 'chapter-3') {
            priorityItems.push({
              text: '実習編-本格的に計測,改善する',
              items: subDirItems,
            })
          } else {
            priorityItems.push({
              text: file,
              items: subDirItems,
            })
          }
        } else {
          normalItems.push({
            text: file,
            items: subDirItems,
          })
        }
      }
    } else if (stat.isFile() && file.endsWith('.md')) {
      const content = fs.readFileSync(filePath, 'utf-8')
      const titleMatch = content.match(/^#\s+(.*)/m)

      if (titleMatch) {
        const relativePath = path.join(
          relativeDir,
          file.replace(/\.md$/, '.html'),
        )
        const link = `/${relativePath}`

        // 優先フォルダのアイテムかどうかを判定し、対応する配列にアイテムを追加
        if (dir === priorityFolder) {
          priorityItems.push({
            text: titleMatch[1],
            link,
          })
        } else {
          normalItems.push({
            text: titleMatch[1],
            link,
          })
        }
      }
    }
  })

  // 優先フォルダのアイテムを優先して追加し、通常のアイテムを後に追加
  sidebar.push(...priorityItems, ...normalItems)

  return sidebar
}
