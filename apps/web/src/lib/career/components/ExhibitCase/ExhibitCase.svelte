<script lang="ts">
	import Info from '@lucide/svelte/icons/info';
	import { Icon, Meter, PopupButton, Tag, Tooltip } from '@study-atelier/ui';
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
		<div class="corner">
			<PopupButton align="end" label={m.career.about} tooltip>
				{#snippet trigger()}
					<Icon icon={Info} size="sm" />
				{/snippet}
				<div class="about">
					<p>{hidden && 'hint' in texts ? texts.hint : texts.about}</p>
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
		</div>
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
		{#if next === undefined}
			<p class="caption">{m.career.top}</p>
		{:else if !hidden}
			<Meter label={name} max={next} value={exhibit.value} />
			<p class="caption">{m.career.progress(exhibit.value, next)}</p>
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
		isolation: isolate;
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
		display: flex;
	}

	.lamp {
		display: block;
		padding: 0;
		inline-size: var(--spacing-3);
		block-size: var(--spacing-3);
		border: var(--border-width-hairline) solid var(--color-fg-muted);
	}

	.lamp.on {
		border-color: var(--color-case-gold);
		background: var(--color-case-gold);
	}

	.corner {
		position: absolute;
		top: var(--spacing-2);
		right: var(--spacing-2);
		z-index: 2;
	}

	.about {
		display: grid;
		gap: var(--spacing-3);
		inline-size: min(var(--size-content-narrow), calc(100vw - var(--spacing-12)));
	}
</style>
