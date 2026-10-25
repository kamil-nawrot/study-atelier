<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import { Alert, Button, Icon } from '@study-atelier/ui';
	import {
		artworkImageCredit,
		artworkImageSource
	} from '#lib/images/artwork-image/artwork-image.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import PinMark from '#lib/pins/components/PinMark/PinMark.svelte';
	import { onControl, sessionKey } from '#lib/review/keys/keys.ts';
	import { authorsOf, describeArtwork } from '#lib/review/overview/overview.ts';
	import type { Quiz } from '#lib/review/types/quiz.ts';
	import type { ReviewDetails } from '#lib/review/types/review-details.ts';
	import type { ReviewItem } from '#lib/review/types/review-item.ts';
	import QuizOptions from '#lib/review/components/QuizOptions/QuizOptions.svelte';
	import QuizTiles from '#lib/review/components/QuizTiles/QuizTiles.svelte';
	import ReviewCard from '#lib/review/components/ReviewCard/ReviewCard.svelte';

	type Props = {
		item: ReviewItem & { quiz: Quiz };
		details?: ReviewDetails;
		chosen?: number;
		saving: boolean;
		error?: string;
		onanswer: (choice: number) => void;
		onnext: () => void;
	};

	let { item, details, chosen, saving, error, onanswer, onnext }: Props = $props();

	const STAGE_WIDTH = 960;

	let heading = $state<HTMLElement>();
	let nextButton = $state<HTMLElement>();

	let artwork = $derived(item.artwork);
	let quiz = $derived(item.quiz);
	let answered = $derived(chosen !== undefined);
	let correct = $derived(chosen === quiz.answer);
	let picked = $derived(chosen === undefined ? undefined : quiz.options[chosen]);
	let alt = $derived(answered ? describeArtwork(artwork) : m.review.flashcard.imageAlt);
	let pin = $derived(item.pin);
	let credit = $derived(pin ? artworkImageCredit(pin.image) : details?.credit);

	$effect(() => {
		void artwork.id;
		if (answered) nextButton?.querySelector('button')?.focus();
		else heading?.focus();
	});

	function byline(work: WallArtwork): string {
		return [authorsOf(work), work.date].filter(Boolean).join(', ');
	}

	function keydown(event: KeyboardEvent): void {
		if (!sessionKey(event)) return;
		if (event.key === 'Enter' && answered) {
			if (onControl(event)) return;
			event.preventDefault();
			onnext();
			return;
		}
		const choice = Number(event.key) - 1;
		if (
			!answered &&
			!saving &&
			Number.isInteger(choice) &&
			choice >= 0 &&
			choice < quiz.options.length
		) {
			event.preventDefault();
			onanswer(choice);
		}
	}
</script>

<svelte:window onkeydown={keydown} />

{#snippet feedback()}
	<div class="feedback" role="status">
		{#if answered && picked}
			{#if item.mode === 'quiz_style' || item.mode === 'quiz_pin'}
				<p class="verdict">
					{correct ? m.review.quiz.right : m.review.quiz.wrong}
					{quiz.options[quiz.answer].label}.
				</p>
				<p><cite class="artwork-title">{artwork.title}</cite>, {byline(artwork)}.</p>
			{:else if item.mode === 'quiz_image' && !correct}
				<p class="verdict">
					{m.review.quiz.wrong} <cite class="artwork-title">{picked.label}</cite>.
				</p>
			{:else}
				<p class="verdict">
					{correct ? m.review.quiz.right : m.review.quiz.wrong}
					<cite class="artwork-title">{artwork.title}</cite>.
				</p>
				<p>{byline(artwork)}.</p>
			{/if}
			{#if !correct}
				<p class="caption">{m.review.quiz.retry}</p>
			{/if}
		{/if}
	</div>
{/snippet}

{#snippet next()}
	{#if error}
		<Alert title={m.review.saveErrorTitle} tone="danger">{error}</Alert>
	{/if}
	<div bind:this={nextButton}>
		<Button
			aria-keyshortcuts="Enter"
			disabled={!answered}
			fullWidth
			onclick={onnext}
			variant="primary"
		>
			{m.review.quiz.next}
			<Icon icon={ArrowRight} size="sm" />
		</Button>
	</div>
{/snippet}

{#snippet tiles()}
	<QuizTiles {chosen} {onanswer} {quiz} {saving} />
{/snippet}

{#snippet pinMark()}
	{#if pin}
		<PinMark label="?" x={pin.x} y={pin.y} />
	{/if}
{/snippet}

<ReviewCard
	actions={next}
	{alt}
	{artwork}
	compact
	credit={answered ? credit : undefined}
	image={pin ? artworkImageSource(pin.image, STAGE_WIDTH) : artwork.image}
	labelledby="quiz-heading"
	overlay={pin ? pinMark : undefined}
	stage={item.mode === 'quiz_image' ? tiles : undefined}
>
	{#snippet body()}
		<div class="intro">
			<h1 bind:this={heading} id="quiz-heading" tabindex="-1">
				{#if item.mode === 'quiz_image'}
					{m.review.quiz.imageQuestion.start}
					<cite class="artwork-title">{artwork.title}</cite>{m.review.quiz.imageQuestion.end}
				{:else if item.mode === 'quiz_style'}
					{m.review.quiz.styleQuestion}
				{:else if item.mode === 'quiz_pin'}
					{m.review.quiz.pinQuestion}
				{:else}
					{m.review.quiz.titleQuestion}
				{/if}
			</h1>
			{#if item.mode === 'quiz_image'}
				<p class="lead">{m.review.quiz.imageHint}</p>
			{:else if item.mode === 'quiz_style'}
				<p class="lead">{m.review.quiz.styleHint}</p>
			{:else if item.mode === 'quiz_pin'}
				<p class="lead">{m.review.quiz.pinHint}</p>
			{/if}
		</div>
		{#if item.mode !== 'quiz_image'}
			<QuizOptions {chosen} {onanswer} {quiz} {saving} />
		{/if}
		{@render feedback()}
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
