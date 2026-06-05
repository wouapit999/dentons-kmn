import { useEffect } from "react";
import { useData } from "../context/DataContext";
import { SEEDED_CLIENTS, SEEDED_MATTERS } from "../data/seedData";

const SEED_KEY = "dkmn_seeded_v1";

/**
 * Seeds clients and matters from the Excel import on first run.
 * Checks localStorage flag — only runs once, never duplicates.
 */
export function useSeedData() {
  const { clients, setClients, matters, setMatters } = useData();

  useEffect(() => {
    // Already seeded? Skip.
    if (localStorage.getItem(SEED_KEY) === "true") return;

    // Wait a tick to let Firestore sync first
    const timer = setTimeout(() => {
      const existingClientIds = new Set(clients.map(c => c.id));
      const existingMatterIds = new Set(matters.map(m => m.id));

      const newClients = SEEDED_CLIENTS.filter(c => !existingClientIds.has(c.id));
      const newMatters = SEEDED_MATTERS.filter(m => !existingMatterIds.has(m.id));

      if (newClients.length > 0) {
        setClients(prev => [...prev, ...newClients]);
      }
      if (newMatters.length > 0) {
        setMatters(prev => [...prev, ...newMatters]);
      }

      if (newClients.length > 0 || newMatters.length > 0) {
        console.log(`✅ Seeded ${newClients.length} clients and ${newMatters.length} matters from Excel import.`);
      }

      localStorage.setItem(SEED_KEY, "true");
    }, 1500);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
