# Receipt → Expense Agent

An AI-powered agent that transforms receipt images into expense records with minimal user input.

## Features

### Core Capabilities
- **Smart OCR Extraction**: Uses vision-capable LLMs to extract structured data from receipt images and PDFs
- **Automatic Categorization**: AI-powered expense categorization with confidence scoring
- **Duplicate Detection**: Identifies potential duplicate expenses based on vendor, amount, and date similarity
- **Arithmetic Validation**: Validates that net + VAT = gross and flags anomalies
- **Draft Workflow**: Creates editable drafts that require explicit user confirmation before saving
- **Security-First Design**: Treats all receipt content as untrusted data to prevent injection attacks

### User Experience
- **Minimal Questions**: Only asks about critical missing fields (date, amount, vendor if low confidence)
- **Visual Confidence Indicators**: Shows extraction confidence with color-coded progress bars
- **Inline Editing**: Users can review and edit all fields before confirming
- **Warning System**: Displays non-critical warnings without blocking the workflow
- **One-Click Confirmation**: Simple "Confirm & Save" button after review

## Architecture

### Services Layer

#### Receipt Extraction (`receipt-extraction.ts`)
- `extractReceiptData()`: Vision LLM-based OCR with structured output
- `validateReceipt()`: Arithmetic validation and anomaly detection
- `sanitizeExtractedData()`: Security layer to prevent injection attacks

#### Expense Agent (`expense-agent.ts`)
- `processReceipt()`: Main workflow orchestrator
- `createExpenseDraft()`: Create draft expense (status: DRAFT)
- `commitExpenseDraft()`: Finalize expense (status: FINAL)
- `updateExpenseDraft()`: Update draft with user corrections
- `discardExpenseDraft()`: Delete draft
- `detectDuplicates()`: Find similar expenses

### API Endpoints

- `POST /api/expenses/process-receipt`: Upload and process receipt
- `PUT /api/expenses/drafts/[id]`: Update draft
- `DELETE /api/expenses/drafts/[id]`: Discard draft
- `POST /api/expenses/drafts/[id]/commit`: Finalize and save expense

### UI Components

#### ReceiptAgent (`receipt-agent.tsx`)
- File upload with drag-and-drop support
- Real-time processing states (uploading → extracting → reviewing → ready)
- Inline editing of all expense fields
- Confidence indicators with color coding
- Warning and error display
- Action buttons: Confirm, Edit, Discard

## Data Model

### Expense Schema Extensions

```prisma
enum ExpenseStatus {
  DRAFT    // Created by agent, not yet confirmed
  FINAL    // Confirmed by user
}

model Expense {
  // ... existing fields
  status         ExpenseStatus @default(FINAL)
  fileId         String?       // Link to receipt file
  agentMetadata  Json?         // Stores extraction data, validation results
}
```

### Agent Metadata Structure

```json
{
  "extracted": {
    "vendor": "string",
    "date": "YYYY-MM-DD",
    "totalGross": 100.00,
    "currency": "EUR",
    "vatAmount": 19.00,
    "vatRate": 0.19,
    "confidence": { ... }
  },
  "validation": {
    "isValid": true,
    "warnings": [...],
    "errors": [...]
  },
  "vatRate": 0.19
}
```

## Workflow

1. **Upload**: User uploads receipt image/PDF
2. **Extract**: Vision LLM extracts structured data
3. **Validate**: Arithmetic validation and duplicate detection
4. **Categorize**: AI suggests category based on vendor and historical data
5. **Draft**: Create draft expense in database (status: DRAFT)
6. **Review**: User reviews and optionally edits fields
7. **Confirm**: User confirms → status changes to FINAL
8. **Save**: Expense is now visible in expense list

## Security Considerations

### Injection Prevention
- All receipt content is treated as **untrusted data**
- OCR system is instructed to ignore instructions in receipt text
- All extracted strings are sanitized and truncated
- Script tags and code content are stripped
- No user-provided data is ever executed as code

### Validation Rules
- File size limited to 10MB
- Only image/* and application/pdf MIME types accepted
- String fields have maximum length limits
- Numeric fields are validated for finite values
- JSON data is parsed safely with error handling

## Configuration

### Environment Variables

```env
# AI Provider (openai or anthropic)
AI_PROVIDER=openai
AI_API_KEY=your_api_key_here

# For vision capabilities (production)
# Use a vision-capable model like gpt-4-vision-preview or claude-3-opus
```

### Supported Models

- **OpenAI**: gpt-4-vision-preview, gpt-4o
- **Anthropic**: claude-3-opus, claude-3-sonnet (with vision)

> **Note**: The current implementation uses a text-based fallback. To enable full vision OCR, update `receipt-extraction.ts` to call the vision API endpoint.

## Future Enhancements

### Planned Features
- [ ] Split expense feature (divide one receipt into multiple expenses)
- [ ] Auto-categorization rules (create rules from repeated patterns)
- [ ] Multi-receipt processing (batch upload)
- [ ] Email receipt integration (forward receipts to email)
- [ ] Mobile app with camera integration
- [ ] Recurring expense detection and automation
- [ ] Currency conversion with real-time FX rates
- [ ] Tips and gratuities handling

### Vision API Integration
To enable full vision OCR capabilities:

1. Update `receipt-extraction.ts` to use vision-capable models
2. Implement proper base64 image encoding
3. Add support for multi-page PDFs
4. Implement OCR confidence scoring per field
5. Add table extraction for itemized receipts

## Usage Example

```typescript
// Frontend
const formData = new FormData();
formData.append('file', receiptFile);

const response = await fetch('/api/expenses/process-receipt', {
  method: 'POST',
  body: formData,
});

const { draft, questions, message } = await response.json();

// Review draft, make edits, then commit
await fetch(`/api/expenses/drafts/${draft.id}/commit`, {
  method: 'POST',
  body: JSON.stringify({
    vendor: 'Updated Vendor',
    category: 'Cloud services',
    // ... other updates
  }),
});
```

## Testing

### Manual Testing Checklist
- [ ] Upload clear receipt image → verify correct extraction
- [ ] Upload blurry receipt → verify low confidence warnings
- [ ] Upload receipt with missing total → verify question asked
- [ ] Edit draft fields → verify changes persist
- [ ] Discard draft → verify expense not created
- [ ] Confirm draft → verify expense appears in list
- [ ] Upload duplicate receipt → verify warning shown
- [ ] Upload receipt with VAT mismatch → verify warning shown

### Test Data
Sample receipts are available in `test-data/receipts/`:
- `clear-receipt.jpg`: High-quality scan
- `blurry-receipt.jpg`: Low-quality photo
- `multi-item-receipt.pdf`: PDF with multiple line items
- `foreign-receipt.jpg`: Non-EUR currency

## Troubleshooting

### Common Issues

**OCR Extraction Fails**
- Ensure AI_API_KEY is set correctly
- Check that image is clear and all corners are visible
- Try uploading a higher resolution image
- Verify vision model is available (or use text fallback)

**Duplicate Detection Too Sensitive**
- Adjust similarity threshold in `detectDuplicates()` (currently 0.7)
- Modify date window (currently ±3 days)

**Category Suggestions Inaccurate**
- Add more historical expenses for pattern learning
- Update `CATEGORY_RULES` in `receiptCategorisation.ts`
- Customize categories for your business type

## Contributing

When adding new features:
1. Always treat receipt content as untrusted
2. Add validation for new fields
3. Update TypeScript interfaces
4. Add appropriate confidence scoring
5. Test with various receipt formats
6. Document security considerations
