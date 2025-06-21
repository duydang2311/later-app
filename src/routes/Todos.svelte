<script lang="ts">
	import { browser } from '$app/environment';
	import { Indexes } from '$lib/services/db';
	import { useRuntime } from '$lib/services/runtime';
	import { logError } from '$lib/utils';
	import { attempt } from '@duydang2311/attempt';
	import { Check, X } from '@lucide/svelte';

	let todos = $state.raw<{ id: string; content: string; completed: boolean }[]>([]);

	const { db } = useRuntime();

	export const invalidate = async () => {
		const openTx = await db.transaction('todos', 'readonly');
		if (openTx.failed) {
			logError('Failed to open transaction for todos')(openTx.error);
			return;
		}
		const index = openTx.data.store.index(Indexes.byDateAndTimestamp);
		const now = new Date();
		const date = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
		const getTodos = await attempt.async(() =>
			index.getAll(IDBKeyRange.bound([date, 0], [date, Number.POSITIVE_INFINITY]))
		)(logError('Failed to get todos from DB'));
		if (getTodos.failed) {
			return;
		}

		todos = getTodos.data.map((a) => ({
			id: a.id,
			content: a.content,
			completed: a.completed,
		}));
	};

	const deleteTodo = async (id: string) => {
		const openTx = await db.transaction('todos', 'readwrite');
		if (openTx.failed) {
			logError('Failed to open transaction for todos')(openTx.error);
			return;
		}

		await Promise.all([
			attempt.async(() => openTx.data.store.delete(id))(logError('Failed to delete todo from DB')),
			attempt.async(() => openTx.data.done)(
				logError('Failed to commit transaction for deleting todo')
			),
		]);
		await invalidate();
	};

	const setComplete = async (id: string, value: boolean) => {
		const openTx = await db.transaction('todos', 'readwrite');
		if (openTx.failed) {
			logError('Failed to open transaction for todos')(openTx.error);
			return;
		}

		const getTodo = await attempt.async(() => openTx.data.store.get(id))(
			logError('Failed to get todo from DB')
		);
		if (getTodo.failed) {
			return;
		}
		if (!getTodo.data) {
			logError('Todo not found')(id);
			return;
		}

		await Promise.all([
			attempt.async(() => openTx.data.store.put({ ...getTodo.data!, completed: value }))(
				logError('Failed to update todo in DB')
			),
			attempt.async(() => openTx.data.done)(
				logError('Failed to commit transaction for updating todo')
			),
		]);
		await invalidate();
	};

	if (browser) {
		invalidate();
	}
</script>

<div
	class="font-playful bg-secondary-container py-4 border border-secondary-container-fg/2 border-b-0 max-h-full overflow-hidden flex flex-col rounded-t-sm"
>
	<h2 class="text-secondary-container-fg text-2xl mb-4 lowercase font-medium px-4">Todos</h2>
	{#if todos.length === 0}
		<p class="text-secondary-container-fg/70 px-4 lowercase">Nothing for now. Maybe later.</p>
	{:else}
		<ul class="grid grid-cols-[1fr_auto] max-h-full flex-1 overflow-auto px-4">
			{#each todos as todo (todo.id)}
				<li class="col-span-full grid-cols-subgrid grid items-center gap-4 group relative">
					<button
						type="button"
						onclick={() => {
							setComplete(todo.id, !todo.completed);
						}}
						class="rounded-sm transition flex items-center gap-4 py-2 wrap-anywhere text-left"
					>
						<div
							class={[
								'group rounded-sm border transition size-4',
								todo.completed
									? 'bg-primary text-primary-fg border-primary/40'
									: 'bg-secondary-container-fg/20 text-secondary-container border-secondary-container-fg/5 group-hover:bg-primary/40',
							]}
						>
							{#if todo.completed}
								<Check class="size-full" />
							{/if}
						</div>
						<span
							class={[
								'transition',
								todo.completed ? 'text-primary font-medium' : 'group-hover:text-primary/60',
							]}
						>
							{todo.content}
						</span>
					</button>
					<button
						type="button"
						onclick={() => {
							deleteTodo(todo.id);
						}}
						class="text-negative size-4"
					>
						<X class="size-full" />
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
