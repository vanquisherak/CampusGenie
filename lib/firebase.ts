import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App singleton
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore using the specific database ID provisioned
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Auth instance
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Security / Protocol Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot according to skill guidelines
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client indicates offline status or network limit.');
    }
    return false;
  }
}

// Auth helper functions
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    if (cred.user) {
      // Sync or update profile record in Firestore
      const userRef = doc(db, 'users', cred.user.uid);
      await setDoc(
        userRef,
        {
          displayName: cred.user.displayName || 'Campus Scholar',
          email: cred.user.email || '',
          photoURL: cred.user.photoURL || '',
          targetTrack: 'Computer Science & AI',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }
    return cred.user;
  } catch (error) {
    console.error('Google Sign-in Error:', error);
    throw error;
  }
}

export async function logOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// Diagnostic persistence
export async function saveDiagnosticAttempt(
  userId: string,
  result: {
    topic: string;
    score: number;
    total: number;
    percentage: number;
    misconceptionsCleared: number;
  }
) {
  const id = `diag_${Date.now()}`;
  const path = `users/${userId}/diagnostics/${id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'diagnostics', id), {
      userId,
      topic: result.topic,
      score: result.score,
      total: result.total,
      percentage: result.percentage,
      misconceptionsCleared: result.misconceptionsCleared,
      attemptedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

// Study block persistence
export async function saveStudyBlock(
  userId: string,
  block: {
    title: string;
    durationMin?: number;
    durationMinutes?: number;
    completed?: boolean;
    status?: string;
    notes?: string;
    course?: string;
    scheduledFor?: string;
    microStepsCount?: number;
    completedStepsCount?: number;
    blueprintGoal?: string;
    lastUpdated?: string;
  }
) {
  const id = `block_${Date.now()}`;
  const path = `users/${userId}/studyBlocks/${id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'studyBlocks', id), {
      userId,
      title: block.title,
      durationMin: block.durationMin ?? block.durationMinutes ?? 30,
      completed: block.completed ?? block.status === 'completed',
      status: block.status ?? (block.completed ? 'completed' : 'in-progress'),
      course: block.course || 'General',
      notes: block.notes || '',
      blueprintGoal: block.blueprintGoal || '',
      microStepsCount: block.microStepsCount || 0,
      completedStepsCount: block.completedStepsCount || 0,
      scheduledFor: block.scheduledFor || new Date().toISOString(),
      updatedAt: block.lastUpdated || new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

// Bookmark project persistence
export async function toggleProjectBookmark(
  userId: string,
  project: { id: string; title: string; tier: string },
  currentlySaved: boolean
) {
  const id = `bm_${project.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  const path = `users/${userId}/projectBookmarks/${id}`;
  try {
    if (currentlySaved) {
      await deleteDoc(doc(db, 'users', userId, 'projectBookmarks', id));
    } else {
      await setDoc(doc(db, 'users', userId, 'projectBookmarks', id), {
        userId,
        projectId: project.id,
        title: project.title,
        tier: project.tier,
        savedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, currentlySaved ? OperationType.DELETE : OperationType.CREATE, path);
  }
}
