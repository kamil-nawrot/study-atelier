<script lang="ts">
	import Flag from '@lucide/svelte/icons/flag';
	import ListChecks from '@lucide/svelte/icons/list-checks';
	import { onMount } from 'svelte';
	import { Alert, Button, EmptyState, PageHeader, Tabs, Toast } from '@study-atelier/ui';
	import type { ResolvedPathname } from '$app/types';
	import BackroomList from '#lib/backroom/components/BackroomList/BackroomList.svelte';
	import { flagRows, missingRows } from '#lib/backroom/backroom-rows/backroom-rows.ts';
	import { flagCount } from '#lib/backroom/flag-count/flag-count.svelte.ts';
	import { fixSession } from '#lib/backroom/fix-session/fix-session.svelte.ts';
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

	let flagged = $derived(flagRows(flags, artworks, terms));
	let missing = $derived(missingRows(artworks, terms));
	let shown = $derived(tab === 'flags' ? flagged : missing);

	onMount(() => {
		fixSession.clear();
		void flagCount.refresh();
		if (message) toast.show(message);
	});

	function fix(index: number, queue: boolean): void {
		fixSession.start(
			shown.map((row) => row.entry),
			index,
			queue
		);
	}
</script>

<PageHeader lead={m.backroom.lead} />

<Tabs label={m.backroom.title} {tabs} bind:value={tab}>
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
		<BackroomList onfix={(index) => fix(index, false)} {onimage} rows={shown} />
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
