<script lang="ts">
	import ComingSoon from '#lib/collection/components/ComingSoon.svelte';
	import { m } from '#lib/i18n/index.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<ComingSoon email={data.session.user.email ?? ''} title={m.comingSoon.trash} />
