<script lang="ts">
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
	const todo = $derived(data.todo);
</script>

<main class="flex-1 p-4 bg-secondary-container text-secondary-container-fg">
	<h1 class="font-playful text-h1 [view-transition-name:todo-title] w-fit">
		{todo.title}
	</h1>
	<div class="mt-2">
		{#if todo.content}
			<p>{todo.content}</p>
		{:else}
			<p>No content provided.</p>
		{/if}
	</div>
</main>
