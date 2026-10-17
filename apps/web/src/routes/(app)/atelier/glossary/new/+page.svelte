<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/index.ts';
	import GlossaryFormPage from '#lib/glossary/components/GlossaryFormPage.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<GlossaryFormPage
	backPath={resolve('/(app)/atelier/glossary')}
	{data}
	email={data.session.user.email ?? ''}
	title={m.glossary.form.newTitle}
/>
