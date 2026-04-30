import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FilterState {
  candidateFilters: {
    skills: string[];
    skillsMode: "AND" | "OR";
    experienceMin?: number;
    experienceMax?: number;
    seniority?: string;
  };
  setCandidateFilters: (filters: Partial<FilterState["candidateFilters"]>) => void;
  clearCandidateFilters: () => void;
}

const defaultFilters: FilterState["candidateFilters"] = {
  skills: [],
  skillsMode: "AND",
  experienceMin: undefined,
  experienceMax: undefined,
  seniority: undefined,
};

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      candidateFilters: defaultFilters,
      setCandidateFilters: (filters) =>
        set((state) => ({
          candidateFilters: { ...state.candidateFilters, ...filters },
        })),
      clearCandidateFilters: () => set({ candidateFilters: defaultFilters }),
    }),
    {
      name: "antigravity-filters",
    }
  )
);
