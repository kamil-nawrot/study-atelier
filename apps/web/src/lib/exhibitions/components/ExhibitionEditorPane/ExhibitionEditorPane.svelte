<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { Alert } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import CloseUpDialog from '#lib/exhibitions/components/CloseUpDialog/CloseUpDialog.svelte';
	import BlockBar from '#lib/exhibitions/components/BlockBar/BlockBar.svelte';
	import DragOverlay from '#lib/exhibitions/components/DragOverlay/DragOverlay.svelte';
	import { ExhibitionEditor } from '#lib/exhibitions/editor/exhibition-editor/exhibition-editor.svelte.ts';
	import {
		BlockDrag,
		type DragHandlers
	} from '#lib/exhibitions/editor/block-drag/block-drag.svelte.ts';
	import { blockLabel, newBlockLabel } from '#lib/exhibitions/editor/drag-label/drag-label.ts';
	import { withEditableBody } from '#lib/exhibitions/exhibition-document/exhibition-document.ts';
	import type { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';
	import type {
		CurrentBlock,
		NewBlock
	} from '#lib/exhibitions/editor/block-commands/block-commands.ts';
	import type { ExhibitionSession } from '#lib/exhibitions/exhibition-session/exhibition-session.svelte.ts';

	type Props = {
		session: ExhibitionSession;
		lookup: ArtworkLookup;
		barHeight: number;
	};

	let { session, lookup, barHeight }: Props = $props();

	let host: HTMLElement;
	let editor = $state.raw<ExhibitionEditor>();
	let limit = $state<string>();
	let closeUpOpen = $state(false);
	let closeUpOf = $state('');
	let frameWidth = $state(0);
	let dragging = $state(false);

	const drag = new BlockDrag(() => barHeight);

	export function add(block: NewBlock): void {
		editor?.add(block);
	}

	export function dragNew(event: PointerEvent, block: NewBlock): void {
		drag.begin(
			event,
			newBlockLabel(block, lookup),
			handlers(block, () => undefined)
		);
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
		const resized = new ResizeObserver(() => created.measure());
		resized.observe(host);
		return () => {
			drag.cancel();
			resized.disconnect();
			created.destroy();
		};
	});

	function handlers(
		block: NewBlock | undefined,
		pick: () => CurrentBlock | undefined
	): DragHandlers {
		let moved: HTMLElement | undefined;
		return {
			onstart: () => {
				const picked = pick();
				if (picked) drag.label = blockLabel(picked.node, lookup);
				const dom = picked && editor?.view.nodeDOM(picked.pos);
				moved = dom instanceof HTMLElement ? dom : undefined;
				void shrink(moved);
			},
			onmove: (x: number, y: number) => editor?.hover(x, y),
			ondrop: (x: number, y: number) => editor?.place(block, x, y),
			onend: () => {
				moved?.classList.remove('moving');
				dragging = false;
				editor?.endDrag();
				editor?.measure();
			}
		};
	}

	async function shrink(moved: HTMLElement | undefined): Promise<void> {
		const before = moved?.getBoundingClientRect().top;
		moved?.classList.add('moving');
		dragging = true;
		editor?.hideBar();
		await tick();
		if (moved && before !== undefined)
			window.scrollBy(0, moved.getBoundingClientRect().top - before);
		editor?.hover(drag.x, drag.y);
	}

	function moveFromBar(event: PointerEvent): void {
		const block = editor?.startMove();
		if (!block || !editor) return;
		drag.begin(
			event,
			m.exhibitions.bar.move,
			handlers(undefined, () => block)
		);
	}

	function moveFromFigure(event: PointerEvent): void {
		const target = event.target instanceof Element ? event.target : null;
		const figure = target?.closest('.artwork-block .mat, .close-up-block .crop');
		const dom = figure?.closest('.artwork-block, .close-up-block');
		if (!dom || !editor) return;
		drag.begin(
			event,
			m.exhibitions.bar.move,
			handlers(undefined, () => editor?.pickUp(dom))
		);
	}
</script>

<svelte:window onresize={() => editor?.measure()} />

<div class="column">
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
	<div class="frame" class:dragging bind:clientWidth={frameWidth}>
		<div bind:this={host} class="document" onpointerdown={moveFromFigure} role="presentation"></div>
		{#if editor?.bar && !dragging}
			<BlockBar
				bar={editor.bar}
				{frameWidth}
				oncloseup={() => {
					closeUpOf = editor?.bar?.artworkId ?? '';
					closeUpOpen = closeUpOf !== '';
				}}
				onconvert={(kind) => editor?.convert(kind)}
				onmovestart={moveFromBar}
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
	</div>
</div>

<CloseUpDialog
	artworkId={closeUpOf}
	{lookup}
	onpick={(attributes) => editor?.addCloseUp(attributes)}
	bind:open={closeUpOpen}
/>

<DragOverlay dropAt={editor?.dropAt} label={drag.label} x={drag.x} y={drag.y} />

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

	.frame {
		position: relative;
	}

	.document :global(.ProseMirror) {
		display: grid;
		gap: var(--spacing-8);
		justify-items: start;
		min-height: calc(10 * var(--spacing-6));
		padding-bottom: calc(2 * var(--size-control));
		outline: none;
	}

	@media (min-width: 768px) {
		.document :global(.ProseMirror) {
			gap: calc(var(--size-control) + var(--spacing-4));
			padding-top: calc(var(--size-control) + var(--spacing-2));
			padding-bottom: 0;
		}

		.document :global(:is(.artwork-block .mat, .close-up-block .crop)) {
			cursor: grab;
		}
	}

	.document :global(.ProseMirror-focused .is-current:not(.artwork-block, .close-up-block)) {
		outline: var(--border-width-base) dashed var(--color-fg);
		outline-offset: var(--spacing-2);
	}

	.document :global(.ProseMirror-focused .is-current :is(.mat, .crop)) {
		outline: var(--border-width-base) dashed var(--color-fg);
		outline-offset: var(--border-width-base);
	}

	.dragging :global(.ProseMirror) {
		cursor: grabbing;
		user-select: none;
	}

	.dragging :global(.ProseMirror img) {
		max-height: calc(6 * var(--spacing-6));
	}

	.dragging :global(.ProseMirror :is([data-palette], .note)) {
		display: none;
	}

	.dragging :global(.ProseMirror .mat) {
		padding: var(--spacing-2);
	}

	.dragging :global(.ProseMirror .close-up-block) {
		max-width: calc(6 * var(--spacing-6));
	}

	.dragging :global(.ProseMirror .moving) {
		opacity: 0.4;
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

	.document :global(:is(.ProseMirror, [data-column]) > .artwork-block) {
		width: 100%;
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
</style>
