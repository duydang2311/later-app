<script lang="ts">
	import { browser } from '$app/environment';
	import type { Todo } from '$lib/models/todo';
	import { Indexes } from '$lib/services/db';
	import { useRuntime } from '$lib/services/runtime';
	import { logError } from '$lib/utils';
	import { tsap } from '$lib/utils/transitions';
	import { attempt } from '@duydang2311/attempt';
	import { X } from '@lucide/svelte';

	let todos = $state.raw<Todo[]>([]);

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

		todos = getTodos.data;
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
				<li class="col-span-full grid-cols-subgrid grid items-center gap-4 relative">
					<div class="transition flex items-center py-2 gap-2 wrap-anywhere text-left">
						<div class={['group flex items-center justify-center relative']}>
							<div
								class={[
									'absolute size-4 border border-outline rounded-xs',
									todo.completed
										? 'bg-primary text-primary-fg border-primary/40'
										: 'bg-transparent text-secondary-container border-base-variant-fg group-hover:bg-primary/20',
								]}
							></div>
							{#if todo.completed}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="100%"
									height="100%"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									class="absolute inset-0 size-4 text-primary-fg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
								>
									<path
										d="M20 6 9 17l-5-5"
										in:tsap={(node, gsap) => {
											const path = node as SVGPathElement;
											const length = path.getTotalLength();
											return gsap.fromTo(
												node,
												{ strokeDashoffset: -length + 1, strokeDasharray: length },
												{
													strokeDashoffset: 0,
												}
											);
										}}
										out:tsap={(node, gsap) => {
											const path = node as SVGPathElement;
											const length = path.getTotalLength();
											return gsap.fromTo(
												node,
												{
													strokeDasharray: length,
													strokeDashoffset: 0,
												},
												{ strokeDashoffset: -length + 1 }
											);
										}}
									></path>
								</svg>
							{/if}
							<input
								type="checkbox"
								class="relative appearance-none size-8 hover:bg-primary/5 rounded"
								onchange={(e) => {
									setComplete(todo.id, e.currentTarget.checked);
								}}
							/>
						</div>
						<a
						href="/todos/{todo.publicId}-{todo.slug}"
							class={[
								'transition [view-transition-name:todo-title] w-fit',
								todo.completed ? 'text-primary font-medium' : 'group-hover:text-primary/60',
							]}
						>
							{todo.title}
							</a>
					</div>
					<button
						type="button"
						onclick={() => {
							deleteTodo(todo.id);
						}}
						class="c-button c-button--negative size-6 p-1"
					>
						<X class="size-full" />
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
