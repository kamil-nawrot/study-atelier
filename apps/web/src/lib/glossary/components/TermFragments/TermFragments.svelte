<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { Disclosure, IconButton } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { formatRecordNumber } from '#lib/catalogue/record-number/record-number.ts';
	import DetailLens from '#lib/pins/components/DetailLens/DetailLens.svelte';
	import type { TermFragment } from '#lib/glossary/types/term-fragment.ts';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		fragments: readonly TermFragment[];
	};

	let { fragments }: Props = $props();

	let strip = $state<HTMLUListElement>();
	let atStart = $state(true);
	let atEnd = $state(true);

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
					<li>
						<a
							href="{resolve('/(app)/atelier/[number]', {
								number: String(fragment.number)
							})}?pin={encodeURIComponent(fragment.pinId)}"
							title={fragment.text || undefined}
						>
							<DetailLens lens={fragment} />
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
		--detail-lens: 128px;

		display: grid;
		grid-template-columns: minmax(0, 1fr);
		align-items: start;
		gap: var(--spacing-4);
	}

	.arrow {
		display: none;
		padding-top: calc(var(--detail-lens) / 2 - var(--size-control) / 2);
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
		flex: 0 0 var(--detail-lens);
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

	a:hover,
	a:focus-visible {
		--detail-lens-ring: var(--color-fg-muted);
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
			--detail-lens: 160px;
		}

		.strip.scrolls {
			grid-template-columns: auto minmax(0, 1fr) auto;
		}

		.strip.scrolls .arrow {
			display: block;
		}
	}
</style>
