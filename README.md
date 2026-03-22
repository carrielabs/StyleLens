 # StyleLens

 StyleLens is a Next.js app for extracting visual style references from URLs and images.

 ## Development

 Run the development server:

 ```bash
 npm run dev
 ```

 Open [http://localhost:3000](http://localhost:3000) in your browser.

 Useful local checks:

 ```bash
 npm run lint
 npx tsc --noEmit
 npm test
 ```

 ## Project Structure

 Main app areas:

 - `app/page.tsx`
   Homepage composition layer. Wires auth state, history state, extraction state, page layout and overlays together.
 - `hooks/useHistory.ts`
   History list state, guest history, account history, guest-to-account migration, rename/delete/undo/pin/search behavior.
 - `hooks/useExtraction.ts`
   URL extraction, image extraction, upload preview, drag/paste input, cancel flow, loading states and extraction errors.
 - `components/home/HomeSidebar.tsx`
   Sidebar history UI.
 - `components/home/HomeWorkspace.tsx`
   Main page-mode report container.
 - `components/home/HomeOverlays.tsx`
   Modal-mode report container and overlays.
 - `components/report/*`
   Shared report presentation building blocks.
 - `lib/types/index.ts`
   Shared app types, including homepage report and history display types.
 - `docs/`
   Product and design reference documents.
 - `scripts/`
   Local helper scripts.

 ## Important Conventions

 - `walkthrough.md` is maintained outside this workflow and should not be touched during normal refactors.
 - The report uses a "single source, dual view" structure:
   - Page mode lives in `HomeWorkspace`
   - Modal mode lives in `HomeOverlays`
   - Shared report content can be reused, but the two containers should not be collapsed into one generic shell if that changes UX details.
 - Homepage refactors should prefer low-risk steps:
   - preserve behavior first
   - preserve UI details first
   - split structure before changing logic

 ## Current Testing

 Vitest is set up for lightweight logic coverage.

 Current test focus:

 - `hooks/useHistory.test.tsx`
 - `hooks/useExtraction.test.tsx`

 Run all tests with:

 ```bash
 npm test
 ```

 ## Notes

 - Screenshot caching and guest history behavior are part of the product cost-control strategy and should be treated carefully.
 - AI extraction availability can depend on provider or network constraints, so user-facing errors should stay friendly and should not expose raw backend or provider messages.
