/**
 * File: app/not-found.tsx
 * Description: 404 Not Found page.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

import { fr } from '@/lib/i18n/dictionaries/fr'

const NotFound = () => {
  return <div>{fr.common.errors.notFound}</div>
}

export default NotFound
