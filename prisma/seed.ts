import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const services = [
  ["Project & Thesis Formatting", "APA, MLA, Harvard, Chicago, pagination, TOC and document cleanup.", 5000],
  ["Research Assistance", "Topic refinement, methodology guidance, literature organization and editing.", 5000],
  ["Assignment & Term-Paper Support", "Research, proofreading, structure and academic writing support.", 3000],
  ["Data Analysis Assistance", "Excel/SPSS guidance, tables, charts and interpretation support.", 7500],
  ["Printing & Binding", "Black-and-white or colour printing, binding and final document production.", 1000],
  ["Campus Delivery", "Printed academic work delivered to selected UNN campus locations.", 1500],
] as const;

async function main() {
  for (const [name, description, basePrice] of services) {
    await prisma.service.upsert({
      where: { name },
      update: { description, basePrice, active: true },
      create: { name, description, basePrice },
    });
  }
  console.log(`Seeded ${services.length} services.`);
}

main().finally(() => prisma.$disconnect());
