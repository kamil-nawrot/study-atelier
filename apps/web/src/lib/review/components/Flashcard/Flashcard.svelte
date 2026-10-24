<script lang="ts">
	import { Alert, Button, Tag } from '@study-atelier/ui';
	import { formatRecordNumber } from '#lib/catalogue/record-number/record-number.ts';
	import GlossaryNotes from '#lib/glossary/components/GlossaryNotes/GlossaryNotes.svelte';
	import type { GlossaryEntry } from '#lib/glossary/types.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { onControl, sessionKey } from '#lib/review/keys/keys.ts';
	import { authorsOf } from '#lib/review/overview/overview.ts';
	import { RATINGS } from '#lib/review/scheduler/scheduler.ts';
	import type { ReviewDetails, ReviewItem, ReviewRating } from '#lib/review/types.ts';
	import ReviewCard from '#lib/review/components/ReviewCard/ReviewCard.svelte';

	type Props = {
		item: ReviewItem;
		details?: ReviewDetails;
		glossary?: GlossaryEntry[];
		revealed: boolean;
		saving: boolean;
		error?: string;
		onreveal: () => void;
		onrate: (rating: ReviewRating) => void;
	};

	let { item, details, glossary, revealed, saving, error, onreveal, onrate }: Props = $props();

	let revealButton = $state<HTMLElement>();
	let heading = $state<HTMLElement>();

	let artwork = $derived(item.artwork);
	let authors = $derived(authorsOf(artwork));
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

	function keydown(event: KeyboardEvent): void {
		if (!sessionKey(event)) return;
		if (event.key === ' ' && !revealed) {
			if (onControl(event)) return;
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

<ReviewCard
	{alt}
	{artwork}
	credit={revealed ? details?.credit : undefined}
	labelledby="flashcard-heading"
>
	{#snippet body()}
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
					<GlossaryNotes entries={glossary} linked={false} value={notes} />
				</section>
			{/if}
		{:else}
			<h1 id="flashcard-heading">{m.review.flashcard.question}</h1>
			<p class="lead">{m.review.flashcard.hint}</p>
		{/if}
	{/snippet}
	{#snippet actions()}
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
						{m.review.ratings[rating]}
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
	{/snippet}
</ReviewCard>

<style>
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

	.ratings {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--spacing-2);
	}
</style>
