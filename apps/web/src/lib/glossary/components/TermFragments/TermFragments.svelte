<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { Disclosure, IconButton } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { formatRecordNumber } from '#lib/catalogue/record-number/record-number.ts';
	import type { TermFragment } from '#lib/glossary/types/term-fragment.ts';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		fragments: readonly TermFragment[];
	};

	let { fragments }: Props = $props();

	let strip = $state<HTMLUListElement>();
	let atStart = $state(true);
	let atEnd = $state(true);
	let failed = $state<ReadonlySet<string>>(new Set());

	function measure(): void {
		if (!strip) return;
		atStart = strip.scrollLeft <= 1;
		atEnd = strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 1;
	}

	$effect(() => {
		if (!strip) return;
		void fragments.length;
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(strip);
		return () => observer.disconnect();
	});

	function scroll(direction: -1 | 1): void {
		strip?.scrollBy({ left: direction * strip.clientWidth * 0.8, behavior: 'smooth' });
	}

	function cropFailed(fragment: TermFragment): void {
		failed = new Set([...failed, fragment.pinId]);
	}
</script>

<section aria-labelledby="glossary-fragments">
	<Disclosure
		id="glossary-fragments"
		count={fragments.length}
		room
		title={m.glossary.view.fragments}
	>
		<div class="strip" class:scrolls={!atStart || !atEnd}>
			<span class="arrow">
				<IconButton
					disabled={atStart}
					icon={ChevronLeft}
					label={m.glossary.view.fragmentsBack}
					onclick={() => scroll(-1)}
				/>
			</span>
			<ul bind:this={strip} onscroll={measure}>
				{#each fragments as fragment (fragment.pinId)}
					{@const thumbnail = fragment.thumbnail}
					<li>
						<a
							href="{resolve('/(app)/atelier/[number]', {
								number: String(fragment.number)
							})}?pin={encodeURIComponent(fragment.pinId)}"
							title={fragment.text || undefined}
						>
							<span class="lens">
								{#if fragment.crop && !failed.has(fragment.pinId)}
									<img alt="" onerror={() => cropFailed(fragment)} src={fragment.crop} />
								{:else if thumbnail.src}
									<img
										style:left="{thumbnail.left}%"
										style:top="{thumbnail.top}%"
										style:width="{thumbnail.width}%"
										style:height="{thumbnail.height}%"
										class="view"
										alt=""
										src={thumbnail.src}
									/>
								{/if}
								<svg class="ring" aria-hidden="true" viewBox="0 0 100 100">
									<circle cx="50" cy="50" r="49" />
								</svg>
							</span>
							<span class="title">{fragment.title}</span>
							<span class="number">{formatRecordNumber(fragment.number)}</span>
						</a>
					</li>
				{/each}
			</ul>
			<span class="arrow">
				<IconButton
					disabled={atEnd}
					icon={ChevronRight}
					label={m.glossary.view.fragmentsForward}
					onclick={() => scroll(1)}
				/>
			</span>
		</div>
	</Disclosure>
</section>

<style>
	.strip {
		--fragment-lens: 128px;

		display: grid;
		grid-template-columns: minmax(0, 1fr);
		align-items: start;
		gap: var(--spacing-4);
	}

	.arrow {
		display: none;
		padding-top: calc(var(--fragment-lens) / 2 - var(--size-control) / 2);
	}

	ul {
		display: flex;
		gap: var(--spacing-6);
		overflow-x: auto;
		padding: 0 0 var(--spacing-2);
		list-style: none;
		scroll-snap-type: x proximity;
		scrollbar-width: thin;
	}

	li {
		flex: 0 0 var(--fragment-lens);
		scroll-snap-align: start;
	}

	a {
		display: grid;
		justify-items: center;
		gap: var(--spacing-2);
		color: var(--color-fg);
		text-align: center;
		text-decoration: none;
	}

	.lens {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		width: var(--fragment-lens);
		height: var(--fragment-lens);
		background: var(--color-mat-window);
		clip-path: circle(50%);
	}

	.ring {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		fill: none;
		stroke: var(--color-line);
		stroke-width: var(--border-width-hairline);
		vector-effect: non-scaling-stroke;
	}

	.lens > img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.lens > img.view {
		position: absolute;
		max-width: none;
		object-fit: fill;
	}

	a:hover .ring,
	a:focus-visible .ring {
		stroke: var(--color-fg-muted);
	}

	.title {
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-md);
		font-style: italic;
		line-height: var(--line-height-md);
	}

	.number {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
		letter-spacing: var(--letter-spacing-wide);
	}

	@media (min-width: 768px) {
		.strip {
			--fragment-lens: 160px;
		}

		.strip.scrolls {
			grid-template-columns: auto minmax(0, 1fr) auto;
		}

		.strip.scrolls .arrow {
			display: block;
		}
	}
</style>
