import { PrismaClient, Role, ElectionStatus, Priority } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding SEAIT Online Voting System database...");

  const adminPasswordHash = await bcrypt.hash("Admin@12345", 10);
  const comelecPasswordHash = await bcrypt.hash("Comelec@12345", 10);
  const studentPasswordHash = await bcrypt.hash("Student@12345", 10);

  // 1. Create System Admin
  const admin = await prisma.user.upsert({
    where: { schoolId: "ADMIN-001" },
    update: {},
    create: {
      schoolId: "ADMIN-001",
      email: "admin@seait.edu.ph",
      passwordHash: adminPasswordHash,
      firstName: "System",
      lastName: "Administrator",
      role: Role.SYSTEM_ADMIN,
      department: "Management Information Systems",
      yearLevel: "Faculty/Staff",
    },
  });
  console.log("Seeded Admin:", admin.email);

  // 2. Create COMELEC Officer
  const comelec = await prisma.user.upsert({
    where: { schoolId: "COMELEC-001" },
    update: {},
    create: {
      schoolId: "COMELEC-001",
      email: "comelec@seait.edu.ph",
      passwordHash: comelecPasswordHash,
      firstName: "COMELEC",
      lastName: "Commissioner",
      role: Role.COMELEC_OFFICER,
      department: "Commission on Elections",
      yearLevel: "Faculty/Staff",
    },
  });
  console.log("Seeded COMELEC Officer:", comelec.email);

  // 3. Create Sample Students
  const studentsData = [
    {
      schoolId: "2024-00123",
      email: "shelley.abilo@seait.edu.ph",
      firstName: "Shelley Fatima",
      lastName: "Abilo",
      department: "College of Information and Communication Technology",
      yearLevel: "3rd Year",
    },
    {
      schoolId: "2024-00124",
      email: "stephen.reyes@seait.edu.ph",
      firstName: "Stephen",
      lastName: "Reyes",
      department: "College of Business Administration",
      yearLevel: "2nd Year",
    },
    {
      schoolId: "2024-00125",
      email: "maria.santos@seait.edu.ph",
      firstName: "Maria",
      lastName: "Santos",
      department: "College of Education",
      yearLevel: "4th Year",
    },
    {
      schoolId: "2024-00126",
      email: "juan.delacruz@seait.edu.ph",
      firstName: "Juan",
      lastName: "Dela Cruz",
      department: "College of Criminology",
      yearLevel: "1st Year",
    },
    {
      schoolId: "2024-00127",
      email: "kimberly.tan@seait.edu.ph",
      firstName: "Kimberly",
      lastName: "Tan",
      department: "College of Information and Communication Technology",
      yearLevel: "3rd Year",
    },
  ];

  const students = [];
  for (const s of studentsData) {
    const student = await prisma.user.upsert({
      where: { schoolId: s.schoolId },
      update: {},
      create: {
        ...s,
        passwordHash: studentPasswordHash,
        role: Role.STUDENT,
      },
    });
    students.push(student);
  }
  console.log(`Seeded ${students.length} student accounts.`);

  // 4. Create Active Election
  const now = new Date();
  const startTime = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
  const endTime = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days from now

  const election = await prisma.election.upsert({
    where: { id: "e1000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "e1000000-0000-0000-0000-000000000001",
      title: "SEAIT Supreme Student Council General Election 2026-2027",
      description:
        "Official institutional election for the Executive Officers and Department Representatives of the South East Asian Institute of Technology Supreme Student Council. Votes are cryptographically committed to the blockchain vote ledger.",
      academicYear: "2026-2027",
      semester: "1st Semester",
      status: ElectionStatus.OPEN,
      startTime,
      endTime,
    },
  });
  console.log("Seeded Election:", election.title);

  // 5. Positions and Candidates
  const positionsData = [
    {
      id: "p1000000-0000-0000-0000-000000000001",
      title: "President",
      description: "Chief Executive Officer of the Supreme Student Council",
      orderIndex: 1,
      maxChoices: 1,
      isRequired: true,
      candidates: [
        {
          id: "c1000000-0000-0000-0000-000000000001",
          fullName: "Christian Dave Morales",
          studentId: "2023-01001",
          partyList: "Progressive Student Alliance",
          platform:
            "Expanding student welfare services, transparent budget reports, and upgraded campus internet connectivity for digital learning.",
          photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
        },
        {
          id: "c1000000-0000-0000-0000-000000000002",
          fullName: "Bea Nicole Fernandez",
          studentId: "2023-01002",
          partyList: "Lakas SEAIT Coalition",
          platform:
            "Advocating academic flexibility, mental health support programs, and modernized student council operations with online feedback channels.",
          photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400",
        },
      ],
    },
    {
      id: "p1000000-0000-0000-0000-000000000002",
      title: "Vice President",
      description: "Assists the President and oversees council committees",
      orderIndex: 2,
      maxChoices: 1,
      isRequired: true,
      candidates: [
        {
          id: "c1000000-0000-0000-0000-000000000003",
          fullName: "Jericho Valenzuela",
          studentId: "2023-01003",
          partyList: "Progressive Student Alliance",
          platform:
            "Strengthening inter-departmental collaboration, leadership seminars, and career mentorship initiatives for graduating students.",
          photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
        },
        {
          id: "c1000000-0000-0000-0000-000000000004",
          fullName: "Alyssa Mae Ramos",
          studentId: "2023-01004",
          partyList: "Lakas SEAIT Coalition",
          platform:
            "Establishing transparent grievance desks across all college departments and supporting student-led research symposiums.",
          photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400",
        },
      ],
    },
    {
      id: "p1000000-0000-0000-0000-000000000003",
      title: "Secretary",
      description: "Custody of student council records, minutes, and communications",
      orderIndex: 3,
      maxChoices: 1,
      isRequired: true,
      candidates: [
        {
          id: "c1000000-0000-0000-0000-000000000005",
          fullName: "Patricia Ann Gomez",
          studentId: "2023-01005",
          partyList: "Progressive Student Alliance",
          platform:
            "Digital meeting archives, public council resolutions repository, and accessible voting records publication.",
          photoUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=400",
        },
        {
          id: "c1000000-0000-0000-0000-000000000006",
          fullName: "Mark Jayson Delos Reyes",
          studentId: "2023-01006",
          partyList: "Independent",
          platform:
            "Paperless council operations, real-time memo broadcasts, and student handbook compliance review.",
          photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400",
        },
      ],
    },
    {
      id: "p1000000-0000-0000-0000-000000000004",
      title: "Treasurer",
      description: "Manages student council funds and financial accountability",
      orderIndex: 4,
      maxChoices: 1,
      isRequired: true,
      candidates: [
        {
          id: "c1000000-0000-0000-0000-000000000007",
          fullName: "Kathryn Bernardo Cruz",
          studentId: "2023-01007",
          partyList: "Progressive Student Alliance",
          platform:
            "Monthly itemized expense publication, digital liquidation receipts, and fair allocation of student activity funds.",
          photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
        },
      ],
    },
  ];

  for (const posData of positionsData) {
    const position = await prisma.position.upsert({
      where: { id: posData.id },
      update: {},
      create: {
        id: posData.id,
        electionId: election.id,
        title: posData.title,
        description: posData.description,
        orderIndex: posData.orderIndex,
        maxChoices: posData.maxChoices,
        isRequired: posData.isRequired,
      },
    });

    for (const candData of posData.candidates) {
      await prisma.candidate.upsert({
        where: { id: candData.id },
        update: {},
        create: {
          id: candData.id,
          electionId: election.id,
          positionId: position.id,
          fullName: candData.fullName,
          studentId: candData.studentId,
          partyList: candData.partyList,
          platform: candData.platform,
          photoUrl: candData.photoUrl,
        },
      });
    }
  }
  console.log("Seeded Positions and Candidates.");

  // 6. Register all students as eligible voters for this election
  for (const st of students) {
    await prisma.voterEligibility.upsert({
      where: {
        electionId_userId: {
          electionId: election.id,
          userId: st.id,
        },
      },
      update: {},
      create: {
        electionId: election.id,
        userId: st.id,
        hasVoted: false,
      },
    });
  }
  console.log("Seeded Voter Eligibilities.");

  // 7. Seed Announcements
  await prisma.announcement.create({
    data: {
      title: "Official Opening of 2026-2027 Supreme Student Council Online Voting",
      content:
        "The COMELEC committee hereby proclaims the official commencement of remote voting for the Supreme Student Council General Elections. All verified SEAIT students may cast their ballots via this portal. After submitting, retain your unique Verification Reference to verify your ledger record.",
      priority: Priority.URGENT,
      authorId: comelec.id,
    },
  });

  await prisma.announcement.create({
    data: {
      title: "Verifiable Blockchain Vote Receipts Explained",
      content:
        "Each accepted ballot generates a cryptographic commitment sealed into the distributed ledger. Students can navigate to the Receipt Verification page at any time to independently confirm that their vote has been permanently recorded without exposing candidate choices.",
      priority: Priority.NORMAL,
      authorId: comelec.id,
    },
  });
  console.log("Seeded Announcements.");

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
