'use server';
/**
 * @fileOverview A Genkit flow to generate detailed and engaging product descriptions for watches.
 *
 * - generateProductDescription - A function that handles the product description generation process.
 * - AdminProductDescriptionGeneratorInput - The input type for the generateProductDescription function.
 * - AdminProductDescriptionGeneratorOutput - The return type for the generateProductDescription function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AdminProductDescriptionGeneratorInputSchema = z.object({
  productName: z.string().describe('The name of the watch product.'),
  category: z.enum(['Men', 'Women', 'Kids']).describe('The category of the watch (Men, Women, or Kids).'),
  priceInr: z.number().describe('The price of the watch in Indian Rupees.'),
  tags: z.array(z.string()).describe('A list of keywords or tags describing the watch\'s style, type, or features.'),
  stockStatus: z.enum(['Available', 'Out of Stock']).describe('The current stock status of the watch.'),
});
export type AdminProductDescriptionGeneratorInput = z.infer<typeof AdminProductDescriptionGeneratorInputSchema>;

const AdminProductDescriptionGeneratorOutputSchema = z.object({
  description: z.string().describe('The AI-generated detailed and engaging product description for the watch.'),
});
export type AdminProductDescriptionGeneratorOutput = z.infer<typeof AdminProductDescriptionGeneratorOutputSchema>;

export async function generateProductDescription(input: AdminProductDescriptionGeneratorInput): Promise<AdminProductDescriptionGeneratorOutput> {
  return adminProductDescriptionGeneratorFlow(input);
}

const adminProductDescriptionGeneratorPrompt = ai.definePrompt({
  name: 'adminProductDescriptionGeneratorPrompt',
  input: { schema: AdminProductDescriptionGeneratorInputSchema },
  output: { schema: AdminProductDescriptionGeneratorOutputSchema },
  prompt: `You are a professional copywriter for a premium watch store called 'Hi/sky'. Your task is to create a detailed and engaging product description for a watch based on the provided attributes. The description should be modern, appealing, and highlight the watch's features.

Product Name: {{{productName}}}
Category: {{{category}}} Watches
Price: INR {{{priceInr}}}
Key Features/Styles: {{#each tags}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Stock Status: {{{stockStatus}}}

Craft a compelling product description, focusing on the watch's appeal, design, and target audience. Ensure the tone is sophisticated and persuasive.`,
});

const adminProductDescriptionGeneratorFlow = ai.defineFlow(
  {
    name: 'adminProductDescriptionGeneratorFlow',
    inputSchema: AdminProductDescriptionGeneratorInputSchema,
    outputSchema: AdminProductDescriptionGeneratorOutputSchema,
  },
  async (input) => {
    const { output } = await adminProductDescriptionGeneratorPrompt(input);
    return output!;
  }
);
