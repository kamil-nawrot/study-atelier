<script lang="ts">
	import type { UiMessages } from '../types/ui-messages';
	import { type Component, onDestroy, untrack } from 'svelte';
	import { setUiMessages, uiMessages } from '../messages/messages';

	type Props = {
		messages: UiMessages;
		component: Component<Record<string, unknown>>;
		props?: Record<string, unknown>;
	};

	let { messages, component: Subject, props = {} }: Props = $props();

	const previous = uiMessages();
	setUiMessages(untrack(() => messages));
	onDestroy(() => setUiMessages(previous));
</script>

<Subject {...props} />
