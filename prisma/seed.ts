import * as dotenv from "dotenv";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");

  // Create demo user
  const hashedPassword = await hash("password123", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@bizflow.software" },
    update: {},
    create: {
      email: "demo@bizflow.software",
      name: "Demo User",
      password: hashedPassword,
    },
  });

  console.log(`✓ Created user: ${user.email}`);

  // Create demo space
  const space = await prisma.space.upsert({
    where: { slug: "demo-personal" },
    update: {
      ownerUserId: user.id,
      currency: "EUR",
      timezone: "Europe/Berlin",
      locale: "de-DE",
    },
    create: {
      name: "Demo Personal Business",
      slug: "demo-personal",
      ownerUserId: user.id,
      currency: "EUR",
      timezone: "Europe/Berlin",
      locale: "de-DE",
      spaceType: "PERSONAL",
      country: "DE",
    },
  });

  console.log(`✓ Created space: ${space.name}`);

  // Create space membership
  await prisma.spaceMembership.upsert({
    where: {
      userId_spaceId: {
        userId: user.id,
        spaceId: space.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      spaceId: space.id,
      role: "OWNER",
    },
  });

  console.log(`✓ Created space membership for ${user.email}`);

  // Create tax configuration
  const taxConfig = await prisma.taxConfig.upsert({
    where: { spaceId: space.id },
    update: {},
    create: {
      spaceId: space.id,
      isKleinunternehmer: false,
      vatFrequency: "QUARTERLY",
      taxNumber: "12 345 678 901",
      vatId: "DE123456789",
    },
  });

  console.log(`✓ Created tax config for space`);

  // Create multiple demo clients
  const clients = [
    {
      name: "Acme Corporation",
      email: "contact@acme.example",
      vatId: "DE123456789",
      address: "123 Business St, 10115 Berlin",
    },
    {
      name: "TechStart GmbH",
      email: "hello@techstart.de",
      vatId: "DE987654321",
      address: "456 Innovation Ave, 80331 Munich",
    },
    {
      name: "Global Services Ltd",
      email: "info@globalservices.co.uk",
      vatId: "GB123456789",
      address: "789 Enterprise Way, London, UK",
    },
  ];

  // Clear existing demo data for idempotent runs
  await prisma.task.deleteMany({
    where: { spaceId: space.id },
  });
  await prisma.inboxItem.deleteMany({
    where: { spaceId: space.id },
  });
  await prisma.receipt.deleteMany({
    where: { spaceId: space.id },
  });
  await prisma.invoiceLineItem.deleteMany({
    where: {
      invoice: {
        spaceId: space.id,
      },
    },
  });
  await prisma.invoice.deleteMany({
    where: { spaceId: space.id },
  });
  await prisma.client.deleteMany({
    where: { spaceId: space.id },
  });

  const createdClients = [];
  for (const clientData of clients) {
    const client = await prisma.client.create({
      data: {
        spaceId: space.id,
        ...clientData,
      },
    });
    createdClients.push(client);
  }

  console.log(`✓ Created ${createdClients.length} demo clients`);

  // Create invoices with different statuses
  const invoices = [
    {
      number: "2025-001",
      clientId: createdClients[0].id,
      issueDate: new Date("2025-01-15"),
      dueDate: new Date("2025-02-14"),
      netAmount: 1000.0,
      vatAmount: 190.0,
      grossAmount: 1190.0,
      status: "PAID" as const,
      description: "Consulting services - January 2025",
    },
    {
      number: "2025-002",
      clientId: createdClients[1].id,
      issueDate: new Date("2025-01-20"),
      dueDate: new Date("2025-02-19"),
      netAmount: 2500.0,
      vatAmount: 475.0,
      grossAmount: 2975.0,
      status: "SENT" as const,
      description: "Software development services",
    },
    {
      number: "2025-003",
      clientId: createdClients[0].id,
      issueDate: new Date("2024-12-15"),
      dueDate: new Date("2025-01-14"),
      netAmount: 1500.0,
      vatAmount: 285.0,
      grossAmount: 1785.0,
      status: "OVERDUE" as const,
      description: "Business analysis services",
    },
    {
      number: "2025-004",
      clientId: createdClients[2].id,
      issueDate: new Date("2025-02-01"),
      dueDate: new Date("2025-03-03"),
      netAmount: 3000.0,
      vatAmount: 570.0,
      grossAmount: 3570.0,
      status: "DRAFT" as const,
      description: "Project management services",
    },
  ];

  const createdInvoices = [];
  for (const invoiceData of invoices) {
    const { description, ...data } = invoiceData;
    const invoice = await prisma.invoice.create({
      data: {
        spaceId: space.id,
        currency: "EUR",
        ...data,
        lineItems: {
          create: [
            {
              description,
              quantity: data.status === "DRAFT" ? 30 : 10,
              unitPrice:
                data.status === "DRAFT"
                  ? 100.0
                  : data.netAmount / 10,
              vatRate: 0.19,
              netAmount: data.netAmount,
              vatAmount: data.vatAmount,
              grossAmount: data.grossAmount,
            },
          ],
        },
      },
    });
    createdInvoices.push(invoice);
  }

  console.log(`✓ Created ${createdInvoices.length} demo invoices`);

  // Create receipts with different categories
  const receipts = [
    {
      vendorName: "AWS",
      documentDate: new Date("2025-01-10"),
      grossAmount: 119.0,
      netAmount: 100.0,
      vatAmount: 19.0,
      vatRate: 0.19,
      category: "Cloud services",
      source: "UPLOAD" as const,
      status: "CONFIRMED" as const,
    },
    {
      vendorName: "Microsoft",
      documentDate: new Date("2025-01-15"),
      grossAmount: 238.0,
      netAmount: 200.0,
      vatAmount: 38.0,
      vatRate: 0.19,
      category: "Software licenses",
      source: "UPLOAD" as const,
      status: "CONFIRMED" as const,
    },
    {
      vendorName: "Office Supplies GmbH",
      documentDate: new Date("2025-02-01"),
      grossAmount: 71.4,
      netAmount: 60.0,
      vatAmount: 11.4,
      vatRate: 0.19,
      category: "Office supplies",
      source: "MANUAL" as const,
      status: "PENDING_REVIEW" as const,
    },
    {
      vendorName: "Deutsche Telekom",
      documentDate: new Date("2025-01-20"),
      grossAmount: 59.5,
      netAmount: 50.0,
      vatAmount: 9.5,
      vatRate: 0.19,
      category: "Telecommunications",
      source: "EMAIL" as const,
      status: "CONFIRMED" as const,
    },
    {
      vendorName: "Lufthansa",
      documentDate: new Date("2025-01-25"),
      grossAmount: 714.0,
      netAmount: 600.0,
      vatAmount: 114.0,
      vatRate: 0.19,
      category: "Travel",
      source: "UPLOAD" as const,
      status: "PENDING_REVIEW" as const,
    },
  ];

  const createdReceipts = [];
  for (const receiptData of receipts) {
    const receipt = await prisma.receipt.create({
      data: {
        spaceId: space.id,
        currency: "EUR",
        ...receiptData,
      },
    });
    createdReceipts.push(receipt);
  }

  console.log(`✓ Created ${createdReceipts.length} demo receipts`);

  // Create inbox items
  const inboxItems = [
    {
      type: "RECEIPT_REVIEW" as const,
      title: "Review receipt from Office Supplies GmbH",
      description: "€60.00 - Office supplies purchase needs categorization",
      relatedEntityType: "Receipt",
      relatedEntityId: createdReceipts[2].id,
      status: "OPEN" as const,
    },
    {
      type: "RECEIPT_REVIEW" as const,
      title: "Review receipt from Lufthansa",
      description: "€600.00 - Business travel receipt pending review",
      relatedEntityType: "Receipt",
      relatedEntityId: createdReceipts[4].id,
      status: "OPEN" as const,
    },
    {
      type: "INVOICE_DRAFT" as const,
      title: "Review draft invoice 2025-004",
      description: "Project management services invoice ready for sending",
      relatedEntityType: "Invoice",
      relatedEntityId: createdInvoices[3].id,
      status: "OPEN" as const,
    },
    {
      type: "TAX_CHECK" as const,
      title: "Q1 2025 tax period approaching",
      description: "Q1 2025 will close in 30 days. Review tax configuration.",
      status: "OPEN" as const,
    },
  ];

  const createdInboxItems = [];
  for (const itemData of inboxItems) {
    const item = await prisma.inboxItem.create({
      data: {
        spaceId: space.id,
        ...itemData,
      },
    });
    createdInboxItems.push(item);
  }

  console.log(`✓ Created ${createdInboxItems.length} demo inbox items`);

  // Create tasks
  const tasks = [
    {
      title: "Submit VAT return for Q4 2024",
      description: "Quarterly VAT return to German tax authorities",
      dueDate: new Date("2025-01-31"),
      status: "OPEN" as const,
    },
    {
      title: "Review Q1 2025 expenses",
      description: "Categorize and review all business expenses for Q1",
      dueDate: new Date("2025-04-10"),
      status: "OPEN" as const,
    },
    {
      title: "Follow up on overdue invoice 2025-003",
      description: "Contact Acme Corporation about invoice 2025-003 (€1,785.00)",
      dueDate: new Date("2025-02-10"),
      status: "OPEN" as const,
    },
    {
      title: "Send invoice 2025-002",
      description: "Review and send TechStart GmbH the pending invoice",
      dueDate: new Date("2025-02-05"),
      status: "OPEN" as const,
    },
  ];

  const createdTasks = [];
  for (const taskData of tasks) {
    const task = await prisma.task.create({
      data: {
        spaceId: space.id,
        ...taskData,
      },
    });
    createdTasks.push(task);
  }

  console.log(`✓ Created ${createdTasks.length} demo tasks`);

  // Summary
  console.log("\n✨ Database seed completed successfully!");
  console.log("\n📊 Seed Summary:");
  console.log(`  • 1 User: demo@bizflow.software (password: password123)`);
  console.log(`  • 1 Space: Demo Personal Business`);
  console.log(`  • ${createdClients.length} Clients`);
  console.log(`  • ${createdInvoices.length} Invoices (PAID, SENT, OVERDUE, DRAFT)`);
  console.log(`  • ${createdReceipts.length} Receipts (CONFIRMED, PENDING_REVIEW)`);
  console.log(`  • ${createdInboxItems.length} Inbox Items`);
  console.log(`  • ${createdTasks.length} Tasks`);
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
