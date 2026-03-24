import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where, writeBatch } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Zone, Ward, Facility } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo?: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Admin Token for basic security (as requested by user)
const getAdminToken = () => sessionStorage.getItem('adminAuth') === 'true' ? 'admin123' : '';

// Zones (Fixed 5 zones)
export const ZONES: Zone[] = [
  { id: 'north', name: 'North' },
  { id: 'south', name: 'South' },
  { id: 'east', name: 'East' },
  { id: 'west', name: 'West' },
  { id: 'central', name: 'Central' }
];

// Wards
export async function getWards(): Promise<Ward[]> {
  try {
    const q = query(collection(db, 'wards'), where('deleted', '!=', true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ward));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'wards');
    return [];
  }
}

export async function addWard(ward: Omit<Ward, 'id'>) {
  try {
    return await addDoc(collection(db, 'wards'), { ...ward, deleted: false, _adminToken: getAdminToken() });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'wards');
  }
}

export async function updateWard(id: string, ward: Partial<Ward>) {
  try {
    return await updateDoc(doc(db, 'wards', id), { ...ward, _adminToken: getAdminToken() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `wards/${id}`);
  }
}

export async function deleteWard(id: string) {
  try {
    // Soft delete to allow passing the admin token for security
    return await updateDoc(doc(db, 'wards', id), { deleted: true, _adminToken: getAdminToken() });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `wards/${id}`);
  }
}

// Facilities
export async function getFacilities(): Promise<Facility[]> {
  try {
    const q = query(collection(db, 'facilities'), where('deleted', '!=', true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Facility));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'facilities');
    return [];
  }
}

export async function getFacility(id: string): Promise<Facility | null> {
  try {
    const snapshot = await getDoc(doc(db, 'facilities', id));
    if (!snapshot.exists() || snapshot.data().deleted) return null;
    return { id: snapshot.id, ...snapshot.data() } as Facility;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `facilities/${id}`);
    return null;
  }
}

export async function addFacility(facility: Omit<Facility, 'id'>) {
  try {
    return await addDoc(collection(db, 'facilities'), { ...facility, deleted: false, _adminToken: getAdminToken() });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'facilities');
  }
}

export async function updateFacility(id: string, facility: Partial<Facility>) {
  try {
    return await updateDoc(doc(db, 'facilities', id), { ...facility, _adminToken: getAdminToken() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `facilities/${id}`);
  }
}

export async function deleteFacility(id: string) {
  try {
    // Soft delete to allow passing the admin token for security
    return await updateDoc(doc(db, 'facilities', id), { deleted: true, _adminToken: getAdminToken() });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `facilities/${id}`);
  }
}

// Bulk Upload Helpers
export async function bulkUploadWards(wards: Omit<Ward, 'id'>[]) {
  try {
    const batch = writeBatch(db);
    wards.forEach(ward => {
      const docRef = doc(collection(db, 'wards'));
      batch.set(docRef, { ...ward, deleted: false, _adminToken: getAdminToken() });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'wards');
  }
}

export async function bulkUploadFacilities(facilities: Omit<Facility, 'id'>[]) {
  try {
    const batch = writeBatch(db);
    facilities.forEach(facility => {
      const docRef = doc(collection(db, 'facilities'));
      batch.set(docRef, { ...facility, deleted: false, _adminToken: getAdminToken() });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'facilities');
  }
}
