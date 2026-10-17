<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import { Alert, Button, Icon, Section } from '@study-atelier/ui';
	import { afterNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import AtelierLayout from '#lib/collection/components/AtelierLayout.svelte';
	import { goBackThroughHistory } from '#lib/collection/history.ts';
	import { m } from '#lib/i18n/index.ts';
	import type { GlossaryFormResult } from '../types.ts';
	import GlossaryForm from './GlossaryForm.svelte';

	type Props = {
		email: string;
		data: GlossaryFormResult;
		title: string;
		backPath: ResolvedPathname;
	};

	let { email, data, title, backPath }: Props = $props();

	const glossaryPath = resolve('/(app)/atelier/glossary');

	let form = $state<GlossaryForm>();
	let cameFromApp = false;

	let failed = $derived(data.error !== undefined || data.notFound === true);

	afterNavigate(({ from }) => {
		cameFromApp = from !== null;
	});

	function goBack(event: MouseEvent): void {
		goBackThroughHistory(event, cameFromApp);
	}

	async function showSaved(path: ResolvedPathname, message: string): Promise<void> {
		await goto(path, { replace: true, refreshAll: true, state: { glossaryMessage: message } });
	}
</script>

<AtelierLayout
	confirmLeave={() => form?.confirmLeave() ?? Promise.resolve(true)}
	{email}
	title={data.notFound ? m.glossary.view.notFoundTitle : title}
>
	{#snippet bar()}
		<div class="heading">
			<a class="back" aria-label={m.glossary.form.goBack} href={backPath} onclick={goBack}>
				<Icon icon={ArrowLeft} />
			</a>
			<h1>{title}</h1>
		</div>
	{/snippet}

	{#if failed}
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
			<Button href={glossaryPath}>
				{m.glossary.back}
			</Button>
		</div>
	{:else}
		{#key backPath}
			<GlossaryForm
				bind:this={form}
				cancelHref={backPath}
				entries={data.entries}
				entry={data.entry}
				index={data.index}
				oncancel={goBack}
				onsaved={showSaved}
			/>
		{/key}
	{/if}
</AtelierLayout>

<style>
	.heading {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		min-width: 0;
	}

	.back {
		display: grid;
		place-items: center;
		flex: none;
		padding-block: var(--spacing-2);
		color: var(--color-fg);
	}

	h1 {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
	}
</style>
