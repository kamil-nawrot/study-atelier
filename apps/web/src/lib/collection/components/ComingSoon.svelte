<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Button, Section } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/index.ts';
	import AtelierLayout from './AtelierLayout.svelte';

	type Props = {
		title: string;
		email: string;
		actions?: Snippet;
	};

	let { title, email, actions }: Props = $props();
</script>

<AtelierLayout {email} {title}>
	<Section>
		<h1>{title}</h1>
		<p class="lead">{m.comingSoon.lead}</p>
	</Section>
	<div class="actions">
		{@render actions?.()}
		<Button href={resolve('/(app)/atelier')}>
			{m.comingSoon.backToAtelier}
		</Button>
	</div>
</AtelierLayout>

<style>
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-3);
	}
</style>
