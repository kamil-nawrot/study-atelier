<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/index.ts';
	import GlossaryFormPage from '#lib/glossary/components/GlossaryFormPage.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let backPath = $derived(
		data.entry
			? resolve('/(app)/atelier/glossary/[id]', { id: data.entry.id })
			: resolve('/(app)/atelier/glossary')
	);
</script>

<GlossaryFormPage
	{backPath}
	{data}
	email={data.session.user.email ?? ''}
	title={m.glossary.form.editTitle}
/>
