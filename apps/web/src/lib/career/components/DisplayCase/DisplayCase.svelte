<script lang="ts">
	import ExhibitCase from '#lib/career/components/ExhibitCase/ExhibitCase.svelte';
	import type { Exhibit } from '#lib/career/types/exhibit.ts';

	type Props = {
		exhibits: Exhibit[];
	};

	let { exhibits }: Props = $props();
</script>

<ul class="exhibits">
	{#each exhibits as exhibit (exhibit.code)}
		<li><ExhibitCase {exhibit} /></li>
	{/each}
</ul>

<style>
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
