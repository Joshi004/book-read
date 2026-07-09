import { Snackbar, Button, IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useRegisterSW } from 'virtual:pwa-register/react'

const HOUR = 60 * 60 * 1000

// Prompt-only update flow: a new chapter build is precached silently in the
// background, but never applied without the reader tapping Reload — avoids
// yanking someone off the page they're mid-chapter on.
export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (registration) setInterval(() => registration.update(), HOUR)
    },
    onRegisterError(error) {
      console.error('Service worker registration failed:', error)
    },
  })

  return (
    <Snackbar
      open={needRefresh}
      message="New chapters available"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      action={
        <>
          <Button color="inherit" size="small" onClick={() => updateServiceWorker(true)}>
            Reload
          </Button>
          <IconButton
            size="small"
            color="inherit"
            aria-label="Dismiss"
            onClick={() => setNeedRefresh(false)}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </>
      }
    />
  )
}
