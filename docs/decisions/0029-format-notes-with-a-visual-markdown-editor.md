# 0029. Format artwork notes with a visual editor that stores Markdown

- Status: accepted
- Date: 2026-10-12

## Context and problem statement

The notes of an artwork are plain text: a `text` column, a `TextArea` in the add and edit form, and a paragraph with kept line breaks in the information panel of the artwork view. Notes written while studying grow into short structured texts (a few headings, lists of features, emphasised terms), and plain text cannot show that structure. The owner asked for basic Markdown with a simple editor that has a toolbar for bold, italics, headings and lists.

## Decision drivers

- Writing a note stays as simple as typing in a text field; the learner does not have to learn Markdown syntax.
- Notes already saved as plain text keep working without a data migration.
- The stored text stays readable and portable outside the app.
- The rendered note can never run script or inject markup into the page.
- The editor fits the library: looks from tokens, texts from the shared library messages, accessible by keyboard and screen reader.

## Considered options

1. Markdown source in the native `textarea` with a toolbar that inserts the syntax
2. A visual (WYSIWYG) editor that shows the formatting as the learner types and stores Markdown
3. Markdown source with a toolbar and a "Podgląd" tab that shows the formatted note

For the toolbar:

1. Bold, italic, one heading level, bulleted list
2. The same plus a numbered list
3. Two heading levels plus both lists

## Decision outcome

Chosen option: the visual editor (2) with five buttons: bold, italic, heading, bulleted list and numbered list (toolbar option 2). The owner chose both in the project thread; mockups are in the pull request.

- **Storage.** The note stays in the `notes` column as Markdown text. Plain text is valid Markdown, so existing notes need no migration; a line break inside a paragraph is kept as a line break.
- **Supported Markdown.** Paragraphs, `**bold**`, `*italic*`, one heading level written as `### `, bulleted lists (`- `) and numbered lists (`1. `). The heading is level 3 because the notes sit under the panel's own headings. Anything else (links, images, tables, quotes, code, raw HTML) is not offered by the editor and is shown as plain text when it appears in a note.
- **Editor.** The library gets a new form control built on [TipTap](https://tiptap.dev) 3 (MIT, framework-agnostic, on ProseMirror) with its official Markdown extension, limited to the elements above. It renders an editable region (`contenteditable`) inside the same outline as `TextArea`, with the toolbar on top separated by a hairline. It replaces `TextArea` for notes in the add and edit form; `TextArea` stays for plain long text.
- **Toolbar.** Icon buttons from Lucide (`Bold`, `Italic`, `Heading`, `List`, `ListOrdered`), each with an accessible name from the library messages and `aria-pressed` showing whether the formatting applies at the cursor; a pressed button is filled with `--color-fg`. The toolbar has `role="toolbar"` and is one tab stop with arrow keys between buttons. Ctrl/Cmd+B and Ctrl/Cmd+I work, and typing `### `, `- ` or `1. ` at the start of a line formats it as well.
- **Paste.** Pasted content keeps only the supported formatting; everything else becomes plain text.
- **Display.** The information panel renders the note from Markdown to HTML with [marked](https://marked.js.org) and sanitises it with [DOMPurify](https://github.com/cure53/DOMPurify), allowing only the elements listed above. The rendering lives in a library component, so the same rules apply wherever a note is shown later.
- **Form behaviour.** The control binds a Markdown string like `TextArea`, so the dirty check before leaving the form ("Odrzucić zmiany?") and saving work as they do now.

### Consequences

- Good: the learner sees the formatting while writing and never types syntax.
- Good: notes stay Markdown text in the same column; no migration, and the text stays readable outside the app.
- Good: one sanitised rendering path for all notes.
- Bad: an exception to "library controls build on native HTML elements": the editor is a `contenteditable` region driven by a library instead of a `textarea`, so behaviour such as the phone's own text selection depends on TipTap.
- Bad: the web app bundle grows by the editor (ProseMirror) and the Markdown parser; the add and edit form loads the editor only on that page.
- Bad: Markdown typed by hand that the editor does not support (for example a link) stays visible as plain text instead of being formatted.

## More information

- Requested and decided in the project thread "ATL-71 Notatki w Markdownie z edytorem", 2026-10-12. Requirement R-37.
- Build follows in separate issues: the library editor and note rendering, then their use in the form and the artwork view.
- The editor control keeps the `TextArea` look rules: outline, disabled look, label, hint and error under the field.
