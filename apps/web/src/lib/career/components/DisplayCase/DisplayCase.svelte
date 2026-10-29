<script lang="ts">
	import ExhibitCase from '#lib/career/components/ExhibitCase/ExhibitCase.svelte';
	import type { Exhibit } from '#lib/career/types/exhibit.ts';

	type Props = {
		exhibits: Exhibit[];
	};

	let { exhibits }: Props = $props();

	const METALS = ['none', 'iron', 'bronze', 'silver', 'gold', 'glow'] as const;
	const LINES = '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -1.4 -1.4 -1.4 0 1.9';
</script>

<svg class="filters" aria-hidden="true">
	{#each METALS as metal (metal)}
		<filter id="metal-{metal}" color-interpolation-filters="sRGB" height="1" width="1" x="0" y="0">
			<feColorMatrix in="SourceGraphic" result="lines" type="matrix" values={LINES} />
			<feFlood class={metal} result="metal" />
			<feComposite in="metal" in2="lines" operator="in" />
		</filter>
	{/each}
</svg>

<ul class="exhibits">
	{#each exhibits as exhibit (exhibit.code)}
		<li><ExhibitCase {exhibit} /></li>
	{/each}
</ul>

<style>
	.filters {
		position: absolute;
		inline-size: 0;
		block-size: 0;
	}

	.none {
		flood-color: var(--color-case-unlit);
	}

	.iron {
		flood-color: var(--color-case-iron);
	}

	.bronze {
		flood-color: var(--color-case-bronze);
	}

	.silver {
		flood-color: var(--color-case-silver);
	}

	.gold,
	.glow {
		flood-color: var(--color-case-gold);
	}

	.exhibits {
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
		gap: var(--spacing-6);
		list-style: none;
	}

	.exhibits > li {
		display: grid;
	}
</style>
