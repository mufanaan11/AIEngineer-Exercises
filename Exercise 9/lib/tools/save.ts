import { createTool } from "@inngest/agent-kit";
import { z } from "zod";

export const saveComparisonTool = createTool({

    name: "save_comparison",
    description: "Save the comparison and value ranking of the product listings to the database",
    parameters: z.object({
        comparisons: z.array(
            z.object({
                source: z.string(),
                price: z.string(),
                rating: z.number().optional(),
                pros: z.array(z.string()),
                cons: z.array(z.string()),
                valueScore: z.number().describe("Overall value score from 0 to 1, factoring price, rating and delivery"),
            })
        )
    }),
    handler: async (input, { network, step }) => {

        // store the comparisons in the network state
        network.state.data.comparisons = input.comparisons;

        await step?.run('save_to_db', async () => {

            const { getDB } = await import('../db');

            const db = await getDB();

            const runId = network.state.data.runId;

            if (runId) {
                await db.collection('results').updateOne(
                    {
                        runId, status: 'running'
                    },
                    {
                        $set: {
                            'state.comparisons': input.comparisons,
                            'progress.comparator': 'completed',
                            updatedAt: new Date()
                        }
                    }
                )
            } else {
                console.error('No runId found');
            }
        })

        return { success: true, count: input.comparisons.length };
    }

})


export const saveRecommendationTool = createTool({
    name: "save_recommendation",
    description: "Save the final best-site recommendation to the database",
    parameters: z.object({
        bestSource: z.string().describe("The name of the site/seller with the best overall deal"),
        price: z.string(),
        link: z.string(),
        reasoning: z.string().describe("Why this is the best deal compared to the others"),
    }),
    handler: async (input, { network, step }) => {
        // store the recommendation in the network state
        network.state.data.recommendation = input;

        await step?.run('save_to_db', async () => {
            const { getDB } = await import('../db');

            const db = await getDB();

            const runId = network.state.data.runId;

            if (runId) {

                await db.collection('results').updateOne(
                    { runId, status: 'running' },
                    {
                        $set: {
                            'state.recommendation': input,
                            'progress.recommender': 'completed',
                            status: "success",
                            updatedAt: new Date(),
                            completedAt: new Date()
                        }
                    }
                )

            } else {
                console.error('❌ [Recommender] No runId in state!');
            }
        })

        return { success: true, bestSource: input.bestSource };
    }
})
