<script lang="ts">
	import { Switch } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import ExhibitRoom from '#lib/career/components/ExhibitRoom/ExhibitRoom.svelte';
	import {
		intoRooms,
		rememberFilters,
		rememberFolded,
		rememberedFilters,
		rememberedFolded,
		type CaseFilters
	} from '#lib/career/rooms/rooms.ts';
	import type { Exhibit } from '#lib/career/types/exhibit.ts';

	type Props = {
		exhibits: Exhibit[];
	};

	let { exhibits }: Props = $props();

	let rooms = $derived(intoRooms(exhibits));
	let folded = $state(rememberedFolded());
	let filters: CaseFilters = $state(rememberedFilters());

	function toggle(code: string): void {
		folded = folded.includes(code) ? folded.filter((other) => other !== code) : [...folded, code];
		rememberFolded(folded);
	}

	function setFilter(key: keyof CaseFilters, value: boolean): void {
		filters = { ...filters, [key]: value };
		rememberFilters(filters);
	}
</script>

<div class="case">
	<div class="filters">
		<Switch
			checked={filters.finished}
			label={m.career.showFinished}
			onchange={(event) => setFilter('finished', event.currentTarget.checked)}
		/>
		<Switch
			checked={filters.locked}
			label={m.career.showLocked}
			onchange={(event) => setFilter('locked', event.currentTarget.checked)}
		/>
	</div>
	<div>
		{#each rooms as room, index (room.code)}
			<ExhibitRoom
				{filters}
				number={index + 1}
				ontoggle={() => toggle(room.code)}
				open={!folded.includes(room.code)}
				{room}
			/>
		{/each}
	</div>
</div>

<style>
	.case {
		display: grid;
		gap: var(--spacing-2);
	}

	.filters {
		display: flex;
		flex-wrap: wrap;
		justify-content: end;
		gap: var(--spacing-2) var(--spacing-6);
	}
</style>
