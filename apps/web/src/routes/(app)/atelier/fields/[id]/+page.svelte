<script lang="ts">
	import OwnFieldPage from '#lib/card-index/components/OwnFieldPage/OwnFieldPage.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<OwnFieldPage {data} email={data.session.user.email ?? ''} />
