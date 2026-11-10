<script lang="ts">
	import Layers from '@lucide/svelte/icons/layers';
	import Play from '@lucide/svelte/icons/play';
	import Plus from '@lucide/svelte/icons/plus';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import Sprout from '@lucide/svelte/icons/sprout';
	import {
		Alert,
		Button,
		Disclosure,
		EmptyState,
		Icon,
		PageHeader,
		ToggleTag
	} from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { sameScope, scopeKey } from '#lib/review/overview/overview.ts';
	import type { AtelierKnowledge } from '#lib/review/types/atelier-knowledge.ts';
	import type { ReviewScope } from '#lib/review/types/review-scope.ts';
	import ChoiceTitle from '#lib/review/components/ChoiceTitle/ChoiceTitle.svelte';
	import ReviewKnowledge from '#lib/review/components/ReviewKnowledge/ReviewKnowledge.svelte';
	import ReviewStreak from '#lib/review/components/ReviewStreak/ReviewStreak.svelte';
	import type { ScopeChoice } from '#lib/review/types/scope-choice.ts';
	import { MIN_ARTWORKS } from '#lib/review/queue/queue.ts';
	import type { ReviewForm } from '#lib/review/types/review-form.ts';

	type Props = {
		known: number;
		fresh: number;
		missing: number;
		nextWhen?: string;
		scopes: ScopeChoice[];
		scope: ReviewScope;
		form: ReviewForm;
		forms: readonly ReviewForm[];
		knowledge: AtelierKnowledge;
		troubles: WallArtwork[];
		starting: boolean;
		streak: number;
		reviewedToday?: boolean;
		free?: boolean;
		error?: string;
		onscope: (scope: ReviewScope) => void;
		onform: (form: ReviewForm) => void;
		onstart: () => void;
	};

	let {
		known,
		fresh,
		missing,
		nextWhen,
		scopes,
		scope,
		form,
		forms,
		knowledge,
		troubles,
		starting,
		streak,
		reviewedToday = false,
		free = false,
		error,
		onscope,
		onform,
		onstart
	}: Props = $props();

	let waiting = $derived(known + fresh);

	function scopeLabel(option: ReviewScope): string {
		switch (option.kind) {
			case 'all':
				return m.review.scopes.all;
			case 'seen':
				return m.atelier.filters.fields.seen;
			case 'era': {
				const name = m.eras[option.code].name;
				return name.charAt(0).toLocaleUpperCase('pl') + name.slice(1);
			}
			default:
				return option.name;
		}
	}
</script>

<div class="start">
	<PageHeader lead={m.review.lead} />
	<div class="main">
		{#if missing === 0}
			<div class="round">
				{#if waiting > 0}
					<h2>{m.review.waiting(waiting)}</h2>
					<p class="lead plan">
						{#if known > 0}
							<span class="part"
								><Icon icon={RotateCcw} size="sm" />{m.review.planKnown(known)}</span
							>
						{/if}
						{#if fresh > 0}
							<span class="part"><Icon icon={Sprout} size="sm" />{m.review.planFresh(fresh)}</span>
						{/if}
					</p>
				{:else}
					<h2>{m.review.allDoneTitle}</h2>
					{#if nextWhen}
						<p class="lead">{m.review.allDone(nextWhen)}</p>
					{/if}
				{/if}
			</div>
		{/if}
		{#if streak > 0}
			<ReviewStreak {reviewedToday} {streak} />
		{/if}

		{#if missing > 0}
			<EmptyState
				icon={Layers}
				text={m.review.tooFew(MIN_ARTWORKS, missing)}
				title={m.review.tooFewTitle(MIN_ARTWORKS)}
			>
				<Button href={resolve('/(app)/atelier/new')}>
					<Icon icon={Plus} />
					{m.atelier.add}
				</Button>
			</EmptyState>
		{:else if waiting > 0 || free}
			{#if error}
				<Alert title={m.review.startErrorTitle} tone="danger">{error}</Alert>
			{/if}

			<div class="go">
				<Button disabled={starting} onclick={onstart} variant="primary">
					<Icon icon={Play} size="sm" />
					{starting ? m.review.preparing : waiting > 0 ? m.review.start : m.review.free}
				</Button>
				{#if waiting === 0}
					<p class="caption">{m.review.freeHint}</p>
				{/if}
			</div>

			<Disclosure open={false} plain title={m.review.options}>
				<div class="choices">
					{#if scopes.length > 1}
						<section class="choice" aria-labelledby="review-scope">
							<ChoiceTitle id="review-scope" level={3} text={m.review.scope} />
							<div class="tags">
								{#each scopes as option (scopeKey(option.scope))}
									<ToggleTag
										count={option.count}
										bind:pressed={
											() => sameScope(option.scope, scope),
											(pressed) => pressed && onscope(option.scope)
										}
									>
										{scopeLabel(option.scope)}
									</ToggleTag>
								{/each}
							</div>
						</section>
					{/if}
					<section class="choice" aria-labelledby="review-form">
						<ChoiceTitle id="review-form" level={3} text={m.review.form} />
						<div class="tags">
							{#each forms as option (option)}
								<ToggleTag
									bind:pressed={() => form === option, (pressed) => pressed && onform(option)}
								>
									{m.review.forms[option]}
								</ToggleTag>
							{/each}
						</div>
						<p class="caption">{m.review.formHints[form]}</p>
					</section>
				</div>
			</Disclosure>
		{/if}
	</div>

	<ReviewKnowledge {knowledge} {troubles} />
</div>

<style>
	.start {
		display: grid;
		gap: var(--spacing-6) var(--spacing-12);
		width: 100%;
		max-width: var(--size-content-wide);
	}

	.main {
		display: grid;
		align-content: start;
		gap: var(--spacing-8);
	}

	.round {
		display: grid;
		gap: var(--spacing-2);
	}

	.plan {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-1) var(--spacing-6);
	}

	.part {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-2);
	}

	.go {
		display: grid;
		justify-items: start;
		gap: var(--spacing-2);
	}

	.choices {
		display: grid;
		gap: var(--spacing-6);
	}

	.choice {
		display: grid;
		gap: var(--spacing-3);
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2);
	}

	@media (max-width: 767.98px) {
		.go {
			position: sticky;
			bottom: 0;
			z-index: 1;
			justify-items: stretch;
			padding: var(--spacing-4) 0;
			border-top: var(--border-width-hairline) solid var(--color-tag);
			background: var(--color-bg);
		}
	}

	@media (min-width: 768px) {
		.start {
			grid-template-columns: minmax(0, 1fr) 360px;
		}

		.start > :global(.page-header) {
			grid-column: 1 / -1;
		}
	}
</style>
