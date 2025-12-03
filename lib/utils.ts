/**
 * File: lib/utils.ts
 * Description: Utility functions for class name merging.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
