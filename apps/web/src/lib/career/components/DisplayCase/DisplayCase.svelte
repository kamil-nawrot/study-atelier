<script lang="ts">
	import { m } from '#lib/i18n/i18n.ts';
	import ExhibitCase from '#lib/career/components/ExhibitCase/ExhibitCase.svelte';
	import type { Exhibit } from '#lib/career/types/exhibit.ts';

	type Props = {
		exhibits: Exhibit[];
	};

	let { exhibits }: Props = $props();
</script>

<h2 class="visually-hidden">{m.career.exhibitsHeading}</h2>
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
