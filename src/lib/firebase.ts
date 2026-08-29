import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { BoulderBlock, Wall, UserProposal, UserBlockProgress, UserProfile, Gym } from '../types';
import { MOCK_BLOCKS, MOCK_WALLS, MOCK_GYMS } from '../data/mockData';
import { getLevelForGrade } from '../utils/gradeUtils';

// Whitelist of master super admin emails (App ClimbU Super Admins)
export const INITIAL_ADMIN_EMAILS = [
  'victorb.belchi18720@gmail.com'
];

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore (with designated databaseId if present)
export const db = firebaseConfigJson.firestoreDatabaseId && firebaseConfigJson.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
  : getFirestore(app);

// Authentication helpers
export async function signInWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  await ensureUserDoc(result.user);
  return result.user;
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

// Check if an email is a global Super Admin of ClimbU
export async function checkIsAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  
  if (INITIAL_ADMIN_EMAILS.some(e => e.toLowerCase() === normalized)) {
    return true;
  }

  try {
    const adminDoc = await getDoc(doc(db, 'admins', normalized));
    return adminDoc.exists();
  } catch (err) {
    console.warn('Error checking admin doc in Firestore, falling back to whitelist:', err);
    return INITIAL_ADMIN_EMAILS.some(e => e.toLowerCase() === normalized);
  }
}

// Synchronous helper for UI logic
export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const norm = email.trim().toLowerCase();
  return INITIAL_ADMIN_EMAILS.some(e => e.toLowerCase() === norm);
}

// Check if user is authorized equipador for a specific gym (or Super Admin)
export function isUserGymSetter(gym: Gym | null | undefined, email: string | null | undefined): boolean {
  if (!email) return false;
  if (isSuperAdminEmail(email)) return true;
  if (!gym || !gym.setters) return false;
  const norm = email.trim().toLowerCase();
  return gym.setters.some(s => s.trim().toLowerCase() === norm);
}

// Ensure Admin Table in Firestore exists with master admin
export async function initializeAdminTable(): Promise<void> {
  try {
    for (const email of INITIAL_ADMIN_EMAILS) {
      const normalized = email.trim().toLowerCase();
      const adminRef = doc(db, 'admins', normalized);
      const snapshot = await getDoc(adminRef);
      if (!snapshot.exists()) {
        await setDoc(adminRef, {
          email: normalized,
          role: 'admin',
          createdAt: new Date().toISOString(),
          notes: 'Super Administrador Principal de ClimbU',
        });
      }
    }
  } catch (err) {
    console.error('Error initializing admin table in Firestore:', err);
  }
}

// Ensure user profile document exists and has correct role
export async function ensureUserDoc(user: FirebaseUser): Promise<UserProfile> {
  const isAdmin = await checkIsAdmin(user.email);
  const userRef = doc(db, 'users', user.uid);
  
  const existingSnap = await getDoc(userRef);
  const existingData = existingSnap.exists() ? existingSnap.data() : null;

  const profile: UserProfile = {
    id: user.uid,
    name: user.displayName || 'Escalador ClimbU',
    email: user.email || '',
    avatarUrl: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
    role: isAdmin ? 'admin' : 'user',
    joinedGymIds: existingData?.joinedGymIds || ['gud-climbing-murcia', 'boulder-alhama'],
    unlockedPrivateGymIds: existingData?.unlockedPrivateGymIds || (isAdmin ? ['boulder-alhama'] : []),
  };

  try {
    await setDoc(userRef, {
      uid: user.uid,
      name: profile.name,
      email: profile.email,
      avatarUrl: profile.avatarUrl,
      role: profile.role,
      joinedGymIds: profile.joinedGymIds,
      unlockedPrivateGymIds: profile.unlockedPrivateGymIds,
      lastLogin: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.error('Error saving user doc in Firestore:', err);
  }

  return profile;
}

// Initial DB Seeding for Gyms, Walls & Blocks
export async function seedInitialDataIfEmpty(): Promise<void> {
  try {
    // 1. Ensure Admins table is seeded
    await initializeAdminTable();

    // 2. Check & Seed Gyms
    const gymsSnap = await getDocs(collection(db, 'gyms'));
    if (gymsSnap.empty) {
      console.log('Seeding initial ClimbU Gyms (Boulder Alhama & GUD Climbing) into Firestore...');
      const batch = writeBatch(db);
      for (const gym of MOCK_GYMS) {
        batch.set(doc(db, 'gyms', gym.id), gym);
      }
      await batch.commit();
    } else {
      // Check if GUD Climbing or Alhama are present; if not, ensure both exist
      const existingGymIds = gymsSnap.docs.map(d => d.id);
      for (const gym of MOCK_GYMS) {
        if (!existingGymIds.includes(gym.id)) {
          await setDoc(doc(db, 'gyms', gym.id), gym, { merge: true });
        }
      }
    }

    // 3. Check & Seed Walls
    const wallsSnap = await getDocs(collection(db, 'walls'));
    if (wallsSnap.empty) {
      console.log('Seeding initial walls into Firestore...');
      const batch = writeBatch(db);
      for (const wall of MOCK_WALLS) {
        batch.set(doc(db, 'walls', wall.id), wall);
      }
      await batch.commit();
    } else {
      // Ensure walls have gymId populated
      const existingWallIds = wallsSnap.docs.map(d => d.id);
      for (const wall of MOCK_WALLS) {
        if (!existingWallIds.includes(wall.id)) {
          await setDoc(doc(db, 'walls', wall.id), wall, { merge: true });
        }
      }
    }

    // 4. Check & Seed Blocks
    const blocksSnap = await getDocs(collection(db, 'blocks'));
    if (blocksSnap.empty) {
      console.log('Seeding initial blocks into Firestore...');
      const batch = writeBatch(db);
      for (const block of MOCK_BLOCKS) {
        const blockWithLevel = {
          ...block,
          level: getLevelForGrade(block.grade),
        };
        batch.set(doc(db, 'blocks', block.id), blockWithLevel);
      }
      await batch.commit();
    } else {
      const existingBlockIds = blocksSnap.docs.map(d => d.id);
      for (const block of MOCK_BLOCKS) {
        if (!existingBlockIds.includes(block.id)) {
          const blockWithLevel = {
            ...block,
            level: getLevelForGrade(block.grade),
          };
          await setDoc(doc(db, 'blocks', block.id), blockWithLevel, { merge: true });
        }
      }
    }
  } catch (err) {
    console.error('Error seeding initial Firestore data:', err);
  }
}

// Firestore CRUD for Gyms
export async function saveGymToFirestore(gym: Gym): Promise<void> {
  const gymRef = doc(db, 'gyms', gym.id);
  await setDoc(gymRef, {
    ...gym,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

export async function deleteGymFromFirestore(gymId: string): Promise<void> {
  await deleteDoc(doc(db, 'gyms', gymId));
}

// User Gym memberships
export async function joinGymInFirestore(userId: string, gymId: string, isUnlockedPrivate: boolean = false): Promise<void> {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  const data = snap.exists() ? snap.data() : {};
  const currentJoined: string[] = data.joinedGymIds || [];
  const currentUnlocked: string[] = data.unlockedPrivateGymIds || [];

  const nextJoined = Array.from(new Set([...currentJoined, gymId]));
  const nextUnlocked = isUnlockedPrivate 
    ? Array.from(new Set([...currentUnlocked, gymId]))
    : currentUnlocked;

  await setDoc(userRef, {
    joinedGymIds: nextJoined,
    unlockedPrivateGymIds: nextUnlocked,
  }, { merge: true });
}

export async function leaveGymInFirestore(userId: string, gymId: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;
  const data = snap.data();
  const currentJoined: string[] = data.joinedGymIds || [];
  const nextJoined = currentJoined.filter(id => id !== gymId);

  await setDoc(userRef, {
    joinedGymIds: nextJoined,
  }, { merge: true });
}

// Firestore CRUD operations for Blocks
export async function saveBlockToFirestore(block: BoulderBlock): Promise<void> {
  const blockRef = doc(db, 'blocks', block.id);
  const blockWithLevel = {
    ...block,
    level: getLevelForGrade(block.grade),
    updatedAt: new Date().toISOString(),
  };
  await setDoc(blockRef, blockWithLevel, { merge: true });
}

export async function deleteBlockFromFirestore(blockId: string): Promise<void> {
  await deleteDoc(doc(db, 'blocks', blockId));
}

// Firestore CRUD for Proposals
export async function saveProposalToFirestore(prop: UserProposal): Promise<void> {
  const propRef = doc(db, 'proposals', prop.id);
  await setDoc(propRef, prop, { merge: true });
}

export async function updateProposalStatusInFirestore(
  proposalId: string, 
  status: 'approved' | 'rejected', 
  officialBlockId?: string
): Promise<void> {
  const propRef = doc(db, 'proposals', proposalId);
  const payload: Record<string, any> = { status };
  if (officialBlockId) {
    payload.officialBlockId = officialBlockId;
  }
  await updateDoc(propRef, payload);
}

// Firestore CRUD for User Progress
export async function saveUserBlockProgressInFirestore(
  userId: string, 
  blockId: string, 
  progress: UserBlockProgress
): Promise<void> {
  const progressRef = doc(db, 'users', userId, 'progress', blockId);
  await setDoc(progressRef, {
    ...progress,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

export async function deleteUserProgressDocInFirestore(
  userId: string, 
  blockId: string
): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'progress', blockId));
}

// Realtime Subscriptions
export function subscribeToGyms(onUpdate: (gyms: Gym[]) => void) {
  return onSnapshot(collection(db, 'gyms'), (snapshot) => {
    if (!snapshot.empty) {
      const list = snapshot.docs.map(d => d.data() as Gym);
      onUpdate(list);
    }
  }, (err) => {
    console.error('Error listening to gyms:', err);
  });
}

export function subscribeToWalls(onUpdate: (walls: Wall[]) => void) {
  return onSnapshot(collection(db, 'walls'), (snapshot) => {
    if (!snapshot.empty) {
      const list = snapshot.docs.map(d => d.data() as Wall);
      onUpdate(list);
    }
  }, (err) => {
    console.error('Error listening to walls:', err);
  });
}

export function subscribeToBlocks(onUpdate: (blocks: BoulderBlock[]) => void) {
  return onSnapshot(collection(db, 'blocks'), (snapshot) => {
    if (!snapshot.empty) {
      const list = snapshot.docs.map(d => {
        const data = d.data() as BoulderBlock;
        return {
          ...data,
          level: getLevelForGrade(data.grade),
        };
      });
      onUpdate(list);
    }
  }, (err) => {
    console.error('Error listening to blocks:', err);
  });
}

export function subscribeToProposals(onUpdate: (proposals: UserProposal[]) => void) {
  return onSnapshot(collection(db, 'proposals'), (snapshot) => {
    const list = snapshot.docs.map(d => d.data() as UserProposal);
    onUpdate(list);
  }, (err) => {
    console.error('Error listening to proposals:', err);
  });
}

// Admin Management
export interface AdminRecord {
  email: string;
  role: string;
  createdAt: string;
  addedBy?: string;
  notes?: string;
}

export async function fetchAdminEmails(): Promise<AdminRecord[]> {
  try {
    const snap = await getDocs(collection(db, 'admins'));
    const list: AdminRecord[] = [];
    snap.docs.forEach(d => {
      list.push(d.data() as AdminRecord);
    });

    // Ensure master admin is always present
    for (const masterEmail of INITIAL_ADMIN_EMAILS) {
      if (!list.some(a => a.email.toLowerCase() === masterEmail.toLowerCase())) {
        list.push({
          email: masterEmail.toLowerCase(),
          role: 'admin',
          createdAt: '2026-08-29T00:00:00.000Z',
          notes: 'Super Administrador Principal de ClimbU',
        });
      }
    }

    return list;
  } catch (err) {
    console.error('Error fetching admins from Firestore:', err);
    return INITIAL_ADMIN_EMAILS.map(e => ({
      email: e,
      role: 'admin',
      createdAt: '2026-08-29T00:00:00.000Z',
      notes: 'Super Administrador Principal (fallback)',
    }));
  }
}

export async function addAdminEmail(email: string, addedBy: string = 'Super Admin'): Promise<void> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;
  const adminRef = doc(db, 'admins', normalized);
  await setDoc(adminRef, {
    email: normalized,
    role: 'admin',
    createdAt: new Date().toISOString(),
    addedBy,
    notes: 'Super Administrador autorizado de ClimbU',
  });
}

export async function removeAdminEmail(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  if (INITIAL_ADMIN_EMAILS.some(e => e.toLowerCase() === normalized)) {
    throw new Error('No se puede eliminar al Super Administrador principal del sistema.');
  }
  await deleteDoc(doc(db, 'admins', normalized));
}

export function subscribeToUserProgress(userId: string, onUpdate: (prog: Record<string, UserBlockProgress>) => void) {
  return onSnapshot(collection(db, 'users', userId, 'progress'), (snapshot) => {
    const map: Record<string, UserBlockProgress> = {};
    snapshot.docs.forEach(docSnap => {
      map[docSnap.id] = docSnap.data() as UserBlockProgress;
    });
    onUpdate(map);
  }, (err) => {
    console.error('Error listening to user progress:', err);
  });
}

export function subscribeToAuth(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}
