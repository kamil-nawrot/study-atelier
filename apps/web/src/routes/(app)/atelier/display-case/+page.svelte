<script lang="ts">
	import { onMount } from 'svelte';
	import { Alert } from '@study-atelier/ui';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import DisplayCase from '#lib/career/components/DisplayCase/DisplayCase.svelte';
	import { markTiersSeen } from '#lib/career/career-data/career-data.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	onMount(() => {
		if (!data.error) void markTiersSeen();
	});
</script>

<AtelierLayout email={data.session.user.email ?? ''} title={m.career.title}>
	<header>
		<h1>{m.career.title}</h1>
		<p class="lead">{m.career.lead}</p>
	</header>

	{#if data.error}
		<Alert title={m.career.loadErrorTitle} tone="danger">
			{data.error}
		</Alert>
	{:else}
		<DisplayCase exhibits={data.exhibits} />
	{/if}
</AtelierLayout>

<style>
	header {
		display: grid;
		gap: var(--spacing-2);
	}
</style>
