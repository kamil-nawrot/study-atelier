<script lang="ts">
	import { Editor } from '@tiptap/core';
	import { Markdown } from '@tiptap/markdown';
	import StarterKit from '@tiptap/starter-kit';
	import Bold from '@lucide/svelte/icons/bold';
	import Heading from '@lucide/svelte/icons/heading';
	import Italic from '@lucide/svelte/icons/italic';
	import List from '@lucide/svelte/icons/list';
	import ListOrdered from '@lucide/svelte/icons/list-ordered';
	import type { LucideIcon } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { uiMessages } from '../messages';
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
	};

	type Command = {
		name: 'bold' | 'italic' | 'heading' | 'bulletList' | 'orderedList';
		label: string;
		icon: LucideIcon;
		run: (editor: Editor) => void;
		active: (editor: Editor) => boolean;
	};

	let {
		label,
		value = $bindable(''),
		hint,
		error,
		placeholder,
		disabled = false,
		id
	}: Props = $props();

	const messages = uiMessages().notesEditor;
	const generatedId = $props.id();
	const inputId = $derived(id ?? generatedId);
	const labelId = $derived(`${inputId}-label`);
	const messageId = $derived(`${inputId}-message`);
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
		}
	];

	let host: HTMLDivElement;
	let toolbar: HTMLDivElement;
	let editor = $state.raw<Editor>();
	let pressed = $state<Record<string, boolean>>({});
	let empty = $state(!value.trim());
	let focusedButton = $state(0);

	function refresh(current: Editor): void {
		pressed = Object.fromEntries(
			commands.map((command) => [command.name, command.active(current)])
		);
		empty = current.isEmpty;
	}

	function describe(): Record<string, string> {
		const attributes: Record<string, string> = {
			role: 'textbox',
			'aria-multiline': 'true',
			'aria-labelledby': labelId
		};
		if (message) attributes['aria-describedby'] = messageId;
		if (error) attributes['aria-invalid'] = 'true';
		return attributes;
	}

	onMount(() => {
		const instance = new Editor({
			element: host,
			editable: !disabled,
			content: renderNotes(value),
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
				Markdown
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
			editor.commands.setContent(renderNotes(value), { emitUpdate: false });
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
				<button
					class="tool"
					aria-label={command.label}
					aria-pressed={pressed[command.name] ?? false}
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
			{#if empty && placeholder}
				<span class="placeholder" aria-hidden="true">{placeholder}</span>
			{/if}
			<div bind:this={host} class="editor"></div>
		</div>
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

	.message {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	.message.error {
		color: var(--color-danger);
	}
</style>
