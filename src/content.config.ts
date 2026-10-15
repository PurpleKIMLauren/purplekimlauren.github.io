import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
			// Which section this post belongs to.
			category: z.enum(['predictions', 'briefings', 'data', 'notes']).default('notes'),
			// Freeform tags.
			tags: z.array(z.string()).default([]),
			// Hide from listings while drafting.
			draft: z.boolean().default(false),
		}),
});

export const collections = { blog };
