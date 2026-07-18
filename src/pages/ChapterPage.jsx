import { useState } from 'react'
import { useParams, Navigate, useOutletContext } from 'react-router-dom'
import { Box } from '@mui/material'
import ChapterReader from '../components/ChapterReader.jsx'
import PrevNextNav from '../components/PrevNextNav.jsx'
import OnThisPage from '../components/OnThisPage.jsx'
import { getChapter, getNeighbors } from '../content/chapters.js'

export default function ChapterPage() {
  const { number } = useParams()
  const [headings, setHeadings] = useState([])
  const { focusMode } = useOutletContext() ?? {}
  const chapter = getChapter(number)

  if (!chapter) return <Navigate to="/404" replace />

  const { prev, next } = getNeighbors(chapter.number)

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        gap: 5,
        px: { xs: 2, sm: 4 },
        py: { xs: 3, sm: 5 },
      }}
    >
      <Box sx={{ flex: 1, maxWidth: focusMode ? '60rem' : '46rem', minWidth: 0, transition: 'max-width 0.25s ease' }}>
        <ChapterReader
          key={chapter.number}
          chapter={chapter}
          next={next}
          onHeadings={setHeadings}
        />
        <PrevNextNav prev={prev} next={next} />
      </Box>
      <Box
        sx={{
          width: '15rem',
          flexShrink: 0,
          display: focusMode ? 'none' : { xs: 'none', lg: 'block' },
        }}
      >
        <OnThisPage headings={headings} />
      </Box>
    </Box>
  )
}
