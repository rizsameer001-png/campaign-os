import { BUDGET_SPLIT } from '@election-os/shared/budget-split';

/** ACP-G-004: auto-allocate total budget across Digital/Ground/Events/Misc. */
export function allocateBudget(totalBudget) {
  const total = Number(totalBudget);
  return {
    digital: Math.round(total * BUDGET_SPLIT.digital),
    ground: Math.round(total * BUDGET_SPLIT.ground),
    events: Math.round(total * BUDGET_SPLIT.events),
    miscellaneous: Math.round(total * BUDGET_SPLIT.miscellaneous),
  };
}

/** Splits a week's share of the total budget proportionally by week count. */
export function allocateWeeklyBudget(totalBudget, weekCount) {
  const weekly = Number(totalBudget) / weekCount;
  return allocateBudget(weekly);
}
