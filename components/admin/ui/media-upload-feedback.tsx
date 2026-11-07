/**
 * File: components/admin/ui/media-upload-feedback.tsx
 * Description: Persistent progress and actionable partial upload results.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { ActionFeedback } from '@/components/ui/action-feedback'
import type { MediaUploadProgress } from '@/lib/utils/media-upload'

export const MediaUploadFeedback = ({
  pending,
  completed,
  total,
  errors,
}: MediaUploadProgress) => {
  if (!total) return null
  return (
    <ActionFeedback
      tone={errors.length ? 'error' : pending ? 'info' : 'success'}
      title={
        pending
          ? `Import des images : ${completed} / ${total}`
          : errors.length
            ? 'Certaines images n’ont pas pu être importées'
            : 'Images importées'
      }
    >
      {pending && (
        <progress
          aria-label="Progression de l’import"
          value={completed}
          max={total}
          className="h-2 w-full accent-blue-500"
        />
      )}
      {errors.length > 0 && (
        <>
          <ul className="list-inside list-disc">
            {errors.map(error => (
              <li key={error}>{error}</li>
            ))}
          </ul>
          <p>
            Les images importées sont conservées. Vous pouvez sélectionner à
            nouveau les fichiers en échec.
          </p>
        </>
      )}
    </ActionFeedback>
  )
}
