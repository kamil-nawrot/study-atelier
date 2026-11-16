<script lang="ts">
	import BookA from '@lucide/svelte/icons/book-a';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Shapes from '@lucide/svelte/icons/shapes';
	import { Button, Icon, MetaLine } from '@study-atelier/ui';
	import type { ResolvedPathname } from '$app/types';
	import type { BackroomRow } from '#lib/backroom/types/backroom-row.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		rows: readonly BackroomRow[];
		onfix: (index: number) => void;
		onimage?: (artwork: WallArtwork) => void;
	};

	let { rows, onfix, onimage }: Props = $props();

	$effect(() => {
		for (const row of rows) if (row.artwork?.pendingImage) onimage?.(row.artwork);
	});
</script>

<ul>
	{#each rows as row, index (row.entry.key)}
		<li>
			<div class="thumbnail">
				{#if row.artwork?.image}
					<img
						alt=""
						loading="lazy"
						sizes="64px"
						src={row.artwork.image.src}
						srcset={row.artwork.image.srcset}
					/>
				{:else if row.kind === 'artwork'}
					<span class="window"></span>
				{:else}
					<span class="mark">
						<Icon icon={row.kind === 'term' ? BookA : Shapes} />
					</span>
				{/if}
			</div>
			<div class="text">
				{#if row.kind === 'artwork'}
					<cite class="artwork-title">{row.title}</cite>
				{:else}
					<span class="name">{row.title}</span>
				{/if}
				<span class="reason">{row.reason}</span>
				{#if row.origin || row.comment}
					<MetaLine
						class="meta"
						parts={[row.origin, row.held && m.backroom.held, row.comment && `„${row.comment}”`]}
					/>
				{/if}
			</div>
			<Button
				aria-label={m.backroom.fix}
				compact
				href={row.entry.path as ResolvedPathname}
				icon={Pencil}
				onclick={() => onfix(index)}
			>
				{m.backroom.fix}
			</Button>
		</li>
	{/each}
</ul>

<style>
	ul {
		margin: 0;
		list-style: none;
	}

	li {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: var(--spacing-4);
		padding: var(--spacing-4) 0;
		border-bottom: var(--border-width-hairline) solid var(--color-line);
	}

	.thumbnail {
		width: var(--spacing-16);
		aspect-ratio: 4 / 5;
		padding: var(--spacing-1);
		background: var(--color-mat-bg);
	}

	.thumbnail img,
	.window,
	.mark {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.window {
		background: var(--color-mat-window);
	}

	.mark {
		display: grid;
		place-items: center;
		color: var(--color-fg-muted);
	}

	.text {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-1);
		min-width: 0;
	}

	.artwork-title,
	.name {
		font-size: var(--font-size-lg);
	}

	.reason {
		font-size: var(--font-size-sm);
	}

	.text > :global(.meta) {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
	}
</style>
