'use server';

/**
 * @fileOverview An AI agent that generates personalized anime recommendations based on user watch history and available catalog.
 *
 * - generateAnimeRecommendations - A function that generates anime recommendations.
 * - GenerateAnimeRecommendationsInput - The input type for the generateAnimeRecommendations function.
 * - GenerateAnimeRecommendationsOutput - The return type for the generateAnimeRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAnimeRecommendationsInputSchema = z.object({
  watchHistory: z
    .array(z.string())
    .describe('An array of anime titles the user has watched.'),
  availableAnimeTitles: z
    .array(z.string())
    .describe('An array of anime titles available in the application catalog.'),
});
export type GenerateAnimeRecommendationsInput =
  z.infer<typeof GenerateAnimeRecommendationsInputSchema>;

const GenerateAnimeRecommendationsOutputSchema = z.object({
  recommendations: z
    .array(z.string())
    .describe('An array of anime titles (from the catalog) recommended for the user.'),
});
export type GenerateAnimeRecommendationsOutput =
  z.infer<typeof GenerateAnimeRecommendationsOutputSchema>;

export async function generateAnimeRecommendations(
  input: GenerateAnimeRecommendationsInput
): Promise<GenerateAnimeRecommendationsOutput> {
  return generateAnimeRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAnimeRecommendationsPrompt',
  input: {schema: GenerateAnimeRecommendationsInputSchema},
  output: {schema: GenerateAnimeRecommendationsOutputSchema},
  prompt:
    `You are an AI anime recommendation engine.
You will receive a list of anime titles the user has watched and a list of anime titles available in our catalog.
Your task is to return a list of anime titles from OUR CATALOG that the user might enjoy based on their watch history.
Prioritize titles from the catalog. Only return titles that are present in the provided catalog.

User's watch history:
{{#each watchHistory}}
- {{this}}
{{/each}}

Available anime titles in our catalog:
{{#each availableAnimeTitles}}
- {{this}}
{{/each}}

Based on the user's watch history and the available catalog, here are some recommended anime titles for the user.
IMPORTANT: You MUST return titles exactly as they appear in the "Available anime titles in our catalog" list. Do not alter spelling or add extra words.
Return up to 5 recommendations.
`,
});

const generateAnimeRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateAnimeRecommendationsFlow',
    inputSchema: GenerateAnimeRecommendationsInputSchema,
    outputSchema: GenerateAnimeRecommendationsOutputSchema,
  },
  async (input): Promise<GenerateAnimeRecommendationsOutput> => {
    try {
      const result = await prompt(input);
      if (!result || !result.output || !Array.isArray(result.output.recommendations)) {
        console.error("AI prompt for recommendations did not return a valid output. Result:", result);
        // Return empty recommendations to satisfy the schema, UI will handle "no recommendations".
        return { recommendations: [] };
      }
      // Ensure recommendations are strings, filter out any non-string items if necessary
      const validRecommendations = result.output.recommendations.filter(rec => typeof rec === 'string');
      return { recommendations: validRecommendations };
    } catch (error) {
      console.error("Error calling AI prompt for recommendations:", error);
      // Rethrow the error so it can be caught by the calling component's error handler
      // This will trigger the `setError("Could not load recommendations. Please try again.");`
      // in the RecommendationsSection component.
      throw error;
    }
  }
);
