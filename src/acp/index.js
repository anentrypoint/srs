import { ACPProtocol } from 'acpreact';

const MAX_ITERATIONS = 20;

export class SRSProtocol extends ACPProtocol {
  constructor(instruction, services) {
    super(instruction, services);
    this.history = [];
  }

  async processLoop(text, options = {}) {
    this.history.push({ role: 'user', content: text });
    let iteration = 0;
    let lastResult;
    let currentPrompt = text;

    while (iteration < MAX_ITERATIONS) {
      iteration++;
      const historyContext = this.history.length > 2
        ? `\n\nConversation so far:\n${this.history.slice(-10).map(m => `[${m.role}]: ${m.content}`).join('\n')}\n\n---\n\n`
        : '';
      const promptWithHistory = historyContext + currentPrompt;
      lastResult = await this.process(promptWithHistory, options);

      if (!lastResult.toolCalls || lastResult.toolCalls.length === 0) {
        this.history.push({ role: 'assistant', content: lastResult.text });
        break;
      }

      const toolSummary = lastResult.toolCalls.map(tc => `Tool ${tc.tool} returned: ${JSON.stringify(tc.result)}`).join('\n');
      this.history.push({ role: 'assistant', content: lastResult.text || toolSummary });
      currentPrompt = `Tool results:\n${toolSummary}\n\nContinue based on these results.`;
    }

    return { ...lastResult, iterations: iteration, history: this.history };
  }

  clearHistory() { this.history = []; }

  extractJSON(result) {
    const raw = result.rawOutput ?? '';
    const match = raw.match(/```json\n([\s\S]*?)```/) || raw.match(/({[sS]*})/);
    if (!match) return null;
    try { return JSON.parse(match[1]); } catch { return null; }
  }
}

export { ACPProtocol } from 'acpreact';
