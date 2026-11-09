<script lang="ts">
	import { onDestroy, tick, untrack } from 'svelte';
	import { Alert } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import BlockCard from '#lib/exhibitions/components/BlockCard/BlockCard.svelte';
	import ArtworkPickDialog from '#lib/exhibitions/components/ArtworkPickDialog/ArtworkPickDialog.svelte';
	import CloseUpDialog from '#lib/exhibitions/components/CloseUpDialog/CloseUpDialog.svelte';
	import DragOverlay from '#lib/exhibitions/components/DragOverlay/DragOverlay.svelte';
	import { BlockDrag } from '#lib/exhibitions/editor/block-drag/block-drag.svelte.ts';
	import {
		blockOf,
		canStep,
		documentOf,
		insert,
		move,
		remove,
		rowsOf,
		step,
		update,
		type Row,
		type Target
	} from '#lib/exhibitions/editor/block-rows/block-rows.ts';
	import { dropAt, type Drop } from '#lib/exhibitions/editor/drop-target/drop-target.ts';
	import { measureRows } from '#lib/exhibitions/editor/row-boxes/row-boxes.ts';
	import { blockLabel, newBlockLabel } from '#lib/exhibitions/editor/block-label/block-label.ts';
	import { itemsOf, withItem } from '#lib/exhibitions/editor/block-set/block-set.ts';
	import { paletteOf } from '#lib/images/image-palette/image-palette.ts';
	import { limitOf, sizeLimitOf } from '#lib/exhibitions/editor/block-limits/block-limits.ts';
	import {
		artworkNode,
		closeUpNode,
		kindOf,
		termNode,
		textNode,
		type CloseUpAttributes,
		type NewBlock
	} from '#lib/exhibitions/editor/new-block/new-block.ts';
	import type { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';
	import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';
	import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
	import type { ExhibitionSession } from '#lib/exhibitions/exhibition-session/exhibition-session.svelte.ts';

	type Props = {
		session: ExhibitionSession;
		lookup: ArtworkLookup;
		terms?: readonly GlossaryTerm[];
		barHeight: number;
	};

	let { session, lookup, terms, barHeight }: Props = $props();

	let rows = $state.raw<Row[]>(untrack(() => rowsOf(session.document)));
	let list = $state<HTMLElement>();
	let limit = $state<string>();
	let drop = $state.raw<Drop>();
	let moving = $state<string>();
	let closeUpOf = $state('');
	let closeUpOpen = $state(false);
	let closeUpTarget: Target | undefined;
	let paletteOpen = $state(false);
	let growing: string | undefined;

	const drag = new BlockDrag(() => barHeight);

	onDestroy(() => drag.cancel());

	function change(next: Row[]): void {
		const document = documentOf(next);
		const size = sizeLimitOf(document);
		if (size || limit === m.exhibitions.errors.tooBig) limit = size;
		rows = next;
		session.replace(document);
	}

	function place(node: ExhibitionDocument, target: Target = { before: undefined }): void {
		const block = blockOf(node);
		const next = insert(rows, block, target);
		limit = limitOf(documentOf(next));
		if (limit) return;
		change(next);
		void reveal(block.id, 'before' in target && target.before === undefined);
	}

	async function reveal(id: string, scroll: boolean): Promise<void> {
		await tick();
		const card = list?.querySelector(`[data-block-id="${id}"]`);
		if (scroll) card?.scrollIntoView?.({ block: 'center' });
		card?.querySelector<HTMLElement>('.tiptap, input, textarea')?.focus();
	}

	export function add(block: NewBlock, target?: Target): void {
		growing = undefined;
		if (block.kind === 'closeUp') {
			closeUpOf = block.artworkId;
			closeUpTarget = target;
			closeUpOpen = true;
		} else if (block.kind === 'term') {
			place(termNode(block.termId), target);
		} else if (block.kind === 'palette') {
			void readablePalette(block.artworkId).then((node) => node && place(node, target));
		} else if (block.kind === 'artwork') {
			place(artworkNode(block.artworkId), target);
		} else {
			place(textNode(block.kind), target);
		}
	}

	async function readablePalette(artworkId: string): Promise<ExhibitionDocument | undefined> {
		limit = undefined;
		await lookup.wantPictures(artworkId);
		const pictures = lookup.pictures(artworkId);
		const image = pictures?.[0];
		const result = image ? await paletteOf(image) : undefined;
		if (result && 'colours' in result) return artworkNode(artworkId, true);
		limit = pictures && !image ? m.exhibitions.limits.noImage : m.exhibitions.limits.noPalette;
		return undefined;
	}

	function pickCloseUp(attributes: CloseUpAttributes): void {
		if (growing) grow(closeUpNode(attributes));
		else place(closeUpNode(attributes), closeUpTarget);
		closeUpTarget = undefined;
	}

	function addMore(id: string, node: ExhibitionDocument): void {
		growing = id;
		if (kindOf(node) === 'palette') {
			paletteOpen = true;
			return;
		}
		closeUpOf = String(itemsOf(node).at(-1)?.attrs?.artworkId);
		closeUpOpen = true;
	}

	async function growPalette(artworkId: string): Promise<void> {
		const node = await readablePalette(artworkId);
		if (node) grow(node);
		else growing = undefined;
	}

	function grow(item: ExhibitionDocument): void {
		const id = growing;
		growing = undefined;
		const node = id
			? rows.flatMap((row) => row.blocks).find((block) => block.id === id)?.node
			: undefined;
		if (!id || !node) return;
		const next = update(rows, id, withItem(node, item));
		limit = limitOf(documentOf(next));
		if (!limit) change(next);
	}

	async function stepBlock(id: string, direction: -1 | 1): Promise<void> {
		change(step(rows, id, direction));
		await tick();
		const card = list?.querySelector(`[data-block-id="${id}"]`);
		if (!card || card.contains(document.activeElement)) return;
		const [pressed, other] =
			direction < 0
				? [m.exhibitions.bar.up, m.exhibitions.bar.down]
				: [m.exhibitions.bar.down, m.exhibitions.bar.up];
		const button =
			card.querySelector<HTMLElement>(`button[aria-label="${pressed}"]:not(:disabled)`) ??
			card.querySelector<HTMLElement>(`button[aria-label="${other}"]`);
		button?.focus();
	}

	function hover(x: number, y: number): void {
		const frame = list?.getBoundingClientRect();
		drop = frame && list ? dropAt(measureRows(list), frame, x, y, moving) : undefined;
	}

	function handlers(onplace: (target: Target) => void): Parameters<BlockDrag['begin']>[2] {
		return {
			onstart: () => undefined,
			onmove: hover,
			ondrop: (x, y) => {
				hover(x, y);
				if (drop) onplace(drop.target);
			},
			onend: () => {
				drop = undefined;
				moving = undefined;
			}
		};
	}

	export function dragNew(event: PointerEvent, block: NewBlock): void {
		drag.begin(
			event,
			newBlockLabel(block, lookup),
			handlers((target) => add(block, target))
		);
	}

	function dragBlock(event: PointerEvent, id: string, node: ExhibitionDocument): void {
		const started = drag.begin(
			event,
			blockLabel(node, lookup),
			handlers((target) => change(move(rows, id, target)))
		);
		if (started) moving = id;
	}
</script>

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
	<div bind:this={list} class="rows" class:dragging={drag.active}>
		{#each rows as row (row.id)}
			<div class="row" data-row-id={row.id}>
				{#each row.blocks as block (block.id)}
					<BlockCard
						beside={row.blocks.length > 1}
						{block}
						canDown={canStep(rows, block.id, 1)}
						canUp={canStep(rows, block.id, -1)}
						{lookup}
						moving={drag.active && moving === block.id}
						onaddmore={() => addMore(block.id, block.node)}
						onchange={(node) => change(update(rows, block.id, node))}
						onmovestart={(event) => dragBlock(event, block.id, block.node)}
						onremove={() => change(remove(rows, block.id))}
						onstep={(direction) => stepBlock(block.id, direction)}
						{terms}
					/>
				{/each}
			</div>
		{:else}
			<p class="empty">{m.exhibitions.view.emptyBody}</p>
		{/each}
	</div>
</div>

<CloseUpDialog artworkId={closeUpOf} {lookup} onpick={pickCloseUp} bind:open={closeUpOpen} />

<ArtworkPickDialog
	{lookup}
	onpick={growPalette}
	title={m.exhibitions.paletteDialog.title}
	bind:open={paletteOpen}
/>

<DragOverlay label={drag.label} mark={drop?.mark} top={barHeight} x={drag.x} y={drag.y} />

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

	.rows {
		display: grid;
		gap: var(--spacing-8);
		min-height: calc(10 * var(--spacing-6));
		padding-bottom: calc(2 * var(--size-control));
	}

	.rows.dragging {
		cursor: grabbing;
		user-select: none;
	}

	.row {
		display: flex;
		gap: var(--spacing-8);
		align-items: stretch;
	}

	.row > :global(*) {
		flex: 1 1 0;
	}

	@media (max-width: 767px) {
		.row {
			flex-direction: column;
			align-items: stretch;
		}
	}

	.empty {
		color: var(--color-fg-muted);
	}
</style>
