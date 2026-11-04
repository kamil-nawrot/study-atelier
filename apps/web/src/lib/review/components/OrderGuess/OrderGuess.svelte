<script lang="ts">
	import { untrack } from 'svelte';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import { Button, Icon } from '@study-atelier/ui';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { quizKey } from '#lib/review/keys/keys.ts';
	import { chronological, ORDER_SIZE, placedRight } from '#lib/review/order-guess/order-guess.ts';
	import { authorsOf } from '#lib/review/overview/overview.ts';
	import type { OrderItem } from '#lib/review/types/order-item.ts';
	import { yearsOf } from '#lib/review/year-guess/year-guess.ts';
	import OrderAxis from '#lib/review/components/OrderAxis/OrderAxis.svelte';
	import OrderBoard from '#lib/review/components/OrderBoard/OrderBoard.svelte';
	import ReviewCard from '#lib/review/components/ReviewCard/ReviewCard.svelte';

	type Props = {
		item: OrderItem;
		ordered?: WallArtwork[];
		oncheck: (placed: WallArtwork[]) => void;
		onnext: () => void;
	};

	let { item, ordered, oncheck, onnext }: Props = $props();

	let heading = $state<HTMLElement>();
	let nextButton = $state<HTMLElement>();
	let placement = $state(untrack(() => item.artworks));

	let answered = $derived(ordered !== undefined);
	let shown = $derived(ordered ?? placement);
	let right = $derived(ordered ? placedRight(ordered) : 0);

	$effect(() => {
		if (answered) nextButton?.querySelector('button')?.focus();
		else untrack(() => heading)?.focus();
	});

	function keydown(event: KeyboardEvent): void {
		quizKey(event, { answered, saving: false, options: 0, onanswer: () => {}, onnext });
	}

	function yearOf(artwork: WallArtwork): string {
		const years = yearsOf(artwork);
		if (!years) return '';
		return years[0] === years[1]
			? m.atelier.year(years[0], false)
			: m.atelier.span(years[0], years[1], false);
	}
</script>

<svelte:window onkeydown={keydown} />

{#snippet board()}
	<OrderBoard {answered} artworks={shown} onchange={(next) => (placement = next)} />
{/snippet}

{#snippet actions()}
	<div bind:this={nextButton}>
		{#if answered}
			<Button aria-keyshortcuts="Enter" fullWidth onclick={onnext} variant="primary">
				{m.review.quiz.next}
				<Icon icon={ArrowRight} size="sm" />
			</Button>
		{:else}
			<Button fullWidth onclick={() => oncheck(placement)} variant="primary">
				{m.review.order.check}
			</Button>
		{/if}
	</div>
{/snippet}

<ReviewCard {actions} alt="" compact labelledby="quiz-heading" stage={board}>
	{#snippet body()}
		<div class="intro">
			<p class="caption">{m.review.order.tag}</p>
			<h1 bind:this={heading} id="quiz-heading" tabindex="-1">{m.review.order.question}</h1>
			<p class="lead">{m.review.order.hint}</p>
			<p class="caption keys">{m.review.order.keyboardHint}</p>
		</div>
		<div class="feedback" role="status">
			{#if ordered}
				<p class="verdict">
					{right === ORDER_SIZE
						? m.review.order.right
						: right > 0
							? m.review.order.some(right, ORDER_SIZE)
							: m.review.order.none}
				</p>
				<OrderAxis artworks={ordered} />
				<h2 class="caption">{m.review.order.trueOrder}</h2>
				<ol class="order">
					{#each chronological(ordered) as artwork (artwork.id)}
						<li>
							<cite class="artwork-title">{artwork.title}</cite>{authorsOf(artwork)
								? `, ${authorsOf(artwork)}`
								: ''}, {yearOf(artwork)}
						</li>
					{/each}
				</ol>
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

	.order {
		display: grid;
		gap: var(--spacing-1);
		padding-left: var(--spacing-6);
	}

	@media (max-width: 767.98px) {
		.keys {
			display: none;
		}
	}
</style>
