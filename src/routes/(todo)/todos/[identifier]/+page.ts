import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { Indexes } from '$lib/services/db';

export const load: PageLoad = async ({ parent, params }) => {
	const { db } = await parent();
	const openTx = await db.transaction('todos', 'readonly');
	if (openTx.failed) {
		return error(500, { message: `Failed to open transaction: ${openTx.error}.` });
	}

	const publicId = params.identifier.substring(params.identifier.length - 12);
	const todo = await openTx.data.store.index(Indexes.byPublicId).get(publicId);
	if (!todo) {
		return error(404, { message: `Todo not found.` });
	}

	return {
		todo,
	};
};
