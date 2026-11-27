<script lang="ts">
	import { Alert, PageHeader } from '@study-atelier/ui';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import AlbumList from '#lib/albums/components/AlbumList/AlbumList.svelte';
	import { m } from '#lib/i18n/i18n.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<AtelierLayout email={data.session.user.email ?? ''} heading title={m.albums.title}>
	<div class="albums">
		<PageHeader lead={m.albums.lead}>
			{#snippet aside()}
				{#if !data.error && data.albums.length > 0}
					<span class="caption">{m.albums.count(data.albums.length)}</span>
				{/if}
			{/snippet}
		</PageHeader>
		{#if data.error}
			<Alert title={m.albums.loadErrorTitle} tone="danger">
				{data.error}
			</Alert>
		{/if}
		<AlbumList albums={data.albums} />
	</div>
</AtelierLayout>

<style>
	.albums {
		display: grid;
		gap: var(--spacing-8);
	}
</style>
