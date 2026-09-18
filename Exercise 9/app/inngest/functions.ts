import { NonRetriableError } from "inngest";
import { inngest } from "./client";
import { productComparisonNetwork } from "@/lib/network";
import { getDB } from "@/lib/db";


export const productComparisonWorkflow = inngest.createFunction(
    { id: "product-comparison-workflow" },
    { event: "ai.agents/run" },
    async ({ event }) => {

        const input = event.data.input;
        const runId = event.data.runId;
        const limit = event.data.limit || 1;

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🤖 [Inngest] Starting agents in background');
        console.log('   Input:', input);
        console.log('   RunId:', runId);
        console.log('   Limit:', limit);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        try {

            const result = await productComparisonNetwork.run(input, {
                state: {
                    data: { runId, limit }
                }
            })

            return {
                status: "success",
                result: result.state.data
            }

        } catch (error) {
            console.log("❌ [Inngest] Error running agents", error);

            try {

                const db = await getDB();
                await db.collection('results').updateOne(
                    { runId, status: 'running' },
                    {
                        $set: {
                            status: 'failed',
                            error: error instanceof Error ? error.message : 'Unknown error',
                            failedAt: new Date(),
                        },
                    }
                );

            } catch (error) {
                console.error('Failed to save error:', error);

            }
            throw error;
        }
    })