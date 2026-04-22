'use server';
/**
 * @fileOverview A generative AI tool for providing product recommendations on an e-commerce website.
 *
 * - aiProductRecommendations - A function that generates product recommendations based on a given product.
 * - AiProductRecommendationsInput - The input type for the aiProductRecommendations function.
 * - AiProductRecommendationsOutput - The return type for the aiProductRecommendations function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiProductRecommendationsInputSchema = z.object({
  currentProduct: z.object({
    productId: z.string().describe('Unique identifier of the current product.'),
    name: z.string().describe('Name of the current product.'),
    category: z.string().describe('Category of the current product (e.g., Men Watches, Women Watches).'),
    price: z.number().describe('Price of the current product in INR.'),
    description: z.string().describe('Detailed description of the current product.'),
    tags: z.array(z.string()).describe('List of keywords or tags associated with the product (e.g., formal, casual, leather strap).'),
  }).describe('Details of the product currently being viewed.'),
});
export type AiProductRecommendationsInput = z.infer<typeof AiProductRecommendationsInputSchema>;

const AiProductRecommendationsOutputSchema = z.object({
  recommendedWatches: z.array(z.object({
    productId: z.string().describe('Unique identifier of the recommended watch.'),
    name: z.string().describe('Name of the recommended watch.'),
    reason: z.string().describe('Brief explanation for why this watch is recommended.'),
  })).describe('List of watches recommended based on style, category, or similar attributes.'),
  recommendedAccessories: z.array(z.object({
    productId: z.string().describe('Unique identifier of the recommended accessory.'),
    name: z.string().describe('Name of the recommended accessory.'),
    type: z.string().describe('Type of accessory (e.g., "watch strap", "cleaning kit").'),
    reason: z.string().describe('Brief explanation for why this accessory is recommended.'),
  })).describe('List of complementary accessories (e.g., watch straps, cleaning kits) for the current product.'),
  customersAlsoViewed: z.array(z.object({
    productId: z.string().describe('Unique identifier of the product customers also viewed.'),
    name: z.string().describe('Name of the product customers also viewed.'),
    reason: z.string().describe('Brief explanation for why customers also viewed this product.'),
  })).describe('List of other products that customers frequently viewed alongside the current product.'),
}).describe('Generated product recommendations.');
export type AiProductRecommendationsOutput = z.infer<typeof AiProductRecommendationsOutputSchema>;

export async function aiProductRecommendations(input: AiProductRecommendationsInput): Promise<AiProductRecommendationsOutput> {
  return aiProductRecommendationsFlow(input);
}

const productRecommendationsPrompt = ai.definePrompt({
  name: 'productRecommendationsPrompt',
  input: { schema: AiProductRecommendationsInputSchema },
  output: { schema: AiProductRecommendationsOutputSchema },
  prompt: `You are an intelligent e-commerce recommendation engine for a watch store called Hi/sky.
Your task is to generate personalized product recommendations for related watches, complementary accessories, and items customers also viewed, based on the product a user is currently viewing.

Consider the following details for the current product:
Product ID: {{{currentProduct.productId}}}
Name: {{{currentProduct.name}}}
Category: {{{currentProduct.category}}}
Price: INR {{{currentProduct.price}}}
Description: {{{currentProduct.description}}}
Tags: {{#each currentProduct.tags}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Generate recommendations in the specified JSON format, ensuring each recommended item has a unique, plausible product ID (e.g., "HW-MEN-001", "HW-STRAP-005") and a brief, compelling reason for its inclusion.

Recommended Watches should be similar in style, category, or target audience.
Recommended Accessories should be directly complementary to the current watch, like watch straps or maintenance kits.
Customers Also Viewed items should reflect common browsing patterns, potentially including items from different categories but with a related appeal.
`,
});

const aiProductRecommendationsFlow = ai.defineFlow(
  {
    name: 'aiProductRecommendationsFlow',
    inputSchema: AiProductRecommendationsInputSchema,
    outputSchema: AiProductRecommendationsOutputSchema,
  },
  async (input) => {
    const { output } = await productRecommendationsPrompt(input);
    return output!;
  }
);
