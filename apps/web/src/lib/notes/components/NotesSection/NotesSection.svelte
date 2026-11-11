<script lang="ts">
	import NotebookPen from '@lucide/svelte/icons/notebook-pen';
	import type { Snippet } from 'svelte';
	import { Disclosure } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		children: Snippet;
	};

	let { children }: Props = $props();
</script>

<Disclosure icon={NotebookPen} muted title={m.common.notes}>
	{@render children()}
</Disclosure>
