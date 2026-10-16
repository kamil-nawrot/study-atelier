<script lang="ts">
	import { Alert, ArtworkImage, Button, NoImage, Notes, Tag } from '@study-atelier/ui';
	import { formatRecordNumber } from '#lib/collection/format.ts';
	import { m } from '#lib/i18n/index.ts';
	import { formatInterval } from '../overview.ts';
	import { RATINGS } from '../scheduler.ts';
	import type { ReviewCard, ReviewDetails, ReviewItem, ReviewRating } from '../types.ts';

	type Props = {
		item: ReviewItem;
		details?: ReviewDetails;
		revealed: boolean;
		outcomes?: Record<ReviewRating, ReviewCard>;
		now: Date;
		saving: boolean;
		error?: string;
		onreveal: () => void;
		onrate: (rating: ReviewRating) => void;
	};

	let { item, details, revealed, outcomes, now, saving, error, onreveal, onrate }: Props = $props();

	let revealButton = $state<HTMLElement>();
	let heading = $state<HTMLElement>();

	let artwork = $derived(item.artwork);
	let authors = $derived(
		artwork.authors.length > 0 ? artwork.authors.join(', ') : m.ui.unknownAuthor
	);
	let alt = $derived(revealed ? `${artwork.title}, ${authors}` : m.review.flashcard.imageAlt);
	let fields = $derived(
		[
			{ label: m.artworkForm.period, values: artwork.period ? [artwork.period] : [] },
			{ label: m.artworkForm.style, values: artwork.styles },
			{ label: m.artworkForm.location, values: artwork.location ? [artwork.location] : [] }
		].filter((field) => field.values.length > 0)
	);
	let notes = $derived(details?.notes.trim() ?? '');

	$effect(() => {
		void artwork.id;
		if (revealed) heading?.focus();
		else revealButton?.querySelector('button')?.focus();
	});

	function typing(target: EventTarget | null): boolean {
		if (!(target instanceof HTMLElement)) return false;
		return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
	}

	function keydown(event: KeyboardEvent): void {
		if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
		if (typing(event.target) || document.querySelector('dialog[open]')) return;
		if (event.key === ' ' && !revealed) {
			if (event.target instanceof HTMLElement && event.target.closest('button, a')) return;
			event.preventDefault();
			onreveal();
			return;
		}
		const rating = Number(event.key);
		if (revealed && !saving && RATINGS.includes(rating as ReviewRating)) {
			event.preventDefault();
			onrate(rating as ReviewRating);
		}
	}
</script>

<svelte:window onkeydown={keydown} />

<div class="card">
	<figure class="stage" class:dimmed={artwork.image?.src !== undefined}>
		{#if artwork.image?.src}
			<img class="backdrop" alt="" aria-hidden="true" src={artwork.image.src} />
			<span class="mat">
				<ArtworkImage
					{alt}
					height={artwork.image.height}
					loading="eager"
					sizes="(min-width: 768px) 60vw, 100vw"
					src={artwork.image.src}
					srcset={artwork.image.srcset}
					width={artwork.image.width}
				/>
			</span>
		{:else if artwork.imageUnavailable}
			<span class="mat">
				<ArtworkImage {alt} unavailable />
			</span>
		{:else}
			<span class="mat">
				<span class="window">
					<NoImage label={m.ui.noImage} />
				</span>
			</span>
		{/if}
		{#if revealed && details?.credit}
			<figcaption class="caption">{details.credit}</figcaption>
		{/if}
	</figure>

	<section class="panel" aria-labelledby="flashcard-heading">
		<div class="body">
			{#if revealed}
				<header class="heading">
					<span class="number">{formatRecordNumber(artwork.number)}</span>
					<h1 bind:this={heading} id="flashcard-heading" tabindex="-1">
						<cite class="artwork-title">{artwork.title}</cite>
					</h1>
					<p class="meta">
						<span>{authors}</span>
						{#if artwork.date}
							<span aria-hidden="true">·</span>
							<span class="date">{artwork.date}</span>
						{/if}
					</p>
				</header>
				{#if fields.length > 0}
					<dl>
						{#each fields as field (field.label)}
							<dt class="caption">{field.label}</dt>
							<dd>
								{#each field.values as value (value)}
									<Tag>{value}</Tag>
								{/each}
							</dd>
						{/each}
					</dl>
				{/if}
				{#if notes}
					<section class="notes" aria-labelledby="flashcard-notes">
						<h2 id="flashcard-notes" class="caption">{m.review.flashcard.notes}</h2>
						<Notes value={notes} />
					</section>
				{/if}
			{:else}
				<h1 id="flashcard-heading">{m.review.flashcard.question}</h1>
				<p class="lead">{m.review.flashcard.hint}</p>
			{/if}
		</div>

		<div class="actions">
			{#if error}
				<Alert title={m.review.saveErrorTitle} tone="danger">{error}</Alert>
			{/if}
			{#if revealed}
				<p id="flashcard-rate" class="caption">{m.review.flashcard.rate}</p>
				<div class="ratings" aria-labelledby="flashcard-rate" role="group">
					{#each RATINGS as rating (rating)}
						<Button
							aria-keyshortcuts={String(rating)}
							disabled={saving}
							onclick={() => onrate(rating)}
							variant={rating === 3 ? 'primary' : 'secondary'}
						>
							<span class="rating">
								<span>{m.review.ratings[rating]}</span>
								{#if outcomes}
									<span class="interval">{formatInterval(outcomes[rating].due, now)}</span>
								{/if}
							</span>
						</Button>
					{/each}
				</div>
			{:else}
				<div bind:this={revealButton}>
					<Button aria-keyshortcuts="Space" fullWidth onclick={onreveal} variant="primary">
						{m.review.flashcard.reveal}
					</Button>
				</div>
			{/if}
		</div>
	</section>
</div>

<style>
	.card {
		display: grid;
	}

	.stage {
		position: relative;
		display: grid;
		justify-items: center;
		align-content: center;
		gap: var(--spacing-3);
		padding: var(--spacing-6) var(--spacing-4);
		overflow: hidden;
		background: var(--color-stage-bg);
		color: var(--color-stage-fg-muted);
	}

	.dimmed::after {
		content: '';
		position: absolute;
		inset: 0;
		background: var(--color-scrim);
	}

	.backdrop {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: blur(32px);
		scale: 1.2;
	}

	.stage > :not(.backdrop) {
		position: relative;
		z-index: 1;
	}

	.mat {
		display: block;
		max-width: 100%;
		padding: var(--spacing-2);
		background: var(--color-mat-bg);
	}

	.mat :global(img) {
		display: block;
		width: auto;
		max-width: 100%;
		height: auto;
		max-height: 50dvh;
		background: var(--color-mat-window);
	}

	.window {
		display: grid;
		width: min(320px, calc(100vw - 2 * var(--spacing-6)));
		aspect-ratio: 4 / 5;
	}

	.stage .caption {
		color: var(--color-stage-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	.panel {
		display: grid;
		grid-template-rows: 1fr auto;
	}

	.body {
		display: grid;
		align-content: start;
		gap: var(--spacing-6);
		padding: var(--spacing-6) var(--spacing-4);
	}

	.heading {
		display: grid;
		gap: var(--spacing-2);
	}

	h1:focus {
		outline: none;
	}

	.number {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-xs);
		letter-spacing: var(--letter-spacing-wide);
		font-variant-numeric: tabular-nums;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		column-gap: var(--spacing-1);
	}

	.date {
		white-space: nowrap;
	}

	dl {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: var(--spacing-3) var(--spacing-4);
	}

	dt,
	dd {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--spacing-2);
	}

	.notes {
		display: grid;
		gap: var(--spacing-2);
	}

	.notes h2 {
		font-weight: var(--font-weight-regular);
	}

	.actions {
		position: sticky;
		bottom: 0;
		display: grid;
		gap: var(--spacing-3);
		padding: var(--spacing-4);
		border-top: var(--border-width-hairline) solid var(--color-tag);
		background: var(--color-bg);
	}

	.ratings {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--spacing-2);
	}

	.rating {
		display: grid;
		justify-items: center;
		padding: var(--spacing-1) 0;
		line-height: var(--line-height-xs);
	}

	.interval {
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-regular);
	}

	@media (min-width: 768px) {
		.card {
			grid-template-columns: minmax(0, 1fr) 380px;
			grid-template-rows: minmax(0, 1fr);
			height: 100%;
			min-height: 0;
		}

		.stage {
			container-type: size;
			padding: var(--spacing-6);
		}

		.mat {
			padding: var(--spacing-4) var(--spacing-4) var(--spacing-6);
		}

		.mat :global(img) {
			max-width: calc(100cqw - 2 * var(--spacing-4));
			max-height: calc(100cqh - var(--spacing-12) - var(--spacing-8));
		}

		.window {
			width: auto;
			height: calc(100cqh - var(--spacing-24) - var(--spacing-12));
		}

		.panel {
			min-height: 0;
			border-left: var(--border-width-hairline) solid var(--color-tag);
		}

		.body {
			overflow-y: auto;
			padding: var(--spacing-8) var(--spacing-6);
		}

		.actions {
			position: static;
			padding: var(--spacing-6);
			border-top: none;
		}
	}
</style>
