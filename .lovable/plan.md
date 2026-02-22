

## Remove the Red Buffer Progress Bar from Video Player

The red line at the top of the video is the buffer progress indicator. It will be removed entirely from the Watch page.

### Change

In `src/pages/Watch.tsx`, delete the buffer progress bar overlay (the section that renders the red/primary-colored bar showing `bufferPercent`). This is approximately lines 199-203 in the current file, the block that starts with `{!loading && !error && bufferPercent > 0 && bufferPercent < 100 && (`.

The related `bufferPercent` state and the `handleProgress` event listener can also be cleaned up since they will no longer be needed.

