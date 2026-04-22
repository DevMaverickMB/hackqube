import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Deterministic pseudo-random using a simple seed
function makeRng(seed: number) {
  let s = seed;
  return (min: number, max: number) => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return min + (s % (max - min + 1));
  };
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  console.log("🧹 Cleaning existing data...");
  await prisma.auditLog.deleteMany();
  await prisma.votingSession.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.score.deleteMany();
  await prisma.presentation.deleteMany();
  await prisma.user.deleteMany();

  console.log("🌱 Seeding database with QA data...");

  const rng = makeRng(42);

  // ── Employees ──────────────────────────────────────────────
  const employees = [
    { name: "Aishwarya Ambare", role: "participant" as const },
    { name: "Ashwini Thorat", role: "participant" as const },
    { name: "Ganesh Pol", role: "participant" as const },
    { name: "Hasmukh Purohit", role: "participant" as const },
    { name: "Jayashri Gire", role: "participant" as const },
    { name: "Manisha Patil", role: "participant" as const },
    { name: "Milind Bhushan", role: "admin" as const, clerkId: "user_3CT6q8dq9j1lnpmzhPeC53T7jpY", email: "milind.bhushan@qubesense.com" },
    { name: "Nilima Prabhudesai", role: "participant" as const },
    { name: "Prajakta Nawale", role: "participant" as const },
    { name: "Pratik Phophare", role: "participant" as const },
    { name: "Raviprakash Karmale", role: "participant" as const },
    { name: "Rohit Badge", role: "participant" as const },
    { name: "Sandeep Kulkarni", role: "participant" as const },
    { name: "Sangeeta Daithankar", role: "participant" as const },
    { name: "Shubham Dhumal", role: "participant" as const },
    { name: "Vaibhav Desai", role: "participant" as const },
    { name: "Yogesh Somwanshi", role: "participant" as const },
  ];

  const users = [];
  for (const emp of employees) {
    const firstName = emp.name.split(" ")[0].toLowerCase();
    const e = emp as typeof emp & { clerkId?: string; email?: string };
    const user = await prisma.user.create({
      data: {
        clerkId: e.clerkId ?? `clerk_${firstName}_placeholder`,
        name: emp.name,
        email: e.email ?? `${firstName}@qubesense.com`,
        role: emp.role,
      },
    });
    users.push(user);
  }
  console.log(`✅ Created ${users.length} users (1 admin + ${users.length - 1} participants)`);

  // ── Presentations (16-day sprint, skip weekends) ───────────
  // Sprint started on Monday Apr 6 2026
  const sprintStart = new Date("2026-04-06");

  const presentationIdeas: {
    title: string;
    problem: string;
    tools: string[];
    approach: string;
    impact: "low" | "medium" | "high" | "critical";
    category: "ops" | "product" | "sales" | "support" | "engineering" | "other";
  }[] = [
    {
      title: "AI-Powered Invoice Reconciliation",
      problem: "Manual invoice matching takes 3+ hours daily and is error-prone",
      tools: ["GPT-4", "LangChain", "Pandas"],
      approach: "RAG pipeline to match invoices with POs using semantic similarity",
      impact: "high",
      category: "ops",
    },
    {
      title: "Smart Customer Ticket Router",
      problem: "Support tickets are manually triaged, leading to slow response times",
      tools: ["Claude", "FastAPI", "Supabase"],
      approach: "Classify incoming tickets by urgency and department using LLM embeddings",
      impact: "high",
      category: "support",
    },
    {
      title: "Automated Code Review Assistant",
      problem: "Code reviews bottleneck the team; junior devs wait hours for feedback",
      tools: ["GitHub Copilot", "OpenAI API", "AST Parser"],
      approach: "Pre-review PRs with LLM for common issues before human review",
      impact: "critical",
      category: "engineering",
    },
    {
      title: "Sales Call Insight Extractor",
      problem: "Key insights from sales calls are lost or poorly documented",
      tools: ["Whisper", "GPT-4", "Notion API"],
      approach: "Transcribe calls and extract action items, objections, and next steps",
      impact: "high",
      category: "sales",
    },
    {
      title: "Intelligent Onboarding Chatbot",
      problem: "New hires repeat the same questions; HR spends 40% of time on onboarding",
      tools: ["ChatGPT", "Pinecone", "Next.js"],
      approach: "RAG chatbot trained on company wiki and policy documents",
      impact: "medium",
      category: "ops",
    },
    {
      title: "Predictive Inventory Optimizer",
      problem: "Stockouts and overstock cause revenue loss and waste",
      tools: ["Prophet", "Gemini", "BigQuery"],
      approach: "ML forecasting combined with LLM-generated reorder recommendations",
      impact: "critical",
      category: "ops",
    },
    {
      title: "AI Meeting Notes & Action Tracker",
      problem: "Meeting notes are inconsistent and action items get lost",
      tools: ["Whisper", "Claude", "Linear API"],
      approach: "Auto-transcribe, summarize, and create tickets from meeting recordings",
      impact: "medium",
      category: "product",
    },
    {
      title: "Automated Compliance Checker",
      problem: "Manual compliance audits are slow and miss edge cases",
      tools: ["GPT-4", "LangChain", "PostgreSQL"],
      approach: "Parse regulatory docs and auto-check codebase/configs for violations",
      impact: "critical",
      category: "engineering",
    },
    {
      title: "Smart Email Campaign Generator",
      problem: "Marketing team struggles to A/B test enough email variations",
      tools: ["Claude", "Resend", "Vercel AI SDK"],
      approach: "Generate personalized email variants based on user segments and past engagement",
      impact: "medium",
      category: "sales",
    },
    {
      title: "AI-Driven Bug Triage System",
      problem: "Bug reports pile up with no clear priority; critical bugs get buried",
      tools: ["OpenAI API", "Jira API", "Sentry"],
      approach: "Auto-classify bugs by severity, assign to relevant team, suggest fixes",
      impact: "high",
      category: "engineering",
    },
    {
      title: "Document Intelligence Pipeline",
      problem: "Extracting data from PDFs and scanned docs is manual and slow",
      tools: ["Azure Document Intelligence", "GPT-4 Vision", "Python"],
      approach: "Multi-modal pipeline to extract, validate, and structure document data",
      impact: "high",
      category: "ops",
    },
    {
      title: "Customer Churn Prediction Dashboard",
      problem: "Churn signals are detected too late to take corrective action",
      tools: ["Scikit-learn", "Gemini", "Streamlit"],
      approach: "ML model identifies at-risk accounts; LLM generates retention playbooks",
      impact: "critical",
      category: "product",
    },
    {
      title: "Automated API Documentation Writer",
      problem: "API docs are outdated and incomplete, hurting developer experience",
      tools: ["Claude", "TypeScript AST", "MDX"],
      approach: "Parse code to auto-generate and keep API documentation in sync",
      impact: "medium",
      category: "engineering",
    },
    {
      title: "AI-Powered Candidate Screener",
      problem: "Recruiters spend 60% of time screening unqualified resumes",
      tools: ["GPT-4", "LangChain", "Airtable"],
      approach: "Score and rank candidates against job requirements using semantic matching",
      impact: "high",
      category: "ops",
    },
    {
      title: "Real-time Sentiment Monitor",
      problem: "Customer sentiment shifts on social media go unnoticed for days",
      tools: ["Twitter API", "Claude", "Grafana"],
      approach: "Stream social mentions, classify sentiment, alert on negative spikes",
      impact: "medium",
      category: "support",
    },
    {
      title: "Intelligent Test Case Generator",
      problem: "Writing comprehensive test cases is tedious and coverage is low",
      tools: ["Copilot", "Vitest", "OpenAI API"],
      approach: "Analyze code paths and generate edge-case tests automatically",
      impact: "high",
      category: "engineering",
    },
    {
      title: "AI Sprint Planning Assistant",
      problem: "Sprint planning meetings run long with poor effort estimates",
      tools: ["Claude", "Jira API", "React"],
      approach: "Analyze historical velocity and suggest story points + sprint composition",
      impact: "medium",
      category: "product",
    },
  ];

  const presentations = [];
  let dayOffset = 0;

  for (let i = 0; i < 17; i++) {
    const date = new Date(sprintStart);
    date.setDate(sprintStart.getDate() + dayOffset);

    // Skip weekends
    while (date.getDay() === 0 || date.getDay() === 6) {
      dayOffset++;
      date.setDate(sprintStart.getDate() + dayOffset);
    }

    const idea = presentationIdeas[i];
    const today = new Date("2026-04-17");
    const isPast = date < today;
    const isToday = date.toDateString() === today.toDateString();

    const presentation = await prisma.presentation.create({
      data: {
        userId: users[i].id,
        scheduledDate: date,
        title: idea.title,
        problemStatement: idea.problem,
        aiToolsUsed: idea.tools,
        approach: idea.approach,
        impactLevel: idea.impact,
        category: idea.category,
        status: isPast ? "completed" : isToday ? "completed" : "upcoming",
        implementationStatus: isPast
          ? (["proposed", "under_review", "in_progress", "implemented"] as const)[rng(0, 3)]
          : "proposed",
      },
    });
    presentations.push(presentation);
    dayOffset++;
  }
  console.log(`✅ Created ${presentations.length} presentations (16-day sprint schedule)`);

  // ── Votes & Scores for completed presentations (first 9 days) ──
  // Days 1-8 completed (Apr 6-15), Day 9 (Apr 16) just completed, Day 10 is today (Apr 17)
  const completedCount = 9; // 9 presentations are fully done with votes
  let totalVotes = 0;

  for (let p = 0; p < completedCount; p++) {
    const presentation = presentations[p];
    const presenter = users[p];

    // Each other user votes (except the presenter)
    const voters = users.filter((u) => u.id !== presenter.id);
    // Randomize how many people voted (between 10 and all 16)
    const voterCount = rng(10, voters.length);
    const activeVoters = voters.slice(0, voterCount);

    let sumIdea = 0,
      sumExec = 0,
      sumHelp = 0,
      sumPres = 0;

    for (const voter of activeVoters) {
      const idea = rng(5, 10);
      const exec = rng(4, 10);
      const help = rng(5, 10);
      const pres = rng(4, 10);

      await prisma.vote.create({
        data: {
          voterId: voter.id,
          presentationId: presentation.id,
          ideaScore: idea,
          executionScore: exec,
          helpfulnessScore: help,
          presentationScore: pres,
        },
      });

      sumIdea += idea;
      sumExec += exec;
      sumHelp += help;
      sumPres += pres;
      totalVotes++;
    }

    // Compute and store scores
    const count = activeVoters.length;
    const avgIdea = sumIdea / count;
    const avgExec = sumExec / count;
    const avgHelp = sumHelp / count;
    const avgPres = sumPres / count;
    const finalScore =
      avgIdea * 0.3 + avgExec * 0.3 + avgHelp * 0.2 + avgPres * 0.2;

    await prisma.score.create({
      data: {
        presentationId: presentation.id,
        avgIdea: Math.round(avgIdea * 100) / 100,
        avgExecution: Math.round(avgExec * 100) / 100,
        avgHelpfulness: Math.round(avgHelp * 100) / 100,
        avgPresentation: Math.round(avgPres * 100) / 100,
        finalScore: Math.round(finalScore * 100) / 100,
        voteCount: count,
      },
    });
  }
  console.log(`✅ Created ${totalVotes} votes across ${completedCount} completed presentations`);

  // ── Voting Sessions (closed for completed ones) ────────────
  const admin = users.find((u) => u.role === "admin")!;

  for (let p = 0; p < completedCount; p++) {
    const presentation = presentations[p];
    const openedAt = new Date(presentation.scheduledDate);
    openedAt.setHours(15, 0, 0, 0); // Opened at 3 PM
    const closesAt = new Date(openedAt);
    closesAt.setMinutes(closesAt.getMinutes() + 15);
    const closedAt = new Date(closesAt);

    await prisma.votingSession.create({
      data: {
        presentationId: presentation.id,
        openedBy: admin.id,
        openedAt,
        closesAt,
        closedAt,
        isActive: false,
      },
    });
  }
  console.log(`✅ Created ${completedCount} closed voting sessions`);

  // ── One active voting session for today's presenter (#10) ──
  const todayPresentation = presentations[9]; // Day 10 = index 9
  if (todayPresentation) {
    const now = new Date("2026-04-17T15:00:00");
    const closesAt = new Date(now);
    closesAt.setMinutes(closesAt.getMinutes() + 15);

    // Mark it as completed since voting is active
    await prisma.presentation.update({
      where: { id: todayPresentation.id },
      data: { status: "completed" },
    });

    await prisma.votingSession.create({
      data: {
        presentationId: todayPresentation.id,
        openedBy: admin.id,
        openedAt: now,
        closesAt,
        isActive: true,
      },
    });

    // Add a few early votes for the active session
    const presenter = users[9];
    const earlyVoters = users.filter((u) => u.id !== presenter.id).slice(0, 5);
    for (const voter of earlyVoters) {
      await prisma.vote.create({
        data: {
          voterId: voter.id,
          presentationId: todayPresentation.id,
          ideaScore: rng(6, 10),
          executionScore: rng(5, 10),
          helpfulnessScore: rng(6, 10),
          presentationScore: rng(5, 10),
        },
      });
      totalVotes++;
    }
    console.log("✅ Created active voting session for today with 5 early votes");
  }

  // ── Audit Logs ─────────────────────────────────────────────
  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "seed_database",
      targetType: "system",
      afterVal: { message: "QA data seeded successfully" },
    },
  });

  console.log("\n🎉 Seed complete!");
  console.log(`   ${users.length} users`);
  console.log(`   ${presentations.length} presentations`);
  console.log(`   ${totalVotes} votes`);
  console.log(`   ${completedCount + 1} voting sessions (${completedCount} closed, 1 active)`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
