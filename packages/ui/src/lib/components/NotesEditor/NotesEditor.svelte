<script lang="ts">
	import type { NoteLinkTrigger } from '../../types/note-link-trigger';
	import type { NoteLinks } from '../../types/note-links';
	import type { SuggestionState } from '../../types/suggestion-state';
	import { Editor } from '@tiptap/core';
	import { Markdown } from '@tiptap/markdown';
	import StarterKit from '@tiptap/starter-kit';
	import { onMount } from 'svelte';
	import { uiMessages } from '../../messages/messages';
	import { NoteLink, NoteLinkSuggestion } from '../../note-link-extension/note-link-extension';
	import { isBlank, notesCommands } from '../../notes-commands/notes-commands';
	import { renderNotes } from '../../notes-markdown/notes-markdown';
	import FieldMessage from '../FieldMessage/FieldMessage.svelte';
	import NoteLinkList from '../NoteLinkList/NoteLinkList.svelte';
	import NotesToolbar from '../NotesToolbar/NotesToolbar.svelte';

	type Props = {
		label: string;
		value?: string;
		hint?: string;
		error?: string;
		placeholder?: string;
		disabled?: boolean;
		id?: string;
		links?: NoteLinks;
	};

	let {
		label,
		value = $bindable(''),
		hint,
		error,
		placeholder,
		disabled = false,
		id,
		links
	}: Props = $props();

	const messages = uiMessages().notesEditor;
	const generatedId = $props.id();
	const inputId = $derived(id ?? generatedId);
	const labelId = $derived(`${inputId}-label`);
	const messageId = $derived(`${inputId}-message`);
	const listId = $derived(`${inputId}-links`);
	const message = $derived(error ?? hint);

	const commands = notesCommands(messages);

	let host: HTMLDivElement;
	let editor = $state.raw<Editor>();
	let pressed = $state<Record<string, boolean>>({});
	let blank = $state(!value.trim());
	let suggestion = $state.raw<SuggestionState | null>(null);
	let selected = $state(0);

	function updateSuggestion(trigger: NoteLinkTrigger, next: SuggestionState | null): void {
		if (next === null) {
			if (suggestion?.trigger === trigger) suggestion = null;
			return;
		}
		if (next.query.trim().length < (links?.minQueryLength ?? 0)) {
			if (suggestion?.trigger === trigger) suggestion = null;
			return;
		}
		if (suggestion?.trigger !== trigger || suggestion.items.length !== next.items.length)
			selected = 0;
		suggestion = next;
	}

	function chooseWithKey(event: KeyboardEvent): boolean {
		if (!suggestion || suggestion.items.length === 0) return false;
		const count = suggestion.items.length;
		if (event.key === 'ArrowDown') selected = (selected + 1) % count;
		else if (event.key === 'ArrowUp') selected = (selected - 1 + count) % count;
		else if (event.key === 'Enter' || event.key === 'Tab')
			suggestion.choose(suggestion.items[selected]);
		else return false;
		return true;
	}

	function refresh(current: Editor): void {
		pressed = Object.fromEntries(
			commands.map((command) => [command.name, command.active?.(current) ?? false])
		);
		blank = isBlank(current);
	}

	function describe(): Record<string, string> {
		const attributes: Record<string, string> = {
			role: 'textbox',
			'aria-multiline': 'true',
			'aria-labelledby': labelId
		};
		if (message) attributes['aria-describedby'] = messageId;
		if (links) {
			attributes['aria-haspopup'] = 'listbox';
			attributes['aria-controls'] = listId;
			attributes['aria-expanded'] = suggestion ? 'true' : 'false';
			if (suggestion && suggestion.items.length > 0) {
				attributes['aria-activedescendant'] = `${listId}-${selected}`;
			}
		}
		if (error) attributes['aria-invalid'] = 'true';
		return attributes;
	}

	onMount(() => {
		const instance = new Editor({
			element: host,
			editable: !disabled,
			content: renderNotes(value, links),
			extensions: [
				StarterKit.configure({
					blockquote: false,
					bulletList: {},
					code: false,
					codeBlock: false,
					dropcursor: false,
					gapcursor: false,
					heading: { levels: [3] },
					horizontalRule: false,
					link: false,
					strike: false,
					trailingNode: false,
					underline: false
				}),
				Markdown,
				NoteLink,
				NoteLinkSuggestion.configure({
					items: (trigger, query) => links?.suggest(trigger, query) ?? [],
					onChange: updateSuggestion,
					onKeyDown: chooseWithKey
				})
			],
			editorProps: { attributes: { id: inputId, ...describe() } },
			onCreate: ({ editor: created }) => refresh(created),
			onSelectionUpdate: ({ editor: current }) => refresh(current),
			onTransaction: ({ editor: current }) => refresh(current),
			onUpdate: ({ editor: current }) => {
				value = current.isEmpty ? '' : current.getMarkdown();
			}
		});
		editor = instance;
		return () => instance.destroy();
	});

	$effect(() => {
		if (!editor) return;
		editor.setOptions({ editorProps: { attributes: { id: inputId, ...describe() } } });
		editor.setEditable(!disabled);
	});

	$effect(() => {
		if (!editor) return;
		const current = editor.isEmpty ? '' : editor.getMarkdown();
		if (value !== current) {
			editor.commands.setContent(renderNotes(value, links), { emitUpdate: false });
		}
	});
</script>

<div class="field">
	<span id={labelId} class="label">{label}</span>
	<div class="box" class:disabled class:invalid={!!error}>
		<NotesToolbar {commands} {disabled} {editor} label={messages.toolbar} {pressed} />
		<div class="surface">
			{#if blank && placeholder}
				<span class="placeholder" aria-hidden="true">{placeholder}</span>
			{/if}
			<div bind:this={host} class="editor"></div>
		</div>
		{#if links}
			<NoteLinkList id={listId} {messages} {selected} {suggestion} />
		{/if}
	</div>
	{#if message}
		<FieldMessage id={messageId} {error} {hint} />
	{/if}
</div>

<style>
	.field {
		display: grid;
		gap: var(--spacing-2);
	}

	.label {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
	}

	.field:has(.disabled) .label {
		color: var(--color-fg-muted);
	}

	.box {
		position: relative;
		display: grid;
		border: var(--border-width-base) solid var(--color-line);
		border-radius: var(--border-radius-none);
		background: var(--color-surface);
		color: var(--color-fg);
	}

	.box.invalid {
		border-color: var(--color-danger);
	}

	.box:focus-within {
		outline: var(--border-width-base) dashed var(--color-fg);
		outline-offset: calc(var(--border-width-base) + var(--border-width-hairline));
	}

	.box.disabled {
		border-color: var(--color-tag);
		background: var(--color-tag);
		color: var(--color-fg-muted);
		cursor: not-allowed;
	}

	.surface {
		position: relative;
		min-height: calc(5 * var(--spacing-6));
	}

	.placeholder {
		position: absolute;
		inset: var(--spacing-3);
		color: var(--color-fg-muted);
		pointer-events: none;
	}

	.editor :global(.ProseMirror) {
		display: grid;
		align-content: start;
		gap: var(--spacing-3);
		min-height: inherit;
		padding: var(--spacing-3);
		outline: none;
		font-size: var(--font-size-md);
		line-height: var(--line-height-md);
		overflow-wrap: anywhere;
	}

	.editor :global(.ProseMirror p) {
		margin: 0;
	}

	.editor :global(.ProseMirror h3) {
		font-weight: var(--font-weight-medium);
	}

	.editor :global(.ProseMirror ul),
	.editor :global(.ProseMirror ol) {
		display: grid;
		gap: var(--spacing-1);
		padding-left: var(--spacing-6);
	}

	.editor :global([data-note-link]:not([data-missing])) {
		text-decoration: underline;
		text-decoration-color: var(--color-fg-muted);
		text-decoration-thickness: var(--border-width-hairline);
		text-underline-offset: 0.2em;
	}

	.editor :global(.ProseMirror-selectednode) {
		background: var(--color-tag);
	}

	.editor :global(.suggestion) {
		text-decoration: underline dashed;
		text-decoration-color: var(--color-fg-muted);
		text-decoration-thickness: var(--border-width-hairline);
		text-underline-offset: 0.2em;
	}
</style>
