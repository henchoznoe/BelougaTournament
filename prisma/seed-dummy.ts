/**
 * File: prisma/seed-dummy.ts
 * Description: Seed script for dummy/demo data (dev & preview environments only).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { PrismaClient } from './generated/prisma/client'

// ============================================================================
// TYPES
// ============================================================================

type TournamentFormat = 'SOLO' | 'TEAM'
type TournamentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
type FieldType = 'TEXT' | 'NUMBER'

interface TournamentField {
  label: string
  type: FieldType
  required: boolean
  order: number
}

interface TournamentConfig {
  title: string
  slug: string
  description: string
  format: TournamentFormat
  teamSize: number
  game: string
  prize: string
  status: TournamentStatus
  startDate: Date
  endDate: Date
  registrationOpen: Date
  registrationClose: Date
  rules: string
  maxTeams: number
  fields: TournamentField[]
}

// ============================================================================
// DUMMY DATA DEFINITIONS
// ============================================================================

const DUMMY_USERS = [
  { name: 'Lucas Martin', displayName: 'LucasM', email: 'lucas.martin@demo.test', discordId: '100000000000000001', image: null },
  { name: 'Emma Dupont', displayName: 'EmmaDup', email: 'emma.dupont@demo.test', discordId: '100000000000000002', image: null },
  { name: 'Hugo Bernard', displayName: 'HugoB', email: 'hugo.bernard@demo.test', discordId: '100000000000000003', image: null },
  { name: 'Chloé Moreau', displayName: 'ChloéM', email: 'chloe.moreau@demo.test', discordId: '100000000000000004', image: null },
  { name: 'Nathan Lefèvre', displayName: 'NathanL', email: 'nathan.lefevre@demo.test', discordId: '100000000000000005', image: null },
  { name: 'Léa Fournier', displayName: 'LéaF', email: 'lea.fournier@demo.test', discordId: '100000000000000006', image: null },
  { name: 'Théo Girard', displayName: 'ThéoGG', email: 'theo.girard@demo.test', discordId: '100000000000000007', image: null },
  { name: 'Manon Rousseau', displayName: 'ManonR', email: 'manon.rousseau@demo.test', discordId: '100000000000000008', image: null },
  { name: 'Enzo Lambert', displayName: 'EnzoLamb', email: 'enzo.lambert@demo.test', discordId: '100000000000000009', image: null },
  { name: 'Camille Bonnet', displayName: 'CamilleB', email: 'camille.bonnet@demo.test', discordId: '100000000000000010', image: null },
  { name: 'Tom Mercier', displayName: 'TomMerc', email: 'tom.mercier@demo.test', discordId: '100000000000000011', image: null },
  { name: 'Jade Duval', displayName: 'JadeDuv', email: 'jade.duval@demo.test', discordId: '100000000000000012', image: null },
  { name: 'Louis Petit', displayName: 'LouisP', email: 'louis.petit@demo.test', discordId: '100000000000000013', image: null },
  { name: 'Inès Roux', displayName: 'InèsR', email: 'ines.roux@demo.test', discordId: '100000000000000014', image: null },
  { name: 'Raphaël Morel', displayName: 'RaphMorel', email: 'raphael.morel@demo.test', discordId: '100000000000000015', image: null },
  { name: 'Zoé Laurent', displayName: 'ZoéL', email: 'zoe.laurent@demo.test', discordId: '100000000000000016', image: null },
  { name: 'Arthur Simon', displayName: 'ArthurS', email: 'arthur.simon@demo.test', discordId: '100000000000000017', image: null },
  { name: 'Lina Michel', displayName: 'LinaM', email: 'lina.michel@demo.test', discordId: '100000000000000018', image: null },
  // Banned users
  { name: 'Maxime Cheater', displayName: 'xXCheaterXx', email: 'maxime.cheater@demo.test', discordId: '100000000000000019', image: null },
  { name: 'Sophie Toxic', displayName: 'ToxicSoph', email: 'sophie.toxic@demo.test', discordId: '100000000000000020', image: null },
] as const

// Users that will be assigned ADMIN role
const ADMIN_EMAILS = ['lucas.martin@demo.test', 'emma.dupont@demo.test'] as const

// Banned user configs
const BANNED_USERS = [
  {
    email: 'maxime.cheater@demo.test',
    bannedUntil: new Date('9999-12-31'), // Permanent ban
    banReason: 'Utilisation de logiciel de triche détectée lors du tournoi Valorant Cup.',
  },
  {
    email: 'sophie.toxic@demo.test',
    bannedUntil: new Date('2026-04-01'), // Temporary ban
    banReason: 'Comportement toxique répété envers les autres joueurs.',
  },
] as const

const TOURNAMENTS: TournamentConfig[] = [
  {
    title: 'Belouga Valorant Cup',
    slug: 'belouga-valorant-cup',
    description: 'Tournoi Valorant 5v5 organisé par Belouga. Ouvert à tous les niveaux.',
    format: 'TEAM',
    teamSize: 5,
    game: 'Valorant',
    prize: '500 CHF',
    status: 'PUBLISHED',
    startDate: daysFromNow(14),
    endDate: daysFromNow(16),
    registrationOpen: daysFromNow(-7),
    registrationClose: daysFromNow(12),
    rules: 'Format: Double élimination BO3. Finale en BO5. Serveurs EU West.',
    maxTeams: 8,
    fields: [
      { label: 'Rang actuel', type: 'TEXT', required: true, order: 0 },
      { label: 'Riot ID', type: 'TEXT', required: true, order: 1 },
    ],
  },
  {
    title: 'Rocket League 2v2 Open',
    slug: 'rocket-league-2v2-open',
    description: 'Tournoi Rocket League en 2v2. Tous les rangs sont les bienvenus !',
    format: 'TEAM',
    teamSize: 2,
    game: 'Rocket League',
    prize: '200 CHF',
    status: 'PUBLISHED',
    startDate: daysFromNow(21),
    endDate: daysFromNow(21),
    registrationOpen: daysFromNow(-3),
    registrationClose: daysFromNow(19),
    rules: 'Format: Simple élimination BO3. Finale en BO5.',
    maxTeams: 16,
    fields: [
      { label: 'Epic ID', type: 'TEXT', required: true, order: 0 },
    ],
  },
  {
    title: 'CS2 Solo Championship',
    slug: 'cs2-solo-championship',
    description: 'Tournoi CS2 en format solo (1v1). Prouvez que vous êtes le meilleur !',
    format: 'SOLO',
    teamSize: 1,
    game: 'Counter-Strike 2',
    prize: '150 CHF',
    status: 'PUBLISHED',
    startDate: daysFromNow(30),
    endDate: daysFromNow(31),
    registrationOpen: daysFromNow(-1),
    registrationClose: daysFromNow(28),
    rules: 'Format: Arbre à simple élimination. Toutes les maps actives. BO1 puis BO3 dès les quarts.',
    maxTeams: 32,
    fields: [
      { label: 'Steam ID', type: 'TEXT', required: true, order: 0 },
      { label: 'Heures de jeu', type: 'NUMBER', required: false, order: 1 },
    ],
  },
  {
    title: 'League of Legends Showdown',
    slug: 'league-of-legends-showdown',
    description: 'Le grand tournoi LoL 5v5 de la saison ! Inscription réservée aux équipes complètes.',
    format: 'TEAM',
    teamSize: 5,
    game: 'League of Legends',
    prize: '1000 CHF',
    status: 'DRAFT',
    startDate: daysFromNow(60),
    endDate: daysFromNow(62),
    registrationOpen: daysFromNow(30),
    registrationClose: daysFromNow(55),
    rules: 'Format: Phase de groupes puis élimination directe. Draft Tournament.',
    maxTeams: 16,
    fields: [
      { label: 'Riot ID', type: 'TEXT', required: true, order: 0 },
      { label: 'Rang Solo/Duo', type: 'TEXT', required: true, order: 1 },
      { label: 'Rôle principal', type: 'TEXT', required: true, order: 2 },
    ],
  },
  {
    title: 'Belouga Fortnite Winter Cup',
    slug: 'belouga-fortnite-winter-cup',
    description: "Le tournoi Fortnite de l'hiver dernier. Merci à tous les participants !",
    format: 'SOLO',
    teamSize: 1,
    game: 'Fortnite',
    prize: '300 CHF',
    status: 'ARCHIVED',
    startDate: daysFromNow(-30),
    endDate: daysFromNow(-29),
    registrationOpen: daysFromNow(-60),
    registrationClose: daysFromNow(-32),
    rules: 'Format: Battle Royale scoring system. 6 games au total.',
    maxTeams: 50,
    fields: [
      { label: 'Epic ID', type: 'TEXT', required: true, order: 0 },
    ],
  },
]

const SPONSORS = [
  { name: 'GameZone', url: 'https://gamezone.demo.test', supportedSince: new Date('2023-01-15T12:00:00.000Z') },
  { name: 'SwissGaming', url: 'https://swissgaming.demo.test', supportedSince: new Date('2023-06-01T12:00:00.000Z') },
  { name: 'PixelForge', url: 'https://pixelforge.demo.test', supportedSince: new Date('2024-03-10T12:00:00.000Z') },
]

// Team names for team-based tournaments
const TEAM_NAMES = [
  'Phoenix Rising', 'Shadow Wolves', 'Neon Vipers', 'Arctic Storm',
  'Dark Knights', 'Cyber Foxes', 'Iron Bears', 'Crystal Dragons',
  'Thunder Hawks', 'Lunar Titans', 'Flame Sentinels', 'Frost Giants',
  'Steel Panthers', 'Nova Squad', 'Venom Strike', 'Eclipse Warriors',
]

// ============================================================================
// HELPERS
// ============================================================================

function daysFromNow(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(12, 0, 0, 0) // Normalize to noon
  return date
}

// ============================================================================
// CLEAN FUNCTION
// ============================================================================

const cleanDummyData = async (prisma: PrismaClient) => {
  console.log('Cleaning existing dummy data...')

  // Delete in order respecting FK constraints
  // 1. Delete registrations, team members, teams for dummy tournaments
  // 2. Delete admin assignments for dummy users
  // 3. Delete dummy tournaments (cascades fields, teams, registrations)
  // 4. Delete dummy users (cascade sessions, accounts)
  // 5. Delete dummy sponsors

  const dummyEmails = DUMMY_USERS.map(u => u.email)
  const dummySlugs = TOURNAMENTS.map(t => t.slug)
  const dummySponsorNames = SPONSORS.map(s => s.name)

  // Delete tournament registrations for dummy tournaments
  await prisma.tournamentRegistration.deleteMany({
    where: { tournament: { slug: { in: [...dummySlugs] } } },
  })

  // Delete team members for dummy tournaments
  await prisma.teamMember.deleteMany({
    where: { team: { tournament: { slug: { in: [...dummySlugs] } } } },
  })

  // Delete teams for dummy tournaments
  await prisma.team.deleteMany({
    where: { tournament: { slug: { in: [...dummySlugs] } } },
  })

  // Delete tournament fields for dummy tournaments
  await prisma.tournamentField.deleteMany({
    where: { tournament: { slug: { in: [...dummySlugs] } } },
  })

  // Delete admin assignments for dummy users
  await prisma.adminAssignment.deleteMany({
    where: { admin: { email: { in: [...dummyEmails] } } },
  })

  // Delete dummy tournaments
  await prisma.tournament.deleteMany({
    where: { slug: { in: [...dummySlugs] } },
  })

  // Delete sessions and accounts for dummy users (cascade should handle, but be explicit)
  await prisma.session.deleteMany({
    where: { user: { email: { in: [...dummyEmails] } } },
  })
  await prisma.account.deleteMany({
    where: { user: { email: { in: [...dummyEmails] } } },
  })

  // Delete dummy users
  await prisma.user.deleteMany({
    where: { email: { in: [...dummyEmails] } },
  })

  // Delete dummy sponsors
  await prisma.sponsor.deleteMany({
    where: { name: { in: [...dummySponsorNames] } },
  })

  console.log('Dummy data cleaned.')
}

// ============================================================================
// SEED FUNCTION
// ============================================================================

export const seedDummy = async (prisma: PrismaClient) => {
  // Step 1: Clean existing dummy data
  await cleanDummyData(prisma)

  // Step 2: Create dummy users
  console.log('Creating dummy users...')
  const createdUsers = []

  for (const userData of DUMMY_USERS) {
    const banConfig = BANNED_USERS.find(b => b.email === userData.email)
    const isAdmin = ADMIN_EMAILS.includes(userData.email as typeof ADMIN_EMAILS[number])

    const user = await prisma.user.create({
      data: {
        name: userData.name,
        displayName: userData.displayName,
        email: userData.email,
        emailVerified: true,
        image: userData.image,
        discordId: userData.discordId,
        role: isAdmin ? 'ADMIN' : 'USER',
        bannedUntil: banConfig?.bannedUntil ?? null,
        banReason: banConfig?.banReason ?? null,
      },
    })
    createdUsers.push(user)
  }
  console.log(`  Created ${createdUsers.length} dummy users (${ADMIN_EMAILS.length} admins, ${BANNED_USERS.length} banned)`)

  // Step 3: Create dummy tournaments with fields
  console.log('Creating dummy tournaments...')
  const createdTournaments = []

  for (const tournamentData of TOURNAMENTS) {
    const { fields, ...tournamentFields } = tournamentData
    const tournament = await prisma.tournament.create({
      data: {
        ...tournamentFields,
        fields: {
          create: fields.map(f => ({
            label: f.label,
            type: f.type,
            required: f.required,
            order: f.order,
          })),
        },
      },
    })
    createdTournaments.push(tournament)
  }
  console.log(`  Created ${createdTournaments.length} tournaments`)

  // Step 4: Create admin assignments (assign dummy admins to published tournaments)
  console.log('Creating admin assignments...')
  const adminUsers = createdUsers.filter(u => ADMIN_EMAILS.includes(u.email as typeof ADMIN_EMAILS[number]))
  const publishedTournaments = createdTournaments.filter((_, i) => TOURNAMENTS[i].status === 'PUBLISHED')
  let assignmentCount = 0

  for (const admin of adminUsers) {
    for (const tournament of publishedTournaments) {
      await prisma.adminAssignment.create({
        data: {
          adminId: admin.id,
          tournamentId: tournament.id,
        },
      })
      assignmentCount++
    }
  }
  console.log(`  Created ${assignmentCount} admin assignments`)

  // Step 5: Create teams and registrations
  console.log('Creating teams and registrations...')
  let teamCount = 0
  let registrationCount = 0

  // Get non-banned, non-admin regular users for registrations
  const regularUsers = createdUsers.filter(u => {
    const isBanned = BANNED_USERS.some(b => b.email === u.email)
    const isAdmin = ADMIN_EMAILS.includes(u.email as typeof ADMIN_EMAILS[number])
    return !isBanned && !isAdmin
  })


  for (let tIdx = 0; tIdx < createdTournaments.length; tIdx++) {
    const tournament = createdTournaments[tIdx]
    const tournamentConfig = TOURNAMENTS[tIdx]

    // Skip draft tournaments (no registrations yet)
    if (tournamentConfig.status === 'DRAFT') continue

    if (tournamentConfig.format === 'TEAM') {
      // Create teams with members and registrations
      const teamSize = tournamentConfig.teamSize
      const maxTeamsToCreate = Math.min(
        Math.floor(regularUsers.length / teamSize),
        4, // Create up to 4 teams per tournament
      )

      // Track which users are already used in this tournament
      let userIndex = 0

      for (let t = 0; t < maxTeamsToCreate; t++) {
        if (userIndex + teamSize > regularUsers.length) break

        const teamName = TEAM_NAMES[teamCount % TEAM_NAMES.length]
        const captain = regularUsers[userIndex]
        const members = regularUsers.slice(userIndex, userIndex + teamSize)
        userIndex += teamSize

        // Create team
        const team = await prisma.team.create({
          data: {
            name: teamName,
            tournamentId: tournament.id,
            captainId: captain.id,
            isFull: members.length >= teamSize,
            members: {
              create: members.map(m => ({
                userId: m.id,
              })),
            },
          },
        })

        // Create registration for the team (registered by captain)
        const fieldValues: Record<string, string> = {}
        for (const field of tournamentConfig.fields) {
          fieldValues[field.label] = field.type === 'NUMBER' ? '1500' : `demo-${captain.displayName}`
        }

        await prisma.tournamentRegistration.create({
          data: {
            tournamentId: tournament.id,
            teamId: team.id,
            userId: captain.id,
            fieldValues: JSON.stringify(fieldValues),
          },
        })

        teamCount++
        registrationCount++
      }
    } else {
      // SOLO format — create individual registrations
      const maxRegs = Math.min(regularUsers.length, 6)

      for (let r = 0; r < maxRegs; r++) {
        const user = regularUsers[r]

        const fieldValues: Record<string, string> = {}
        for (const field of tournamentConfig.fields) {
          fieldValues[field.label] = field.type === 'NUMBER' ? `${500 + r * 200}` : `demo-${user.displayName}`
        }

        await prisma.tournamentRegistration.create({
          data: {
            tournamentId: tournament.id,
            userId: user.id,
            fieldValues: JSON.stringify(fieldValues),
          },
        })

        registrationCount++
      }
    }
  }
  console.log(`  Created ${teamCount} teams and ${registrationCount} registrations`)

  // Step 6: Create dummy sponsors
  console.log('Creating dummy sponsors...')
  for (const sponsor of SPONSORS) {
    await prisma.sponsor.create({
      data: {
        name: sponsor.name,
        imageUrls: [],
        url: sponsor.url,
        supportedSince: sponsor.supportedSince,
      },
    })
  }
  console.log(`  Created ${SPONSORS.length} sponsors`)

  console.log('Dummy data seeded successfully!')
}
