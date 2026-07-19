import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Popper, Fade, IconButton, Tooltip } from '@mui/material'
import BorderColorIcon from '@mui/icons-material/BorderColor'
import { useHighlights } from '../reading/HighlightsContext.jsx'
import { highlightsForChapter } from '../reading/highlightsStore.js'
import {
  applyPersistentHighlight,
  removeAllReaderHighlights,
  selectionOffsets,
} from './highlightBlock.js'
import HighlightToolbar from './HighlightToolbar.jsx'
import HighlightPopover from './HighlightPopover.jsx'

// Non-text blocks that can be highlighted as a whole unit.
const ELEMENT_BLOCK_SELECTOR = 'figure.figure-diagram[data-block-id], table[data-block-id]'

function closestBlockEl(node, root) {
  let el = node && node.nodeType === 3 ? node.parentElement : node
  while (el && el !== root) {
    if (el.dataset && el.dataset.blockId) return el
    el = el.parentElement
  }
  return null
}

function rectToVirtual(rect) {
  return { getBoundingClientRect: () => rect }
}

// Owns all in-chapter highlight behaviour: painting stored highlights onto the
// rendered prose, the selection toolbar, the element (diagram/table) affordance,
// and the note popover. Kept out of ChapterReader so that file stays focused on
// loading + reading-tracking. `containerRef` is the BookProse element; it must
// hold a memoized MarkdownContent so React doesn't clobber the injected <mark>s.
export default function ChapterHighlightLayer({ containerRef, chapterNumber, bodyReady, flashId }) {
  const { snapshot, addHighlight, updateNote, removeHighlight } = useHighlights()

  const [selection, setSelection] = useState(null) // { anchorEl(virtual), blockId, start, end, quotedText, blockText }
  const [affordance, setAffordance] = useState(null) // { anchorEl(DOM), blockId }
  const [popover, setPopover] = useState(null) // { anchorEl(DOM), id, startInEdit }
  const pendingNoteId = useRef(null)

  const chapterHighlights = useMemo(
    () => highlightsForChapter(snapshot, chapterNumber),
    [snapshot, chapterNumber],
  )

  // --- Paint stored highlights onto the rendered prose -----------------------
  useEffect(() => {
    const root = containerRef.current
    if (!root || !bodyReady) return

    // Clear previous paint (text marks + element classes/ids) before re-applying.
    removeAllReaderHighlights(root)
    root.querySelectorAll('.reader-highlight-element').forEach((el) => {
      el.classList.remove('reader-highlight-element')
      delete el.dataset.highlightId
    })

    for (const h of chapterHighlights) {
      const el = root.querySelector(`[data-block-id="${CSS.escape(h.blockId)}"]`)
      if (!el) continue // block no longer in the chapter — orphaned (shown on Highlights page)

      if (h.kind === 'element') {
        el.classList.add('reader-highlight-element')
        el.dataset.highlightId = h.id
        continue
      }

      // Text highlight: trust stored offsets while the block text is unchanged;
      // otherwise re-locate the quoted text; give up (orphan) if it's gone.
      const current = el.textContent || ''
      let { startOffset, endOffset } = h
      if (h.blockTextSnapshot && current !== h.blockTextSnapshot && h.quotedText) {
        const idx = current.indexOf(h.quotedText)
        if (idx < 0) continue // orphaned
        startOffset = idx
        endOffset = idx + h.quotedText.length
      }
      applyPersistentHighlight(el, { id: h.id, startOffset, endOffset, noted: !!h.note })
    }
  }, [containerRef, bodyReady, chapterHighlights])

  // --- Flash a highlight arrived at via a Highlights-page deep link ----------
  useEffect(() => {
    if (!flashId || !bodyReady) return
    const root = containerRef.current
    if (!root) return
    const nodes = root.querySelectorAll(
      `mark.reader-highlight[data-highlight-id="${CSS.escape(flashId)}"], [data-highlight-id="${CSS.escape(flashId)}"]`,
    )
    if (!nodes.length) return
    nodes.forEach((n) => n.classList.add('reader-highlight--flash'))
    const t = setTimeout(() => nodes.forEach((n) => n.classList.remove('reader-highlight--flash')), 1700)
    return () => clearTimeout(t)
  }, [containerRef, bodyReady, flashId, chapterHighlights])

  // --- Text selection → toolbar ----------------------------------------------
  const evaluateSelection = useCallback(() => {
    const root = containerRef.current
    if (!root) return
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return setSelection(null)
    const text = sel.toString()
    if (!text.trim()) return setSelection(null)
    const range = sel.getRangeAt(0)
    if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return setSelection(null)
    const block = closestBlockEl(range.startContainer, root)
    if (!block || block !== closestBlockEl(range.endContainer, root)) return setSelection(null) // single block only
    if (block.tagName === 'FIGURE' || block.tagName === 'TABLE') return setSelection(null) // non-text handled separately
    const offsets = selectionOffsets(block, range)
    if (!offsets) return setSelection(null)
    const rect = range.getBoundingClientRect()
    if (!rect || (rect.width === 0 && rect.height === 0)) return setSelection(null)
    setSelection({
      anchorEl: rectToVirtual(rect),
      blockId: block.dataset.blockId,
      start: offsets.start,
      end: offsets.end,
      quotedText: text,
      blockText: block.textContent || '',
    })
  }, [containerRef])

  useEffect(() => {
    if (!bodyReady) return
    let timer
    const onChange = () => {
      clearTimeout(timer)
      timer = setTimeout(evaluateSelection, 250)
    }
    const onScroll = () => setSelection(null)
    document.addEventListener('selectionchange', onChange)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      clearTimeout(timer)
      document.removeEventListener('selectionchange', onChange)
      window.removeEventListener('scroll', onScroll)
    }
  }, [bodyReady, chapterNumber, evaluateSelection])

  // --- Click delegation: open a highlight's popover, or the element affordance
  useEffect(() => {
    const root = containerRef.current
    if (!root || !bodyReady) return
    const onClick = (e) => {
      const mark = e.target.closest?.('mark.reader-highlight')
      if (mark && root.contains(mark)) {
        setPopover({ anchorEl: mark, id: mark.dataset.highlightId, startInEdit: false })
        return
      }
      const block = e.target.closest?.(ELEMENT_BLOCK_SELECTOR)
      if (block && root.contains(block)) {
        if (block.classList.contains('reader-highlight-element') && block.dataset.highlightId) {
          setPopover({ anchorEl: block, id: block.dataset.highlightId, startInEdit: false })
        } else {
          setAffordance({ anchorEl: block, blockId: block.dataset.blockId }) // touch-friendly
        }
      }
    }
    root.addEventListener('click', onClick)
    return () => root.removeEventListener('click', onClick)
  }, [containerRef, bodyReady, chapterNumber])

  // --- Hover delegation: show the element affordance on desktop hover --------
  useEffect(() => {
    const root = containerRef.current
    if (!root || !bodyReady) return
    const onOver = (e) => {
      const block = e.target.closest?.(ELEMENT_BLOCK_SELECTOR)
      if (block && root.contains(block)) {
        if (!block.classList.contains('reader-highlight-element')) {
          setAffordance((prev) => (prev?.anchorEl === block ? prev : { anchorEl: block, blockId: block.dataset.blockId }))
        }
      } else {
        setAffordance(null)
      }
    }
    const onScroll = () => setAffordance(null)
    root.addEventListener('mouseover', onOver)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      root.removeEventListener('mouseover', onOver)
      window.removeEventListener('scroll', onScroll)
    }
  }, [containerRef, bodyReady, chapterNumber])

  // After creating a highlight with "Note", open its popover in edit mode once
  // the mark has been painted into the DOM by the paint effect above.
  useEffect(() => {
    if (!pendingNoteId.current) return
    const root = containerRef.current
    const mark = root?.querySelector(
      `mark.reader-highlight[data-highlight-id="${CSS.escape(pendingNoteId.current)}"]`,
    )
    if (mark) {
      setPopover({ anchorEl: mark, id: pendingNoteId.current, startInEdit: true })
      pendingNoteId.current = null
    }
  }, [containerRef, chapterHighlights])

  const commitTextHighlight = (withNote) => {
    if (!selection) return
    const id = addHighlight({
      chapterNumber,
      blockId: selection.blockId,
      kind: 'text',
      startOffset: selection.start,
      endOffset: selection.end,
      quotedText: selection.quotedText,
      blockTextSnapshot: selection.blockText,
    })
    window.getSelection()?.removeAllRanges()
    setSelection(null)
    if (withNote) pendingNoteId.current = id
  }

  const commitElementHighlight = () => {
    if (!affordance) return
    const root = containerRef.current
    const el = root?.querySelector(`[data-block-id="${CSS.escape(affordance.blockId)}"]`)
    const quoted =
      el?.querySelector?.('figcaption')?.textContent?.trim() ||
      (el?.tagName === 'TABLE' ? 'Table' : 'Diagram')
    addHighlight({ chapterNumber, blockId: affordance.blockId, kind: 'element', quotedText: quoted })
    setAffordance(null)
  }

  const activeHighlight = popover ? snapshot.highlights[popover.id] : null
  // If the popover's highlight was removed, close it.
  useEffect(() => {
    if (popover && !snapshot.highlights[popover.id]) setPopover(null)
  }, [popover, snapshot])

  return (
    <>
      <HighlightToolbar
        anchorEl={selection?.anchorEl || null}
        onHighlight={() => commitTextHighlight(false)}
        onHighlightWithNote={() => commitTextHighlight(true)}
      />

      <Popper
        open={Boolean(affordance)}
        anchorEl={affordance?.anchorEl || null}
        placement="top-end"
        transition
        sx={{ zIndex: 1300 }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={120}>
            <Tooltip title="Highlight this" arrow>
              <IconButton
                size="small"
                aria-label="Highlight this"
                onMouseDown={(e) => e.preventDefault()}
                onClick={commitElementHighlight}
                sx={{
                  bgcolor: 'background.paper',
                  boxShadow: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': { bgcolor: 'background.paper' },
                }}
              >
                <BorderColorIcon fontSize="small" color="primary" />
              </IconButton>
            </Tooltip>
          </Fade>
        )}
      </Popper>

      <HighlightPopover
        anchorEl={popover?.anchorEl || null}
        highlight={activeHighlight}
        startInEdit={popover?.startInEdit}
        onSaveNote={updateNote}
        onRemove={(id) => {
          removeHighlight(id)
          setPopover(null)
        }}
        onClose={() => setPopover(null)}
      />
    </>
  )
}
