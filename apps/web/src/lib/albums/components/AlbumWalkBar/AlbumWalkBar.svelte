<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import { Icon } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import AlbumPicture from '#lib/albums/components/AlbumPicture/AlbumPicture.svelte';
	import type { AlbumWalk } from '#lib/albums/album-walk/album-walk.svelte.ts';

	type Props = {
		walk: AlbumWalk;
	};

	let { walk }: Props = $props();

	let position = $derived(Math.min(walk.index + 1, walk.artworks.length));
</script>

<div class="strip">
	<ul class="thumbs" aria-label={m.albums.walk.listLabel}>
		{#each walk.artworks as artwork (artwork.id)}
			{@const status = walk.statusOf(artwork)}
			<li
				class="thumb"
				class:current={status === 'current'}
				class:done={status !== 'current' && status !== 'todo'}
				aria-current={status === 'current' ? 'step' : undefined}
			>
				<AlbumPicture image={artwork.images[0]} />
				<span class="visually-hidden">
					{artwork.title}
					{#if status === 'saved'}
						{m.albums.walk.saved}
					{:else if status === 'merged'}
						{m.albums.walk.merged}
					{:else if status === 'skipped'}
						{m.albums.walk.skipped}
					{/if}
				</span>
				{#if status === 'saved' || status === 'merged'}
					<span class="check" aria-hidden="true"><Icon icon={Check} size="sm" /></span>
				{/if}
			</li>
		{/each}
	</ul>
	<span class="caption">{m.albums.walk.progress(position, walk.artworks.length)}</span>
</div>

<style>
	.strip {
		display: flex;
		flex: 1;
		align-items: center;
		justify-content: flex-end;
		gap: var(--spacing-3);
		min-width: 0;
	}

	.thumbs {
		display: flex;
		gap: var(--spacing-1);
		min-width: 0;
		overflow: hidden;
		list-style: none;
	}

	.thumb {
		position: relative;
		flex: none;
		width: var(--spacing-8);
		height: var(--spacing-8);
		overflow: hidden;
		opacity: 0.6;
	}

	.thumb :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.thumb.done {
		opacity: 0.4;
	}

	.thumb.current {
		outline: var(--border-width-base) solid var(--color-fg);
		outline-offset: var(--border-width-base);
		opacity: 1;
	}

	.check {
		position: absolute;
		inset: 0;
		display: grid;
		place-content: center;
		color: var(--color-fg);
	}

	.caption {
		flex: none;
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
	}
</style>
