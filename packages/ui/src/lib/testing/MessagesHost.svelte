<script lang="ts">
	import { type Component, untrack } from 'svelte';
	import { setUiMessages, type UiMessages } from '../messages';

	type Props = {
		messages: UiMessages;
		component: Component<Record<string, unknown>>;
		props?: Record<string, unknown>;
	};

	let { messages, component: Subject, props = {} }: Props = $props();

	setUiMessages(untrack(() => messages));
</script>

<Subject {...props} />
