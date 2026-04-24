import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { Project } from '../types';
import { getFirestoreDb } from './firebase';
import { validateImportedProjects } from './projectValidate';

/**
 * Firestore path: `users/{uid}/vode/projects` (document).
 * Rules should allow read/write only when `request.auth.uid == uid`.
 */
export async function loadUserProjectsFromCloud(uid: string): Promise<Project[] | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', uid, 'vode', 'projects'));
  if (!snap.exists()) return null;
  const raw = snap.data()?.projects;
  return validateImportedProjects(raw);
}

export async function saveUserProjectsToCloud(uid: string, projects: Project[]): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  const cleaned = JSON.parse(JSON.stringify(projects)) as Project[];
  await setDoc(
    doc(db, 'users', uid, 'vode', 'projects'),
    { projects: cleaned, updatedAt: serverTimestamp() },
    { merge: true }
  );
}
