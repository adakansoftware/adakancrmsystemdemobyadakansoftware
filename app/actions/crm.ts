// Plain re-export barrel: the action modules under ./crm carry the
// 'use server' directive themselves. Turbopack rejects re-export
// statements inside a 'use server' file, so this file must NOT have it.
export {
  listCompanies,
  createCompanyAction,
  updateCompanyAction,
  deleteCompanyAction,
} from './crm/companies'
export {
  listContacts,
  createContactAction,
  updateContactAction,
  deleteContactAction,
} from './crm/contacts'
export {
  listTags,
  createTagAction,
  updateTagAction,
  deleteTagAction,
} from './crm/tags'
export {
  listLeads,
  createLeadAction,
  updateLeadAction,
  deleteLeadAction,
} from './crm/leads'
export {
  listDeals,
  createDealAction,
  updateDealAction,
  deleteDealAction,
} from './crm/deals'
export {
  listTasks,
  createTaskAction,
  updateTaskAction,
  createActivityAction,
  getTimelineAction,
} from './crm/tasks'
export {
  listNotes,
  createNoteAction,
  updateNoteAction,
  deleteNoteAction,
} from './crm/notes'
export {
  listDealPipelines,
  getDealPipelineBoardAction,
  createPipelineAction,
  updatePipelineAction,
  createStageAction,
  updateStageAction,
  moveDealToStageAction,
  trackDealValueAction,
  getDealMovementHistory,
} from './crm/pipelines'
