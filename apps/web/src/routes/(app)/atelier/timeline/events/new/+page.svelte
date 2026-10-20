<script lang="ts">
	import { m } from '#lib/i18n/index.ts';
	import EventFormPage from '#lib/timeline/components/EventFormPage.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<EventFormPage data={{}} email={data.session.user.email ?? ''} title={m.timeline.form.newTitle} />
