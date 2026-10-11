import type {
  AssessmentWeight,
  AssessmentWeightFormValues,
} from "@/types/assessment-weight";
import { MOCK_ASSESSMENT_WEIGHT } from "./mock/assessment-weight";

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

let store: AssessmentWeight = { ...MOCK_ASSESSMENT_WEIGHT };

export const assessmentWeightService = {
  async get(): Promise<AssessmentWeight> {
    await delay(100);
    return { ...store };
  },

  async update(values: AssessmentWeightFormValues): Promise<AssessmentWeight> {
    await delay();
    const total = values.assessmentPercent + values.examPercent;
    if (total !== 100) {
      throw new Error("Assessment and Exam percentages must total 100.");
    }
    store = {
      ...store,
      ...values,
      updatedAt: new Date().toISOString(),
    };
    return { ...store };
  },
};
