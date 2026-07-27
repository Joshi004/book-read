import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Typography, Stack, Button } from '@mui/material'
import bteData from '../generated/bte-data.json'
import ElementCell from '../components/bte/ElementCell.jsx'
import ElementDetailPopover from '../components/bte/ElementDetailPopover.jsx'
import ElementsLegend from '../components/bte/ElementsLegend.jsx'
import { SERIF, SANS } from '../theme.js'

const { categories, entries } = bteData

function drsSortKey(entry) {
  if (entry.drsValue != null) return entry.drsValue
  if (entry.drsRaw === 'DNL') return -1 // "deception not likely" reads first, alongside the lowest-stress cells
  return 99
}

function gestureTypeMatches(entry, activeTypes) {
  if (activeTypes.size === 0) return true
  if (!entry.gestureType) return false
  return [...activeTypes].some((t) => entry.gestureType.includes(t))
}

export default function ElementsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [activeBands, setActiveBands] = useState(() => new Set())
  const [activeTypes, setActiveTypes] = useState(() => new Set())
  const [hoveredId, setHoveredId] = useState(null)
  const [selected, setSelected] = useState(null) // { entry, anchorEl }

  const entriesBySymbol = useMemo(() => new Map(entries.map((e) => [e.symbol, e])), [])

  // Reverse index so hovering a cell also lights up cells that name *it* as a
  // relation, not just the ones it names — the relationship graph the prose
  // only states from one side becomes visible from both.
  const incomingBySymbol = useMemo(() => {
    const map = new Map()
    for (const e of entries) {
      for (const rel of e.relations) {
        if (!map.has(rel.symbol)) map.set(rel.symbol, [])
        map.get(rel.symbol).push(e.symbol)
      }
    }
    return map
  }, [])

  const relatedSymbols = useMemo(() => {
    if (!hoveredId) return null
    const hovered = entries.find((e) => e.id === hoveredId)
    if (!hovered) return null
    const set = new Set(hovered.relations.map((r) => r.symbol))
    for (const s of incomingBySymbol.get(hovered.symbol) || []) set.add(s)
    return set
  }, [hoveredId, incomingBySymbol])

  const byCategory = useMemo(() => {
    const groups = new Map(categories.map((c) => [c, []]))
    for (const e of entries) groups.get(e.category)?.push(e)
    for (const list of groups.values()) list.sort((a, b) => drsSortKey(a) - drsSortKey(b))
    return groups
  }, [])

  const q = search.trim().toLowerCase()
  const isDimmed = (entry) => {
    if (activeBands.size > 0 && !activeBands.has(entry.colorBand)) return true
    if (!gestureTypeMatches(entry, activeTypes)) return true
    if (q && !entry.symbol.toLowerCase().includes(q) && !entry.name.toLowerCase().includes(q)) return true
    return false
  }

  const toggleInSet = (setter) => (key) =>
    setter((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const hasFilters = activeBands.size > 0 || activeTypes.size > 0 || q.length > 0
  const clearFilters = () => {
    setSearch('')
    setActiveBands(new Set())
    setActiveTypes(new Set())
  }

  const selectEntry = (entry, anchorEl) => setSelected({ entry, anchorEl })
  const selectRelated = (entry) => setSelected((prev) => (prev ? { entry, anchorEl: prev.anchorEl } : null))
  const readInChapter = (entry) => navigate(`/chapter/26?heading=${entry.id}`)

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
      <Typography sx={{ fontFamily: SERIF, fontWeight: 700, fontSize: { xs: '1.6rem', md: '2rem' }, mb: 1 }}>
        The Behavior Elements
      </Typography>
      <Typography sx={{ fontFamily: SANS, color: 'text.secondary', maxWidth: 720, mb: 1.5 }}>
        An interactive version of the Behavioral Table of Elements from Chapter 26. Each
        group below is one body region, ordered left-to-right by deception rating — the
        same low-stress-to-high-stress logic the printed table uses. On a mouse, hover a
        cell to see its related behaviors light up; on any device, tap or click a cell
        for the full write-up.
      </Typography>

      <ElementsLegend
        activeBands={activeBands}
        onToggleBand={toggleInSet(setActiveBands)}
        activeTypes={activeTypes}
        onToggleType={toggleInSet(setActiveTypes)}
        search={search}
        onSearchChange={setSearch}
      />
      {hasFilters && (
        <Button size="small" onClick={clearFilters} sx={{ textTransform: 'none', fontFamily: SANS, mb: 2, mt: -2 }}>
          Clear filters
        </Button>
      )}

      <Stack spacing={4}>
        {categories.map((category) => {
          const list = byCategory.get(category) || []
          if (list.length === 0) return null
          return (
            <Box key={category}>
              <Typography sx={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.95rem', mb: 1.25, pb: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                {category}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {list.map((entry) => (
                  <ElementCell
                    key={entry.id}
                    entry={entry}
                    dimmed={isDimmed(entry)}
                    related={relatedSymbols?.has(entry.symbol) ?? false}
                    onHover={setHoveredId}
                    onSelect={selectEntry}
                  />
                ))}
              </Box>
            </Box>
          )
        })}
      </Stack>

      <ElementDetailPopover
        entry={selected?.entry ?? null}
        anchorEl={selected?.anchorEl ?? null}
        entriesBySymbol={entriesBySymbol}
        onSelectRelated={selectRelated}
        onReadInChapter={readInChapter}
        onClose={() => setSelected(null)}
      />
    </Box>
  )
}
