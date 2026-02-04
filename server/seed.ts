import { storage } from "./storage";

const sampleVentures = [
  { name: "TechStartup Inc", color: "#3B82F6" },
  { name: "Creative Agency", color: "#10B981" },
  { name: "E-Commerce Store", color: "#F59E0B" },
];

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export async function seedDatabase() {
  // Check if already seeded
  const existingVentures = await storage.getVentures();
  if (existingVentures.length > 0) {
    console.log("Database already has data, skipping seed...");
    return;
  }

  console.log("Seeding database with sample data...");

  // Create ventures
  const createdVentures = [];
  for (const venture of sampleVentures) {
    const created = await storage.createVenture(venture);
    createdVentures.push(created);
  }

  // Create sample revenue data for each venture
  const currentYear = new Date().getFullYear();
  const revenuePatterns = [
    // TechStartup - growing steadily
    [8500, 9200, 11000, 12500, 14000, 15500, 17000, 18200, 20000, 22500, 25000, 28000],
    // Creative Agency - seasonal with Q4 spike
    [15000, 12000, 14000, 16000, 18000, 20000, 17000, 15000, 22000, 28000, 35000, 40000],
    // E-Commerce - holiday peaks
    [5000, 4500, 6000, 5500, 7000, 8000, 7500, 9000, 10000, 12000, 25000, 45000],
  ];

  for (let i = 0; i < createdVentures.length; i++) {
    const venture = createdVentures[i];
    const pattern = revenuePatterns[i];

    for (let j = 0; j < 12; j++) {
      await storage.createRevenueData({
        ventureId: venture.id,
        month: months[j],
        year: currentYear,
        amount: pattern[j],
      });
    }
  }

  // Create sample priorities for each venture
  const prioritySets = [
    [
      { text: "Launch MVP by end of month", order: 0 },
      { text: "Close funding round", order: 1 },
      { text: "Hire senior engineer", order: 2 },
    ],
    [
      { text: "Deliver client project on time", order: 0 },
      { text: "Expand design team", order: 1 },
      { text: "Update portfolio website", order: 2 },
    ],
    [
      { text: "Optimize checkout conversion", order: 0 },
      { text: "Add 50 new products", order: 1 },
      { text: "Set up holiday promotions", order: 2 },
    ],
  ];

  for (let i = 0; i < createdVentures.length; i++) {
    const venture = createdVentures[i];
    const priorityData = prioritySets[i];
    for (const priority of priorityData) {
      await storage.createPriority({
        ventureId: venture.id,
        text: priority.text,
        order: priority.order,
        completed: false,
      });
    }
  }

  // Create sample widgets
  await storage.createWidget({
    type: "notes",
    title: "Quick Notes",
    content: {
      markdown: `# Welcome to HunterOS

Your personal dashboard for tracking what matters.

## Features
- **Notes** with markdown and code blocks
- **Priorities** tracking (top 3 per venture)
- **Revenue** graphs
- **Embedded** iframes

### Example Code Block
\`\`\`javascript
const trackProgress = () => {
  console.log("Stay focused!");
};
\`\`\`
`,
    },
    collapsed: false,
    layout: { i: "notes-1", x: 0, y: 0, w: 4, h: 8, minW: 2, minH: 4 },
  });

  await storage.createWidget({
    type: "priorities",
    title: "TechStartup Priorities",
    content: { ventureId: createdVentures[0].id },
    collapsed: false,
    layout: { i: "priorities-1", x: 4, y: 0, w: 4, h: 6, minW: 3, minH: 5 },
  });

  await storage.createWidget({
    type: "revenue",
    title: "Revenue Overview",
    content: { ventureId: createdVentures[0].id, chartType: "line" },
    collapsed: false,
    layout: { i: "revenue-1", x: 8, y: 0, w: 4, h: 7, minW: 4, minH: 5 },
  });

  console.log("Database seeded successfully!");
}
