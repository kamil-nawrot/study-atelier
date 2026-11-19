<script lang="ts">
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash from '@lucide/svelte/icons/trash-2';
	import { onMount } from 'svelte';
	import { Button, LoadFailure, Toast } from '@study-atelier/ui';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { m } from '#lib/i18n/i18n.ts';
	import BackLink from '#lib/shared/navigation/BackLink/BackLink.svelte';
	import FixBar from '#lib/backroom/components/FixBar/FixBar.svelte';
	import MoreActions from '#lib/shared/navigation/MoreActions/MoreActions.svelte';
	import FlagButton, { flagAction } from '#lib/backroom/components/FlagButton/FlagButton.svelte';
	import ItemFlagDialog from '#lib/backroom/components/ItemFlagDialog/ItemFlagDialog.svelte';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import SymbolDeleteDialog from '#lib/symbols/components/SymbolDeleteDialog/SymbolDeleteDialog.svelte';
	import SymbolView from '#lib/symbols/components/SymbolView/SymbolView.svelte';
	import { canAddMeaning } from '#lib/symbols/meaning-edits/meaning-edits.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const glossaryPath = resolve('/(app)/atelier/glossary');

	let toast: Toast;
	let view: ReturnType<typeof SymbolView> | undefined = $state();
	let deleteOpen = $state(false);
	let flag = $state({ open: false, count: 0 });
	let reordering = $state(false);
	let symbol = $derived(data.symbol);
	let title = $derived(
		symbol
			? symbol.name
			: data.notFound
				? m.symbols.view.notFoundTitle
				: m.symbols.view.loadErrorTitle
	);

	onMount(() => {
		const message = page.state.glossaryMessage;
		if (message === undefined || !symbol) return;
		toast.show(message);
		void goto(resolve('/(app)/atelier/glossary/symbols/[id]', { id: symbol.id }), {
			state: {},
			shallow: true,
			replace: true
		});
	});
</script>

<AtelierLayout email={data.session.user.email ?? ''} {title}>
	{#snippet bar()}
		<BackLink fallbackHref={glossaryPath} fallbackName={m.glossary.back} />
		<FixBar />
		{#if symbol}
			{#if symbol.meanings.length > 1}
				{@const label = reordering ? m.symbols.view.reorderDone : m.symbols.view.reorder}
				<Button
					aria-label={label}
					compact
					icon={ArrowUpDown}
					onclick={() => (reordering = !reordering)}
					variant={reordering ? 'primary' : 'secondary'}
				>
					{label}
				</Button>
			{/if}
			{#if canAddMeaning(symbol) && !reordering}
				<Button
					aria-label={m.symbols.meaningDialog.add}
					compact
					icon={Plus}
					onclick={() => view?.addMeaning()}
				>
					{m.symbols.meaningDialog.add}
				</Button>
			{/if}
			<Button
				aria-label={m.common.edit}
				compact
				href={resolve('/(app)/atelier/glossary/symbols/[id]/edit', { id: symbol.id })}
				icon={Pencil}
			>
				{m.common.edit}
			</Button>
			<MoreActions
				actions={[
					{ label: m.common.delete, icon: Trash, onclick: () => (deleteOpen = true), danger: true },
					flagAction(() => (flag.open = true), flag.count)
				]}
			>
				<Button
					aria-label={m.common.delete}
					compact
					icon={Trash}
					onclick={() => (deleteOpen = true)}
					variant="danger"
				>
					{m.common.delete}
				</Button>
				<FlagButton count={flag.count} onclick={() => (flag.open = true)} />
			</MoreActions>
		{/if}
	{/snippet}

	{#if symbol}
		<SymbolView bind:this={view} page={data} {reordering} {symbol} />
	{:else}
		<LoadFailure
			backHref={glossaryPath}
			backLabel={m.glossary.back}
			heading={title}
			message={data.notFound ? m.symbols.view.notFound : (data.error ?? '')}
			notFound={data.notFound === true}
		/>
	{/if}
</AtelierLayout>

<Toast bind:this={toast} />

{#if symbol}
	<SymbolDeleteDialog {symbol} bind:open={deleteOpen} />
	<ItemFlagDialog
		flagsOf={{ symbolId: symbol.id }}
		groups={[
			{
				item: { kind: 'symbol', id: symbol.id, name: symbol.name },
				reasons: ['meaning', 'other']
			}
		]}
		oncount={(count) => (flag.count = count)}
		onflagged={(message) => toast.show(message)}
		bind:open={flag.open}
	/>
{/if}
