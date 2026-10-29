<script lang="ts">
	import { Alert } from '@study-atelier/ui';
	import type { GlossaryEntry } from '#lib/glossary/types/glossary-entry.ts';
	import DefinitionQuiz from '#lib/review/components/DefinitionQuiz/DefinitionQuiz.svelte';
	import Flashcard from '#lib/review/components/Flashcard/Flashcard.svelte';
	import Quiz from '#lib/review/components/Quiz/Quiz.svelte';
	import ReviewStart from '#lib/review/components/ReviewStart/ReviewStart.svelte';
	import ReviewSummary from '#lib/review/components/ReviewSummary/ReviewSummary.svelte';
	import { formatWhen } from '#lib/review/overview/overview.ts';
	import type { ReviewFlow } from '#lib/review/review-flow/review-flow.svelte.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import type { RankForm } from '#lib/profile/types/rank-form.ts';

	type Props = {
		flow: ReviewFlow;
		error?: string;
		glossary?: GlossaryEntry[];
		streak: number;
		rankForm?: RankForm;
	};

	let { flow, error, glossary, streak, rankForm }: Props = $props();
</script>

{#if error}
	<Alert title={m.review.loadErrorTitle} tone="danger">{error}</Alert>
{:else if flow.phase === 'session' && flow.session && flow.current}
	{@const session = flow.session}
	{@const current = flow.current}
	{#key `${session.position}:${current.mode === 'quiz_definition' ? current.term.id : current.artwork.id}`}
		{#if current.mode === 'quiz_definition'}
			<DefinitionQuiz
				chosen={session.chosen}
				item={current}
				onanswer={(choice) => flow.answer(choice)}
				onnext={() => flow.proceed()}
			/>
		{:else if current.quiz}
			<Quiz
				chosen={session.chosen}
				details={flow.details.get(current.artwork.id)}
				error={session.error}
				item={{ ...current, quiz: current.quiz }}
				onanswer={(choice) => flow.answer(choice)}
				onnext={() => flow.proceed()}
				saving={session.saving}
			/>
		{:else}
			<Flashcard
				details={flow.details.get(current.artwork.id)}
				error={session.error}
				{glossary}
				item={current}
				onrate={(rating) => flow.rate(rating)}
				onreveal={() => flow.reveal()}
				revealed={session.revealed}
				saving={session.saving}
			/>
		{/if}
	{/key}
{:else if flow.phase === 'summary' && flow.summary}
	<ReviewSummary
		count={flow.summary.count}
		free={flow.summary.free}
		freeOpen={flow.freeOpen}
		groups={flow.summary.groups.map((group) => ({
			...group,
			artworks: group.artworks.map((artwork) => flow.withImage(artwork))
		}))}
		minutes={flow.summary.minutes}
		nextRound={flow.waiting}
		onfree={() => flow.start()}
		onnext={() => flow.start()}
		{rankForm}
		tomorrow={flow.summary.tomorrow}
	/>
{:else}
	<ReviewStart
		definitions={flow.definitionCount}
		definitionsOn={flow.definitions}
		error={flow.startError}
		form={flow.activeForm}
		forms={flow.forms}
		free={flow.freeOpen}
		fresh={flow.counts.fresh}
		knowledge={flow.knowledge}
		known={flow.counts.known}
		missing={flow.missing}
		nextWhen={flow.nextDate ? formatWhen(flow.nextDate, flow.now) : undefined}
		ondefinitions={(on) => (flow.definitions = on)}
		onform={(chosen) => (flow.form = chosen)}
		onscope={(chosen) => flow.chooseScope(chosen)}
		onstart={() => flow.start()}
		scope={flow.activeScope}
		scopes={flow.scopes}
		starting={flow.starting}
		{streak}
		troubles={flow.hard}
	/>
{/if}
