<script lang="ts">
	import MoreActions from '#lib/shared/navigation/MoreActions/MoreActions.svelte';
	import Check from '@lucide/svelte/icons/check';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash from '@lucide/svelte/icons/trash-2';
	import { MediaQuery } from 'svelte/reactivity';
	import { Button, LoadFailure } from '@study-atelier/ui';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { ResolvedPathname } from '$app/types';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import BackLink from '#lib/shared/navigation/BackLink/BackLink.svelte';
	import DiscardDialog from '#lib/shared/forms/DiscardDialog/DiscardDialog.svelte';
	import { readStored, writeStored } from '#lib/shared/utils/storage/storage.ts';
	import AddPanel from '#lib/exhibitions/components/AddPanel/AddPanel.svelte';
	import ExhibitionBody from '#lib/exhibitions/components/ExhibitionBody/ExhibitionBody.svelte';
	import ExhibitionDeleteDialog from '#lib/exhibitions/components/ExhibitionDeleteDialog/ExhibitionDeleteDialog.svelte';
	import ExhibitionEditorPane from '#lib/exhibitions/components/ExhibitionEditorPane/ExhibitionEditorPane.svelte';
	import SaveStatusText from '#lib/exhibitions/components/SaveStatusText/SaveStatusText.svelte';
	import { addArtworkHref } from '#lib/exhibitions/exhibition-return/exhibition-return.ts';
	import { artworkIdsOf } from '#lib/exhibitions/exhibition-document/exhibition-document.ts';
	import { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';
	import { ExhibitionSession } from '#lib/exhibitions/exhibition-session/exhibition-session.svelte.ts';
	import { ExhibitionLeave } from '#lib/exhibitions/exhibition-leave/exhibition-leave.svelte.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import type { PageProps } from './$types';

	const PANEL_KEY = 'exhibition-panel';

	let { data }: PageProps = $props();

	const listPath = resolve('/(app)/atelier/exhibitions');
	const wide = new MediaQuery('min-width: 768px');
	const lookup = new ArtworkLookup();

	let barHeight = $state(0);
	let deleteOpen = $state(false);
	let panelOpen = $state(readStored('local', PANEL_KEY) !== 'closed');
	let pane = $state<ReturnType<typeof ExhibitionEditorPane>>();

	let session = $derived(data.exhibition ? new ExhibitionSession(data.exhibition) : undefined);
	let editing = $derived(session !== undefined && page.url.searchParams.has('edit'));
	let title = $derived(
		session?.savedTitle ||
			(data.exhibition
				? m.exhibitions.view.titleLabel
				: data.notFound
					? m.exhibitions.view.notFoundTitle
					: m.exhibitions.view.loadErrorTitle)
	);

	$effect(() => lookup.add(data.artworks));
	$effect(() => {
		if (session && !editing) void lookup.checkNotes(artworkIdsOf(session.document));
	});
	$effect(() => () => session?.destroy());
	$effect(() => writeStored('local', PANEL_KEY, panelOpen ? 'open' : 'closed'));

	const leave = new ExhibitionLeave(() => session);

	async function setEditing(on: boolean): Promise<void> {
		if (!data.exhibition) return;
		await session?.flush();
		const path = resolve('/(app)/atelier/exhibitions/[id]', { id: data.exhibition.id });
		await leave.switchMode(() =>
			goto((on ? `${path}?edit` : path) as ResolvedPathname, { replaceState: true })
		);
	}

	async function moved(): Promise<void> {
		await goto(listPath, { refreshAll: true, state: { exhibitionMessage: m.exhibitions.moved } });
	}
</script>

<svelte:window onbeforeunload={(event) => session?.dirty && event.preventDefault()} />

<AtelierLayout email={data.session.user.email ?? ''} task={editing} {title} bind:barHeight>
	{#snippet bar()}
		<BackLink fallbackHref={listPath} fallbackName={m.exhibitions.view.back} />
		{#if session && data.exhibition}
			{#if editing}
				<SaveStatusText status={session.status} />
				<Button
					aria-label={m.exhibitions.view.done}
					compact
					icon={Check}
					onclick={() => setEditing(false)}
					variant="primary"
				>
					{m.exhibitions.view.done}
				</Button>
			{:else}
				<Button
					aria-label={m.exhibitions.view.edit}
					compact
					icon={Pencil}
					onclick={() => setEditing(true)}
				>
					{m.exhibitions.view.edit}
				</Button>
				<MoreActions
					actions={[
						{
							label: m.exhibitions.view.delete,
							icon: Trash,
							onclick: () => (deleteOpen = true),
							danger: true
						}
					]}
				>
					<Button
						aria-label={m.exhibitions.view.delete}
						compact
						icon={Trash}
						onclick={() => (deleteOpen = true)}
						variant="danger"
					>
						{m.exhibitions.view.delete}
					</Button>
				</MoreActions>
			{/if}
		{/if}
	{/snippet}

	{#snippet panel()}
		{#if editing && wide.current && data.exhibition}
			<AddPanel
				addHref={addArtworkHref(data.exhibition.id)}
				{lookup}
				onadd={(block) => pane?.add(block)}
				ondrag={(event, block) => pane?.dragNew(event, block)}
				symbols={data.symbols}
				terms={data.glossary}
				bind:open={panelOpen}
			/>
		{/if}
	{/snippet}

	{#if session && data.exhibition}
		{#if editing}
			<ExhibitionEditorPane
				bind:this={pane}
				{barHeight}
				{lookup}
				{session}
				symbols={data.symbols}
				terms={data.glossary}
			/>
		{:else}
			<article>
				<header>
					<p class="overline">{m.exhibitions.kind}</p>
					<h1>{title}</h1>
				</header>
				<ExhibitionBody
					document={session.document}
					entries={data.glossary}
					{lookup}
					symbols={data.symbols}
				/>
			</article>
		{/if}
	{:else}
		<LoadFailure
			backHref={listPath}
			backLabel={m.exhibitions.view.back}
			errorTitle={m.exhibitions.view.loadErrorTitle}
			message={data.notFound ? m.exhibitions.errors.notFound : (data.error ?? '')}
			notFound={data.notFound === true}
		/>
	{/if}
</AtelierLayout>

<DiscardDialog
	changes={leave.changes}
	description={m.common.discardDescription}
	keepLabel={m.exhibitions.save.keepEditing}
/>

{#if data.exhibition}
	<ExhibitionDeleteDialog
		id={data.exhibition.id}
		onarchived={moved}
		title={session?.title ?? ''}
		bind:open={deleteOpen}
	/>
{/if}

<style>
	article {
		display: grid;
		gap: var(--spacing-8);
	}

	header {
		display: grid;
		gap: var(--spacing-1);
	}

	h1 {
		max-width: var(--size-content-default);
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-2xl);
		font-style: italic;
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-2xl);
	}
</style>
