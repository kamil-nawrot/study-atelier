<script lang="ts">
	import { Editor } from '@tiptap/core';
	import { Markdown } from '@tiptap/markdown';
	import StarterKit from '@tiptap/starter-kit';
	import Bold from '@lucide/svelte/icons/bold';
	import Heading from '@lucide/svelte/icons/heading';
	import Italic from '@lucide/svelte/icons/italic';
	import AtSign from '@lucide/svelte/icons/at-sign';
	import Hash from '@lucide/svelte/icons/hash';
	import List from '@lucide/svelte/icons/list';
	import ListOrdered from '@lucide/svelte/icons/list-ordered';
	import type { LucideIcon } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { uiMessages } from '../messages';
	import { NoteLink, NoteLinkSuggestion, type SuggestionState } from '../note-link-extension';
	import type { NoteLinks, NoteLinkTrigger } from '../note-links';
	import { renderNotes } from '../notes-markdown';
	import Icon from './Icon.svelte';

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

	type Command = {
		name:
			'bold' | 'italic' | 'heading' | 'bulletList' | 'orderedList' | 'linkValue' | 'linkArtwork';
		label: string;
		icon: LucideIcon;
		run: (editor: Editor) => void;
		active?: (editor: Editor) => boolean;
		separated?: boolean;
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

	const commands: Command[] = [
		{
			name: 'bold',
			label: messages.bold,
			icon: Bold,
			run: (editor) => editor.chain().focus().toggleBold().run(),
			active: (editor) => editor.isActive('bold')
		},
		{
			name: 'italic',
			label: messages.italic,
			icon: Italic,
			run: (editor) => editor.chain().focus().toggleItalic().run(),
			active: (editor) => editor.isActive('italic')
		},
		{
			name: 'heading',
			label: messages.heading,
			icon: Heading,
			run: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
			active: (editor) => editor.isActive('heading')
		},
		{
			name: 'bulletList',
			label: messages.bulletedList,
			icon: List,
			run: (editor) => editor.chain().focus().toggleBulletList().run(),
			active: (editor) => editor.isActive('bulletList')
		},
		{
			name: 'orderedList',
			label: messages.numberedList,
			icon: ListOrdered,
			run: (editor) => editor.chain().focus().toggleOrderedList().run(),
			active: (editor) => editor.isActive('orderedList')
		},
		{
			name: 'linkValue',
			label: messages.linkValue,
			icon: AtSign,
			run: (editor) => startLink(editor, '@'),
			separated: true
		},
		{
			name: 'linkArtwork',
			label: messages.linkArtwork,
			icon: Hash,
			run: (editor) => startLink(editor, '#')
		}
	];

	let host: HTMLDivElement;
	let toolbar: HTMLDivElement;
	let editor = $state.raw<Editor>();
	let pressed = $state<Record<string, boolean>>({});
	let blank = $state(!value.trim());
	let focusedButton = $state(0);
	let suggestion = $state.raw<SuggestionState | null>(null);
	let selected = $state(0);
	let listElement = $state<HTMLUListElement>();

	function startLink(editor: Editor, character: NoteLinkTrigger): void {
		const { from } = editor.state.selection;
		const before = editor.state.doc.textBetween(Math.max(1, from - 1), from, ' ', ' ');
		const prefix = before === '' || /\s/.test(before) ? '' : ' ';
		editor
			.chain()
			.focus()
			.insertContent(prefix + character)
			.run();
	}

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

	function isBlank(current: Editor): boolean {
		const { doc } = current.state;
		return (
			doc.childCount === 1 && doc.firstChild?.type.name === 'paragraph' && doc.textContent === ''
		);
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
		if (suggestion && suggestion.items.length > 0) {
			listElement?.querySelector('.active')?.scrollIntoView({ block: 'nearest' });
		}
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

	function buttons(): HTMLButtonElement[] {
		return Array.from(toolbar.querySelectorAll('button'));
	}

	function moveFocus(event: KeyboardEvent): void {
		const keys: Record<string, (index: number, count: number) => number> = {
			ArrowRight: (index, count) => (index + 1) % count,
			ArrowLeft: (index, count) => (index - 1 + count) % count,
			Home: () => 0,
			End: (_, count) => count - 1
		};
		const next = keys[event.key];
		if (!next) return;
		event.preventDefault();
		focusedButton = next(focusedButton, commands.length);
		buttons()[focusedButton].focus();
	}
</script>

<div class="field">
	<span id={labelId} class="label">{label}</span>
	<div class="box" class:disabled class:invalid={!!error}>
		<div
			bind:this={toolbar}
			class="toolbar"
			aria-label={messages.toolbar}
			onkeydown={moveFocus}
			role="toolbar"
			tabindex="-1"
		>
			{#each commands as command, index (command.name)}
				{#if command.separated}
					<span class="separator" aria-orientation="vertical" role="separator"></span>
				{/if}
				<button
					class="tool"
					aria-label={command.label}
					aria-pressed={command.active ? (pressed[command.name] ?? false) : undefined}
					{disabled}
					onclick={() => editor && command.run(editor)}
					onfocus={() => (focusedButton = index)}
					tabindex={index === focusedButton ? 0 : -1}
					title={command.label}
					type="button"
				>
					<Icon icon={command.icon} size="sm" />
				</button>
			{/each}
		</div>
		<div class="surface">
			{#if blank && placeholder}
				<span class="placeholder" aria-hidden="true">{placeholder}</span>
			{/if}
			<div bind:this={host} class="editor"></div>
		</div>
		{#if links}
			<ul
				bind:this={listElement}
				id={listId}
				class="list"
				aria-label={messages.linkSuggestions}
				hidden={!suggestion}
				role="listbox"
			>
				{#if suggestion}
					{#each suggestion.items as option, index (option.href)}
						<li
							id={`${listId}-${index}`}
							class:active={index === selected}
							aria-selected={index === selected}
							onpointerdown={(event) => event.preventDefault()}
							onpointerup={() => suggestion?.choose(option)}
							role="option"
						>
							<span>{option.name}</span>
							<small>{option.detail}</small>
						</li>
					{:else}
						{#if !suggestion.loading}
							<li class="empty" role="presentation">
								{suggestion.trigger === '@' ? messages.noValueFound : messages.noArtworkFound}
							</li>
						{/if}
					{/each}
				{/if}
			</ul>
		{/if}
	</div>
	{#if message}
		<span id={messageId} class="message" class:error={!!error}>{message}</span>
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

	.toolbar {
		display: flex;
		border-bottom: var(--border-width-hairline) solid var(--color-line);
	}

	.separator {
		width: var(--border-width-hairline);
		margin: var(--spacing-2) 0;
		background: var(--color-line);
	}

	.tool {
		display: grid;
		place-items: center;
		width: var(--size-control);
		height: var(--size-control);
		padding: 0;
		border: none;
		border-radius: var(--border-radius-none);
		background: transparent;
		color: inherit;
		cursor: pointer;
	}

	.tool[aria-pressed='true'] {
		background: var(--color-fg);
		color: var(--color-on-fg);
	}

	.tool:disabled {
		cursor: not-allowed;
	}

	.tool:focus-visible {
		outline: var(--border-width-base) dashed var(--color-fg);
		outline-offset: calc(-1 * var(--spacing-2));
	}

	.tool[aria-pressed='true']:focus-visible {
		outline-color: var(--color-on-fg);
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

	.list {
		position: absolute;
		top: calc(100% + var(--border-width-base));
		right: calc(-1 * var(--border-width-base));
		left: calc(-1 * var(--border-width-base));
		z-index: 1;
		max-height: 280px;
		margin: 0;
		padding: var(--spacing-1) 0;
		overflow-y: auto;
		border: var(--border-width-base) solid var(--color-line);
		background: var(--color-bg);
		list-style: none;
	}

	.list[hidden] {
		display: none;
	}

	[role='option'],
	.empty {
		display: flex;
		justify-content: space-between;
		gap: var(--spacing-3);
		padding: var(--spacing-2) var(--spacing-3);
		font-size: var(--font-size-md);
		line-height: var(--line-height-md);
	}

	[role='option'] {
		cursor: pointer;
	}

	[role='option'].active {
		background: var(--color-tag);
	}

	[role='option'] small {
		align-self: center;
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
		text-align: right;
	}

	.empty {
		color: var(--color-fg-muted);
	}

	.message {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	.message.error {
		color: var(--color-danger);
	}
</style>
