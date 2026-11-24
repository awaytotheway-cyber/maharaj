/**
 * Animal definitions. To add a new animal:
 *   1. Add an entry to ANIMALS below (id, name, points, weight, optional lifetimeMs).
 *   2. Add its drawing to src/components/Animal.tsx (the `drawings` map).
 * TypeScript will tell you if a drawing is missing.
 */
export interface AnimalDef {
  /** Unique id, also used as the key for the drawing in Animal.tsx */
  id: string;
  /** Display name */
  name: string;
  /** Points awarded when eaten */
  points: number;
  /** Relative spawn weight. Weights don't need to add up to 100. */
  weight: number;
  /** If set, the animal disappears after this many ms if not eaten. */
  lifetimeMs?: number;
}

export const ANIMALS = [
  { id: 'mouse', name: 'Mouse', points: 5, weight: 35 },
  { id: 'frog', name: 'Frog', points: 10, weight: 30 },
  { id: 'rabbit', name: 'Rabbit', points: 15, weight: 25 },
  { id: 'chick', name: 'Chick', points: 20, weight: 10, lifetimeMs: 6000 },
] as const satisfies readonly AnimalDef[];

export type AnimalId = (typeof ANIMALS)[number]['id'];

export const ANIMAL_IDS: readonly AnimalId[] = ANIMALS.map((a) => a.id);

export function getAnimal(id: AnimalId): AnimalDef {
  const found = ANIMALS.find((a) => a.id === id);
  if (!found) throw new Error(`Unknown animal: ${id}`);
  return found;
}

/** Pick an animal using the spawn weights. `roll` is a number in [0, 1). */
export function pickAnimal(roll: number): AnimalId {
  const total = ANIMALS.reduce((sum, a) => sum + a.weight, 0);
  let target = roll * total;
  for (const a of ANIMALS) {
    target -= a.weight;
    if (target < 0) return a.id;
  }
  return ANIMALS[ANIMALS.length - 1].id;
}

export function emptyEatenCounts(): Record<AnimalId, number> {
  const counts = {} as Record<AnimalId, number>;
  for (const id of ANIMAL_IDS) counts[id] = 0;
  return counts;
}
