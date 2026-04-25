import type { Project } from '../types';
import { MAX_IMPORT_JSON_BYTES } from './projectLimits';
import { validateImportedProjects } from './projectValidate';

export const VODE_STORAGE_KEY = 'vode-projects-v1';

export function parseProjectsJson(raw: string): Project[] | null {
  if (raw.length > MAX_IMPORT_JSON_BYTES) return null;
  try {
    const data = JSON.parse(raw) as unknown;
    return validateImportedProjects(data);
  } catch {
    return null;
  }
}

/**
 * ユーザー操作の JSON 読み込み用。
 * 新仕様の単一 Project と、旧来の全体バックアップ Project[] の両方を受け付ける。
 */
export function parseProjectImportJson(raw: string): Project[] | null {
  if (raw.length > MAX_IMPORT_JSON_BYTES) return null;
  try {
    const data = JSON.parse(raw) as unknown;
    if (Array.isArray(data)) return validateImportedProjects(data);
    return validateImportedProjects([data]);
  } catch {
    return null;
  }
}

export function loadProjectsFromStorage(): Project[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(VODE_STORAGE_KEY);
    if (!raw) return null;
    return parseProjectsJson(raw);
  } catch {
    return null;
  }
}

export function saveProjectsToStorage(projects: Project[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VODE_STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // QuotaExceeded etc.
  }
}
