<script lang="ts">
	import { onMount } from 'svelte';
	import { Alert } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import CloseUpDialog from '#lib/exhibitions/components/CloseUpDialog/CloseUpDialog.svelte';
	import BlockBar from '#lib/exhibitions/components/BlockBar/BlockBar.svelte';
	import {
		BLOCK_MIME,
		ExhibitionEditor
	} from '#lib/exhibitions/editor/exhibition-editor/exhibition-editor.svelte.ts';
	import { withEditableBody } from '#lib/exhibitions/exhibition-document/exhibition-document.ts';
	import type { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';
	import type { NewBlock } from '#lib/exhibitions/editor/block-commands/block-commands.ts';
	import type { ExhibitionSession } from '#lib/exhibitions/exhibition-session/exhibition-session.svelte.ts';

	type Props = {
		session: ExhibitionSession;
		lookup: ArtworkLookup;
		barHeight: number;
	};

	let { session, lookup, barHeight }: Props = $props();

	let host: HTMLElement;
	let column = $state<HTMLElement>();
	let editor = $state.raw<ExhibitionEditor>();
	let limit = $state<string>();
	let closeUpOpen = $state(false);
	let closeUpOf = $state('');

	export function add(block: NewBlock): void {
		editor?.add(block);
	}

	onMount(() => {
		const created = new ExhibitionEditor({
			host,
			document: withEditableBody(session.document),
			lookup,
			onchange: (document) => {
				limit = undefined;
				session.replace(document);
			},
			onlimit: (message) => (limit = message)
		});
		editor = created;
		return () => created.destroy();
	});

	function startMove(event: DragEvent): void {
		if (!editor?.startMove()) {
			event.preventDefault();
			return;
		}
		event.dataTransfer?.setData(BLOCK_MIME, '');
		if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
	}
</script>

<svelte:window onresize={() => editor?.measure()} onscroll={() => editor?.measure()} />

<div bind:this={column} class="column">
	<input
		class="title"
		aria-label={m.exhibitions.view.titleLabel}
		maxlength="200"
		onblur={() => session.keepTitle()}
		oninput={(event) => session.rename(event.currentTarget.value)}
		placeholder={m.exhibitions.view.titleLabel}
		value={session.title}
	/>
	{#if session.status === 'conflict'}
		<Alert title={m.exhibitions.save.conflictTitle} tone="danger">
			{m.exhibitions.save.conflict}
		</Alert>
	{:else if limit}
		<Alert tone="warning">{limit}</Alert>
	{/if}
	<div bind:this={host} class="document"></div>
</div>

{#if editor && column && editor.bar}
	<BlockBar
		bar={editor.bar}
		{column}
		oncloseup={() => {
			closeUpOf = editor?.bar?.artworkId ?? '';
			closeUpOpen = closeUpOf !== '';
		}}
		onconvert={(kind) => editor?.convert(kind)}
		onmovestart={startMove}
		onnote={() => editor?.setArtwork({ note: !editor.bar?.note })}
		onpalette={(only) =>
			editor?.setArtwork(
				only
					? { paletteOnly: !editor.bar?.paletteOnly, palette: false }
					: { palette: !(editor.bar?.palette && !editor.bar?.paletteOnly), paletteOnly: false }
			)}
		onremove={() => editor?.remove()}
		onstep={(direction) => editor?.step(direction)}
		ontoggle={(mark) => editor?.toggle(mark)}
		topLimit={barHeight}
	/>
{/if}

<CloseUpDialog
	artworkId={closeUpOf}
	{lookup}
	onpick={(attributes) => editor?.addCloseUp(attributes)}
	bind:open={closeUpOpen}
/>

{#if editor?.dropAt}
	<div
		style:height="{editor.dropAt.height}px"
		style:left="{editor.dropAt.left}px"
		style:top="{editor.dropAt.top}px"
		style:width="{editor.dropAt.width}px"
		class="drop"
		class:full={editor.dropAt.full}
		class:slot={editor.dropAt.replaces || editor.dropAt.beside !== undefined}
		aria-hidden="true"
	>
		{#if editor.dropAt.full}
			{m.exhibitions.drop.full}
		{:else if editor.dropAt.beside !== undefined}
			{m.exhibitions.drop.here}
		{/if}
	</div>
{/if}

<style>
	.column {
		display: grid;
		gap: var(--spacing-6);
		max-width: var(--size-content-wide);
	}

	.title {
		box-sizing: border-box;
		width: 100%;
		padding: 0;
		border: none;
		background: transparent;
		color: var(--color-fg);
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-2xl);
		font-style: italic;
		line-height: var(--line-height-2xl);
	}

	.title:focus-visible {
		outline: var(--border-width-base) dashed var(--color-fg);
		outline-offset: var(--spacing-2);
	}

	.document :global(.ProseMirror) {
		display: grid;
		gap: var(--spacing-8);
		justify-items: start;
		min-height: calc(10 * var(--spacing-6));
		outline: none;
	}

	.document :global(.ProseMirror > *) {
		max-width: var(--size-content-default);
		margin: 0;
	}

	.document :global(.ProseMirror > [data-block='columns']) {
		display: flex;
		gap: var(--spacing-8);
		align-items: flex-start;
		width: 100%;
		max-width: var(--size-content-wide);
	}

	.document :global(.ProseMirror > [data-block='columns'] > [data-column]) {
		display: grid;
		flex: 1 1 0;
		gap: var(--spacing-4);
		justify-items: start;
		min-width: 0;
	}

	@media (max-width: 767px) {
		.document :global(.ProseMirror > [data-block='columns']) {
			flex-direction: column;
			gap: var(--spacing-8);
		}
	}

	.document :global(.ProseMirror > .artwork-block) {
		max-width: var(--size-content-wide);
	}

	.document :global(.ProseMirror p) {
		margin: 0;
	}

	.document :global(.ProseMirror [data-block='text'] ul),
	.document :global(.ProseMirror [data-block='text'] ol) {
		display: grid;
		gap: var(--spacing-1);
		padding-left: var(--spacing-6);
	}

	.document :global(.ProseMirror h2) {
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-lg);
	}

	.document :global(.ProseMirror blockquote) {
		padding-left: var(--spacing-4);
		border-left: var(--border-width-base) solid var(--color-line);
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-lg);
		font-style: italic;
	}

	.document :global(.is-empty::before) {
		content: attr(data-placeholder);
		position: absolute;
		color: var(--color-fg-muted);
		pointer-events: none;
	}

	.document :global(.ProseMirror-selectednode > .top .mat) {
		outline: var(--border-width-base) dashed var(--color-fg);
	}

	.drop {
		position: fixed;
		z-index: 2;
		display: grid;
		place-items: center;
		border-top: var(--border-width-base) solid var(--color-fg);
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		text-align: center;
		pointer-events: none;
	}

	.drop.slot {
		border: var(--border-width-base) dashed var(--color-fg);
		background: var(--color-surface);
	}
</style>
