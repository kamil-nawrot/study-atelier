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
	import type { LucideIcon } from '@lucide/svelte';
	import { uiMessages } from '../messages';
	import ArtworkImage from './ArtworkImage.svelte';
	import Icon from './Icon.svelte';
	import NoImage from './NoImage.svelte';

	type Props = {
		href: string;
		number: number;
		title: string;
		authors: string[];
		date?: string;
		image?: ArtworkTileImage;
		mark?: LucideIcon;
		markLabel?: string;
		unknownAuthorLabel?: string;
		noImageLabel?: string;
		imageUnavailable?: boolean;
		imageUnavailableLabel?: string;
		onimagefailed?: () => void;
	};

	let {
		href,
		number,
		title,
		authors,
		date,
		image,
		mark,
		markLabel,
		unknownAuthorLabel = uiMessages().unknownAuthor,
		noImageLabel = uiMessages().noImage,
		imageUnavailable = false,
		imageUnavailableLabel = uiMessages().imageFailed,
		onimagefailed
	}: Props = $props();

	const RECORD_NUMBER_DIGITS = 4;

	let authorText = $derived(authors.length > 0 ? authors.join(', ') : unknownAuthorLabel);
	let recordNumber = $derived(`#${String(number).padStart(RECORD_NUMBER_DIGITS, '0')}`);
</script>

<a class="tile" {href}>
	<figure>
		<div class="window">
			{#if image}
				<ArtworkImage
					alt="{title}, {authorText}"
					height={image.height}
					loading="lazy"
					onfailed={onimagefailed}
					sizes={image.sizes}
					src={image.src}
					srcset={image.srcset}
					width={image.width}
				/>
			{:else if imageUnavailable}
				<ArtworkImage alt="{title}, {authorText}" failedLabel={imageUnavailableLabel} unavailable />
			{:else}
				<NoImage label={noImageLabel} />
			{/if}
			{#if mark}
				<span class="mark">
					<Icon icon={mark} label={markLabel} size="sm" />
				</span>
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

	.window :global(img) {
		display: block;
		width: 100%;
		height: auto;
		background: var(--color-mat-window);
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

	.mark {
		position: absolute;
		top: var(--spacing-2);
		left: var(--spacing-2);
		display: flex;
		align-items: center;
		padding: var(--spacing-1) var(--spacing-2);
		background: var(--color-mat-badge-bg);
		color: var(--color-mat-badge-fg);
		line-height: var(--line-height-xs);
	}

	.mark :global(svg) {
		width: var(--font-size-sm);
		height: var(--font-size-sm);
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
