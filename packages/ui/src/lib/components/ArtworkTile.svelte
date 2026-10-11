<script lang="ts" module>
	export type ArtworkTileImage = {
		src: string;
		srcset?: string;
		sizes?: string;
		width: number;
		height: number;
	};
</script>

<script lang="ts">
	import ImageIcon from '@lucide/svelte/icons/image';
	import { uiMessages } from '../messages';
	import Icon from './Icon.svelte';

	type Props = {
		href: string;
		number: number;
		title: string;
		authors: string[];
		date?: string;
		image?: ArtworkTileImage;
		unknownAuthorLabel?: string;
		noImageLabel?: string;
	};

	let {
		href,
		number,
		title,
		authors,
		date,
		image,
		unknownAuthorLabel = uiMessages().unknownAuthor,
		noImageLabel = uiMessages().noImage
	}: Props = $props();

	const RECORD_NUMBER_DIGITS = 4;

	let authorText = $derived(authors.length > 0 ? authors.join(', ') : unknownAuthorLabel);
	let recordNumber = $derived(`#${String(number).padStart(RECORD_NUMBER_DIGITS, '0')}`);
</script>

<a class="tile" {href}>
	<figure>
		<div class="window">
			{#if image}
				<img
					alt="{title}, {authorText}"
					height={image.height}
					loading="lazy"
					sizes={image.sizes}
					src={image.src}
					srcset={image.srcset}
					width={image.width}
				/>
			{:else}
				<div class="empty" aria-label={noImageLabel} role="img">
					<Icon icon={ImageIcon} />
				</div>
			{/if}
			<span class="number">
				{recordNumber}
			</span>
		</div>
		<figcaption>
			<cite class="artwork-title">
				{title}
			</cite>
			<span class="meta">
				<span>
					{authorText}
				</span>
				{#if date}
					<span aria-hidden="true">·</span>
					<span class="date">
						{date}
					</span>
				{/if}
			</span>
		</figcaption>
	</figure>
</a>

<style>
	.tile {
		display: block;
		padding: var(--spacing-2) var(--spacing-2) 0;
		border-radius: var(--border-radius-none);
		background: var(--color-mat-bg);
		color: var(--color-mat-fg);
		text-decoration: none;
	}

	.window {
		position: relative;
	}

	img {
		display: block;
		width: 100%;
		height: auto;
	}

	.empty {
		display: grid;
		place-items: center;
		aspect-ratio: 4 / 5;
		background: var(--color-mat-window);
		color: var(--color-mat-fg-muted);
	}

	.number {
		position: absolute;
		top: var(--spacing-2);
		right: var(--spacing-2);
		padding: 0 var(--spacing-2);
		background: var(--color-mat-badge-bg);
		color: var(--color-mat-badge-fg);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-xs);
		letter-spacing: var(--letter-spacing-wide);
		font-variant-numeric: tabular-nums;
	}

	figcaption {
		display: grid;
		gap: var(--spacing-1);
		padding: var(--spacing-3) 0 var(--spacing-4);
	}

	.artwork-title {
		color: var(--color-mat-fg);
		text-wrap: balance;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		column-gap: var(--spacing-1);
		color: var(--color-mat-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	.date {
		white-space: nowrap;
	}

	.tile:hover .artwork-title {
		text-decoration: underline;
		text-decoration-thickness: var(--border-width-hairline);
		text-underline-offset: 0.2em;
	}
</style>
