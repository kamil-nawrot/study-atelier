<script lang="ts">
	import Footprints from '@lucide/svelte/icons/footprints';
	import { Disclosure } from '@study-atelier/ui';
	import SmallTicket from '#lib/chronicle/components/SmallTicket/SmallTicket.svelte';
	import type { Visit } from '#lib/chronicle/types/visit.ts';

	type Props = {
		visits: Visit[];
		title: (count: number) => string;
		stub?: (visit: Visit) => string;
	};

	let { visits, title, stub }: Props = $props();
</script>

{#if visits.length > 0}
	<div class="visits">
		<Disclosure icon={Footprints} muted open={false} title={title(visits.length)}>
			<ul>
				{#each visits as visit (visit.id)}
					<li><SmallTicket stub={stub?.(visit)} {visit} /></li>
				{/each}
			</ul>
		</Disclosure>
	</div>
{/if}

<style>
	.visits :global(h2) {
		font-size: var(--font-size-md);
		line-height: var(--line-height-md);
	}

	ul {
		display: grid;
		gap: var(--spacing-2);
		padding: 0;
		list-style: none;
	}
</style>
