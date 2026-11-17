<script lang="ts">
	import Flag from '@lucide/svelte/icons/flag';
	import ListChecks from '@lucide/svelte/icons/list-checks';
	import { onMount } from 'svelte';
	import { Alert, Button, EmptyState, PageHeader, Tabs, Toast } from '@study-atelier/ui';
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
	import type { FlagRecord } from '#lib/backroom/types/flag-record.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		flags: readonly FlagRecord[];
		artworks: readonly WallArtwork[];
		terms: readonly BackroomTerm[];
		error?: string;
		message?: string;
		onimage?: (artwork: WallArtwork) => void;
	};

	let { flags, artworks, terms, error, message, onimage }: Props = $props();

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
	let missing = $derived(missingRows(artworks, terms));
	let shown = $derived(tab === 'flags' ? flagged : missing);

	onMount(() => {
		fixSession.clear();
		void flagCount.refresh();
		if (message) toast.show(message);
	});

	function fix(index: number, queue: boolean): void {
		const start = fixStart(
			shown.map((row) => row.entry),
			index
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

<PageHeader lead={m.backroom.lead} />

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
			<Button
				href={shown[0].entry.path as ResolvedPathname}
				icon={ListChecks}
				onclick={() => fix(0, true)}
			>
				{m.backroom.fixAll}
			</Button>
		</div>
		<BackroomList
			{busy}
			onfix={(index) => fix(index, false)}
			onfixed={markFixed}
			{onimage}
			rows={shown}
		/>
	{/if}
</Tabs>

<Toast bind:this={toast} />

<style>
	.tools {
		display: flex;
		justify-content: flex-end;
		padding-bottom: var(--spacing-2);
	}
</style>
