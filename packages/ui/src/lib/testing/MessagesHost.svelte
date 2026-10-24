<script lang="ts">
	import { type Component, onDestroy, untrack } from 'svelte';
	import { setUiMessages, uiMessages, type UiMessages } from '../messages/messages';

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
