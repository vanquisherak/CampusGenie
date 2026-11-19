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
  collection,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  type Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import type { LearnerTopicState } from '@/lib/curriculum/types';
import type { StudyNote } from '@/lib/rag/retriever';

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

function buildErrorInfo(error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo {
  return {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo = buildErrorInfo(error, operationType, path);
  console.error('Firestore Security / Protocol Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function logSnapshotError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = buildErrorInfo(error, operationType, path);
  console.warn('Firestore Listener Warning: ', JSON.stringify(errInfo));
}

export function sanitizeDocId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
  return cleaned || `doc_${Date.now()}`;
}

function clampStr(val: string | undefined, max: number, fallback = ''): string {
  const s = (val ?? fallback).trim();
  return s.slice(0, max);
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
      const userRef = doc(db, 'users', cred.user.uid);
      const existingSnap = await getDoc(userRef).catch(() => null);
      const existingData = existingSnap?.exists() ? existingSnap.data() : null;
      const now = new Date().toISOString();

      await setDoc(
        userRef,
        {
          displayName: clampStr(cred.user.displayName || 'Campus Scholar', 100, 'Campus Scholar'),
          email: clampStr(cred.user.email || (existingData?.email as string) || '', 150),
          photoURL: clampStr(cred.user.photoURL || '', 500),
          targetTrack: clampStr((existingData?.targetTrack as string) || 'Computer Science & AI', 100),
          createdAt: (existingData?.createdAt as string) || now,
          updatedAt: now,
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

// =========================================================================
// 1. LEARNER PROGRESS SYNC (Mastery & Resolved Misconceptions)
// =========================================================================
export interface LearnerProgressDoc {
  userId: string;
  topics: LearnerTopicState[];
  resolvedMisconceptions?: string[];
  updatedAt: string;
}

export async function saveLearnerProgress(
  userId: string,
  topics: LearnerTopicState[],
  resolvedMisconceptions: string[] = []
) {
  const path = `users/${userId}/learnerState/current`;
  try {
    await setDoc(doc(db, 'users', userId, 'learnerState', 'current'), {
      userId,
      topics: topics.slice(0, 30),
      resolvedMisconceptions: resolvedMisconceptions.slice(0, 30),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export function subscribeToLearnerProgress(
  userId: string,
  onData: (progress: LearnerProgressDoc | null) => void
): Unsubscribe {
  const path = `users/${userId}/learnerState/current`;
  return onSnapshot(
    doc(db, 'users', userId, 'learnerState', 'current'),
    (snap) => {
      if (snap.exists()) {
        onData(snap.data() as LearnerProgressDoc);
      } else {
        onData(null);
      }
    },
    (err) => logSnapshotError(err, OperationType.GET, path)
  );
}

// =========================================================================
// 2. ACTIVITY FEED SYNC
// =========================================================================
export interface SyncedActivityItem {
  id: string;
  title: string;
  meta: string;
  status: string;
  color: string;
  details?: string;
  createdAt?: string;
}

export async function saveActivityEntry(
  userId: string,
  entry: Omit<SyncedActivityItem, 'id' | 'createdAt'> & { id?: string }
) {
  const id = sanitizeDocId(entry.id || `act_${Date.now()}`);
  const path = `users/${userId}/activities/${id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'activities', id), {
      userId,
      title: clampStr(entry.title, 160, 'Activity'),
      meta: clampStr(entry.meta, 80, 'Just now'),
      status: clampStr(entry.status, 80, 'Logged'),
      color: clampStr(entry.color, 60, 'bg-[var(--cobalt)]'),
      details: clampStr(entry.details, 500),
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export function subscribeToActivities(
  userId: string,
  onData: (items: SyncedActivityItem[]) => void
): Unsubscribe {
  const path = `users/${userId}/activities`;
  const q = query(
    collection(db, 'users', userId, 'activities'),
    where('userId', '==', userId),
    limit(20)
  );
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<SyncedActivityItem, 'id'>) }))
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      onData(items);
    },
    (err) => logSnapshotError(err, OperationType.LIST, path)
  );
}

// =========================================================================
// 3. DIAGNOSTIC PERSISTENCE
// =========================================================================
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
  const id = sanitizeDocId(`diag_${Date.now()}`);
  const path = `users/${userId}/diagnostics/${id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'diagnostics', id), {
      userId,
      topic: clampStr(result.topic, 120, 'General'),
      score: Math.max(0, result.score),
      total: Math.max(1, result.total),
      percentage: Math.min(100, Math.max(0, result.percentage)),
      misconceptionsCleared: Math.max(0, result.misconceptionsCleared),
      attemptedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

// =========================================================================
// 4. STUDY BLOCKS PERSISTENCE & SYNC
// =========================================================================
export interface SyncedStudyBlock {
  id: string;
  userId: string;
  title: string;
  course?: string;
  durationMin: number;
  completed: boolean;
  status?: string;
  notes?: string;
  blueprintGoal?: string;
  microStepsCount?: number;
  completedStepsCount?: number;
  scheduledFor: string;
  updatedAt?: string;
}

export async function saveStudyBlock(
  userId: string,
  block: {
    id?: string;
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
  const id = sanitizeDocId(block.id || `block_${Date.now()}`);
  const path = `users/${userId}/studyBlocks/${id}`;
  const isCompleted = block.completed ?? block.status === 'completed';
  try {
    await setDoc(
      doc(db, 'users', userId, 'studyBlocks', id),
      {
        userId,
        title: clampStr(block.title, 150, 'Study Block'),
        durationMin: Math.min(1440, Math.max(1, block.durationMin ?? block.durationMinutes ?? 30)),
        completed: isCompleted,
        status: clampStr(block.status ?? (isCompleted ? 'completed' : 'in-progress'), 40),
        course: clampStr(block.course || 'General', 100),
        notes: clampStr(block.notes || '', 500),
        blueprintGoal: clampStr(block.blueprintGoal || '', 400),
        microStepsCount: Math.min(50, Math.max(0, block.microStepsCount ?? 0)),
        completedStepsCount: Math.min(50, Math.max(0, block.completedStepsCount ?? 0)),
        scheduledFor: clampStr(block.scheduledFor || new Date().toISOString(), 60),
        updatedAt: clampStr(block.lastUpdated || new Date().toISOString(), 60),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export function subscribeToStudyBlocks(
  userId: string,
  onData: (blocks: SyncedStudyBlock[]) => void
): Unsubscribe {
  const path = `users/${userId}/studyBlocks`;
  const q = query(
    collection(db, 'users', userId, 'studyBlocks'),
    where('userId', '==', userId),
    limit(30)
  );
  return onSnapshot(
    q,
    (snap) => {
      const blocks = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<SyncedStudyBlock, 'id'>) }))
        .sort((a, b) => (b.updatedAt || b.scheduledFor).localeCompare(a.updatedAt || a.scheduledFor));
      onData(blocks);
    },
    (err) => logSnapshotError(err, OperationType.LIST, path)
  );
}

// =========================================================================
// 5. PROJECT BOOKMARKS PERSISTENCE & SYNC
// =========================================================================
export interface SyncedProjectBookmark {
  id: string;
  userId: string;
  projectId: string;
  title: string;
  tier: string;
  savedAt: string;
}

export async function toggleProjectBookmark(
  userId: string,
  project: { id: string; title: string; tier: string },
  currentlySaved: boolean
) {
  const id = sanitizeDocId(`bm_${project.id}`);
  const path = `users/${userId}/projectBookmarks/${id}`;
  try {
    if (currentlySaved) {
      await deleteDoc(doc(db, 'users', userId, 'projectBookmarks', id));
    } else {
      await setDoc(doc(db, 'users', userId, 'projectBookmarks', id), {
        userId,
        projectId: clampStr(project.id, 100),
        title: clampStr(project.title, 150),
        tier: clampStr(project.tier, 50),
        savedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, currentlySaved ? OperationType.DELETE : OperationType.CREATE, path);
  }
}

export function subscribeToProjectBookmarks(
  userId: string,
  onData: (bookmarks: SyncedProjectBookmark[]) => void
): Unsubscribe {
  const path = `users/${userId}/projectBookmarks`;
  const q = query(
    collection(db, 'users', userId, 'projectBookmarks'),
    where('userId', '==', userId),
    limit(50)
  );
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<SyncedProjectBookmark, 'id'>),
      }));
      onData(items);
    },
    (err) => logSnapshotError(err, OperationType.LIST, path)
  );
}

// =========================================================================
// 6. PDF & LECTURE STUDY NOTES RAG SYNC
// =========================================================================
export async function saveStudyNote(userId: string, note: StudyNote): Promise<void> {
  const id = sanitizeDocId(note.id);
  const path = `users/${userId}/studyNotes/${id}`;
  const boundedChunks = (note.chunks || []).slice(0, 25).map((c, idx) => ({
    id: clampStr(c.id || `chunk-${idx + 1}`, 40),
    heading: clampStr(c.heading || note.title, 100),
    content: clampStr(c.content || '', 900),
    keywords: (c.keywords || []).slice(0, 8).map((k) => clampStr(k, 40)),
  }));

  try {
    await setDoc(doc(db, 'users', userId, 'studyNotes', id), {
      userId,
      title: clampStr(note.title, 160, 'Study Note'),
      fileName: clampStr(note.fileName, 160, 'notes.txt'),
      course: clampStr(note.course, 100, 'General'),
      chunkCount: boundedChunks.length,
      chunks: boundedChunks,
      createdAt: clampStr(note.createdAt || new Date().toISOString(), 60),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function deleteStudyNote(userId: string, noteId: string): Promise<void> {
  const id = sanitizeDocId(noteId);
  const path = `users/${userId}/studyNotes/${id}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'studyNotes', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function subscribeToStudyNotes(
  userId: string,
  onData: (notes: StudyNote[]) => void
): Unsubscribe {
  const path = `users/${userId}/studyNotes`;
  const q = query(
    collection(db, 'users', userId, 'studyNotes'),
    where('userId', '==', userId),
    limit(20)
  );
  return onSnapshot(
    q,
    (snap) => {
      const notes = snap.docs
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: String(data.title || 'Untitled Note'),
            fileName: String(data.fileName || 'note.txt'),
            course: String(data.course || 'General'),
            chunkCount: Number(data.chunkCount || 0),
            chunks: Array.isArray(data.chunks) ? data.chunks : [],
            createdAt: String(data.createdAt || ''),
          } as StudyNote;
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onData(notes);
    },
    (err) => logSnapshotError(err, OperationType.LIST, path)
  );
}

// =========================================================================
// 7. REAL-TIME PEER STUDY ROOMS (Firestore Multi-User Rooms)
// =========================================================================
export interface FirestorePeerRoom {
  roomId: string;
  title: string;
  workspace: string;
  topic: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FirestoreRoomMessage {
  id: string;
  roomId: string;
  sender: 'user' | 'ai';
  senderUid: string;
  senderName: string;
  senderInitials?: string;
  avatarBg?: string;
  content: string;
  badge?: string;
  createdAt: string;
}

export interface FirestoreRoomPresence {
  roomId: string;
  userId: string;
  displayName: string;
  initials: string;
  status: string;
  lastSeen: string;
}

export async function ensurePeerRoom(
  room: { roomId: string; title: string; workspace: string; topic: string },
  userId: string
): Promise<string> {
  const safeRoomId = sanitizeDocId(room.roomId);
  const roomRef = doc(db, 'peerRooms', safeRoomId);
  const path = `peerRooms/${safeRoomId}`;
  try {
    const snap = await getDoc(roomRef);
    if (!snap.exists()) {
      const now = new Date().toISOString();
      await setDoc(roomRef, {
        roomId: safeRoomId,
        title: clampStr(room.title, 150, 'Live Study Room'),
        workspace: clampStr(room.workspace, 80, 'Study Studio'),
        topic: clampStr(room.topic, 200, 'Curriculum Review'),
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      });
    }
    return safeRoomId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function createCustomPeerRoom(
  userId: string,
  input: { title: string; workspace: string; topic: string }
): Promise<FirestorePeerRoom> {
  const roomId = sanitizeDocId(`custom_room_${Date.now()}`);
  const now = new Date().toISOString();
  const room: FirestorePeerRoom = {
    roomId,
    title: clampStr(input.title, 150, 'Study Group Room'),
    workspace: clampStr(input.workspace, 80, 'Study Studio'),
    topic: clampStr(input.topic, 200, 'Exam Prep & Problem Solving'),
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
  };
  const path = `peerRooms/${roomId}`;
  try {
    await setDoc(doc(db, 'peerRooms', roomId), room);
    return room;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export function subscribeToPeerRooms(
  onData: (rooms: FirestorePeerRoom[]) => void
): Unsubscribe {
  const path = 'peerRooms';
  const q = query(collection(db, 'peerRooms'), orderBy('createdAt', 'desc'), limit(25));
  return onSnapshot(
    q,
    (snap) => {
      const rooms = snap.docs.map((d) => d.data() as FirestorePeerRoom);
      onData(rooms);
    },
    (err) => logSnapshotError(err, OperationType.LIST, path)
  );
}

export function subscribeToRoomMessages(
  roomId: string,
  onData: (messages: FirestoreRoomMessage[]) => void
): Unsubscribe {
  const safeRoomId = sanitizeDocId(roomId);
  const path = `peerRooms/${safeRoomId}/messages`;
  const q = query(
    collection(db, 'peerRooms', safeRoomId, 'messages'),
    orderBy('createdAt', 'asc'),
    limit(100)
  );
  return onSnapshot(
    q,
    (snap) => {
      const msgs = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<FirestoreRoomMessage, 'id'>),
      }));
      onData(msgs);
    },
    (err) => logSnapshotError(err, OperationType.LIST, path)
  );
}

export async function sendRoomMessage(
  roomId: string,
  userId: string,
  payload: {
    sender: 'user' | 'ai';
    senderName: string;
    senderInitials?: string;
    avatarBg?: string;
    content: string;
    badge?: string;
  }
): Promise<void> {
  const safeRoomId = sanitizeDocId(roomId);
  const msgId = sanitizeDocId(`msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  const path = `peerRooms/${safeRoomId}/messages/${msgId}`;
  try {
    await setDoc(doc(db, 'peerRooms', safeRoomId, 'messages', msgId), {
      roomId: safeRoomId,
      sender: payload.sender,
      senderUid: userId,
      senderName: clampStr(payload.senderName, 100, 'Scholar'),
      senderInitials: clampStr(payload.senderInitials || 'SC', 8),
      avatarBg: clampStr(payload.avatarBg || 'bg-slate-800', 40),
      content: clampStr(payload.content, 4000, ' '),
      badge: clampStr(payload.badge || '', 40),
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateRoomPresence(
  roomId: string,
  user: { uid: string; displayName: string; status?: string }
): Promise<void> {
  const safeRoomId = sanitizeDocId(roomId);
  const safeUid = sanitizeDocId(user.uid);
  const path = `peerRooms/${safeRoomId}/presence/${safeUid}`;
  const parts = (user.displayName || 'Scholar').trim().split(/\s+/);
  const initials = parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('') || 'SC';

  try {
    await setDoc(doc(db, 'peerRooms', safeRoomId, 'presence', safeUid), {
      roomId: safeRoomId,
      userId: user.uid,
      displayName: clampStr(user.displayName || 'Scholar', 100, 'Scholar'),
      initials: clampStr(initials, 8, 'SC'),
      status: clampStr(user.status || 'Active in room', 40),
      lastSeen: new Date().toISOString(),
    });
  } catch (err) {
    logSnapshotError(err, OperationType.WRITE, path);
  }
}

export async function removeRoomPresence(roomId: string, userId: string): Promise<void> {
  const safeRoomId = sanitizeDocId(roomId);
  const safeUid = sanitizeDocId(userId);
  const path = `peerRooms/${safeRoomId}/presence/${safeUid}`;
  try {
    await deleteDoc(doc(db, 'peerRooms', safeRoomId, 'presence', safeUid));
  } catch (err) {
    logSnapshotError(err, OperationType.DELETE, path);
  }
}

export function subscribeToRoomPresence(
  roomId: string,
  onData: (members: FirestoreRoomPresence[]) => void
): Unsubscribe {
  const safeRoomId = sanitizeDocId(roomId);
  const path = `peerRooms/${safeRoomId}/presence`;
  const q = query(collection(db, 'peerRooms', safeRoomId, 'presence'), limit(30));
  return onSnapshot(
    q,
    (snap) => {
      const members = snap.docs.map((d) => d.data() as FirestoreRoomPresence);
      onData(members);
    },
    (err) => logSnapshotError(err, OperationType.LIST, path)
  );
}
