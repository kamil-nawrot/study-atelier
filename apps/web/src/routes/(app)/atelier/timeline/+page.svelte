<script lang="ts">
	import { Alert } from '@study-atelier/ui';
	import AtelierBackLink from '#lib/collection/components/AtelierBackLink.svelte';
	import AtelierLayout from '#lib/collection/components/AtelierLayout.svelte';
	import { m } from '#lib/i18n/index.ts';
	import TimelineView from '#lib/timeline/components/TimelineView.svelte';
	import { rememberedEra, startEra } from '#lib/timeline/start.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let initialEra = $derived(startEra(data.artworks, rememberedEra()));
</script>

<AtelierLayout email={data.session.user.email ?? ''} title={m.timeline.title}>
	{#snippet bar()}
		<AtelierBackLink />
	{/snippet}

	{#if data.error}
		<Alert title={m.timeline.loadErrorTitle} tone="danger">
			{data.error}
		</Alert>
	{:else}
		<TimelineView {initialEra} />
	{/if}
</AtelierLayout>
