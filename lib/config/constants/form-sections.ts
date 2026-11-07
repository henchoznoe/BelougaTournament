/**
 * File: lib/config/constants/form-sections.ts
 * Description: Tournament editor sections and their associated validation fields.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

export const TOURNAMENT_FORM_SECTIONS = [
  {
    id: 'general',
    label: 'Général',
    fields: ['title', 'description', 'slug', 'status'],
  },
  { id: 'games', label: 'Jeux', fields: ['games'] },
  {
    id: 'format',
    label: 'Format',
    fields: [
      'format',
      'teamSize',
      'maxTeams',
      'showRegistrants',
      'teamLogoEnabled',
    ],
  },
  {
    id: 'payment',
    label: 'Paiement',
    fields: [
      'registrationType',
      'entryFeeAmount',
      'entryFeeCurrency',
      'refundPolicyType',
      'refundDeadlineDays',
      'donationEnabled',
      'donationType',
      'donationFixedAmount',
      'donationMinAmount',
    ],
  },
  {
    id: 'dates',
    label: 'Dates',
    fields: ['startDate', 'endDate', 'registrationOpen', 'registrationClose'],
  },
  { id: 'images', label: 'Médias', fields: ['imageUrls', 'streamUrl'] },
  { id: 'content', label: 'Contenu', fields: ['rules', 'prize'] },
  { id: 'fields', label: 'Champs', fields: ['fields'] },
  {
    id: 'stages',
    label: 'Phases',
    fields: ['toornamentId', 'toornamentStages'],
  },
] as const
