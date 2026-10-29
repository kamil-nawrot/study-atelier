<script lang="ts">
	import { Disclosure, Meter, Tag } from '@study-atelier/ui';
	import { asset } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import { artOf } from '#lib/career/exhibit-art/exhibit-art.ts';
	import {
		hasNewTier,
		isHidden,
		metalOf,
		nextThreshold,
		reachedTier,
		settingOf
	} from '#lib/career/exhibits/exhibits.ts';
	import { curiosityOf } from '#lib/career/curiosities/curiosities.ts';
	import { tierDate } from '#lib/career/tier-date/tier-date.ts';
	import { roman } from '#lib/timeline/labels/labels.ts';
	import type { Exhibit } from '#lib/career/types/exhibit.ts';

	type Props = {
		exhibit: Exhibit;
	};

	let { exhibit }: Props = $props();

	let texts = $derived(m.career.exhibits[exhibit.code as keyof typeof m.career.exhibits]);
	let art = $derived(artOf(exhibit.code));
	let tier = $derived(reachedTier(exhibit));
	let total = $derived(exhibit.thresholds.length);
	let next = $derived(nextThreshold(exhibit));
	let hidden = $derived(isHidden(exhibit));
	let setting = $derived(settingOf(tier));
	let name = $derived(hidden ? m.career.hiddenName : texts.name);
</script>

<article class="exhibit">
	<div
		class="vitrine"
		class:gilt={setting >= 5}
		class:lit={tier > 0}
		class:side={setting >= 4}
		class:velvet={setting >= 2}
	>
		{#if art}
			<img
				style:filter="url(#metal-{metalOf(tier, total)})"
				class="object"
				alt=""
				src={asset(art.file)}
			/>
		{/if}
		<span class="plinth">
			{#if setting >= 3}
				<span class="plaque">{name}</span>
			{/if}
		</span>
	</div>
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
		<p>{hidden && 'hint' in texts ? texts.hint : texts.about}</p>
		<p class="caption">
			{tier > 0 ? m.career.tier(roman(tier), roman(total)) : m.career.noTier}
		</p>
		<ol class="lamps" aria-hidden="true">
			{#each exhibit.thresholds as threshold, index (threshold)}
				<li class:on={index < tier}></li>
			{/each}
		</ol>
		{#if next === undefined}
			<p class="caption">{m.career.top}</p>
		{:else if !hidden}
			<Meter label={name} max={next} value={exhibit.value} />
			<p class="caption">{m.career.progress(exhibit.value, next)}</p>
		{/if}
		{#if exhibit.tiers.length > 0}
			<Disclosure level={3} open={false} plain title={m.career.tiers}>
				<ol class="dates">
					{#each exhibit.tiers as unlocked (unlocked.tier)}
						{@const curiosity = curiosityOf(exhibit.code, unlocked.tier)}
						<li>
							<span class="caption">
								{m.career.tierDate(roman(unlocked.tier), tierDate(unlocked.unlockedAt))}
							</span>
							{#if curiosity}
								<p>
									{curiosity.text}
									<a href={curiosity.source} rel="external noreferrer" target="_blank"
										>{m.career.source}</a
									>
								</p>
							{/if}
						</li>
					{/each}
				</ol>
			</Disclosure>
		{/if}
	</div>
</article>

<style>
	.exhibit {
		display: grid;
		grid-template-rows: auto 1fr;
		gap: var(--spacing-3);
	}

	.vitrine {
		position: relative;
		display: grid;
		place-items: end center;
		block-size: 15rem;
		overflow: hidden;
		border: var(--border-width-base) solid var(--color-case-unlit);
		background: var(--color-stage-bg);
	}

	.velvet {
		background: radial-gradient(
			ellipse 70% 80% at 50% 10%,
			color-mix(in srgb, var(--color-case-velvet) 70%, var(--color-stage-bg)),
			var(--color-stage-bg)
		);
	}

	.lit::before {
		position: absolute;
		inset: 0;
		background: radial-gradient(
			ellipse 45% 75% at 50% 0%,
			color-mix(in srgb, var(--color-case-gold) 35%, transparent),
			transparent
		);
		content: '';
	}

	.side::after {
		position: absolute;
		inset: 0;
		background: radial-gradient(
			ellipse 40% 60% at 100% 20%,
			color-mix(in srgb, var(--color-case-gold) 22%, transparent),
			transparent
		);
		content: '';
	}

	.gilt {
		border: var(--border-width-heavy) double var(--color-case-gold);
	}

	.object {
		position: relative;
		z-index: 1;
		max-inline-size: 80%;
		max-block-size: 11rem;
		object-fit: contain;
	}

	.plinth {
		position: relative;
		z-index: 1;
		display: grid;
		place-items: center;
		inline-size: 70%;
		block-size: var(--spacing-6);
		background: var(--color-case-unlit);
	}

	.plaque {
		padding-inline: var(--spacing-2);
		overflow: hidden;
		max-inline-size: 90%;
		background: var(--color-case-gold);
		color: var(--color-stage-bg);
		font-size: var(--font-size-xs);
		letter-spacing: var(--letter-spacing-wide);
		text-overflow: ellipsis;
		text-transform: uppercase;
		white-space: nowrap;
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
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-1);
		list-style: none;
	}

	.lamps li {
		inline-size: var(--spacing-3);
		block-size: var(--spacing-3);
		border: var(--border-width-hairline) solid var(--color-fg-muted);
	}

	.lamps .on {
		border-color: var(--color-case-gold);
		background: var(--color-case-gold);
	}

	.dates li {
		display: grid;
		gap: var(--spacing-1);
	}

	.dates {
		padding: 0;
		display: grid;
		gap: var(--spacing-3);
		list-style: none;
	}
</style>
