import { prisma } from "../lib/prisma";
import { ElectionStatus } from "@prisma/client";

export class AnalyticsService {
  async getElectionOverview(electionId: string) {
    const election = await prisma.election.findUnique({
      where: { id: electionId },
    });

    if (!election) {
      const err: any = new Error("Election not found.");
      err.statusCode = 404;
      err.code = "ELECTION_NOT_FOUND";
      throw err;
    }

    const [totalEligible, acceptedBallots, txStats, voters] = await Promise.all([
      prisma.voterEligibility.count({ where: { electionId } }),
      prisma.ballotSubmission.count({ where: { electionId } }),
      prisma.ballotSubmission.groupBy({
        by: ["blockchainStatus"],
        where: { electionId },
        _count: { id: true },
      }),
      prisma.voterEligibility.findMany({
        where: { electionId },
        select: {
          hasVoted: true,
          votedAt: true,
          user: {
            select: {
              department: true,
              yearLevel: true,
            },
          },
        },
      }),
    ]);

    const remainingVoters = Math.max(0, totalEligible - acceptedBallots);
    const turnoutPercentage =
      totalEligible > 0
        ? parseFloat(((acceptedBallots / totalEligible) * 100).toFixed(2))
        : 0;

    // Breakdown by Department
    const departmentMap = new Map<string, { total: number; voted: number }>();
    const yearLevelMap = new Map<string, { total: number; voted: number }>();

    for (const v of voters) {
      const dept = v.user.department || "Other";
      const yr = v.user.yearLevel || "Other";

      const currentDept = departmentMap.get(dept) || { total: 0, voted: 0 };
      currentDept.total++;
      if (v.hasVoted) currentDept.voted++;
      departmentMap.set(dept, currentDept);

      const currentYr = yearLevelMap.get(yr) || { total: 0, voted: 0 };
      currentYr.total++;
      if (v.hasVoted) currentYr.voted++;
      yearLevelMap.set(yr, currentYr);
    }

    const departmentStats = Array.from(departmentMap.entries()).map(([department, data]) => ({
      department,
      totalEligible: data.total,
      votedCount: data.voted,
      turnoutPercentage: data.total > 0 ? parseFloat(((data.voted / data.total) * 100).toFixed(1)) : 0,
    }));

    const yearLevelStats = Array.from(yearLevelMap.entries()).map(([yearLevel, data]) => ({
      yearLevel,
      totalEligible: data.total,
      votedCount: data.voted,
      turnoutPercentage: data.total > 0 ? parseFloat(((data.voted / data.total) * 100).toFixed(1)) : 0,
    }));

    // Hourly Timeline
    const hourlyMap = new Map<string, number>();
    for (const v of voters) {
      if (v.hasVoted && v.votedAt) {
        const hourStr = v.votedAt.toISOString().substring(0, 13) + ":00:00Z";
        hourlyMap.set(hourStr, (hourlyMap.get(hourStr) || 0) + 1);
      }
    }

    const hourlyActivity = Array.from(hourlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([hour, count]) => ({ hour, count }));

    return {
      electionId: election.id,
      title: election.title,
      status: election.status,
      startTime: election.startTime,
      endTime: election.endTime,
      totalEligibleVoters: totalEligible,
      acceptedBallots,
      remainingEligibleVoters: remainingVoters,
      turnoutPercentage,
      transactions: {
        confirmed: txStats.find((s) => s.blockchainStatus === "CONFIRMED")?._count.id || 0,
        pending: txStats.find((s) => s.blockchainStatus === "PENDING")?._count.id || 0,
        failed: txStats.find((s) => s.blockchainStatus === "FAILED")?._count.id || 0,
      },
      departmentStats,
      yearLevelStats,
      hourlyActivity,
    };
  }
}

export const analyticsService = new AnalyticsService();
