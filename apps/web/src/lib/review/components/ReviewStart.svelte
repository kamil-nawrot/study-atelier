<script lang="ts">
	import Play from '@lucide/svelte/icons/play';
	import { Button, Icon, ToggleTag } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { formatRecordNumber } from '#lib/collection/format.ts';
	import type { WallArtwork } from '#lib/collection/types.ts';
	import { m } from '#lib/i18n/index.ts';
	import { type EraMemory, type ReviewScope, sameScope, scopeKey } from '../overview.ts';

	type Props = {
		known: number;
		fresh: number;
		minutes: number;
		missing: number;
		nextWhen?: string;
		scopes: ReviewScope[];
		scope: ReviewScope;
		memory: EraMemory[];
		troubles: WallArtwork[];
		starting: boolean;
		onscope: (scope: ReviewScope) => void;
		onstart: () => void;
	};

	let {
		known,
		fresh,
		minutes,
		missing,
		nextWhen,
		scopes,
		scope,
		memory,
		troubles,
		starting,
		onscope,
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

	function byline(artwork: WallArtwork): string {
		return [artwork.authors.join(', '), artwork.date].filter(Boolean).join(', ');
	}
</script>

<div class="start">
	<div class="main">
		<header class="intro">
			{#if missing > 0}
				<h1>{m.review.title}</h1>
				<p class="lead">{m.review.tooFew(missing)}</p>
			{:else if waiting > 0}
				<h1>{m.review.waiting(waiting)}</h1>
				<p class="lead">{m.review.plan(known, fresh, minutes)}</p>
			{:else}
				<h1>{m.review.title}</h1>
				{#if nextWhen}
					<p class="lead">{m.review.allDone(nextWhen)}</p>
				{/if}
			{/if}
		</header>

		{#if scopes.length > 1}
			<section class="choice" aria-labelledby="review-scope">
				<h2 id="review-scope" class="choice-title">{m.review.scope}</h2>
				<div class="tags">
					{#each scopes as option (scopeKey(option))}
						<ToggleTag
							bind:pressed={() => sameScope(option, scope), (pressed) => pressed && onscope(option)}
						>
							{scopeLabel(option)}
						</ToggleTag>
					{/each}
				</div>
			</section>
		{/if}

		{#if missing === 0 && waiting > 0}
			<div class="go">
				<Button disabled={starting} onclick={onstart} variant="primary">
					<Icon icon={Play} size="sm" />
					{m.review.start}
				</Button>
			</div>
		{/if}
	</div>

	{#if memory.length > 0 || troubles.length > 0}
		<aside class="side" aria-label={m.review.memory}>
			{#if memory.length > 0}
				<section class="memory" aria-labelledby="review-memory">
					<div class="section-head">
						<h2 id="review-memory" class="choice-title">{m.review.memory}</h2>
						<p class="caption">{m.review.memoryHint}</p>
					</div>
					<ul class="eras">
						{#each memory as era (era.code)}
							<li>
								<span class="era">{m.eras[era.code].name}</span>
								<span class="caption count">{m.review.memoryCount(era.remembered, era.total)}</span>
								<span class="track" aria-hidden="true">
									<span style:width="{(era.remembered / era.total) * 100}%" class="fill"></span>
								</span>
							</li>
						{/each}
					</ul>
				</section>
			{/if}
			{#if troubles.length > 0}
				<section class="troubles" aria-labelledby="review-troubles">
					<h2 id="review-troubles" class="choice-title">{m.review.troubles}</h2>
					<ul class="thumbnails">
						{#each troubles as artwork (artwork.id)}
							<li>
								<a
									class="thumbnail"
									aria-label={`${formatRecordNumber(artwork.number)} ${artwork.title}`}
									href={resolve('/(app)/atelier/[number]', { number: String(artwork.number) })}
									title={[artwork.title, byline(artwork)].filter(Boolean).join(', ')}
								>
									{#if artwork.image?.src}
										<img
											alt=""
											loading="lazy"
											sizes="96px"
											src={artwork.image.src}
											srcset={artwork.image.srcset}
										/>
									{/if}
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

	.intro {
		display: grid;
		gap: var(--spacing-2);
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

	.memory,
	.troubles,
	.section-head {
		display: grid;
		gap: var(--spacing-3);
	}

	.section-head {
		gap: var(--spacing-1);
	}

	.eras {
		display: grid;
		gap: var(--spacing-3);
		padding: 0;
		list-style: none;
	}

	.eras li {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: var(--spacing-1) var(--spacing-4);
		align-items: baseline;
	}

	.era {
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.era::first-letter {
		text-transform: uppercase;
	}

	.count {
		font-variant-numeric: tabular-nums;
	}

	.track {
		grid-column: 1 / -1;
		height: var(--border-width-button);
		background: var(--color-tag);
	}

	.fill {
		display: block;
		height: 100%;
		background: var(--color-fg);
	}

	.thumbnails {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: var(--spacing-2);
		padding: 0;
		list-style: none;
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
</style>
