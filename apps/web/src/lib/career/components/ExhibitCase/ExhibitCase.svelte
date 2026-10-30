<script lang="ts">
	import Info from '@lucide/svelte/icons/info';
	import { Meter, PopupButton, Tag } from '@study-atelier/ui';
	import { MediaQuery } from 'svelte/reactivity';
	import { m } from '#lib/i18n/i18n.ts';
	import ExhibitFrame from '#lib/career/components/ExhibitFrame/ExhibitFrame.svelte';
	import TierLamps from '#lib/career/components/TierLamps/TierLamps.svelte';
	import {
		hasNewTier,
		isHidden,
		metalOf,
		nextThreshold,
		reachedTier
	} from '#lib/career/exhibits/exhibits.ts';
	import { roman } from '#lib/timeline/labels/labels.ts';
	import type { Exhibit } from '#lib/career/types/exhibit.ts';
	import type { ExhibitTexts } from '#lib/career/types/exhibit-texts.ts';

	type Props = {
		exhibit: Exhibit;
	};

	let { exhibit }: Props = $props();

	const wide = new MediaQuery('min-width: 768px');

	let texts = $derived(
		(m.career.exhibits as Record<string, ExhibitTexts>)[exhibit.code] ?? {
			name: exhibit.code,
			about: ''
		}
	);
	let tier = $derived(reachedTier(exhibit));
	let total = $derived(exhibit.thresholds.length);
	let next = $derived(nextThreshold(exhibit));
	let hidden = $derived(isHidden(exhibit));
	let metal = $derived(metalOf(tier, total));
	let name = $derived(hidden ? m.career.hiddenName : texts.name);
	let summary = $derived(
		hidden ? texts.hint : texts.count ? texts.count(exhibit.value, next) : texts.awarded
	);
</script>

<article class="exhibit">
	<ExhibitFrame code={exhibit.code} {metal} numeral={tier > 0 ? roman(tier) : undefined}>
		{#if !hidden}
			<PopupButton align={wide.current ? 'end' : 'start'} label={m.career.about} stageIcon={Info}>
				<p class="about">{texts.about}</p>
			</PopupButton>
		{/if}
	</ExhibitFrame>
	<div class="label">
		<header>
			<h3>
				{#if hidden}
					{name}
				{:else}
					<cite class="artwork-title">{name}</cite>
				{/if}
			</h3>
			{#if hasNewTier(exhibit)}
				<Tag>{m.career.new}</Tag>
			{/if}
		</header>
		{#if tier > 0}
			<p class="visually-hidden">{m.career.tier(roman(tier), roman(total))}</p>
		{/if}
		{#if !hidden}
			<TierLamps {exhibit} {tier} />
		{/if}
		{#if next !== undefined && texts.count && !hidden}
			<Meter label={name} max={next} value={exhibit.value} />
		{/if}
		{#if summary}
			<p class="caption">{summary}</p>
		{/if}
	</div>
</article>

<style>
	.exhibit {
		display: grid;
		grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
		align-items: start;
		gap: var(--spacing-3);
	}

	@media (min-width: 768px) {
		.exhibit {
			grid-template-rows: auto 1fr;
			grid-template-columns: none;
		}
	}

	.about {
		inline-size: min(var(--size-content-narrow), calc(100vw - var(--spacing-24)));
	}

	.label {
		display: grid;
		align-content: start;
		gap: var(--spacing-2);
	}

	header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--spacing-2);
	}
</style>
