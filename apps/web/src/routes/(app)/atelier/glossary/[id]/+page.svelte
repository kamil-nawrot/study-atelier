<script lang="ts">
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash from '@lucide/svelte/icons/trash-2';
	import { onMount } from 'svelte';
	import { Alert, Button, Dialog, LoadFailure, Toast } from '@study-atelier/ui';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import AtelierLayout from '#lib/collection/components/AtelierLayout.svelte';
	import GlossaryView from '#lib/glossary/components/GlossaryView.svelte';
	import { deleteGlossaryEntry } from '#lib/glossary/glossary-data.ts';
	import BackLink from '#lib/navigation/components/BackLink.svelte';
	import { m } from '#lib/i18n/index.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const glossaryPath = resolve('/(app)/atelier/glossary');

	let toast: Toast;
	let deleteOpen = $state(false);
	let deleting = $state(false);
	let deleteError = $state<string>();

	let entry = $derived(data.entry);
	let title = $derived(
		entry
			? entry.name
			: data.notFound
				? m.glossary.view.notFoundTitle
				: m.glossary.view.loadErrorTitle
	);

	onMount(() => {
		const message = page.state.glossaryMessage;
		if (message === undefined || !entry) return;
		toast.show(message);
		void goto(resolve('/(app)/atelier/glossary/[id]', { id: entry.id }), {
			state: {},
			shallow: true,
			replace: true
		});
	});

	function askToDelete(): void {
		deleteError = undefined;
		deleteOpen = true;
	}

	async function remove(): Promise<void> {
		if (!entry || deleting) return;
		deleting = true;
		deleteError = undefined;
		const result = await deleteGlossaryEntry(entry.id);
		deleting = false;
		if (result.error) {
			deleteError = result.error;
			return;
		}
		deleteOpen = false;
		await goto(glossaryPath, {
			refreshAll: true,
			state: { glossaryMessage: m.glossary.view.deleted(entry.name) }
		});
	}
</script>

<AtelierLayout email={data.session.user.email ?? ''} {title}>
	{#snippet bar()}
		<BackLink fallbackHref={glossaryPath} fallbackName={m.glossary.back} />
		{#if entry}
			<Button
				aria-label={m.glossary.view.edit}
				compact
				href={resolve('/(app)/atelier/glossary/[id]/edit', { id: entry.id })}
				icon={Pencil}
			>
				{m.glossary.view.edit}
			</Button>
			<Button
				aria-label={m.glossary.view.delete}
				compact
				icon={Trash}
				onclick={askToDelete}
				variant="danger"
			>
				{m.glossary.view.delete}
			</Button>
		{/if}
	{/snippet}

	{#if entry}
		<GlossaryView entries={data.glossary} {entry} mentions={data.mentions} />
	{:else}
		<LoadFailure
			backHref={glossaryPath}
			backLabel={m.glossary.back}
			errorTitle={m.glossary.view.loadErrorTitle}
			message={data.notFound ? m.glossary.view.notFound : (data.error ?? '')}
			notFound={data.notFound === true}
		/>
	{/if}
</AtelierLayout>

<Toast bind:this={toast} />

{#snippet deleteErrorAlert()}
	<Alert tone="danger">
		{deleteError}
	</Alert>
{/snippet}

{#if entry}
	<Dialog
		children={deleteError ? deleteErrorAlert : undefined}
		description={m.glossary.deleteConfirm.description}
		size="small"
		title={m.glossary.deleteConfirm.title(entry.name)}
		bind:open={deleteOpen}
	>
		{#snippet footer()}
			<Button onclick={() => (deleteOpen = false)}>
				{m.glossary.deleteConfirm.back}
			</Button>
			<Button disabled={deleting} onclick={remove} variant="primary">
				{deleting ? m.glossary.deleteConfirm.deleting : m.glossary.deleteConfirm.confirm}
			</Button>
		{/snippet}
	</Dialog>
{/if}
