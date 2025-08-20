import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { serialize } from 'next-mdx-remote/serialize'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypePrettyCode from 'rehype-pretty-code'
import remarkGfm from 'remark-gfm'

const contentDirectory = path.join(process.cwd(), 'content')

export async function getDocBySlug(slug: string[]) {
  const realSlug = slug.join('/')
  const fullPath = path.join(contentDirectory, `${realSlug}.mdx`)
  
  if (!fs.existsSync(fullPath)) {
    return null
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents)
  
  const mdxSource = await serialize(content, {
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [
        rehypeSlug,
        [
          rehypePrettyCode,
          {
            theme: 'github-dark',
            onVisitLine(node: any) {
              if (node.children.length === 0) {
                node.children = [{ type: 'text', value: ' ' }]
              }
            },
            onVisitHighlightedLine(node: any) {
              node.properties.className.push('line--highlighted')
            },
            onVisitHighlightedWord(node: any) {
              node.properties.className = ['word--highlighted']
            },
          },
        ],
        [
          rehypeAutolinkHeadings,
          {
            properties: {
              className: ['subheading-anchor'],
              ariaLabel: 'Link to section',
            },
          },
        ],
      ],
    },
  })

  return {
    slug: realSlug,
    frontMatter: data,
    mdxSource,
  }
}

export async function getAllDocs() {
  const docs: any[] = []

  // 递归获取所有文档
  const getDocsRecursively = (dir: string, basePath: string = '') => {
    const files = fs.readdirSync(dir)

    files.forEach(file => {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)

      if (stat.isDirectory()) {
        getDocsRecursively(filePath, path.join(basePath, file))
      } else if (file.endsWith('.mdx')) {
        const fileContents = fs.readFileSync(filePath, 'utf8')
        const { data } = matter(fileContents)
        const slug = path.join(basePath, file.replace(/\.mdx$/, ''))

        if (data.published !== false) {
          docs.push({
            ...data,
            slug: `/${slug}`,
            category: data.category || 'Uncategorized',
          })
        }
      }
    })
  }

  getDocsRecursively(contentDirectory)

  // 按类别和顺序排序
  return docs.sort((a, b) => {
    if (a.category === b.category) {
      return (a.order || 0) - (b.order || 0)
    }
    return a.category.localeCompare(b.category)
  })
}

export async function getDocsByCategory() {
  const allDocs = await getAllDocs()
  
  // 按类别分组
  const categories: Record<string, any[]> = {}
  
  allDocs.forEach(doc => {
    const category = doc.category
    if (!categories[category]) {
      categories[category] = []
    }
    categories[category].push(doc)
  })
  
  return categories
}