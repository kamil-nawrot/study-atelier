<script lang="ts">
	import Info from '@lucide/svelte/icons/info';
	import { Meter, PopupButton, Tag, Tooltip } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import ExhibitFrame from '#lib/career/components/ExhibitFrame/ExhibitFrame.svelte';
	import {
		hasNewTier,
		isHidden,
		metalOf,
		nextThreshold,
		reachedTier
	} from '#lib/career/exhibits/exhibits.ts';
	import { curiosityOf } from '#lib/career/curiosities/curiosities.ts';
	import { tierDate } from '#lib/career/tier-date/tier-date.ts';
	import { roman } from '#lib/timeline/labels/labels.ts';
	import type { Exhibit } from '#lib/career/types/exhibit.ts';
	import type { ExhibitTexts } from '#lib/career/types/exhibit-texts.ts';

	type Props = {
		exhibit: Exhibit;
	};

	let { exhibit }: Props = $props();

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
	let curiosities = $derived(
		exhibit.tiers.flatMap((unlocked) => {
			const curiosity = curiosityOf(exhibit.code, unlocked.tier);
			return curiosity ? [{ tier: unlocked.tier, ...curiosity }] : [];
		})
	);

	function dateOf(level: number): Date | undefined {
		return exhibit.tiers.find((unlocked) => unlocked.tier === level)?.unlockedAt;
	}
</script>

<article class="exhibit">
	<ExhibitFrame code={exhibit.code} {metal}>
		{#if !hidden}
			<PopupButton align="end" label={m.career.about} stageIcon={Info}>
				<div class="about">
					<p>{texts.about}</p>
					{#each curiosities as curiosity (curiosity.tier)}
						<p>
							<span class="caption">{m.career.tierLabel(roman(curiosity.tier))}</span>
							{curiosity.text}
							<a href={curiosity.source} rel="external noreferrer" target="_blank"
								>{m.career.source}</a
							>
						</p>
					{/each}
				</div>
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
		<p class="caption">
			{tier > 0 ? m.career.tier(roman(tier), roman(total)) : m.career.noTier}
		</p>
		<ol class="lamps">
			{#each exhibit.thresholds as threshold, index (threshold)}
				{@const unlockedAt = dateOf(index + 1)}
				<li>
					{#if unlockedAt}
						<Tooltip text={m.career.tierDate(roman(index + 1), tierDate(unlockedAt))}>
							{#snippet children(id)}
								<button
									class="lamp on"
									aria-describedby={id}
									aria-label={m.career.tierLabel(roman(index + 1))}
									type="button"
								></button>
							{/snippet}
						</Tooltip>
					{:else}
						<span class="lamp" class:on={index < tier} aria-hidden="true"></span>
					{/if}
				</li>
			{/each}
		</ol>
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
		grid-template-rows: auto 1fr;
		gap: var(--spacing-3);
	}

	.about {
		display: grid;
		gap: var(--spacing-3);
		inline-size: min(var(--size-content-narrow), calc(100vw - var(--spacing-12)));
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

	.lamps {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-1);
		padding: 0;
		list-style: none;
	}

	.lamps li {
		display: flex;
	}

	.lamp {
		display: block;
		inline-size: var(--spacing-3);
		block-size: var(--spacing-3);
		padding: 0;
		border: var(--border-width-hairline) solid var(--color-fg-muted);
	}

	.lamp.on {
		border-color: var(--color-case-gold);
		background: var(--color-case-gold);
	}
</style>
