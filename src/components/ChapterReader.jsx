import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom'
import { Skeleton, Snackbar, Button } from '@mui/material'
import ChapterOpener from './ChapterOpener.jsx'
import BookProse from './BookProse.jsx'
import MarkdownContent from '../content/markdown.jsx'
import ChapterHighlightLayer from './ChapterHighlightLayer.jsx'
import { stripLeadingH1 } from '../content/markdownPipeline.js'
import { loadChapterBody } from '../content/chapters.js'
import { highlightOccurrence } from './highlightBlock.js'
import { useReadingTracker } from '../reading/useReadingTracker.js'
import { useReadingTrackerContext } from '../reading/ReadingTrackerContext.jsx'
import { useReadingSpeed } from '../reading/readingSpeed.jsx'
import { useAutoScroll } from '../reading/useAutoScroll.js'

// Set once per page-load. A mobile OS reviving a discarded/idle tab
// re-evaluates this module from scratch, so the flag naturally distinguishes
// "we just booted on this exact chapter" (resume last position) from
// ordinary in-session navigation between chapters (start at top, as before).
let coldBootPending = true

export default function ChapterReader({ chapter, next, onHeadings }) {
  const ref = useRef(null)
  const [rawBody, setRawBody] = useState(null)
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { snapshot } = useReadingTrackerContext()
  const { active, wpm, setPlaying, setEtaSec } = useReadingSpeed()
  const [atEnd, setAtEnd] = useState(false)

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

  // Memoize the rendered Markdown so it only re-renders when the chapter body
  // changes — not on every parent re-render (reading-tracker snapshots, theme,
  // etc.). This keeps the DOM stable so the persistent highlight <mark>s that
  // ChapterHighlightLayer injects into it aren't reconciled away by React.
  const renderedBody = useMemo(() => (body == null ? null : <MarkdownContent body={body} />), [body])

  // A Highlights-page deep link asks a specific highlight to flash on arrival.
  const flashId = location.state?.flashId || searchParams.get('hl') || null

  // Track genuine reading of this chapter once its prose is in the DOM.
  useReadingTracker(chapter.number, ref, body != null)

  // Auto Read: drive the scroll from the reader's chosen speed (focus mode only).
  useAutoScroll(chapter.number, ref, body != null, {
    active,
    wpm,
    onManualPause: () => setPlaying(false), // reader took over — pause, stay armed
    onReachedEnd: () => {
      setPlaying(false)
      setAtEnd(true)
    },
    onProgress: ({ etaSec }) => setEtaSec(etaSec),
  })

  const continueToNext = () => {
    setAtEnd(false)
    if (next) {
      setPlaying(true) // resume auto-scroll in the next chapter
      navigate(`/chapter/${next.number}`)
    }
  }

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

  // Resume the reader's last known position on a cold boot of this chapter
  // (a fresh page load, or a mobile browser reviving a discarded idle tab on
  // the same URL) — but only then, so ordinary chapter-to-chapter navigation
  // keeps starting at the top via ScrollToTop.
  useEffect(() => {
    if (body == null) return
    if (!coldBootPending) return
    coldBootPending = false
    if (pending) return // the search deep-link effect above owns this case
    const chapterState = snapshot.chapters[String(chapter.number)]
    if (!chapterState) return
    const el = chapterState.lastBlockId
      ? ref.current?.querySelector(`[data-block-id="${CSS.escape(chapterState.lastBlockId)}"]`)
      : null
    if (el) {
      el.scrollIntoView({ block: 'start' })
      return
    }
    if (chapterState.lastScrollRatio > 0) {
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (max > 0) window.scrollTo({ top: chapterState.lastScrollRatio * max })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter.number, body])

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
          renderedBody
        )}
      </BookProse>

      <ChapterHighlightLayer
        containerRef={ref}
        chapterNumber={chapter.number}
        bodyReady={body != null}
        flashId={flashId}
      />

      <Snackbar
        open={atEnd}
        onClose={() => setAtEnd(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 96, sm: 96 } }}
        message={next ? `Finished “${chapter.title}”.` : 'You’ve reached the end.'}
        action={
          next ? (
            <Button color="secondary" size="small" onClick={continueToNext} sx={{ textTransform: 'none' }}>
              Continue to next chapter
            </Button>
          ) : (
            <Button color="secondary" size="small" onClick={() => setAtEnd(false)} sx={{ textTransform: 'none' }}>
              Done
            </Button>
          )
        }
      />
    </article>
  )
}
