import { PrismaClient, TournamentFormat, MatchStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 管理者ユーザー
  const password = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      password,
      name: "管理者",
      role: "SUPER_ADMIN",
    },
  });

  console.log("Admin user created:", admin.email);

  // ========== チーム作成 ==========
  const teamNames = [
    "ドラゴンズ",
    "イーグルス",
    "スターズ",
    "サンダース",
    "フェニックス",
    "タイガース",
    "ホークス",
    "ライオンズ",
    "ベアーズ",
    "シャークス",
  ];

  const teams: { id: string; name: string }[] = [];
  for (const name of teamNames) {
    const team = await prisma.team.create({
      data: {
        name,
        representative: `${name}代表`,
        contact: `090-0000-${String(teams.length).padStart(4, "0")}`,
        memo: `${name}のメモ`,
      },
    });
    teams.push(team);
  }
  console.log(`${teams.length} teams created`);

  // ========== リーグ大会 ==========
  const league = await prisma.tournament.upsert({
    where: { slug: "spring-league-2025" },
    update: {},
    create: {
      name: "2025年春季リーグ戦",
      slug: "spring-league-2025",
      description: "地域草野球 春季リーグ戦です。全チーム総当たりで順位を決定します。",
      format: TournamentFormat.LEAGUE,
      startDate: new Date("2025-04-01"),
      endDate: new Date("2025-06-30"),
      winPoints: 3,
      drawPoints: 1,
      losePoints: 0,
    },
  });

  // リーグにチーム登録（6チーム）
  for (let i = 0; i < 6; i++) {
    await prisma.entry.upsert({
      where: {
        tournamentId_teamId: {
          tournamentId: league.id,
          teamId: teams[i].id,
        },
      },
      update: {},
      create: { tournamentId: league.id, teamId: teams[i].id, sortOrder: i },
    });
  }

  // リーグ権限
  await prisma.permission.upsert({
    where: {
      userId_tournamentId: { userId: admin.id, tournamentId: league.id },
    },
    update: {},
    create: {
      userId: admin.id,
      tournamentId: league.id,
      role: "OWNER",
    },
  });

  // リーグの試合（一部結果入力済み）
  const leagueTeams = teams.slice(0, 6);
  const leagueMatches = [
    { home: 0, away: 1, date: "2025-04-05", hs: 3, as: 1, round: 1 },
    { home: 2, away: 3, date: "2025-04-05", hs: 2, as: 2, round: 1 },
    { home: 4, away: 5, date: "2025-04-05", hs: 5, as: 0, round: 1 },
    { home: 0, away: 2, date: "2025-04-12", hs: 1, as: 4, round: 2 },
    { home: 1, away: 3, date: "2025-04-12", hs: null, as: null, round: 2 },
    { home: 4, away: 0, date: "2025-04-19", hs: null, as: null, round: 3 },
    { home: 5, away: 1, date: "2025-04-19", hs: null, as: null, round: 3 },
  ];

  for (const m of leagueMatches) {
    await prisma.match.create({
      data: {
        tournamentId: league.id,
        homeTeamId: leagueTeams[m.home].id,
        awayTeamId: leagueTeams[m.away].id,
        matchDate: new Date(m.date),
        startTime: "10:00",
        venue: "市民球場",
        gatherTime: "09:00",
        roundNumber: m.round,
        status: m.hs !== null ? MatchStatus.FINISHED : MatchStatus.SCHEDULED,
        homeScore: m.hs,
        awayScore: m.as,
        winnerId:
          m.hs !== null && m.as !== null
            ? m.hs > m.as
              ? leagueTeams[m.home].id
              : m.as > m.hs
                ? leagueTeams[m.away].id
                : null
            : null,
      },
    });
  }
  console.log("League tournament created with matches");

  // ========== トーナメント大会 ==========
  const tourney = await prisma.tournament.upsert({
    where: { slug: "spring-cup-2025" },
    update: {},
    create: {
      name: "2025年スプリングカップ",
      slug: "spring-cup-2025",
      description: "春のトーナメント大会。8チームによるシングルエリミネーション。",
      format: TournamentFormat.TOURNAMENT,
      startDate: new Date("2025-05-01"),
      endDate: new Date("2025-05-31"),
      thirdPlaceMatch: true,
    },
  });

  // トーナメントにチーム登録（8チーム）
  for (let i = 0; i < 8; i++) {
    await prisma.entry.upsert({
      where: {
        tournamentId_teamId: {
          tournamentId: tourney.id,
          teamId: teams[i].id,
        },
      },
      update: {},
      create: {
        tournamentId: tourney.id,
        teamId: teams[i].id,
        sortOrder: i,
      },
    });
  }

  // トーナメント権限
  await prisma.permission.upsert({
    where: {
      userId_tournamentId: { userId: admin.id, tournamentId: tourney.id },
    },
    update: {},
    create: {
      userId: admin.id,
      tournamentId: tourney.id,
      role: "OWNER",
    },
  });

  // トーナメント表生成（手動でブラケットを構築）
  // Round 1: 4試合
  const r1Matches = [];
  const r1Nodes = [];
  for (let i = 0; i < 4; i++) {
    const homeIdx = i * 2;
    const awayIdx = i * 2 + 1;
    const finished = i < 2; // 最初の2試合は結果入力済み

    const match = await prisma.match.create({
      data: {
        tournamentId: tourney.id,
        homeTeamId: teams[homeIdx].id,
        awayTeamId: teams[awayIdx].id,
        matchDate: new Date("2025-05-03"),
        startTime: `${10 + i * 2}:00`,
        venue: "中央公園グラウンド",
        roundNumber: 1,
        status: finished ? MatchStatus.FINISHED : MatchStatus.SCHEDULED,
        homeScore: finished ? (i === 0 ? 5 : 1) : null,
        awayScore: finished ? (i === 0 ? 2 : 3) : null,
        winnerId: finished
          ? i === 0
            ? teams[homeIdx].id
            : teams[awayIdx].id
          : null,
      },
    });
    r1Matches.push(match);

    const node = await prisma.bracketNode.create({
      data: {
        tournamentId: tourney.id,
        matchId: match.id,
        round: 1,
        position: i,
      },
    });
    r1Nodes.push(node);
  }

  // Round 2: 2試合（準決勝）
  const r2Matches = [];
  const r2Nodes = [];
  for (let i = 0; i < 2; i++) {
    const homeTeamId = i === 0 ? teams[0].id : null; // 1試合目の勝者
    const awayTeamId = i === 0 ? teams[3].id : null; // 2試合目の勝者

    const match = await prisma.match.create({
      data: {
        tournamentId: tourney.id,
        homeTeamId,
        awayTeamId,
        matchDate: new Date("2025-05-10"),
        startTime: `${10 + i * 3}:00`,
        venue: "中央公園グラウンド",
        roundNumber: 2,
        status: MatchStatus.SCHEDULED,
      },
    });
    r2Matches.push(match);

    const node = await prisma.bracketNode.create({
      data: {
        tournamentId: tourney.id,
        matchId: match.id,
        round: 2,
        position: i,
      },
    });
    r2Nodes.push(node);
  }

  // 決勝
  const finalMatch = await prisma.match.create({
    data: {
      tournamentId: tourney.id,
      matchDate: new Date("2025-05-17"),
      startTime: "13:00",
      venue: "中央公園グラウンド",
      roundNumber: 3,
      status: MatchStatus.SCHEDULED,
    },
  });

  const finalNode = await prisma.bracketNode.create({
    data: {
      tournamentId: tourney.id,
      matchId: finalMatch.id,
      round: 3,
      position: 0,
    },
  });

  // 3位決定戦
  const thirdMatch = await prisma.match.create({
    data: {
      tournamentId: tourney.id,
      matchDate: new Date("2025-05-17"),
      startTime: "10:00",
      venue: "中央公園グラウンド",
      roundNumber: 3,
      status: MatchStatus.SCHEDULED,
    },
  });

  await prisma.bracketNode.create({
    data: {
      tournamentId: tourney.id,
      matchId: thirdMatch.id,
      round: 3,
      position: 1,
      isThirdPlace: true,
    },
  });

  // nextNode設定
  for (let i = 0; i < 4; i++) {
    await prisma.bracketNode.update({
      where: { id: r1Nodes[i].id },
      data: { nextNodeId: r2Nodes[Math.floor(i / 2)].id },
    });
  }
  for (let i = 0; i < 2; i++) {
    await prisma.bracketNode.update({
      where: { id: r2Nodes[i].id },
      data: { nextNodeId: finalNode.id },
    });
  }

  console.log("Tournament created with bracket");

  // ========== お知らせ ==========
  await prisma.announcement.createMany({
    data: [
      {
        tournamentId: league.id,
        title: "春季リーグ開幕のお知らせ",
        content: "4月5日より2025年春季リーグ戦を開始します。参加チームの皆さん、よろしくお願いいたします。",
        pinned: true,
      },
      {
        tournamentId: league.id,
        title: "第2節の日程変更について",
        content: "4月12日の第2節は予定通り開催します。雨天の場合は翌週に順延となります。",
        pinned: false,
      },
      {
        tournamentId: tourney.id,
        title: "スプリングカップ開催決定",
        content: "2025年5月にスプリングカップを開催します。8チームによるトーナメント方式です。",
        pinned: true,
      },
      {
        tournamentId: tourney.id,
        title: "組み合わせ抽選結果",
        content: "5月3日の1回戦の組み合わせが決定しました。トーナメント表をご確認ください。",
        pinned: false,
      },
    ],
  });

  console.log("Announcements created");
  console.log("\n============================");
  console.log("Seed completed!");
  console.log("Login: admin@example.com / admin123");
  console.log("============================");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
