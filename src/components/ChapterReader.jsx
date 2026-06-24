import { useEffect, useRef } from 'react'
import ChapterOpener from './ChapterOpener.jsx'
import BookProse from './BookProse.jsx'
import MarkdownContent from '../content/markdown.jsx'

// The leading `# Chapter NN — Title` is replaced by the styled opener (mirrors
// build.py, which dropped the first H1).
function stripLeadingH1(body) {
  return String(body).replace(/^\s*#\s+.*(?:\r?\n)+/, '')
}

export default function ChapterReader({ chapter, onHeadings }) {
  const ref = useRef(null)
  const body = stripLeadingH1(chapter.body)

  // After the Markdown renders, read the real heading ids (assigned by
  // rehype-slug) so the on-this-page nav anchors always match.
  useEffect(() => {
    if (!onHeadings || !ref.current) return
    const nodes = ref.current.querySelectorAll('h2, h3')
    const list = Array.from(nodes)
      .filter((el) => el.id)
      .map((el) => ({
        id: el.id,
        text: el.textContent || '',
        level: el.tagName === 'H2' ? 2 : 3,
      }))
    onHeadings(list)
  }, [chapter.number, onHeadings])

  return (
    <article>
      <ChapterOpener
        book={chapter.book}
        number={chapter.number}
        title={chapter.title}
        subtitle={chapter.subtitle}
      />
      <BookProse ref={ref} className="book-prose">
        <MarkdownContent body={body} />
      </BookProse>
    </article>
  )
}
