<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Play from '@lucide/svelte/icons/play';
	import { Alert, Button, Icon, Tag, ToggleTag } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import type { WallArtwork } from '#lib/collection/types.ts';
	import { m } from '#lib/i18n/index.ts';
	import {
		type AtelierKnowledge,
		authorsOf,
		type ReviewScope,
		sameScope,
		scopeKey
	} from '../overview.ts';
	import { MIN_ARTWORKS } from '../queue.ts';
	import type { ReviewForm } from '../types.ts';

	type ScopeChoice = {
		scope: ReviewScope;
		waiting: number;
	};

	type Props = {
		known: number;
		fresh: number;
		missing: number;
		nextWhen?: string;
		scopes: ScopeChoice[];
		scope: ReviewScope;
		form: ReviewForm;
		knowledge: AtelierKnowledge;
		troubles: WallArtwork[];
		starting: boolean;
		streak: number;
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
		knowledge,
		troubles,
		starting,
		streak,
		error,
		onscope,
		onform,
		onstart
	}: Props = $props();

	const FORMS: readonly ReviewForm[] = ['mixed', 'flashcards', 'quizzes'];
	const GROUPS = ['settled', 'learning', 'fresh'] as const;

	let waiting = $derived(known + fresh);
	let total = $derived(knowledge.settled + knowledge.learning + knowledge.fresh);

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
				<p class="lead">{m.review.tooFew(MIN_ARTWORKS, missing)}</p>
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
			<div class="go">
				<Button href={resolve('/(app)/atelier/new')} variant="primary">
					{m.atelier.add}
				</Button>
			</div>
		{:else if waiting > 0}
			{#if error}
				<Alert title={m.review.startErrorTitle} tone="danger">{error}</Alert>
			{/if}

			<div class="go">
				<Button disabled={starting} onclick={onstart} variant="primary">
					<Icon icon={Play} size="sm" />
					{m.review.start}
				</Button>
			</div>

			<details class="options">
				<summary>
					{m.review.options}
					<Icon icon={ChevronDown} size="sm" />
				</summary>
				<div class="choices">
					{#if scopes.length > 1}
						<section class="choice" aria-labelledby="review-scope">
							<h2 id="review-scope" class="choice-title">{m.review.scope}</h2>
							<div class="tags">
								{#each scopes as option (scopeKey(option.scope))}
									<ToggleTag
										count={option.waiting}
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
							{#each FORMS as option (option)}
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
			</details>
		{/if}

		<section class="how" aria-labelledby="review-how">
			<h2 id="review-how" class="choice-title">{m.review.howTitle}</h2>
			<p class="caption">{m.review.how}</p>
		</section>
	</div>

	{#if total > 0}
		<aside class="side" aria-labelledby="review-knowledge">
			<section class="knowledge">
				<h2 id="review-knowledge" class="choice-title">{m.review.knowledge}</h2>
				<span class="bar" aria-hidden="true">
					{#each GROUPS as group (group)}
						<span style:flex-grow={knowledge[group]} class="segment {group}"></span>
					{/each}
				</span>
				<dl class="groups">
					{#each GROUPS as group (group)}
						<div class="group">
							<dt>
								<span class="swatch {group}" aria-hidden="true"></span>
								{m.review.knowledgeGroups[group].label}
							</dt>
							<dd class="number">{knowledge[group]}</dd>
							<dd class="caption hint">{m.review.knowledgeGroups[group].hint}</dd>
						</div>
					{/each}
				</dl>
			</section>
			{#if troubles.length > 0}
				<section class="troubles" aria-labelledby="review-troubles">
					<h2 id="review-troubles" class="choice-title">{m.review.troubles}</h2>
					<ul class="trouble-list">
						{#each troubles as artwork (artwork.id)}
							<li>
								<a
									class="trouble"
									href={resolve('/(app)/atelier/[number]', { number: String(artwork.number) })}
								>
									<span class="thumbnail">
										{#if artwork.image?.src}
											<img
												alt=""
												loading="lazy"
												sizes="64px"
												src={artwork.image.src}
												srcset={artwork.image.srcset}
											/>
										{/if}
									</span>
									<span class="trouble-text">
										<cite class="artwork-title">{artwork.title}</cite>
										<span class="caption">{authorsOf(artwork)}</span>
									</span>
								</a>
							</li>
						{/each}
					</ul>
				</section>
			{/if}
		</aside>
	{/if}
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

	.options {
		display: grid;
		gap: var(--spacing-6);
	}

	summary {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-2);
		width: fit-content;
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
		list-style: none;
		cursor: pointer;
	}

	summary::-webkit-details-marker {
		display: none;
	}

	.options[open] summary :global(svg) {
		rotate: 180deg;
	}

	.choices {
		display: grid;
		gap: var(--spacing-6);
		padding-top: var(--spacing-6);
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

	.side {
		display: grid;
		align-content: start;
		gap: var(--spacing-8);
	}

	.knowledge,
	.troubles {
		display: grid;
		gap: var(--spacing-4);
	}

	.bar {
		display: flex;
		gap: var(--border-width-hairline);
		height: var(--spacing-2);
	}

	.segment {
		flex-basis: 0;
	}

	.settled {
		background: var(--color-fg);
	}

	.learning {
		background: var(--color-fg-muted);
	}

	.fresh {
		background: var(--color-tag);
	}

	.groups {
		display: grid;
		gap: var(--spacing-3);
	}

	.group {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 0 var(--spacing-4);
		align-items: baseline;
	}

	dt {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.swatch {
		flex: none;
		width: var(--spacing-2);
		height: var(--spacing-2);
	}

	.number {
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
		font-variant-numeric: tabular-nums;
	}

	.hint {
		grid-column: 1 / -1;
		padding-left: var(--spacing-4);
	}

	.trouble-list {
		display: grid;
		gap: var(--spacing-3);
		padding: 0;
		list-style: none;
	}

	.trouble {
		display: grid;
		grid-template-columns: var(--spacing-16) minmax(0, 1fr);
		gap: var(--spacing-3);
		align-items: center;
		color: inherit;
		text-decoration: none;
	}

	.thumbnail {
		display: block;
		aspect-ratio: 1;
		padding: var(--spacing-1);
		overflow: hidden;
		background: var(--color-mat-bg);
	}

	.thumbnail img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.trouble-text {
		display: grid;
		gap: var(--spacing-1);
		min-width: 0;
	}

	.trouble-text > * {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.trouble:hover .artwork-title {
		text-decoration: underline;
	}

	@media (max-width: 767.98px) {
		.go {
			position: sticky;
			bottom: 0;
			z-index: 1;
			display: grid;
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

	@media (prefers-reduced-motion: no-preference) {
		summary :global(svg) {
			transition: rotate var(--duration-short) ease-out;
		}
	}
</style>
