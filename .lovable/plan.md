

# Pixar-Style "CINEVERSE" Logo Animation

Inspired by Pixar's iconic lamp animation, we'll create a playful text logo animation where a spotlight/lamp-like element bounces onto one of the letters, squishing it down -- then the full text settles into place.

## How It Works

1. The letters "C-I-N-E-V-E-R-S-E" animate in with a staggered fade-up effect
2. A small spotlight icon (or a star/lamp shape) drops from above and "lands" on the letter "I", squishing it briefly
3. The "I" compresses, then springs back to normal height
4. The spotlight settles on top of the "I" and glows softly
5. The animation plays once on page load (not on every navigation)

## Technical Approach

### 1. Create a new `CineverseLogo` component (`src/components/CineverseLogo.tsx`)

- Split "CINEVERSE" into individual letter `<span>` elements
- Each letter gets a staggered `animation-delay` for a sequential fade-up entrance
- The "I" letter has a special squish keyframe (scaleY compress then bounce back)
- A small lamp/spotlight SVG element animates downward onto the "I" with a bounce
- Use `sessionStorage` to track if animation already played this session, so it only runs once on first load (not every route change)

### 2. Add keyframes to `tailwind.config.ts`

- `letter-fade-up`: Letters fade and slide up into place
- `lamp-drop`: Lamp drops from above with a bounce easing
- `letter-squish`: The "I" compresses vertically then springs back
- `lamp-glow`: Subtle glow pulse on the lamp after landing

### 3. Update `Navbar.tsx`

- Replace the plain `<span>CINEVERSE</span>` with the new `<CineverseLogo />` component
- No other navbar changes needed

### 4. Add supporting CSS in `src/index.css`

- Lamp glow effect using a small `box-shadow` or `text-shadow`
- Ensure the animation doesn't cause layout shift (fixed dimensions on the logo container)

## Visual Timeline

```text
Time:  0ms    100ms   200ms   300ms   400ms   500ms   600ms   700ms   800ms
       |-------|-------|-------|-------|-------|-------|-------|-------|
Letters: C...I...N...E...V...E...R...S...E  (staggered fade-up)
Lamp:                          [drops down--->bounces on "I"]
"I":                                         [squish---spring back]
Glow:                                                  [soft pulse]
```

## Files to Create/Edit

- **New**: `src/components/CineverseLogo.tsx` -- animated logo component
- **Edit**: `src/components/Navbar.tsx` -- swap plain text for new component
- **Edit**: `tailwind.config.ts` -- add new keyframes and animations
- **Edit**: `src/index.css` -- add lamp glow styles

