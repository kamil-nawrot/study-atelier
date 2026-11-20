<script lang="ts">
	import Flag from '@lucide/svelte/icons/flag';
	import ListChecks from '@lucide/svelte/icons/list-checks';
	import { onMount } from 'svelte';
	import { Alert, Button, EmptyState, PageHeader, Tabs, Toast } from '@study-atelier/ui';
	import ListTools from '#lib/shared/lists/ListTools/ListTools.svelte';
	import { normalizeForSearch } from '#lib/shared/utils/search/search.ts';
	import { refreshAll } from '$app/navigation';
	import type { ResolvedPathname } from '$app/types';
	import { deleteFlag } from '#lib/backroom/backroom-data/backroom-data.ts';
	import { restoreFlag } from '#lib/backroom/flags-data/flags-data.ts';
	import { fixStart } from '#lib/backroom/fix-entries/fix-entries.ts';
	import BackroomList from '#lib/backroom/components/BackroomList/BackroomList.svelte';
	import { flagRows, missingRows } from '#lib/backroom/backroom-rows/backroom-rows.ts';
	import { flagCount } from '#lib/backroom/flag-count/flag-count.svelte.ts';
	import { fixSession } from '#lib/backroom/fix-session/fix-session.svelte.ts';
	import type { BackroomRow } from '#lib/backroom/types/backroom-row.ts';
	import type { BackroomTerm } from '#lib/backroom/types/backroom-term.ts';
	import type { BrokenImage } from '#lib/backroom/types/broken-image.ts';
	import type { FlagRecord } from '#lib/backroom/types/flag-record.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		flags: readonly FlagRecord[];
		artworks: readonly WallArtwork[];
		terms: readonly BackroomTerm[];
		brokenImages?: readonly BrokenImage[];
		error?: string;
		message?: string;
		onimage?: (artwork: WallArtwork) => void;
	};

	let { flags, artworks, terms, brokenImages = [], error, message, onimage }: Props = $props();

	let toast: Toast;
	let tab = $state('flags');
	const tabs = [
		{ value: 'flags', label: m.backroom.tabs.flags },
		{ value: 'missing', label: m.backroom.tabs.missing }
	];

	let fixed = $state<string[]>([]);
	let busy = $state<string>();
	let failure = $state<string>();
	let flagged = $derived(
		flagRows(
			flags.filter((flag) => !fixed.includes(flag.id)),
			artworks,
			terms
		)
	);
	let missing = $derived(missingRows(artworks, terms, brokenImages));
	let shown = $derived(tab === 'flags' ? flagged : missing);
	let query = $state('');
	let term = $derived(normalizeForSearch(query));
	let visible = $derived(
		term ? shown.filter((row) => normalizeForSearch(row.title).includes(term)) : shown
	);

	onMount(() => {
		fixSession.clear();
		void flagCount.refresh();
		if (message) toast.show(message);
	});

	function fix(index: number, queue: boolean): void {
		const row = visible[index];
		const start = fixStart(
			shown.map((item) => item.entry),
			Math.max(0, shown.indexOf(row))
		);
		fixSession.start(start.entries, start.position, queue);
	}

	async function markFixed(row: BackroomRow): Promise<void> {
		const flag = row.flag;
		if (!flag || busy) return;
		busy = flag.id;
		const { error } = await deleteFlag(flag.id);
		busy = undefined;
		failure = error;
		if (error) return;
		fixed = [...fixed, flag.id];
		void flagCount.refresh();
		toast.show(m.backroom.markedFixed, { label: m.backroom.undo, run: () => void undo(flag) });
	}

	async function undo(flag: FlagRecord): Promise<void> {
		const { error } = await restoreFlag(flag);
		failure = error;
		if (error) return;
		await refreshAll();
		fixed = fixed.filter((id) => id !== flag.id);
		void flagCount.refresh();
	}
</script>

<PageHeader lead={m.backroom.lead}>
	{#snippet aside()}
		{#if !error && shown.length > 0}
			<span class="caption">{m.backroom.count(visible.length)}</span>
		{/if}
	{/snippet}
</PageHeader>

<Tabs label={m.backroom.title} {tabs} bind:value={tab}>
	{#if failure}
		<Alert title={m.backroom.fixErrorTitle} tone="danger">
			{failure}
		</Alert>
	{/if}
	{#if error}
		<Alert title={m.backroom.loadErrorTitle} tone="danger">
			{error}
		</Alert>
	{:else if shown.length === 0}
		<EmptyState
			icon={Flag}
			text={tab === 'flags' ? m.backroom.emptyFlags : m.backroom.emptyMissing}
			title={tab === 'flags' ? m.backroom.emptyFlagsTitle : m.backroom.emptyMissingTitle}
		/>
	{:else}
		<div class="tools">
			<ListTools searchLabel={m.backroom.search} sortLabel="" bind:query>
				{#snippet actions()}
					<Button
						href={(visible[0] ?? shown[0]).entry.path as ResolvedPathname}
						icon={ListChecks}
						onclick={() => fix(0, true)}
					>
						{m.backroom.fixAll}
					</Button>
				{/snippet}
			</ListTools>
		</div>
		{#if visible.length === 0}
			<p class="no-results">{m.backroom.noResults(query.trim())}</p>
		{/if}
		<BackroomList
			{busy}
			onfix={(index) => fix(index, false)}
			onfixed={markFixed}
			{onimage}
			rows={visible}
		/>
	{/if}
</Tabs>

<Toast bind:this={toast} />

<style>
	.tools {
		padding-bottom: var(--spacing-2);
	}

	.no-results {
		color: var(--color-fg-muted);
	}
</style>
