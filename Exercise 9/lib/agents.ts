import { createAgent, openai } from "@inngest/agent-kit";
import { searchProductsTool } from "./tools/serper";
import { saveComparisonTool, saveRecommendationTool } from "./tools/save";


// Agent 1 : Product Scout Agent
export const productScoutAgent = createAgent({
    name: "product-scout",
    description: "A product scout agent that searches shopping sites for listings of a product",
    system: `
    You are an expert shopping researcher. Your job is to:
    1. Search for product listings using the search_products tool based on the user's query
    2. The query can be for ANY product: electronics, fashion, home goods, etc
    3. Use the exact product the user requested
    4. Return listings with price, source (site/seller) and rating so they can be compared

ALWAYS use the search_products tool with the user's query.
    `,
    tools: [
        searchProductsTool
    ],
    model: openai({ model: "gpt-5-mini" })
})

// Agent 2 : Comparator Agent
export const comparatorAgent = createAgent({
    name: "comparator",
    description: "Compares product listings across sites on price, rating and delivery",
    system: ({ network }) => {
        const listings = network?.state.data.listings || [];

        return `

        You are a shopping comparison expert. Compare these product listings:
        ${JSON.stringify(listings, null, 2)}

        For each listing, determine:
        1. Pros (e.g. lowest price, highest rating, fast delivery)
        2. Cons (e.g. no reviews, higher price, slow/unknown delivery)
        3. A valueScore from 0 to 1 that weighs price against rating and delivery

        MUST use the save_comparison tool to store your analysis, one entry per listing.
        `},
    tools: [saveComparisonTool],
    tool_choice: "save_comparison",
    model: openai({ model: "gpt-5-mini" })
})

// Agent 3 : Recommender Agent

export const recommenderAgent = createAgent({

    name: "recommender",
    description: "Picks the single best site to buy from and explains why",
    system: ({ network }) => {
        const listings = network?.state.data.listings || [];
        const comparisons = network?.state.data.comparisons || [];

        return `
        You are a shopping advisor. Based on the listings and comparisons below, pick the ONE best
        site/seller to buy from:
        Listings: ${JSON.stringify(listings, null, 2)}
        Comparisons: ${JSON.stringify(comparisons, null, 2)}

        Weigh price, rating and delivery to choose the single best overall deal, and explain your
        reasoning in 1-2 sentences.

        MUST use the save_recommendation tool to store your pick.`
    },

    tools: [saveRecommendationTool],
    tool_choice: "save_recommendation",
    model: openai({ model: "gpt-5-mini" })
})
