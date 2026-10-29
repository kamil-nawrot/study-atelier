<script lang="ts">
	import type { Editor } from '@tiptap/core';
	import type { NotesCommand } from '../../types/notes-command';
	import Icon from '../Icon/Icon.svelte';

	type Props = {
		label: string;
		commands: NotesCommand[];
		editor?: Editor;
		pressed: Record<string, boolean>;
		disabled: boolean;
	};

	let { label, commands, editor, pressed, disabled }: Props = $props();

	let toolbar: HTMLDivElement;
	let focusedButton = $state(0);

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

<div
	bind:this={toolbar}
	class="toolbar"
	aria-label={label}
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

<style>
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
</style>
