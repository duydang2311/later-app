<script lang="ts">
	import { browser } from '$app/environment';
	import { Indexes } from '$lib/services/db';
	import { useRuntime } from '$lib/services/runtime';
	import { Check, X } from '@lucide/svelte';

	let todos = $state.raw<{ id: string; content: string; completed: boolean }[]>([]);

	const { db } = useRuntime();

	export const invalidate = async () => {
		const store = await db.objectStore('todos', 'readonly');
		const index = store.index(Indexes.byDateAndTimestamp);
		const now = new Date();
		const date = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
		const request = index.getAll(IDBKeyRange.bound([date, 0], [date, Number.POSITIVE_INFINITY]));
		request.onsuccess = (e) => {
			todos = (e.target as IDBRequest<any[]>).result.map((a) => ({
				id: a.id,
				content: a.value.content,
				completed: a.value.completed || false,
			}));
		};
		request.onerror = () => {
			console.error('Failed to fetch todos:', request.error);
		};
	};

	const deleteTodo = async (id: string) => {
		const store = await db.objectStore('todos', 'readwrite');
		store.delete(id);
		await invalidate();
	};

	const setComplete = async (id: string, value: boolean) => {
		const store = await db.objectStore('todos', 'readwrite');
		await new Promise((resolve, reject) => {
			const request = store.get(id);
			request.onsuccess = async (e) => {
				const todo = (e.target as IDBRequest<any>).result;
				if (!todo) {
					reject(new Error('Todo not found'));
					return;
				}
				todo.value.completed = value;
				const putReq = store.put(todo);
				putReq.onsuccess = () => {
					resolve(todo);
				};
				putReq.onerror = () => {
					reject(putReq.error);
				};
				resolve(todo);
			};
			request.onerror = () => {
				reject(request.error);
			};
		});
		await invalidate();
	};

	if (browser) {
		invalidate();
	}
</script>

<div
	class="font-playful bg-secondary-container h-full py-4 border border-secondary-container-fg/2 border-b-0 rounded-t-sm w-2xl max-w-full min-h-96"
>
	<h2 class="text-secondary-container-fg text-2xl mb-4 lowercase font-medium px-4">Todos</h2>
	{#if todos.length === 0}
		<p class="text-secondary-container-fg/70 px-4 lowercase">Nothing for now. Maybe later.</p>
	{:else}
		<ul class="grid grid-cols-[1fr_auto] max-h-96 overflow-auto px-4">
			{#each todos as todo (todo.id)}
				<li class="col-span-full grid-cols-subgrid grid items-center gap-4 group relative">
					<button
						type="button"
						onclick={() => {
							setComplete(todo.id, !todo.completed);
						}}
						class="rounded-sm transition flex items-center gap-4 py-2"
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
