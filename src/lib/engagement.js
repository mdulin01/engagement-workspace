// Merges the static engagement config with the settings/engagement override
// (effective date is the only thing expected to change after execution).
import config from "../config/engagement.json";
import { useCollection } from "./data.js";
import {
  milestoneDate, deliverableDueDate, weekNumber, phaseFor, termEnd, today, termMonths,
} from "./dates.js";

export function useEngagement() {
  const { rows: settings, loading } = useCollection("settings");
  const override = settings.find((s) => s.id === "engagement") || {};
  const effectiveDate = override.effectiveDate || config.effectiveDate;
  const now = today();
  const week = weekNumber(effectiveDate, now);
  return {
    loading,
    config,
    effectiveDate,
    endDate: termEnd(effectiveDate, config.termMonths),
    today: now,
    week,
    currentPhases: phaseFor(config.phases, week),
    months: termMonths(effectiveDate, config.termMonths),
    milestones: config.milestones.map((m) => ({ ...m, date: milestoneDate(effectiveDate, m) })),
    deliverables: config.deliverables.map((d) => ({ ...d, dueDate: deliverableDueDate(effectiveDate, d.due, config.termMonths) })),
  };
}
