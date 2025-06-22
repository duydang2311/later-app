export interface Todo {
	id: string;
	publicId: string;
	date: string;
	timestamp: number;
	title: string;
	content?: string;
	completed: boolean;
	slug: string;
}
