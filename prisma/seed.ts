import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");

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

  console.log(`Created user: ${user.email}`);

  const space = await prisma.space.upsert({
    where: { slug: "demo-personal" },
    update: {},
    create: {
      name: "Demo Personal Business",
      slug: "demo-personal",
      spaceType: "PERSONAL",
      country: "DE",
    },
  });

  console.log(`Created space: ${space.name}`);

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

  console.log(`Created space membership for ${user.email}`);

  const taxConfig = await prisma.taxConfig.upsert({
    where: { spaceId: space.id },
    update: {},
    create: {
      spaceId: space.id,
      isKleinunternehmer: false,
      vatFrequency: "QUARTERLY",
      taxNumber: "123/456/789",
    },
  });

  console.log(`Created tax config for space: ${space.name}`);

  const client = await prisma.client.create({
    data: {
      spaceId: space.id,
      name: "Acme Corporation",
      email: "contact@acme.example",
      vatId: "DE123456789",
      address: "123 Business St, 10115 Berlin",
    },
  });

  console.log(`Created demo client: ${client.name}`);

  const invoice = await prisma.invoice.create({
    data: {
      spaceId: space.id,
      clientId: client.id,
      number: "2025-001",
      issueDate: new Date("2025-01-15"),
      dueDate: new Date("2025-02-14"),
      currency: "EUR",
      netAmount: 1000.0,
      vatAmount: 190.0,
      grossAmount: 1190.0,
      status: "SENT",
      lineItems: {
        create: [
          {
            description: "Consulting services - January 2025",
            quantity: 10,
            unitPrice: 100.0,
            vatRate: 0.19,
            netAmount: 1000.0,
            vatAmount: 190.0,
            grossAmount: 1190.0,
          },
        ],
      },
    },
  });

  console.log(`Created demo invoice: ${invoice.number}`);

  const receipt = await prisma.receipt.create({
    data: {
      spaceId: space.id,
      vendorName: "AWS",
      documentDate: new Date("2025-01-10"),
      currency: "EUR",
      grossAmount: 119.0,
      netAmount: 100.0,
      vatAmount: 19.0,
      vatRate: 0.19,
      category: "Cloud services",
      source: "UPLOAD",
      status: "CONFIRMED",
    },
  });

  console.log(`Created demo receipt: ${receipt.vendorName}`);

  const task = await prisma.task.create({
    data: {
      spaceId: space.id,
      title: "Submit VAT return for Q1 2025",
      description: "Due date: April 10, 2025",
      dueDate: new Date("2025-04-10"),
      status: "OPEN",
    },
  });

  console.log(`Created demo task: ${task.title}`);

  console.log("Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
