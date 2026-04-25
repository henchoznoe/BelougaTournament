/**
 * File: lib/config/constants/contact.ts
 * Description: Contact form constants (recipient, subject options).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

/** Admin team inbox — receives all contact form submissions. */
export const CONTACT_EMAIL = 'belougatournament@gmail.com'

/** Available subject categories for the contact form dropdown. */
export const CONTACT_SUBJECTS = [
  { value: 'sponsoring', label: 'Sponsoring' },
  { value: 'inscription', label: 'Inscription tournoi' },
  { value: 'bug', label: 'Bug technique' },
  { value: 'feedback', label: 'Feedback / Amélioration' },
  { value: 'question', label: 'Question générale' },
  { value: 'autre', label: 'Autre' },
] as const

/** Tuple of subject values for use in Zod enum validation. */
export const CONTACT_SUBJECT_VALUES = CONTACT_SUBJECTS.map(
  s => s.value,
) as unknown as readonly [
  (typeof CONTACT_SUBJECTS)[number]['value'],
  ...(typeof CONTACT_SUBJECTS)[number]['value'][],
]
