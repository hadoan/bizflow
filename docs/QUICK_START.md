# Bizflow Receipt Agent - Quick Start Guide

## ✅ Status: Ready to Test

The Receipt → Expense Agent implementation is complete with two modes:
- **Quick Scan** - Single receipt upload with form-based review
- **AI Chat (Copilot)** - Conversational interface with streaming responses

---

## 🚀 Quick Start (3 Steps)

### 1. Configure Environment

Create or update your `.env` file:

```bash
# Required: AI Provider
AI_PROVIDER=openai          # or "anthropic"
AI_API_KEY=your_api_key_here

# Or use provider-specific keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Database (should already be configured)
DATABASE_URL=postgresql://bizflow:bizflow_dev_password@localhost:5432/bizflow_dev
```

### 2. Start Development Server

```bash
# Make sure database is running
docker-compose up -d

# Start Next.js dev server
pnpm dev
```

### 3. Test the Agent

1. Open browser: http://localhost:3000
2. Login to your account
3. Navigate to **Expenses** (`/personal/expenses`)
4. Try both modes:

**Quick Scan Mode:**
- Click **"Quick Scan"** button
- Upload a receipt image
- Review extracted data
- Click **"Confirm & Save"**

**AI Chat Mode:**
- Click **"AI Chat"** button
- Upload receipt or type message
- Have a conversation
- Say **"confirm"** to save

---

## 📦 What Was Installed

```json
{
  "ai": "3.4.33",              // AI SDK with React hooks
  "@ai-sdk/openai": "0.0.66",  // OpenAI provider
  "@ai-sdk/anthropic": "0.0.55", // Anthropic provider
  "zod": "^3.25.76"            // Schema validation
}
```

---

## 🗄️ Database Changes

Migration applied: `20251214121105_add_expense_draft_and_agent_support`

**Schema Changes:**
- Added `ExpenseStatus` enum (DRAFT, FINAL)
- Added `fileId` field to Expense model
- Added `agentMetadata` JSON field to Expense model
- Added relation between Expense and File models

---

## 🧪 Test Scenarios

### Quick Scan Mode

1. **Clear Receipt**
   - Upload high-quality receipt
   - Verify all fields extracted correctly
   - Check confidence indicators (should be green)
   - Confirm and verify expense saved

2. **Blurry Receipt**
   - Upload low-quality image
   - Check for yellow/red confidence indicators
   - Verify warnings displayed
   - Edit fields if needed
   - Confirm and save

3. **Edit Draft**
   - Upload receipt
   - Edit vendor, category, or amount
   - Verify changes persist
   - Confirm and save

4. **Discard Draft**
   - Upload receipt
   - Click **"Discard"**
   - Verify no expense created

### AI Chat Mode

1. **Simple Upload**
   ```
   User: [uploads receipt.jpg]

   Agent: Got it — reading the receipt...
   [Shows draft with extracted data]

   User: confirm

   Agent: ✓ Expense saved!
   ```

2. **Conversational Editing**
   ```
   User: [uploads receipt]

   Agent: [Shows draft for "Amazon"]

   User: change category to cloud services

   Agent: [Updates draft]

   User: confirm

   Agent: ✓ Saved!
   ```

3. **Missing Data**
   ```
   User: [uploads blurry receipt]

   Agent: I couldn't read the amount clearly.
          What is the total?

   User: 42.50 EUR

   Agent: [Updates draft]
   ```

---

## 🔍 Troubleshooting

### "AI_API_KEY not configured"

**Solution:** Add your API key to `.env`:
```bash
AI_API_KEY=your_key_here
```

### "Module 'ai/react' not found"

**Solution:** AI SDK is installed correctly (v3.4.33). Try:
```bash
rm -rf node_modules .next
pnpm install
```

### Agent not responding

**Checks:**
1. Is the dev server running? (`pnpm dev`)
2. Is the API key valid?
3. Check browser console for errors
4. Check terminal for API errors

### Streaming not working

**Checks:**
1. Edge runtime enabled? (Check route.ts has `export const runtime = 'edge'`)
2. Browser supports streaming?
3. No middleware blocking streams?

---

## 📁 Key Files

**Backend:**
- [src/lib/ai-sdk.ts](src/lib/ai-sdk.ts) - Provider config
- [src/modules/finance/services/receipt-extraction.ts](src/modules/finance/services/receipt-extraction.ts) - OCR service
- [src/modules/finance/services/expense-agent.ts](src/modules/finance/services/expense-agent.ts) - Agent workflow
- [src/modules/finance/agents/expense-agent-tools.ts](src/modules/finance/agents/expense-agent-tools.ts) - AI SDK tools
- [src/app/api/chat/expense-agent/route.ts](src/app/api/chat/expense-agent/route.ts) - Streaming endpoint

**Frontend:**
- [src/app/(app)/personal/expenses/_components/receipt-agent.tsx](src/app/(app)/personal/expenses/_components/receipt-agent.tsx) - Quick Scan UI
- [src/app/(app)/personal/expenses/_components/expense-copilot.tsx](src/app/(app)/personal/expenses/_components/expense-copilot.tsx) - AI Chat UI
- [src/app/(app)/personal/expenses/page.tsx](src/app/(app)/personal/expenses/page.tsx) - Integration

**API Routes:**
- `POST /api/expenses/process-receipt` - Upload & process (Quick Scan)
- `POST /api/chat/expense-agent` - Streaming chat (Copilot)
- `PUT /api/expenses/drafts/[id]` - Update draft
- `DELETE /api/expenses/drafts/[id]` - Discard draft
- `POST /api/expenses/drafts/[id]/commit` - Finalize expense

---

## 🎯 Success Criteria

✅ Receipt uploaded successfully
✅ Data extracted (vendor, date, amount, VAT)
✅ Confidence indicators shown
✅ Warnings displayed (if any)
✅ Draft editable
✅ Confirm creates final expense
✅ Expense appears in list
✅ Chat mode streams responses
✅ Tool calls visible
✅ Conversation maintained

---

## 🔐 Security Notes

**Built-in Protection:**
- All receipt content treated as untrusted
- Injection-resistant OCR
- Input sanitization on all fields
- Confirmation gates for WRITE operations
- User/space scoped authorization

**Best Practices:**
- Never skip confirmation dialogs
- Review AI-extracted data before saving
- Don't share API keys in code
- Use environment variables

---

## 📚 Documentation

- [RECEIPT_AGENT.md](RECEIPT_AGENT.md) - Quick Scan architecture
- [COPILOT_AGENT.md](COPILOT_AGENT.md) - AI Chat architecture
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Complete overview

---

## 🎉 You're Ready!

The system is fully implemented and ready for testing. Start with a simple clear receipt to verify the basic flow, then try more complex scenarios.

**Next Steps:**
1. Set your `AI_API_KEY` in `.env`
2. Run `pnpm dev`
3. Upload a test receipt
4. Have fun! 🚀

---

## 💡 Tips

**For Best Results:**
- Use clear, flat photos of receipts
- Ensure all corners are visible
- Avoid shadows and glare
- Upload PDF when available

**For Development:**
- Check browser console for logs
- Monitor network tab for streaming
- Use Chrome DevTools for debugging
- Review AI SDK documentation for advanced features

---

## 📞 Support

- GitHub Issues: Report bugs
- Documentation: See docs above
- AI SDK Docs: https://sdk.vercel.ai/docs

---

**Happy Testing! 🎊**
