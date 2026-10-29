<script lang="ts">
	import { tick } from 'svelte';
	import ImageViewer from '#lib/images/components/ImageViewer/ImageViewer.svelte';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import QuizTile from '#lib/review/components/QuizTile/QuizTile.svelte';
	import type { Quiz } from '#lib/review/types/quiz.ts';
	import type { QuizOption } from '#lib/review/types/quiz-option.ts';

	type Props = {
		quiz: Quiz;
		chosen?: number;
		saving: boolean;
		onanswer: (choice: number) => void;
	};

	let { quiz, chosen, saving, onanswer }: Props = $props();

	const FALLBACK_RATIO = 0.8;

	let viewer: ReturnType<typeof ImageViewer>;
	let viewed = $state<{ image: WallArtwork['image']; alt: string }>();

	function ratioOf(option: QuizOption): number {
		const image = option.artwork?.image;
		return image ? image.width / image.height : FALLBACK_RATIO;
	}

	async function enlarge(image: WallArtwork['image'], alt: string): Promise<void> {
		viewed = { image, alt };
		await tick();
		viewer.open();
	}
</script>

<div
	style:--r1={ratioOf(quiz.options[0])}
	style:--r2={ratioOf(quiz.options[1])}
	style:--r3={ratioOf(quiz.options[2])}
	style:--r4={ratioOf(quiz.options[3])}
	style:--ratio-sum={quiz.options.reduce((sum, option) => sum + ratioOf(option), 0)}
	class="tiles-frame"
>
	<ol class="tiles" aria-label={m.review.quiz.options}>
		{#each quiz.options as option, index (option.artwork?.id ?? option.label)}
			<QuizTile
				answer={quiz.answer}
				{chosen}
				{index}
				{onanswer}
				onenlarge={enlarge}
				{option}
				ratio={ratioOf(option)}
				{saving}
			/>
		{/each}
	</ol>
</div>

<ImageViewer bind:this={viewer} alt={viewed?.alt ?? ''} image={viewed?.image} />

<style>
	.tiles-frame {
		--tile-gap: var(--spacing-6);
		--tile-band: calc(
			var(--spacing-2) + 2 * var(--font-size-lg) * var(--line-height-lg) + var(--spacing-1) +
				var(--font-size-xs) * var(--line-height-xs) + var(--spacing-3)
		);
		--tile-chrome-x: calc(2 * var(--spacing-2) + 2 * var(--border-width-button));
		--tile-chrome-y: calc(var(--spacing-2) + var(--tile-band) + 2 * var(--border-width-button));
		--tile-image-width: calc((100cqw - var(--tile-gap)) / 2 - var(--tile-chrome-x));
		--h1: calc(var(--tile-image-width) / var(--r1) + var(--tile-chrome-y));
		--h2: calc(var(--tile-image-width) / var(--r2) + var(--tile-chrome-y));
		--h3: calc(var(--tile-image-width) / var(--r3) + var(--tile-chrome-y));
		--h4: calc(var(--tile-image-width) / var(--r4) + var(--tile-chrome-y));

		container-type: inline-size;
		width: 100%;
	}

	.tiles {
		position: relative;
		height: calc(max(var(--h1) + var(--h3), var(--h2) + var(--h4)) + var(--tile-gap));
		margin: 0;
		padding: 0;
		list-style: none;
	}

	@media (min-width: 768px) {
		.tiles-frame {
			--tile-gap: var(--spacing-4);
			--tile-height: min(
				100cqh - var(--tile-chrome-y),
				(100cqw - 3 * var(--tile-gap) - 4 * var(--tile-chrome-x)) / var(--ratio-sum)
			);
		}

		.tiles {
			display: flex;
			justify-content: center;
			align-items: flex-start;
			gap: var(--tile-gap);
			height: auto;
		}
	}
</style>
