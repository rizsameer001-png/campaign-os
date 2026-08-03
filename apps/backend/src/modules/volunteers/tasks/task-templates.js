// VMS-T-006: pre-filled templates for common volunteer activities.
export const TASK_TEMPLATES = Object.freeze([
  { key: 'door_to_door', title: 'Door-to-door outreach', description: 'Visit assigned households and discuss the campaign.', priority: 'medium' },
  { key: 'rally_setup', title: 'Rally setup', description: 'Set up stage, seating, and sound equipment before the rally.', priority: 'high' },
  { key: 'booth_duty', title: 'Booth duty', description: 'Staff an assigned booth and log voter turnout.', priority: 'high' },
  { key: 'survey', title: 'Voter survey', description: 'Collect survey responses in the assigned area.', priority: 'low' },
]);

export function getTemplate(key) {
  return TASK_TEMPLATES.find((t) => t.key === key) ?? null;
}
