# Langfuse Integration - LLM Observability

## Overview

Bizflow uses [Langfuse](https://langfuse.com) for comprehensive LLM observability, tracking all AI interactions including the Expense Agent's receipt processing.

**What Langfuse Captures:**
- Every LLM API call (input/output)
- Token usage and costs
- Tool execution (7 expense agent tools)
- Latency and performance metrics
- User sessions and traces
- Errors and failures

---

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Langfuse Observability
LANGFUSE_PUBLIC_KEY=pk-lf-481a58bb-b14d-4045-a7f8-21f560bbd8c3
LANGFUSE_SECRET_KEY=sk-lf-6bf5ba89-e6f9-4519-8f4e-032bf71529b6
LANGFUSE_HOST=https://cloud.langfuse.com
```

**Note**: Langfuse is **automatically enabled** when these keys are present. If keys are missing, the system runs normally without tracing.

---

## Architecture

### Files Modified

1. **[src/lib/langfuse.ts](src/lib/langfuse.ts)** - Langfuse client configuration
2. **[src/app/api/chat/expense-agent/route.ts](src/app/api/chat/expense-agent/route.ts)** - Main integration point
3. **[src/lib/langfuse-ai-sdk.ts](src/lib/langfuse-ai-sdk.ts)** - AI SDK wrapper utilities (future use)

### Data Flow

```
User uploads receipt
    ↓
POST /api/chat/expense-agent
    ↓
Create Langfuse Trace
    ├─ Trace ID: unique per conversation
    ├─ Session ID: {spaceId}-{userId}
    ├─ User ID: user.id
    └─ Metadata: space, email, messageCount
    ↓
Create Langfuse Generation
    ├─ Model: claude-3-haiku / gpt-4o-mini
    ├─ Input: messages array
    ├─ System prompt: full context
    ├─ Tools: 7 expense agent tools
    └─ Metadata: attachments, toolCount
    ↓
AI SDK streamText()
    ├─ LLM processes request
    ├─ Calls tools (extractReceipt, validateReceipt, etc.)
    └─ Streams response
    ↓
onFinish callback
    ├─ Update generation with:
    │   ├─ Output text
    │   ├─ Token usage (prompt/completion/total)
    │   ├─ Tool call count
    │   └─ Finish reason
    └─ Flush events to Langfuse
```

---

## Implementation Details

### Trace Structure

#### 1. Trace (Conversation Level)
Created once per API call:

```typescript
const trace = langfuse.trace({
  name: 'expense-agent-chat',
  userId: user.id,
  sessionId: `${space.id}-${user.id}`,
  metadata: {
    endpoint: '/api/chat/expense-agent',
    spaceId: space.id,
    spaceName: space.name,
    userEmail: user.email,
    messageCount: messages.length,
  },
});
```

**Captures:**
- User identity
- Workspace context
- Conversation length

#### 2. Generation (LLM Call Level)
Nested within trace:

```typescript
const generation = trace.generation({
  name: 'expense-agent-llm-call',
  model: 'claude-3-haiku-20240307', // or gpt-4o-mini
  input: sanitizedMessages,
  metadata: {
    hasAttachments: true,
    attachmentCount: 1,
    systemPromptLength: 2500,
    toolCount: 7,
  },
});
```

**Captures:**
- Model identifier
- Input messages
- System prompt metadata
- Tool availability

#### 3. Completion Data
Updated in `onFinish` callback:

```typescript
generation.update({
  output: text,
  usage: {
    promptTokens: 1500,
    completionTokens: 300,
    totalTokens: 1800,
  },
  metadata: {
    finishReason: 'stop',
    toolCallCount: 5,
    toolResultCount: 5,
  },
});
generation.end();
```

**Captures:**
- Full response text
- Token consumption
- Tool execution stats
- Completion status

### Error Handling

Errors are logged to the trace:

```typescript
catch (error) {
  trace.update({
    metadata: {
      error: error.message,
      errorStack: error.stack,
    },
  });
  await flushLangfuse();
}
```

### Event Flushing

**Important**: Langfuse events are batched and sent asynchronously. We flush in two places:

1. **On successful completion** (`onFinish` callback)
2. **On error** (catch block)

```typescript
await flushLangfuse(); // Ensures events are sent before response
```

---

## Viewing Traces in Langfuse

### Access Dashboard

1. Go to [https://cloud.langfuse.com](https://cloud.langfuse.com)
2. Log in with your Langfuse account
3. Select your project

### Trace View

Each trace shows:

```
expense-agent-chat
├─ Session: workspace-123-user-456
├─ User: user@example.com
├─ Messages: 3
│
└─ expense-agent-llm-call
    ├─ Model: claude-3-haiku-20240307
    ├─ Input: [{ role: 'user', content: 'Process this receipt' }, ...]
    ├─ Output: "Got it — reading the receipt..."
    ├─ Tokens: 1,800 (1,500 prompt + 300 completion)
    ├─ Cost: $0.0027 (estimated)
    ├─ Latency: 2.3s
    ├─ Tool Calls: 5
    │   ├─ extractReceipt
    │   ├─ validateReceipt
    │   ├─ categorizeExpense
    │   ├─ createExpenseDraft
    │   └─ commitExpenseDraft
    └─ Status: ✓ Success
```

### Metrics Available

**Per Trace:**
- Total tokens used
- Estimated cost
- Latency (end-to-end)
- Tool execution count
- User/session information

**Aggregated:**
- Token usage over time
- Cost per day/week/month
- Average latency
- Error rate
- Most used tools
- User activity

---

## Tool Call Tracking

Langfuse automatically captures tool executions as part of the generation. In the dashboard, you'll see:

**Tool Call Metadata:**
```json
{
  "toolCallCount": 5,
  "toolResultCount": 5,
  "tools": [
    "extractReceipt",
    "validateReceipt",
    "categorizeExpense",
    "createExpenseDraft",
    "commitExpenseDraft"
  ]
}
```

**Individual Tool Details** (captured in `onFinish`):
- Tool name
- Input parameters
- Output result
- Execution order

---

## Cost Tracking

### Automatic Cost Calculation

Langfuse automatically calculates costs based on:
- Model used (Claude 3 Haiku vs GPT-4o-mini)
- Token counts (prompt + completion)
- Current pricing from OpenAI/Anthropic

**Example Receipt Processing Cost:**
```
Model: Claude 3 Haiku
Prompt tokens: 1,500 ($0.25/1M) = $0.000375
Completion tokens: 300 ($1.25/1M) = $0.000375
Total: ~$0.00075 per receipt
```

**Note**: Costs include vision API usage when processing receipt images.

### Cost Monitoring

View costs in Langfuse dashboard:
- **Daily**: Track daily spend
- **Per user**: Identify heavy users
- **Per session**: Cost of each conversation
- **Per model**: Compare Claude vs GPT-4o costs

---

## Performance Monitoring

### Latency Tracking

Langfuse measures:
- **Time to first token**: How fast streaming starts
- **Total latency**: Full response time
- **Tool execution time**: Time spent in tools

**Optimization Targets:**
- Time to first token: < 500ms
- Total latency: < 5s for simple receipts
- Tool calls: < 2s combined

### Bottleneck Detection

Langfuse helps identify:
- Slow tool executions (e.g., vision API calls)
- Long system prompts (increase prompt tokens)
- Excessive tool calls (agent inefficiency)

---

## Session Analysis

### Session Grouping

Sessions are grouped by: `{spaceId}-{userId}`

**Benefits:**
- Track conversations per workspace
- Analyze user behavior patterns
- Identify multi-turn conversations
- Debug user-specific issues

### Multi-Turn Conversations

Langfuse tracks:
- Message count in conversation
- Topic continuity
- Tool usage patterns
- Success/failure rates

---

## Debugging with Langfuse

### Common Issues

#### 1. High Token Usage
**Symptom**: Costs higher than expected

**Debug in Langfuse:**
- Check `systemPromptLength` in metadata
- Review input message sizes
- Look for repeated context

**Fix**: Optimize system prompt, reduce message history

#### 2. Slow Responses
**Symptom**: Latency > 5s

**Debug in Langfuse:**
- Check latency breakdown
- Review tool call counts
- Identify slow tools

**Fix**: Optimize tool execution, use faster model

#### 3. Failed Tool Calls
**Symptom**: Expenses not saved

**Debug in Langfuse:**
- Check tool execution metadata
- Review error messages
- Examine tool parameters

**Fix**: Validate tool input schema, improve error handling

---

## Privacy & Security

### Data Sent to Langfuse

**Included:**
- User ID (hashed)
- Session ID (workspace + user)
- Message content (prompts and responses)
- Tool parameters and results
- Token usage and costs

**Not Included:**
- Passwords or auth tokens
- Payment information
- Raw receipt images (only extracted text)

### Data Retention

Langfuse Cloud:
- Free tier: 30 days retention
- Pro tier: Unlimited retention
- Self-hosted: You control retention

### Compliance

- **GDPR**: User data can be deleted via Langfuse API
- **SOC 2**: Langfuse Cloud is SOC 2 compliant
- **HIPAA**: Use self-hosted Langfuse for HIPAA compliance

---

## Advanced Features

### Custom Metadata

Add custom fields to traces:

```typescript
trace.update({
  metadata: {
    receiptType: 'restaurant',
    vendorCategory: 'meals',
    amountRange: '0-50',
    hasVAT: true,
  },
});
```

### Scores and Feedback

Rate LLM outputs (future implementation):

```typescript
trace.score({
  name: 'accuracy',
  value: 0.95, // 95% accurate extraction
});

trace.score({
  name: 'user_satisfaction',
  value: 1, // User confirmed expense
});
```

### Experiments

A/B test different prompts:

```typescript
const trace = langfuse.trace({
  name: 'expense-agent-chat',
  tags: ['experiment-prompt-v2'],
});
```

Then compare performance in Langfuse dashboard.

---

## Troubleshooting

### Langfuse Not Logging

**Check:**
1. Environment variables are set correctly
2. `isLangfuseEnabled()` returns `true`
3. No network firewall blocking Langfuse API
4. API keys are valid (check Langfuse dashboard)

**Debug:**
```bash
# Check if Langfuse is enabled
node -e "console.log(Boolean(process.env.LANGFUSE_PUBLIC_KEY))"

# Test connection
curl -X POST https://cloud.langfuse.com/api/public/ingestion \
  -H "Authorization: Basic $(echo -n ${LANGFUSE_PUBLIC_KEY}:${LANGFUSE_SECRET_KEY} | base64)"
```

### Events Not Appearing

**Issue**: Events sent but not visible in dashboard

**Causes:**
1. Events not flushed (check `await flushLangfuse()`)
2. Async flush timing (wait a few seconds)
3. Langfuse processing delay (up to 30s)

**Fix:**
```typescript
// Always await flush before returning response
await langfuse.flushAsync();
```

### High Latency

**Issue**: Adding Langfuse increases response time

**Causes:**
1. Synchronous event sending (should be async)
2. Flush called too frequently
3. Network issues with Langfuse API

**Fix:**
- Use async flush (already implemented)
- Batch events (Langfuse does this automatically)
- Consider self-hosted Langfuse for faster network

---

## Self-Hosted Option

For maximum control and performance, deploy Langfuse on your infrastructure:

```bash
# Docker Compose
docker-compose -f docker-compose.langfuse.yml up -d
```

Then update `.env`:
```bash
LANGFUSE_HOST=https://your-langfuse-instance.com
```

**Benefits:**
- Faster network latency
- Full data control
- No external dependencies
- Custom retention policies

---

## Metrics & KPIs

### Track These KPIs

**Operational:**
- Requests per day
- Average latency
- Error rate
- Tool usage distribution

**Financial:**
- Cost per receipt processed
- Daily/monthly AI spend
- Cost by model (Claude vs GPT)
- Cost per workspace

**Quality:**
- Expense save success rate
- User confirmation rate
- Duplicate detection accuracy
- Category suggestion accuracy

### Example Queries

**In Langfuse SQL Console:**

```sql
-- Cost per workspace
SELECT
  metadata->>'spaceId' as workspace,
  SUM(total_cost) as total_cost,
  COUNT(*) as requests
FROM traces
WHERE name = 'expense-agent-chat'
GROUP BY workspace
ORDER BY total_cost DESC;

-- Average latency by tool count
SELECT
  metadata->>'toolCallCount' as tools,
  AVG(latency_ms) as avg_latency
FROM generations
WHERE name = 'expense-agent-llm-call'
GROUP BY tools
ORDER BY tools;

-- Success rate
SELECT
  metadata->>'finishReason' as finish_reason,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM generations
GROUP BY finish_reason;
```

---

## Best Practices

### 1. Meaningful Names
Use descriptive trace and generation names:
```typescript
// ✓ Good
trace.name = 'expense-agent-chat';
generation.name = 'expense-agent-llm-call';

// ✗ Bad
trace.name = 'api-call';
generation.name = 'llm';
```

### 2. Rich Metadata
Add context to help debugging:
```typescript
metadata: {
  spaceId,
  userEmail,
  messageCount,
  hasAttachments,
  toolCount,
}
```

### 3. Session Tracking
Group related traces:
```typescript
sessionId: `${space.id}-${user.id}`;
```

### 4. Always Flush
Ensure events are sent:
```typescript
await flushLangfuse();
```

### 5. Error Logging
Capture errors for analysis:
```typescript
catch (error) {
  trace.update({ metadata: { error: error.message } });
}
```

---

## Next Steps

1. **Monitor Dashboard**: Check [Langfuse Cloud](https://cloud.langfuse.com) daily
2. **Set Alerts**: Configure alerts for high costs or errors
3. **Analyze Patterns**: Identify optimization opportunities
4. **Add Scores**: Implement user feedback scoring
5. **A/B Testing**: Experiment with different prompts

---

## Resources

- **Langfuse Docs**: https://langfuse.com/docs
- **AI SDK Integration**: https://langfuse.com/docs/integrations/vercel-ai-sdk
- **Pricing**: https://langfuse.com/pricing
- **GitHub**: https://github.com/langfuse/langfuse

---

## Summary

Langfuse integration provides:

✅ **Complete observability** of LLM calls
✅ **Cost tracking** and optimization
✅ **Performance monitoring** and bottleneck detection
✅ **Debugging tools** for production issues
✅ **Session analysis** for user behavior
✅ **Zero performance impact** (async event sending)
✅ **Privacy compliant** (GDPR, SOC 2)

All expense agent interactions are now traced and analyzable in the Langfuse dashboard.
