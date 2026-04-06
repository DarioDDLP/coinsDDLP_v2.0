import { Injectable } from '@angular/core';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  QueryConstraint,
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { CollectionName } from '../../shared/constants/collections.const';

/**
 * Servicio genérico de acceso a Firestore.
 * Responsabilidad única: comunicación con la base de datos.
 * No contiene lógica de negocio.
 */
@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private get db() {
    return getFirestore();
  }

  getCollection<T>(
    collectionName: CollectionName,
    ...constraints: QueryConstraint[]
  ): Observable<T[]> {
    return new Observable(observer => {
      const ref = collection(this.db, collectionName);
      const q = constraints.length ? query(ref, ...constraints) : query(ref);

      const unsubscribe = onSnapshot(
        q,
        snapshot => {
          const items = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
          })) as T[];
          observer.next(items);
        },
        error => observer.error(error)
      );

      return () => unsubscribe();
    });
  }

  async add<T extends object>(
    collectionName: CollectionName,
    data: T
  ): Promise<string> {
    const ref = await addDoc(collection(this.db, collectionName), data);
    return ref.id;
  }

  async update<T extends object>(
    collectionName: CollectionName,
    id: string,
    data: Partial<T>
  ): Promise<void> {
    await updateDoc(doc(this.db, collectionName, id), data as object);
  }

  async remove(collectionName: CollectionName, id: string): Promise<void> {
    await deleteDoc(doc(this.db, collectionName, id));
  }
}
