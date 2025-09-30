# Mobile Testing Guide - Swarm Commander

## Mobile Optimizations Implemented

### 1. **Touch Controls**
- ✅ Single finger tap & hold: Attract your player swarm
- ✅ Two-finger pinch: Zoom in/out
- ✅ Two-finger drag: Pan camera around arena
- ✅ Touch indicators show where you're influencing

### 2. **Responsive UI**
- ✅ Dynamic UI scaling based on screen size
- ✅ Touch-friendly button sizes (minimum 44x44px)
- ✅ Power-up menu in bottom-right corner (mobile) vs bottom-left (desktop)
- ✅ Mini-map repositioned for mobile
- ✅ Larger touch targets with visual feedback

### 3. **Mobile-Specific Features**
- ✅ Auto-detection of mobile devices
- ✅ Power-ups deploy at camera center on mobile (not mouse position)
- ✅ Expanded power-up menu with large icons
- ✅ Cooldown visual indicators
- ✅ Simplified HUD layout for smaller screens

### 4. **Performance**
- ✅ Canvas rendering optimized with `alpha: false`
- ✅ Removed unnecessary trail rendering for better FPS
- ✅ Efficient boid updates with spatial indexing (Quadtree)

### 5. **Viewport & Scrolling**
- ✅ Disabled page scroll/zoom on mobile
- ✅ Prevented double-tap zoom
- ✅ Full-screen canvas
- ✅ Fixed positioning to prevent address bar issues

## How to Test on Mobile

### Option 1: Local Network Testing
1. Start dev server: `npm run dev`
2. Note the local IP (usually shown in terminal, e.g., `http://192.168.x.x:5173`)
3. Open that URL on your mobile device (ensure both devices are on same WiFi)

### Option 2: ngrok/Tunneling
```bash
npm run dev
# In another terminal:
npx ngrok http 5173
# Use the ngrok URL on your mobile device
```

### Option 3: Deploy to Test
```bash
npm run build
# Deploy the dist/ folder to any static host (Vercel, Netlify, GitHub Pages)
```

## Testing Checklist

### Touch Gestures
- [ ] Single finger tap shows cyan touch indicator
- [ ] Player (cyan) boids move toward touch point
- [ ] AI (pink) boids do NOT respond to touch
- [ ] Two-finger pinch zooms in/out smoothly
- [ ] Two-finger drag pans camera
- [ ] Zoom limits work (can't zoom too far in/out)

### UI Interaction
- [ ] Pause button (top-right) responds to tap
- [ ] Pause screen opens with doctrine sliders
- [ ] Sliders are draggable on mobile
- [ ] Resume button works
- [ ] Power-up button (bottom-right) opens menu
- [ ] Power-up menu items are tappable
- [ ] Cooldown indicators show progress

### Power-ups
- [ ] Tap BOMB in menu deploys bomb at screen center
- [ ] Bomb shows pulsing animation
- [ ] Bomb explodes after ~1.5s with visible radius
- [ ] Both teams affected by bomb blast (friendly fire!)
- [ ] Tap TRACTOR deploys tractor beam
- [ ] Tractor beam pulls nearby boids
- [ ] Power-ups show cooldown after use
- [ ] Can't deploy power-up while on cooldown

### Game Flow
- [ ] Game starts automatically
- [ ] Player and AI teams visible (cyan vs pink)
- [ ] Morale bars update
- [ ] Team counts update as boids defect
- [ ] Alerts appear at top-center
- [ ] Win/lose screen appears when one team eliminated
- [ ] "NEW MISSION" button restarts game

### Visual Elements
- [ ] Mini-map shows arena walls
- [ ] Mini-map camera indicator updates
- [ ] Boids visible as small triangles
- [ ] Wall obstacles visible
- [ ] Arena grid visible when zoomed in
- [ ] No rendering glitches or lag

### Performance
- [ ] Smooth 60fps on modern phones
- [ ] No jank during pinch zoom
- [ ] No lag when many boids on screen
- [ ] Touch response feels immediate

## Common Issues & Fixes

### Issue: Touch not registering
- **Check**: Canvas covers full screen?
- **Fix**: Ensure no CSS blocking touch events

### Issue: Pinch zoom feels jerky
- **Check**: Two fingers detected?
- **Fix**: Added smoothing to zoom interpolation

### Issue: Power-ups not deploying
- **Check**: Touch hit UI button?
- **Fix**: Increased button sizes, added visual feedback

### Issue: Boids not responding to touch
- **Check**: Touching with single finger?
- **Check**: Touching player (cyan) boids?
- **Fix**: Only player team responds to touch

### Issue: Camera drifts during pinch
- **Check**: Both fingers on screen?
- **Fix**: Using center point for pan calculation

### Issue: Page scrolls or zooms
- **Fix**: Added `touch-action: none` and viewport meta tags

## Browser Compatibility

### Tested On:
- ✅ iOS Safari (iOS 14+)
- ✅ Chrome Mobile (Android 10+)
- ✅ Samsung Internet
- ✅ Firefox Mobile

### Known Limitations:
- Older browsers (pre-2020) may have touch event issues
- Some budget Android devices may have performance issues with 240 boids
- PWA features not yet implemented (can be added)

## Debug Tips

### Enable Mobile Debug Console
Add to your mobile browser or use:
```javascript
// Add this temporarily to App.svelte for debugging
console.log('Touch:', { touches: touches.length, isTouching: isTouchingBoids });
```

### Performance Monitoring
Open DevTools → Performance → Record while testing to identify bottlenecks.

### Remote Debugging
- **iOS**: Safari → Develop → [Your Device]
- **Android**: Chrome → chrome://inspect

## Recommended Mobile Settings

For best experience:
- Rotate to landscape mode
- Close other apps
- Ensure good WiFi/connection
- Brightness at comfortable level (game has dark UI)

## Future Mobile Enhancements
- [ ] Haptic feedback on power-up deploy
- [ ] Audio cues for events
- [ ] PWA support (install to home screen)
- [ ] Offline mode
- [ ] Reduced motion mode for accessibility
- [ ] Configurable boid count for performance tuning
