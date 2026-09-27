# Shared content styling

`rich-content.css` owns semantic article styling in the HTML widget, its read-only preview, and `BlogArticle`. `editor-content.css` contains authoring-only selection and placeholder decoration. Do not add theme classes to saved HTML or use `!important` to override author formatting.

Run regression tests from `frontend` with `npm run test:editor`.

## Visual regression fixture

`fixtures/rich-content.ts` contains representative HTML for rendering through `HtmlWidget` (editable and read-only) and `BlogArticle`. Use a temporary local preview or an unsaved test record; do not publish the fixture.

Verify each surface with the application's `.dark` theme enabled and disabled, at desktop and mobile widths:

- H1–H6 hierarchy, paragraph spacing, emphasis, nested bullets and numbering.
- Distinct links with underline and keyboard focus, blockquotes, captions and dividers.
- Default pastel highlights have dark readable ink; explicit foreground colors and custom backgrounds remain unchanged, including inherited author colors.
- The custom line remains Georgia, 24px, blue and right-aligned.
- Tables retain semantic table/colgroup layout, visible borders and distinct headers. Wide tables scroll within the content surface, not the page. Code blocks scroll independently and preserve whitespace.
- Images retain their aspect ratio and supplied width, never exceed their container, and follow the figure's alignment.
- In the editable widget, drag a table boundary, release, then undo once: the original table dimensions must return.
- Read-only and published content show no editor controls or placeholder. Selection styling is scoped to the widget.

## Verification performed

The same fixture was checked in the actual `HtmlWidget`, read-only widget and `BlogArticle` components at a 1100px viewport, with additional editor and blog checks at 390px. In both themes, browser-computed colors, font sizes/families, alignment and whitespace matched across all three renderers. A 720px-wide five-column table stayed inside a 343px published content scroller without horizontal page overflow. A real table drag was restored with one undo. Image loading and explicit formatting were also verified. The temporary QA route was removed afterward; no blog records were created or modified.

JSDOM checks CSS token wiring and explicit overrides; real-browser checks are necessary for resolved CSS variables, layout, overflow and resize geometry. The default highlight rule follows the editor's existing pastel palette; arbitrary author-selected color combinations remain the author's choice.
