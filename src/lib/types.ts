export type StorageMode = "mock" | "database";
export type StudyId = "study1" | "study2";
export type Condition = "control" | "treatment";
export type CollectionKey = "pixelPaws" | "pixelPawsX" | "cyberWhales";
export type CollectionArtVariant = CollectionKey;
export type PageKind =
  | "intro"
  | "single-collection"
  | "dual-collection"
  | "likert"
  | "demographics";

export type AnswerValue = string | number | boolean | null;
export type AnswerRecord = Record<string, AnswerValue>;

export type SourceReference = {
  title: string;
  url: string;
  note: string;
};

export type CollectionRecord = {
  key: CollectionKey;
  name: string;
  creator: string;
  createdDate: string;
  floorPrice: string;
  description: string;
  artVariant: CollectionArtVariant;
  themeTagline: string;
  normalizationNote: string;
  coverPalette: string[];
  thumbnailPalette: string[];
  sourceReferences: SourceReference[];
};

type BasePage = {
  kind: PageKind;
  pageNumber: number;
  pageVersion: string;
  sidebarCollectionKeys?: CollectionKey[];
};

export type IntroPage = BasePage & {
  kind: "intro";
  paragraphs: string[];
};

export type SingleCollectionPage = BasePage & {
  kind: "single-collection";
  introLines: string[];
  collectionKey: CollectionKey;
  collectionNameOverride?: string;
  footerLines: string[];
};

export type DualCollectionPage = BasePage & {
  kind: "dual-collection";
  introLines: string[];
  collectionKeys: [CollectionKey, CollectionKey];
  collectionLabels: [string, string];
  footerLines: string[];
};

export type LikertPage = BasePage & {
  kind: "likert";
  introLines: string[];
  scaleLabel: string;
  items: string[];
  answerKeys: string[];
};

export type DemographicField = {
  key: string;
  label: string;
  kind: "number" | "radio";
  options?: string[];
};

export type DemographicsPage = BasePage & {
  kind: "demographics";
  introLines: string[];
  scaleLabel: string;
  items: string[];
  answerKeys: string[];
  demographicSectionTitle: string;
  demographicFields: DemographicField[];
};

export type ResolvedStudyPage =
  | IntroPage
  | SingleCollectionPage
  | DualCollectionPage
  | LikertPage
  | DemographicsPage;

export type StudyMetadata = {
  id: StudyId;
  slug: string;
  shortLabel: string;
  fullTitle: string;
  totalPages: number;
};

export type RespondentSession = {
  respondentId: string;
  studyId: StudyId;
  condition: Condition;
  startedAt: string;
  currentPage: number;
  completedAt?: string;
  pageDrafts: Record<string, AnswerRecord>;
};

export type StudySessionBootstrap = {
  respondentId: string;
  condition: Condition;
  startedAt?: string;
  currentPage?: number;
  reset?: boolean;
};

export type RespondentStartPayload = {
  respondent_id: string;
  study_id: StudyId;
  condition: Condition;
  started_at: string;
  status: "in_progress";
};

export type PageEventPayload = {
  respondent_id: string;
  study_id: StudyId;
  condition: Condition;
  page_number: number;
  page_version: string;
  answers: AnswerRecord;
  entered_at: string;
  submitted_at: string;
  duration_ms: number;
};

export type RespondentFinishPayload = {
  respondent_id: string;
  study_id: StudyId;
  condition: Condition;
  finished_at: string;
  status: "completed";
};

export type RespondentRecord = Omit<RespondentStartPayload, "status"> & {
  status: "in_progress" | "completed";
  finished_at?: string;
  last_page_number?: number;
};

export type DashboardDataset = {
  respondents: RespondentRecord[];
  pageEvents: PageEventPayload[];
  finishes: RespondentFinishPayload[];
  storageMode: StorageMode;
  notices: string[];
  updatedAt: string;
};

export type DashboardSubmission = {
  key: string;
  respondentId: string;
  studyId: StudyId;
  condition: Condition;
  eventType: "page_event" | "finish";
  timestamp: string;
  pageNumber?: number;
  pageVersion?: string;
};

export type DashboardSummary = {
  totalRespondents: number;
  completedRespondents: number;
  studyCounts: Record<StudyId, number>;
  conditionCounts: Record<Condition, number>;
  latestSubmissions: DashboardSubmission[];
  storageMode: StorageMode;
  notices: string[];
  updatedAt: string;
};

export type PersistResult = {
  mode: StorageMode;
  fallback?: boolean;
};
