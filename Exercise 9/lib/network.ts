import { createNetwork, createRoutingAgent, openai } from "@inngest/agent-kit";
import { doneTool, routeToAgentTool } from "./tools/router";
import { comparatorAgent, productScoutAgent, recommenderAgent } from "./agents";

const supervisorAgent = createRoutingAgent({
    name: "supervisor",
    description: "AI supervisor that orchestrates the product comparison workflow",
    system: ({ network }) => {
        const state = network?.state.data;
        console.log("🔍 [Supervisor] Current state:", state);
        const agents = Array.from(network?.agents.values() || []);

        return `You are an intelligent supervisor managing a shopping comparison workflow.
        **Current State:**
        - Listings found: ${state?.listings?.length || 0}
        - Comparisons made: ${state?.comparisons?.length || 0}
        - Recommendation ready: ${state?.recommendation ? 'Yes' : 'No'}

        **Available Agents:**
        ${agents.map(a => `- ${a.name}: ${a.description}`).join('\n')}

        **Your Job:**
        1. Analyze the current state
        2. Decide which agent should run next to progress the workflow
        3. Use route_to_agent tool to select the next agent, passing its EXACT name as listed above
        4. Use done tool when a recommendation has been saved

        **Workflow Logic:**
        - If no listings: route to "product-scout"
        - If listings but no comparisons: route to "comparator"
        - If comparisons but no recommendation: route to "recommender"
        - If recommendation exists: call done

        Think step by step and make the best decision!
        `;
    },
    model: openai({ model: "gpt-5-mini" }),
    tools: [routeToAgentTool, doneTool],
    tool_choice: "auto",
    lifecycle: {

        onRoute: ({ result, network }) => {

            if (!result.toolCalls || result.toolCalls.length === 0) {
                return undefined;
            }

            // get the firt tool call

            const tool = result.toolCalls[0];

            // if done tool is called, stop network

            if (tool.tool.name === "done") {
                return undefined;
            }

            // if route_to_agent tool is called, route to the agent
            if (tool.tool.name === "route_to_agent") {
                const agentName = (tool.content as any)?.data || (tool.content as string);
                return [agentName];
            }
            return undefined;
        }
    },
})

export const productComparisonNetwork = createNetwork({
    name: "product_comparison_workflow",
    description: "Multi-agent system for finding and comparing shopping listings across sites",
    agents:[
        productScoutAgent,
        comparatorAgent,
        recommenderAgent
    ],
    router: supervisorAgent,
    maxIter: 10
})
