<script lang="ts">
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		index: number;
		answer: number;
		chosen?: number;
	};

	let { index, answer, chosen }: Props = $props();
</script>

{#if chosen !== undefined && index === answer}
	<span class="visually-hidden">, {m.review.quiz.rightOption}</span>
{:else if index === chosen}
	<span class="visually-hidden">, {m.review.quiz.chosenOption}</span>
{/if}
