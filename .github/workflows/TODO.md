# CI Workflow TODOs

## Cross-platform preview comparison with tolerance

**Current state:** `preview-cross-platform` job regenerates previews on macOS and
Windows, reports differences, but always passes (informational only).

**Goal:** Add image comparison with tolerance threshold to catch real rendering
bugs while allowing expected antialiasing differences.

**Implementation ideas:**

1. **pixelmatch + jimp** (Node.js)
   - `npm install pixelmatch jimp`
   - Compare PNG pixel-by-pixel with threshold (e.g., 0.1% diff allowed)
   - Fail if diff exceeds threshold

2. **ImageMagick compare** (system command)
   - Available on most CI runners
   - `compare -metric AE -fuzz 5% image1.png image2.png null:`
   - Parse metric and fail if too high

3. **Playwright's toMatchSnapshot with threshold**
   - Built-in image comparison
   - `expect(screenshot).toMatchSnapshot({ maxDiffPixelRatio: 0.01 })`
   - Requires baseline images per platform

**Recommendation:** Start with pixelmatch (simple Node.js, no system deps).
Store Linux baseline, compare macOS/Windows against it with ~1-5% tolerance.
Tune threshold based on observed differences.

**Acceptance criteria:**
- Major layout bugs fail CI (e.g., symbols missing, wrong size)
- Minor antialiasing differences pass (e.g., 1-2px edge smoothing)
- Clear error messages when threshold exceeded with diff visualization

**Priority:** Medium (nice-to-have quality gate; current setup catches most issues)
