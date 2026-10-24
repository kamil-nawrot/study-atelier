<script lang="ts" module>
	export type ArtworkTileImage = {
		src?: string;
		srcset?: string;
		sizes?: string;
		width: number;
		height: number;
	};
</script>

<script lang="ts">
	import Heart from '@lucide/svelte/icons/heart';
	import type { LucideIcon } from '@lucide/svelte';
	import { uiMessages } from '../../messages/messages';
	import ArtworkImage from '../ArtworkImage/ArtworkImage.svelte';
	import Icon from '../Icon/Icon.svelte';
	import NoImage from '../NoImage/NoImage.svelte';

	type Props = {
		href: string;
		number: number;
		title: string;
		authors: string[];
		date?: string;
		image?: ArtworkTileImage;
		mark?: LucideIcon;
		markLabel?: string;
		favourite?: boolean;
		favouriteLabel?: string;
		onfavourite?: () => void;
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
		favourite = false,
		favouriteLabel,
		onfavourite,
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

<div class="tile" class:with-heart={onfavourite}>
	<a class="link" {href}>
		<figure>
			<div style:--artwork-ratio={image ? image.width / image.height : undefined} class="window">
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
					<ArtworkImage
						alt="{title}, {authorText}"
						failedLabel={imageUnavailableLabel}
						unavailable
					/>
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
	{#if onfavourite}
		<button
			class="heart"
			aria-label={favouriteLabel}
			aria-pressed={favourite}
			onclick={onfavourite}
			type="button"
		>
			<Icon icon={Heart} size="sm" />
		</button>
	{/if}
</div>

<style>
	.tile {
		position: relative;
		padding: var(--spacing-2) var(--spacing-2) 0;
		border-radius: var(--border-radius-none);
		background: var(--color-mat-bg);
		color: var(--color-mat-fg);
	}

	.link {
		display: block;
		color: inherit;
		text-decoration: none;
	}

	.window {
		position: relative;
	}

	.window :global(img) {
		display: block;
		width: min(100%, calc(var(--artwork-max-height, 100000px) * var(--artwork-ratio, 1)));
		height: auto;
		margin-inline: auto;
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

	.with-heart figcaption {
		padding-inline-end: var(--size-control);
	}

	.heart {
		position: absolute;
		inset-inline-end: 0;
		inset-block-end: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--size-control);
		height: var(--size-control);
		padding: 0;
		border: 0;
		background: none;
		color: var(--color-mat-fg-muted);
		cursor: pointer;
	}

	.heart :global(svg) {
		width: var(--font-size-md);
		height: var(--font-size-md);
	}

	.heart[aria-pressed='true'] :global(svg) {
		fill: currentColor;
	}

	.link:hover .artwork-title {
		text-decoration: underline;
		text-decoration-thickness: var(--border-width-hairline);
		text-underline-offset: 0.2em;
	}
</style>
