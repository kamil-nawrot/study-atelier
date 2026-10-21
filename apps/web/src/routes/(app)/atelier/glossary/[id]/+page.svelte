<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash from '@lucide/svelte/icons/trash-2';
	import { onMount } from 'svelte';
	import { Alert, Button, Dialog, Icon, Section, Toast } from '@study-atelier/ui';
	import { afterNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import AtelierLayout from '#lib/collection/components/AtelierLayout.svelte';
	import { goBackThroughHistory } from '#lib/collection/history.ts';
	import GlossaryView from '#lib/glossary/components/GlossaryView.svelte';
	import { deleteGlossaryEntry } from '#lib/glossary/glossary-data.ts';
	import { m } from '#lib/i18n/index.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const glossaryPath = resolve('/(app)/atelier/glossary');

	let toast: Toast;
	let cameFromList = false;
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

	afterNavigate(({ from }) => {
		cameFromList = from?.route.id === '/(app)/atelier/glossary';
	});

	function goBack(event: MouseEvent): void {
		goBackThroughHistory(event, cameFromList);
	}

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
		<a class="back" href={glossaryPath} onclick={goBack}>
			<Icon icon={ArrowLeft} />
			{m.glossary.back}
		</a>
		{#if entry}
			<Button
				aria-label={m.glossary.view.edit}
				href={resolve('/(app)/atelier/glossary/[id]/edit', { id: entry.id })}
			>
				<Icon icon={Pencil} size="sm" />
				<span class="label">
					{m.glossary.view.edit}
				</span>
			</Button>
			<Button aria-label={m.glossary.view.delete} onclick={askToDelete} variant="danger">
				<Icon icon={Trash} size="sm" />
				<span class="label">
					{m.glossary.view.delete}
				</span>
			</Button>
		{/if}
	{/snippet}

	{#if entry}
		<GlossaryView entries={data.glossary} {entry} mentions={data.mentions} />
	{:else}
		<Section>
			{#if data.notFound}
				<p class="lead">{m.glossary.view.notFound}</p>
			{:else}
				<Alert title={m.glossary.view.loadErrorTitle} tone="danger">
					{data.error}
				</Alert>
			{/if}
		</Section>
		<div>
			<Button href={glossaryPath} onclick={goBack}>
				{m.glossary.back}
			</Button>
		</div>
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

<style>
	.back {
		display: flex;
		flex: 1;
		align-items: center;
		gap: var(--spacing-2);
		color: var(--color-fg);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		text-decoration: none;
	}

	.label {
		display: none;
	}

	@media (min-width: 768px) {
		.label {
			display: inline;
		}
	}
</style>
