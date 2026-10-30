<script lang="ts">
	import { PopupButton } from '@study-atelier/ui';
	import { MediaQuery } from 'svelte/reactivity';
	import { m } from '#lib/i18n/i18n.ts';
	import { curiosityOf } from '#lib/career/curiosities/curiosities.ts';
	import { tierDate } from '#lib/career/tier-date/tier-date.ts';
	import { roman } from '#lib/timeline/labels/labels.ts';
	import type { Exhibit } from '#lib/career/types/exhibit.ts';

	type Props = {
		exhibit: Exhibit;
		tier: number;
	};

	let { exhibit, tier }: Props = $props();

	const wide = new MediaQuery('min-width: 768px');

	function unlockedOf(level: number): Exhibit['tiers'][number] | undefined {
		return exhibit.tiers.find((unlocked) => unlocked.tier === level);
	}
</script>

<ol class="lamps">
	{#each exhibit.thresholds as threshold, index (threshold)}
		{@const level = index + 1}
		{@const unlocked = unlockedOf(level)}
		<li>
			{#if unlocked}
				{@const curiosity = curiosityOf(exhibit.code, level)}
				<PopupButton
					align={wide.current ? 'start' : 'end'}
					bare
					hover
					label={m.career.tierLabel(roman(level))}
				>
					{#snippet trigger()}
						<span class="lamp on" class:fresh={curiosity && !unlocked.seenAt}></span>
					{/snippet}
					<div class="tier">
						<p class="caption">{m.career.tierDate(roman(level), tierDate(unlocked.unlockedAt))}</p>
						{#if curiosity}
							<p>
								{curiosity.text}
								<a href={curiosity.source} rel="external noreferrer" target="_blank"
									>{m.career.source}</a
								>
							</p>
						{/if}
					</div>
				</PopupButton>
			{:else}
				<span class="lamp" class:on={index < tier} aria-hidden="true"></span>
			{/if}
		</li>
	{/each}
</ol>

<style>
	.lamps {
		position: relative;
		container-type: inline-size;
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
		border: var(--border-width-hairline) solid var(--color-fg-muted);
	}

	.lamp.on {
		border-color: var(--color-case-gold);
		background: var(--color-case-gold);
	}

	.lamp.fresh {
		outline: var(--border-width-hairline) solid var(--color-case-gold);
		outline-offset: var(--border-width-hairline);
	}

	.tier {
		display: grid;
		gap: var(--spacing-2);
		inline-size: calc(100vw - var(--spacing-16));
	}

	@media (min-width: 768px) {
		.tier {
			inline-size: calc(100cqi - var(--spacing-8) - 2 * var(--border-width-base));
		}
	}
</style>
