import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TalentPoolFilter = "exclude_discarded" | "active" | "may_fit_future" | "discarded" | "all";

interface FilterState {
  candidateFilters: {
    skills: string[];
    skillsMode: "AND" | "OR";
    experienceMin?: number;
    experienceMax?: number;
    seniority?: string;
    talentPoolStatus: TalentPoolFilter;
    salaryMin?: number;
    salaryMax?: number;
    includeUndefinedSalary: boolean;
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
  talentPoolStatus: "exclude_discarded",
  salaryMin: undefined,
  salaryMax: undefined,
  includeUndefinedSalary: true,
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
      name: "smartcrm-filters",
    }
  )
);
