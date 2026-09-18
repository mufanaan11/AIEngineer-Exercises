import { createTool } from "@inngest/agent-kit";
import { z } from "zod";


export const searchProductsTool = createTool({
    name: "search_products",
    description: "Search for product listings across shopping sites (price, rating, seller, link)",
    parameters: z.object({
        query: z.string().describe("The product to search for, e.g. 'iPhone 15' or 'Sony WH-1000XM5'")
    }),

    handler: async (input, { network, step }) => {

        console.log("NEW PRODUCT SEARCH called");
        console.log("Query:", input.query);

        const response = await step?.run('serper_shopping_api_call', async () => {

            const res = await fetch('https://google.serper.dev/shopping', {
                method: 'POST',
                headers: {
                    'X-API-KEY': process.env.SERPER_API_KEY!,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    q: input.query,
                    page: 1
                })
            })

            if (!res.ok) {
                throw new Error(`Serper Shopping API returned status ${res.status}`);
            }

            const data = await res.json();
            return data;
        })

        const limit = network.state.data.limit || 1;

        const listings: any[] = (response.shopping || []).slice(0, limit).map((item: any) => ({
            title: item.title,
            source: item.source,
            price: item.price,
            rating: item.rating,
            ratingCount: item.ratingCount,
            delivery: item.delivery,
            link: item.link,
            imageUrl: item.imageUrl,
        }));

        // Store in network state
        network.state.data.listings = listings;

        // Save to MongoDB immediately!
        await step?.run('save_to_db', async () => {
            const { getDB } = await import('../db');
            const db = await getDB();
            const runId = network.state.data.runId;

            console.log('🔍 [Product Scout] Attempting to save to DB...');
            console.log('   runId:', runId);
            console.log('   listings count:', listings.length);

            if (runId) {
                const result = await db.collection('results').updateOne(
                    { runId, status: 'running' },
                    {
                        $set: {
                            'state.listings': listings,
                            'progress.productScout': 'completed',
                            updatedAt: new Date(),
                        },
                    }
                );
                console.log('✅ [Product Scout] DB Update Result:', {
                    matched: result.matchedCount,
                    modified: result.modifiedCount,
                });
            } else {
                console.error('❌ [Product Scout] No runId in state!');
            }
        });

        return { success: true, count: listings.length };
    }
})
