import { useEffect, useRef, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { Skeleton } from '@mui/material'
import ChapterOpener from './ChapterOpener.jsx'
import BookProse from './BookProse.jsx'
import MarkdownContent from '../content/markdown.jsx'
import { stripLeadingH1 } from '../content/markdownPipeline.js'
import { loadChapterBody } from '../content/chapters.js'
import { highlightOccurrence } from './highlightBlock.js'
import { useReadingTracker } from '../reading/useReadingTracker.js'

export default function ChapterReader({ chapter, onHeadings }) {
  const ref = useRef(null)
  const [rawBody, setRawBody] = useState(null)
  const location = useLocation()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    let alive = true
    setRawBody(null)
    loadChapterBody(chapter.number).then((text) => {
      if (alive) setRawBody(text)
    })
    return () => {
      alive = false
    }
  }, [chapter.number])

  const body = rawBody == null ? null : stripLeadingH1(rawBody)

  // Track genuine reading of this chapter once its prose is in the DOM.
  useReadingTracker(chapter.number, ref, body != null)

  // After the Markdown renders, read the real heading ids (assigned by
  // rehype-slug) so the on-this-page nav anchors always match. `body` is a
  // dependency too — the body arrives asynchronously, and this effect must
  // rerun once it's actually in the DOM, not just on chapter switch.
  useEffect(() => {
    if (!onHeadings || !ref.current || body == null) return
    const nodes = ref.current.querySelectorAll('h2, h3')
    const list = Array.from(nodes)
      .filter((el) => el.id)
      .map((el) => ({
        id: el.id,
        text: el.textContent || '',
        level: el.tagName === 'H2' ? 2 : 3,
      }))
    onHeadings(list)
  }, [chapter.number, onHeadings, body])

  // A search result may have handed off a specific block + term to land on —
  // via router state (same-session click-through) or the URL's query string
  // (survives a hard refresh, since HashRouter's in-memory state doesn't).
  const pending = location.state?.blockId
    ? location.state
    : searchParams.get('block')
      ? {
          blockId: searchParams.get('block'),
          matchedTerm: searchParams.get('term'),
          occurrenceInBlock: Number(searchParams.get('occ') || 1),
        }
      : null

  useEffect(() => {
    if (!pending || !ref.current || body == null) return
    const el = ref.current.querySelector(`[data-block-id="${CSS.escape(pending.blockId)}"]`)
    if (!el) return // content changed since this link was generated
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    highlightOccurrence(el, pending.matchedTerm, pending.occurrenceInBlock)
    const timer = setTimeout(() => highlightOccurrence(el, null, null), 2500)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter.number, body, pending?.blockId, pending?.matchedTerm, pending?.occurrenceInBlock])

  return (
    <article>
      <ChapterOpener
        book={chapter.book}
        number={chapter.number}
        title={chapter.title}
        subtitle={chapter.subtitle}
      />
      <BookProse ref={ref} className="book-prose">
        {body == null ? (
          <>
            <Skeleton variant="text" height={28} sx={{ mb: 1.5 }} />
            <Skeleton variant="text" height={20} width="94%" />
            <Skeleton variant="text" height={20} width="88%" />
            <Skeleton variant="text" height={20} width="91%" sx={{ mb: 2 }} />
            <Skeleton variant="text" height={20} width="80%" />
          </>
        ) : (
          <MarkdownContent body={body} />
        )}
      </BookProse>
    </article>
  )
}
