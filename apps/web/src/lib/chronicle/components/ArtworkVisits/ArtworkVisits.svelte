<script lang="ts">
	import Footprints from '@lucide/svelte/icons/footprints';
	import { Icon } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import SmallTicket from '#lib/chronicle/components/SmallTicket/SmallTicket.svelte';
	import type { Visit } from '#lib/chronicle/types/visit.ts';

	type Props = {
		visits: Visit[];
	};

	let { visits }: Props = $props();
</script>

{#if visits.length > 0}
	<section class="visits" aria-labelledby="artwork-visits">
		<h2 id="artwork-visits" class="caption">
			<Icon icon={Footprints} size="sm" />
			{m.chronicle.artworkVisits(visits.length)}
		</h2>
		<ul>
			{#each visits as visit (visit.id)}
				<li><SmallTicket {visit} /></li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	.visits,
	ul {
		display: grid;
		gap: var(--spacing-2);
	}

	.visits {
		gap: var(--spacing-3);
	}

	h2 {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		font-weight: var(--font-weight-regular);
	}

	ul {
		padding: 0;
		list-style: none;
	}
</style>
