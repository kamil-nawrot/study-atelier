<script lang="ts">
	import { Button, Section } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/index.ts';
	import AtelierLayout from './AtelierLayout.svelte';

	type Props = {
		title: string;
		email: string;
	};

	let { title, email }: Props = $props();
</script>

<AtelierLayout {email} {title}>
	<Section>
		<h1>{title}</h1>
		<p class="lead">{m.comingSoon.lead}</p>
	</Section>
	<div>
		<Button href={resolve('/(app)/atelier')}>
			{m.comingSoon.backToAtelier}
		</Button>
	</div>
</AtelierLayout>
