import { useMemo } from 'react'
import { Box, Typography } from '@mui/material'
import ElementCell from './ElementCell.jsx'
import { SANS, MONO } from '../../theme.js'

const LABEL_COL_PX = 44
const DATA_COL_PX = 86
const HEADER_ROW_PX = 28
const DATA_ROW_PX = 72
const GAP_PX = 6

// Grid-column/-row tracks: track 1 is the sticky row-letter margin, tracks
// 2..19 are the 18 print columns; grid-row 1 is the column-number header,
// rows 2..10 are the 9 print rows (A-G, then Object Interaction, then Direct
// Verbal Behavior — see gridRows in bte-data.json, sourced from
// scripts/generate-bte-data.mjs's GRID_ROWS/GRID_POSITION_BY_SYMBOL).
export default function ElementsClassicGrid({ entries, gridRows, gridColumns, isDimmed, relationTypeFor, onHover, onSelect }) {
  const entriesByRow = useMemo(() => {
    const map = new Map(gridRows.map((r) => [r.key, []]))
    const unplaced = []
    for (const e of entries) {
      if (e.row == null || e.col == null || !map.has(e.row)) {
        unplaced.push(e)
        continue
      }
      map.get(e.row).push(e)
    }
    return { map, unplaced }
  }, [entries, gridRows])

  const gridWidth = LABEL_COL_PX + gridColumns * (DATA_COL_PX + GAP_PX)

  return (
    <Box>
      <Box sx={{ overflowX: 'auto', pb: 1 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `${LABEL_COL_PX}px repeat(${gridColumns}, ${DATA_COL_PX}px)`,
            gridAutoRows: `${DATA_ROW_PX}px`,
            gridTemplateRows: `${HEADER_ROW_PX}px`,
            gap: `${GAP_PX}px`,
            width: gridWidth,
          }}
        >
          {Array.from({ length: gridColumns }, (_, i) => (
            <Typography
              key={`col-${i}`}
              sx={{
                gridColumn: i + 2,
                gridRow: 1,
                fontFamily: SANS,
                fontSize: '0.68rem',
                fontWeight: 700,
                color: 'text.secondary',
                textAlign: 'center',
              }}
            >
              {i + 1}
            </Typography>
          ))}

          {gridRows.map((rowDef, rIdx) => {
            const rowTrack = rIdx + 2
            const rowEntries = entriesByRow.map.get(rowDef.key) || []
            return (
              <Box key={rowDef.key} sx={{ display: 'contents' }}>
                <Box
                  sx={{
                    gridColumn: 1,
                    gridRow: rowTrack,
                    position: 'sticky',
                    left: 0,
                    zIndex: 1,
                    bgcolor: 'background.default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {rowDef.letter && (
                    <Typography sx={{ fontFamily: SANS, fontWeight: 700, fontSize: '1.1rem', color: 'text.secondary' }}>
                      {rowDef.letter}
                    </Typography>
                  )}
                </Box>

                {!rowDef.letter && (
                  <Typography
                    title={rowDef.category}
                    sx={{
                      gridColumn: '2 / 5',
                      gridRow: rowTrack,
                      alignSelf: 'center',
                      fontFamily: SANS,
                      fontWeight: 700,
                      fontSize: '0.68rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: 'text.secondary',
                    }}
                  >
                    {rowDef.category}
                  </Typography>
                )}

                {rowEntries.map((entry) => (
                  <Box key={entry.id} sx={{ gridColumn: entry.col + 1, gridRow: rowTrack }}>
                    <ElementCell
                      entry={entry}
                      dimmed={isDimmed(entry)}
                      relationType={relationTypeFor(entry)}
                      onHover={onHover}
                      onSelect={onSelect}
                    />
                  </Box>
                ))}
              </Box>
            )
          })}
        </Box>
      </Box>

      {entriesByRow.unplaced.length > 0 && (
        <Typography sx={{ fontFamily: MONO, fontSize: '0.72rem', color: 'text.secondary', mt: 1.5 }}>
          Not yet mapped to the print layout: {entriesByRow.unplaced.map((e) => e.symbol).join(', ')}
        </Typography>
      )}
    </Box>
  )
}
