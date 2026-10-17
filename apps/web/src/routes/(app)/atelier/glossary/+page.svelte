<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import { onMount } from 'svelte';
	import { Alert, Button, Icon, Toast } from '@study-atelier/ui';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import AtelierBackLink from '#lib/collection/components/AtelierBackLink.svelte';
	import AtelierLayout from '#lib/collection/components/AtelierLayout.svelte';
	import GlossaryList from '#lib/glossary/components/GlossaryList.svelte';
	import { m } from '#lib/i18n/index.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const glossaryPath = resolve('/(app)/atelier/glossary');

	let toast: Toast;

	onMount(() => {
		const message = page.state.glossaryMessage;
		if (message === undefined) return;
		toast.show(message);
		void goto(glossaryPath, { state: {}, shallow: true, replace: true });
	});
</script>

<AtelierLayout email={data.session.user.email ?? ''} title={m.glossary.title}>
	{#snippet bar()}
		<AtelierBackLink />
		{#if !data.error}
			<Button href={resolve('/(app)/atelier/glossary/new')} variant="primary">
				<Icon icon={Plus} size="sm" />
				<span class="long">{m.glossary.add}</span>
				<span class="short">{m.glossary.addShort}</span>
			</Button>
		{/if}
	{/snippet}

	<header>
		<h1>{m.glossary.title}</h1>
		<p class="lead">{m.glossary.lead}</p>
	</header>

	{#if data.error}
		<Alert title={m.glossary.loadErrorTitle} tone="danger">
			{data.error}
		</Alert>
	{:else}
		<GlossaryList entries={data.entries} />
	{/if}
</AtelierLayout>

<Toast bind:this={toast} />

<style>
	header {
		display: grid;
		gap: var(--spacing-2);
	}

	.short {
		display: inline;
	}

	.long {
		display: none;
	}

	@media (min-width: 768px) {
		.short {
			display: none;
		}

		.long {
			display: inline;
		}
	}
</style>
