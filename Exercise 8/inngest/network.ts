import { createNetwork } from '@inngest/agent-kit';
import { classifierAgent, knowledgeAgent, responseAgent } from './agents';
import type { TriageState } from './state';

export const triageNetwork = createNetwork<TriageState>({
  name: 'support-triage',
  agents: [classifierAgent, knowledgeAgent, responseAgent],
  maxIter: 6,
  router: ({ network }) => {
    const { category, articles, reply } = network.state.data;

    if (!category) return classifierAgent;
    if (!articles) return knowledgeAgent;
    if (!reply) return responseAgent;
    return undefined;
  },
});
