<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Toast } from '@study-atelier/ui';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import ComingSoon from '#lib/collection/components/ComingSoon.svelte';
	import { formatRecordNumber } from '#lib/collection/format.ts';
	import { m } from '#lib/i18n/index.ts';
	import type { PageProps } from './$types';

	let { data, params }: PageProps = $props();

	let toast: Toast;

	let artworkPath = $derived(resolve('/(app)/atelier/[number]', { number: params.number }));
	let editPath = $derived(resolve('/(app)/atelier/[number]/edit', { number: params.number }));

	onMount(() => {
		const saved = page.state.saved;
		if (saved === undefined) return;
		toast.show(m.artworkForm.changesSaved(formatRecordNumber(saved)));
		void goto(artworkPath, { state: {}, shallow: true, replace: true });
	});
</script>

<ComingSoon
	email={data.session.user.email ?? ''}
	title={m.comingSoon.artwork(formatRecordNumber(Number(params.number)))}
>
	{#snippet actions()}
		<Button href={editPath} variant="primary">
			{m.comingSoon.edit}
		</Button>
	{/snippet}
</ComingSoon>

<Toast bind:this={toast} />
