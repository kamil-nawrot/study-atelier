<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import { Button, Icon, Tabs } from '@study-atelier/ui';
	import { CARD_INDEX_TABS } from '#lib/card-index/card-index-tab/card-index-tab.ts';
	import { loadOwnValues } from '#lib/card-index/card-index-data/card-index-data.ts';
	import { buildTimeline, valuesOf } from '#lib/card-index/card-index/card-index.ts';
	import {
		rememberSort,
		rememberedSort,
		sortsOf,
		type CardIndexSort
	} from '#lib/card-index/card-index-sort/card-index-sort.ts';
	import CardIndexEvents from '#lib/card-index/components/CardIndexEvents/CardIndexEvents.svelte';
	import CardIndexList from '#lib/card-index/components/CardIndexList/CardIndexList.svelte';
	import CardIndexTimeline from '#lib/card-index/components/CardIndexTimeline/CardIndexTimeline.svelte';
	import OwnFieldsTab from '#lib/card-index/components/OwnFieldsTab/OwnFieldsTab.svelte';
	import { withOwnValues } from '#lib/card-index/own-fields/own-fields.ts';
	import { loadOwnFields } from '#lib/card-index/own-fields-data/own-fields-data.ts';
	import { newValuePath, valuePath } from '#lib/card-index/value-pages/value-pages.ts';
	import type { CategoryCode } from '#lib/catalogue/types/category-code.ts';
	import { countryName } from '#lib/catalogue/countries/countries.ts';
	import { formatDate } from '#lib/catalogue/years/years.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import type { OwnField } from '#lib/card-index/types/own-field.ts';
	import type { CardIndexData } from '#lib/catalogue/types/card-index-data.ts';
	import type { CardIndexRecord } from '#lib/catalogue/types/card-index-record.ts';
	import type { TimelineEvent } from '#lib/timeline/types/timeline-event.ts';

	type ListedValue = CardIndexRecord & { country?: string; detail?: string };

	type Props = {
		index: CardIndexData;
		events: TimelineEvent[];
		ownFields: OwnField[];
		ownFieldsError?: string;
		tab: string;
		query: string;
		onmessage: (message: string) => void;
	};

	let {
		index,
		events,
		ownFields,
		ownFieldsError,
		tab = $bindable(),
		query = $bindable(),
		onmessage
	}: Props = $props();

	const tabs = CARD_INDEX_TABS.map((value) => ({
		value,
		label: m.cardIndex.tabs[value],
		end: value === 'own'
	}));

	let sorts = $state<Record<string, CardIndexSort>>(
		Object.fromEntries(CARD_INDEX_TABS.map((value) => [value, rememberedSort(value)]))
	);
	let timeline = $derived(buildTimeline(index));
	let eventRecords = $derived(
		events.map((event) => ({
			id: event.id,
			name: event.name,
			note: formatDate(event.yearFrom, event.yearTo, event.yearApproximate) ?? '',
			year: event.yearFrom ?? event.yearTo ?? undefined
		}))
	);
	let own = $derived({ fields: ownFields, error: ownFieldsError });

	function chooseTab(next: string): void {
		if (next !== tab) query = '';
		tab = next;
	}

	function setSort(value: string, sort: CardIndexSort): void {
		sorts[value] = sort;
		rememberSort(value, sort);
	}

	function listed(kind: 'material' | 'author' | 'location'): ListedValue[] {
		const byCountry = kind === 'location' && sorts.location === 'country';
		return valuesOf(index, kind).map((record) => {
			const country = record.countryCode ? countryName(record.countryCode) : undefined;
			return { ...record, country, detail: byCountry ? country : undefined };
		});
	}

	async function ownFieldsChanged(message?: string): Promise<void> {
		const [definitions, values] = await Promise.all([loadOwnFields(), loadOwnValues()]);
		own = {
			fields: withOwnValues(definitions.fields, values.ownValues),
			error: definitions.error ?? values.error
		};
		if (message) onmessage(message);
	}
</script>

{#snippet adds(kinds: CategoryCode[])}
	<div class="add">
		{#each kinds as kind (kind)}
			<Button href={newValuePath(kind)}>
				<Icon icon={Plus} />
				{m.cardIndex.add[kind]}
			</Button>
		{/each}
	</div>
{/snippet}

<Tabs label={m.cardIndex.tabsLabel} {tabs} bind:value={() => tab, chooseTab}>
	{#if tab === 'timeline'}
		<div class="tab">
			{@render adds(['period', 'style'])}
			<CardIndexTimeline
				{timeline}
				bind:query
				bind:sort={() => sorts.timeline, (sort) => setSort('timeline', sort)}
			/>
		</div>
	{:else if tab === 'material' || tab === 'author' || tab === 'location'}
		{@const kind = tab}
		{#key kind}
			<div class="tab">
				{@render adds([kind])}
				<CardIndexList
					empty={m.cardIndex.emptyList[kind]}
					href={(id) => valuePath(kind, id)}
					records={listed(kind)}
					searchLabel={m.cardIndex.search[kind]}
					sorts={sortsOf(kind)}
					bind:query
					bind:sort={() => sorts[kind], (sort) => setSort(kind, sort)}
				/>
			</div>
		{/key}
	{:else if tab === 'events'}
		<CardIndexEvents
			entries={eventRecords}
			bind:query
			bind:sort={() => sorts.events, (sort) => setSort('events', sort)}
		/>
	{:else if tab === 'own'}
		<OwnFieldsTab error={own.error} fields={own.fields} onchanged={ownFieldsChanged} />
	{/if}
</Tabs>

<style>
	.tab {
		display: grid;
		gap: var(--spacing-6);
	}

	.add {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: var(--spacing-3);
	}
</style>
