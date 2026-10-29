<script lang="ts">
	import Layers from '@lucide/svelte/icons/layers';
	import Play from '@lucide/svelte/icons/play';
	import Plus from '@lucide/svelte/icons/plus';
	import {
		Alert,
		Button,
		Disclosure,
		EmptyState,
		Icon,
		Switch,
		Tag,
		ToggleTag
	} from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { sameScope, scopeKey } from '#lib/review/overview/overview.ts';
	import type { AtelierKnowledge } from '#lib/review/types/atelier-knowledge.ts';
	import type { ReviewScope } from '#lib/review/types/review-scope.ts';
	import ReviewKnowledge from '#lib/review/components/ReviewKnowledge/ReviewKnowledge.svelte';
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
		free?: boolean;
		definitions?: number;
		definitionsOn?: boolean;
		error?: string;
		onscope: (scope: ReviewScope) => void;
		onform: (form: ReviewForm) => void;
		ondefinitions?: (on: boolean) => void;
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
		free = false,
		definitions,
		definitionsOn = false,
		error,
		onscope,
		onform,
		ondefinitions,
		onstart
	}: Props = $props();

	let waiting = $derived(known + fresh);

	function scopeLabel(option: ReviewScope): string {
		switch (option.kind) {
			case 'all':
				return m.review.scopes.all;
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
	<div class="main">
		<header class="intro">
			{#if missing > 0}
				<h1>{m.review.title}</h1>
			{:else if waiting > 0}
				<h1>{m.review.waiting(waiting)}</h1>
				<p class="lead">{m.review.plan(known, fresh)}</p>
			{:else}
				<h1>{m.review.allDoneTitle}</h1>
				{#if nextWhen}
					<p class="lead">{m.review.allDone(nextWhen)}</p>
				{/if}
			{/if}
			{#if streak > 0}
				<p class="streak">
					<Tag>{m.review.streak(streak)}</Tag>
				</p>
			{/if}
		</header>

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
					{waiting > 0 ? m.review.start : m.review.free}
				</Button>
				{#if waiting === 0}
					<p class="caption">{m.review.freeHint}</p>
				{/if}
			</div>

			<Disclosure open={false} plain title={m.review.options}>
				<div class="choices">
					{#if scopes.length > 1}
						<section class="choice" aria-labelledby="review-scope">
							<h2 id="review-scope" class="choice-title">{m.review.scope}</h2>
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
						<h2 id="review-form" class="choice-title">{m.review.form}</h2>
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
					{#if definitions !== undefined}
						<section class="choice">
							<Switch
								label={m.review.definitions}
								bind:checked={() => definitionsOn, (on) => ondefinitions?.(on)}
							/>
							<p class="caption">{m.review.definitionsHint(definitions)}</p>
						</section>
					{/if}
				</div>
			</Disclosure>
		{/if}

		<section class="how" aria-labelledby="review-how">
			<h2 id="review-how" class="choice-title">{m.review.howTitle}</h2>
			<p class="caption">{m.review.how}</p>
		</section>
	</div>

	<ReviewKnowledge {knowledge} {troubles} />
</div>

<style>
	.start {
		display: grid;
		gap: var(--spacing-12);
		width: 100%;
		max-width: var(--size-content-wide);
	}

	.main {
		display: grid;
		align-content: start;
		gap: var(--spacing-8);
	}

	.intro,
	.how {
		display: grid;
		gap: var(--spacing-2);
	}

	.streak {
		padding-top: var(--spacing-2);
	}

	.how {
		max-width: var(--size-content-narrow);
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

	.choice-title {
		font-size: var(--font-size-md);
		line-height: var(--line-height-md);
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
	}
</style>
