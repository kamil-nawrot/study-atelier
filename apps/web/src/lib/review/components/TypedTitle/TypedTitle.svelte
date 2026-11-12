<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import { Alert, Button, Icon } from '@study-atelier/ui';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { quizKey } from '#lib/review/keys/keys.ts';
	import { authorsOf, describeArtwork } from '#lib/review/overview/overview.ts';
	import type { TitleSuggestion } from '#lib/review/typed-title/typed-title.ts';
	import type { ReviewDetails } from '#lib/review/types/review-details.ts';
	import type { ReviewItem } from '#lib/review/types/review-item.ts';
	import ReviewCard from '#lib/review/components/ReviewCard/ReviewCard.svelte';
	import TitleCombobox from '#lib/review/components/TitleCombobox/TitleCombobox.svelte';

	type Props = {
		item: ReviewItem;
		artworks: readonly WallArtwork[];
		details?: ReviewDetails;
		typed?: readonly string[];
		saving: boolean;
		error?: string;
		onanswer: (picked: readonly string[]) => void;
		onnext: () => void;
	};

	let { item, artworks, details, typed, saving, error, onanswer, onnext }: Props = $props();

	let heading = $state<HTMLElement>();
	let nextButton = $state<HTMLElement>();
	let selected = $state<TitleSuggestion>();
	let typing = $state(false);

	let artwork = $derived(item.artwork);
	let answered = $derived(typed !== undefined);
	let correct = $derived(typed?.includes(artwork.id) ?? false);
	let alt = $derived(answered ? describeArtwork(artwork) : m.review.flashcard.imageAlt);
	let byline = $derived(authorsOf(artwork));

	$effect(() => {
		void artwork.id;
		typing = false;
	});

	$effect(() => {
		void artwork.id;
		if (answered) nextButton?.querySelector('button')?.focus();
		else heading?.focus();
	});

	function check(): void {
		if (selected && !saving && !answered) onanswer(selected.ids);
	}

	function keydown(event: KeyboardEvent): void {
		quizKey(event, { answered, saving, options: 0, onanswer: () => {}, onnext });
	}
</script>

<svelte:window onkeydown={keydown} />

{#snippet next()}
	{#if error}
		<Alert title={m.review.saveErrorTitle} tone="danger">{error}</Alert>
	{/if}
	<div bind:this={nextButton}>
		{#if answered}
			<Button aria-keyshortcuts="Enter" fullWidth onclick={onnext} variant="primary">
				{m.review.quiz.next}
				<Icon icon={ArrowRight} size="sm" />
			</Button>
		{:else}
			<Button
				aria-keyshortcuts="Enter"
				disabled={!selected || saving}
				fullWidth
				onclick={check}
				variant="primary"
			>
				{m.review.quiz.typedCheck}
				<Icon icon={ArrowRight} size="sm" />
			</Button>
		{/if}
	</div>
{/snippet}

<ReviewCard
	actions={next}
	{alt}
	{artwork}
	collapsed={typing && !answered}
	compact
	credit={answered ? details?.credit : undefined}
	image={artwork.image}
	labelledby="quiz-heading"
>
	{#snippet body()}
		<div class="intro">
			<h1 bind:this={heading} id="quiz-heading" tabindex="-1">{m.review.quiz.typedQuestion}</h1>
			<p class="lead">{m.review.quiz.typedHint}</p>
		</div>
		<div onfocusin={() => (typing = true)}>
			<TitleCombobox
				{artworks}
				oncheck={check}
				verdict={answered ? (correct ? 'right' : 'wrong') : undefined}
				bind:selected
			/>
		</div>
		<div class="feedback" role="status">
			{#if answered}
				<p class="verdict">
					{correct ? m.review.quiz.right : m.review.quiz.wrong}
					<cite class="artwork-title">{artwork.title}</cite>{byline ? `, ${byline}` : ''}.
				</p>
				{#if !correct}
					<p class="caption">{m.review.quiz.retry}</p>
				{/if}
			{/if}
		</div>
	{/snippet}
</ReviewCard>

<style>
	h1:focus {
		outline: none;
	}

	.intro,
	.feedback {
		display: grid;
		gap: var(--spacing-2);
	}

	.feedback:empty {
		display: none;
	}

	.verdict {
		font-size: var(--font-size-md);
		line-height: var(--line-height-md);
	}
</style>
