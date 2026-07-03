import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  writeBatch,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";

// Firestore caps a batch at 500 writes; stay well under to leave headroom.
const CHUNK = 450;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export interface ArchiveResult {
  archived: number;
  showsReset: number;
}

/**
 * Start a new show: archive every current registration into `responses_archive`
 * (keyed by original id, so re-running is idempotent), then clear the live
 * `responses` collection, then refill every show's seats to capacity.
 *
 * Order is deliberate — copy and confirm before deleting, so a mid-run failure
 * never loses data. `label` groups this batch of archived docs (e.g. the show's
 * name/date) for later export.
 */
export async function startNewShow(label: string): Promise<ArchiveResult> {
  const snap = await getDocs(collection(db, "responses"));
  const docs = snap.docs as QueryDocumentSnapshot[];

  // 1. Copy into the archive (original id -> idempotent on retry).
  for (const group of chunk(docs, CHUNK)) {
    const batch = writeBatch(db);
    for (const d of group) {
      batch.set(doc(db, "responses_archive", d.id), {
        ...d.data(),
        archivedAt: serverTimestamp(),
        archiveLabel: label,
      });
    }
    await batch.commit();
  }

  // 2. Delete the originals only after every copy has committed.
  for (const group of chunk(docs, CHUNK)) {
    const batch = writeBatch(db);
    for (const d of group) batch.delete(doc(db, "responses", d.id));
    await batch.commit();
  }

  // 3. Refill seats on every show (same effect as per-show "إعادة الضبط").
  const showsSnap = await getDocs(collection(db, "shows"));
  for (const group of chunk(showsSnap.docs, CHUNK)) {
    const batch = writeBatch(db);
    for (const d of group) {
      const cap = (d.data() as { capacity?: number }).capacity ?? 0;
      batch.update(doc(db, "shows", d.id), { seatsRemaining: cap });
    }
    await batch.commit();
  }

  return { archived: docs.length, showsReset: showsSnap.size };
}
