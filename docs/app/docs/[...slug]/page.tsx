import { notFound } from "next/navigation"
import { MDXRemote } from "next-mdx-remote"
import { getDocBySlug } from "../../../lib/mdx"
import { Mdx } from "../../../components/mdx-components"

interface DocPageProps {
  params: {
    slug: string[]
  }
}

export async function generateMetadata({ params }: DocPageProps) {
  const doc = await getDocBySlug(params.slug)

  if (!doc) {
    return {}
  }

  return {
    title: doc.frontMatter.title,
    description: doc.frontMatter.description,
  }
}

export default async function DocPage({ params }: DocPageProps) {
  const doc = await getDocBySlug(params.slug)

  if (!doc) {
    notFound()
  }

  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">{doc.frontMatter.title}</h1>
        {doc.frontMatter.description && (
          <p className="text-xl text-muted-foreground">{doc.frontMatter.description}</p>
        )}
      </div>
      <hr className="my-6" />
      <Mdx code={doc.mdxSource} />
    </article>
  )
}