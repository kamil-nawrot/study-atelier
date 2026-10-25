<script lang="ts">
	import Footprints from '@lucide/svelte/icons/footprints';
	import { Disclosure } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import SmallTicket from '#lib/chronicle/components/SmallTicket/SmallTicket.svelte';
	import type { Visit } from '#lib/chronicle/types/visit.ts';

	type Props = {
		visits: Visit[];
	};

	let { visits }: Props = $props();
</script>

{#if visits.length > 0}
	<Disclosure
		icon={Footprints}
		level={3}
		muted
		open={false}
		title={m.chronicle.artworkVisits(visits.length)}
	>
		<ul>
			{#each visits as visit (visit.id)}
				<li><SmallTicket {visit} /></li>
			{/each}
		</ul>
	</Disclosure>
{/if}

<style>
	ul {
		display: grid;
		gap: var(--spacing-2);
		padding: 0;
		list-style: none;
	}
</style>
