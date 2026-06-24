import { Link as RouterLink } from 'react-router-dom'
import { Box, Typography, Button } from '@mui/material'
import { SERIF } from '../theme.js'

export default function NotFound() {
  return (
    <Box sx={{ maxWidth: '40rem', mx: 'auto', px: 3, py: 10, textAlign: 'center' }}>
      <Typography sx={{ fontFamily: SERIF, fontSize: '3rem', fontWeight: 700 }}>
        Not found
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 4 }}>
        That page or chapter doesn't exist.
      </Typography>
      <Button component={RouterLink} to="/" variant="contained">
        Back to contents
      </Button>
    </Box>
  )
}
