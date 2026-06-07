import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    orderBy: { createdAt: 'desc' }
  });

  if (!user) {
    console.log("No user found. Please sign up first.");
    return;
  }
  
  const project = await prisma.project.create({
    data: {
      name: "Kigali Heights Expansion - Full Example",
      client: "Rwanda Infrastructure Board",
      location: "Kigali, Rwanda",
      projectType: "Commercial",
      contractType: "LUMP_SUM",
      startDate: new Date("2026-07-01"),
      completionDate: new Date("2027-07-01"),
      estimatorName: user.firstName + " " + user.lastName,
      createdById: user.id,
      
      boqItems: {
        create: [
          {
            itemNo: "1.1",
            description: "Excavation for foundation",
            unit: "m3",
            quantity: 500,
            materialRate: 0,
            laborRate: 1500, // RWF
            equipmentRate: 5000, // RWF
            totalRate: 6500,
            amount: 500 * 6500,
            section: "Substructure"
          },
          {
            itemNo: "1.2",
            description: "Concrete for footing class C25",
            unit: "m3",
            quantity: 120,
            materialRate: 120000, // RWF
            laborRate: 15000,
            equipmentRate: 5000,
            totalRate: 140000,
            amount: 120 * 140000,
            section: "Substructure"
          }
        ]
      },
      mtoItems: {
        create: [
          {
            materialName: "Cement OPC 42.5",
            unit: "Bags",
            quantity: 800,
            deliveryLocation: "Site A",
            requiredDate: new Date("2026-07-15")
          }
        ]
      },
      laborCosts: {
        create: [
          {
            trade: "Mason",
            activity: "Concrete pouring",
            productivityRate: 2.5,
            manHours: 48,
            laborRatePerHour: 2000, // RWF
            totalLaborCost: 48 * 2000
          }
        ]
      },
      equipmentCosts: {
        create: [
          {
            equipmentName: "Concrete Mixer",
            capacity: "1m3",
            hireRatePerDay: 50000, // RWF
            durationDays: 10,
            fuelCost: 100000,
            operatorCost: 50000,
            totalCost: 10 * 50000 + 100000 + 50000
          }
        ]
      },
      rateAnalyses: {
        create: [
          {
            boqItemNo: "1.2",
            description: "Concrete class C25 analysis",
            unit: "m3",
            materialCost: 120000, // RWF
            laborCost: 15000,
            equipmentCost: 5000,
            wastage: 5,
            overheads: 10,
            profitPercent: 15,
            finalUnitRate: 140000
          }
        ]
      },
      specifications: {
        create: [
          {
            specSection: "03 30 00",
            description: "Cast-in-Place Concrete",
            discipline: "STRUCT",
            revision: "Rev 1",
            remarks: "Use local suppliers for aggregates"
          }
        ]
      },
      drawings: {
        create: [
          {
            drawingNo: "A-101",
            title: "Ground Floor Architectural Plan",
            discipline: "ARCH",
            revision: "00",
            issueDate: new Date("2026-06-01"),
            scale: "1:100",
            status: "ISSUED",
            fileUrl: "https://example.com/archicad_model.pln",
            fileType: "PLN",
            length: 50,
            width: 30,
            dimensionSheets: {
              create: [
                {
                  code: "DIM-001",
                  description: "Ground Floor Main Hall Area",
                  unit: "m2",
                  rate: 50000,
                  quantity: 1,
                  length: 20,
                  width: 15,
                  total: 300,
                  formula: "20 * 15"
                }
              ]
            }
          },
          {
            drawingNo: "S-201",
            title: "Foundation Structural Details",
            discipline: "STRUCT",
            revision: "01",
            issueDate: new Date("2026-06-05"),
            scale: "1:50",
            status: "REVISED",
            fileUrl: "https://example.com/foundation_plan.png",
            fileType: "IMAGE",
            length: 10,
            width: 10
          }
        ]
      }
    }
  });

  console.log("Mock data created successfully using RWF!");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
