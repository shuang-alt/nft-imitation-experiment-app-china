import collectionData from "./collection-data.json";
import type {
  CollectionKey,
  CollectionRecord,
  Condition,
  DemographicField,
  ResolvedStudyPage,
  StudyId,
  StudyMetadata,
} from "./types";

const collections = collectionData as Record<CollectionKey, CollectionRecord>;

const fivePointScaleLabel = "1 = 非常不同意，5 = 非常同意";

const nftExperienceItems = [
  "我熟悉 NFT marketplace",
  "我了解 NFT collection 的基本信息",
  "我曾经关注过 NFT 项目",
  "我曾经购买过 NFT",
  "我平时对数字藏品感兴趣",
  "我经常浏览类似的平台",
];

const demographicFields: DemographicField[] = [
  {
    key: "age",
    label: "您的年龄：",
    kind: "number",
  },
  {
    key: "gender",
    label: "您的性别：",
    kind: "radio",
    options: ["男", "女", "其他"],
  },
  {
    key: "holds_cryptocurrency",
    label: "您是否持有 cryptocurrency：",
    kind: "radio",
    options: ["是", "否"],
  },
  {
    key: "purchased_nft",
    label: "您是否购买过 NFT：",
    kind: "radio",
    options: ["是", "否"],
  },
];

export const studyMetadata: Record<StudyId, StudyMetadata> = {
  study1: {
    id: "study1",
    slug: "study-1",
    shortLabel: "Study 1",
    fullTitle: "Sequential Exposure Experiment",
    totalPages: 8,
  },
  study2: {
    id: "study2",
    slug: "study-2",
    shortLabel: "Study 2",
    fullTitle: "Joint Display Experiment",
    totalPages: 7,
  },
};

export const featuredCollectionKeys: CollectionKey[] = [
  "tinyDinosEth",
  "basedOnChainDinos",
  "goopTroop",
  "lilNouns",
];

const marketplaceEntryCollections: CollectionKey[] = [
  "tinyDinosEth",
  "basedOnChainDinos",
  "goopTroop",
  "lilNouns",
];

const entryPreviewCollections: Record<
  `${StudyId}-${Condition}`,
  CollectionKey[]
> = {
  "study1-control": marketplaceEntryCollections,
  "study1-treatment": marketplaceEntryCollections,
  "study2-control": marketplaceEntryCollections,
  "study2-treatment": marketplaceEntryCollections,
};

export function isStudyId(value: string): value is StudyId {
  return value === "study1" || value === "study2";
}

export function isCondition(value: string): value is Condition {
  return value === "control" || value === "treatment";
}

export function getCollectionRecord(collectionKey: CollectionKey) {
  return collections[collectionKey];
}

export function getFeaturedCollections() {
  return featuredCollectionKeys.map((key) => collections[key]);
}

export function getStudyMetadata(studyId: StudyId) {
  return studyMetadata[studyId];
}

export function getConditionLabel(condition: Condition) {
  return condition === "control" ? "Control" : "Treatment";
}

export function buildStudyEntryPath(studyId: StudyId, condition: Condition) {
  return `/${studyId}-${condition}`;
}

export function buildStudyPagePath(
  studyId: StudyId,
  condition: Condition,
  pageNumber: number,
) {
  return `/study/${studyId}/${condition}/page/${pageNumber}`;
}

export function buildThankYouPath(studyId: StudyId, condition: Condition) {
  return `/thank-you/${studyId}/${condition}`;
}

export function getEntryPreviewCollections(studyId: StudyId, condition: Condition) {
  return entryPreviewCollections[`${studyId}-${condition}`].map((key) => collections[key]);
}

export function getStudyEntryCards() {
  return (Object.entries(entryPreviewCollections) as Array<
    [`${StudyId}-${Condition}`, CollectionKey[]]
  >).map(([flowKey, previewCollections]) => {
    const [studyId, condition] = flowKey.split("-") as [StudyId, Condition];
    const study = getStudyMetadata(studyId);

    return {
      studyId,
      condition,
      study,
      conditionLabel: getConditionLabel(condition),
      entryPath: buildStudyEntryPath(studyId, condition),
      pagePath: buildStudyPagePath(studyId, condition, 1),
      previewCollections: previewCollections.map((key) => collections[key]),
    };
  });
}

export function getStudyPages(
  studyId: StudyId,
  condition: Condition,
): ResolvedStudyPage[] {
  if (studyId === "study1") {
    return buildStudy1Pages(condition);
  }

  return buildStudy2Pages(condition);
}

function buildStudy1Pages(condition: Condition): ResolvedStudyPage[] {
  return [
    {
      kind: "intro",
      pageNumber: 1,
      pageVersion: "study1-page1-v1",
      paragraphs: [
        "感谢您参与本研究。",
        "本研究旨在了解用户在浏览 NFT marketplace（数字藏品平台）时的看法与决策过程。",
        "在接下来的页面中，您将看到一些 NFT collection 的展示信息。请像平时浏览数字藏品平台如 OpenSea 一样查看这些内容。",
        "随后，我们会询问您对某个 NFT collection 的印象和看法。",
        "本研究仅用于学术研究，所有回答将匿名处理。",
        "请点击“下一页”继续。",
      ],
      sidebarCollectionKeys: [condition === "control" ? "goopTroop" : "basedOnChainDinos"],
    },
    {
      kind: "single-collection",
      pageNumber: 2,
      pageVersion: "study1-page2-v2",
      introLines: [
        "请想象你正在浏览一个 NFT marketplace。",
        "下面展示的是平台上的一个 NFT collection。",
        "请认真查看本页展示的信息，后续问题将涉及您刚才浏览页面中的具体内容，请根据页面信息作答。",
      ],
      collectionKey: condition === "control" ? "goopTroop" : "basedOnChainDinos",
      cardImageCount: 3,
      metadataEmphasis: true,
      cardPresentation: "study1-browse",
      footerLines: [
        "请根据平时浏览 NFT marketplace 的习惯查看以上信息。",
        "点击“下一页”继续。",
      ],
      sidebarCollectionKeys: [condition === "control" ? "goopTroop" : "basedOnChainDinos"],
    },
    {
      kind: "single-collection",
      pageNumber: 3,
      pageVersion: "study1-page3-v2",
      introLines: [
        "现在请继续浏览下面这个 NFT collection。",
        "请继续认真查看本页展示的信息，接下来的问题将涉及您刚才浏览过的两个 NFT collection，请根据页面信息作答。",
      ],
      collectionKey: "tinyDinosEth",
      cardImageCount: 3,
      metadataEmphasis: true,
      cardPresentation: "study1-browse",
      footerLines: [
        "请根据您对刚才浏览过的两个 NFT collection 的印象，在接下来的问题中作答。",
        "点击“下一页”继续。",
      ],
      sidebarCollectionKeys: ["tinyDinosEth"],
    },
    {
      kind: "single-choice",
      pageNumber: 4,
      pageVersion: "study1-page4-v1",
      introLines: [
        "以下问题是关于刚才浏览的两个 NFT collection 的关系判断。",
        "请根据您刚才看到的页面信息，选择最符合您判断的一项。",
      ],
      question: "您认为刚才看到的两个 NFT collection 中，哪一个在模仿另一个？",
      answerKey: "imitation_direction_1",
      options: [
        {
          value: "first_imitates_second",
          label: "第一个 NFT collection 在模仿第二个 NFT collection",
        },
        {
          value: "second_imitates_first",
          label: "第二个 NFT collection 在模仿第一个 NFT collection",
        },
        {
          value: "no_imitation_relationship",
          label: "我认为两者之间不存在模仿关系",
        },
      ],
    },
    {
      kind: "likert",
      pageNumber: 5,
      pageVersion: "study1-page5-v2",
      introLines: [
        "以下问题是关于刚才浏览的第二个 NFT collection。",
        "请根据您的真实感受回答。",
      ],
      scaleLabel: fivePointScaleLabel,
      items: [
        "第二个 NFT collection 吸引了我的注意",
        "浏览页面后，我对第二个 NFT collection 更感兴趣",
        "我想进一步了解第二个 NFT collection",
        "第二个 NFT collection 给我留下了较深的印象",
      ],
      answerKeys: ["awareness_1", "awareness_2", "awareness_3", "awareness_4"],
      questionStyle: "matrix-stars",
    },
    {
      kind: "likert",
      pageNumber: 6,
      pageVersion: "study1-page6-v2",
      introLines: ["以下问题仍然关于刚才浏览的第二个 NFT collection。"],
      scaleLabel: fivePointScaleLabel,
      items: [
        "我会考虑购买第二个 NFT collection 的 NFT",
        "我对购买第二个 NFT collection 的 NFT 感兴趣",
        "第二个 NFT collection 是一个值得考虑购买的 NFT collection",
        "如果价格合适，我愿意购买第二个 NFT collection 的 NFT",
      ],
      answerKeys: [
        "purchase_interest_1",
        "purchase_interest_2",
        "purchase_interest_3",
        "purchase_interest_4",
      ],
      questionStyle: "matrix-stars",
    },
    {
      kind: "likert",
      pageNumber: 7,
      pageVersion: "study1-page7-v2",
      introLines: [
        "以下问题是关于刚才浏览的第一个 NFT collection 与第二个 NFT collection 之间的关系。",
      ],
      scaleLabel: fivePointScaleLabel,
      items: [
        "第一个 NFT collection 可以作为第二个 NFT collection 的替代",
        "我可能会购买第一个 NFT collection，而不是第二个 NFT collection",
        "第一个 NFT collection 降低了我对第二个 NFT collection 的购买兴趣",
        "看完第一个 NFT collection 后，我不想再继续搜索第二个 NFT collection 的相关信息。",
      ],
      answerKeys: [
        "substitution_1",
        "substitution_2",
        "substitution_3",
        "search_closure_1",
      ],
      questionStyle: "matrix-stars",
    },
    {
      kind: "demographics",
      pageNumber: 8,
      pageVersion: "study1-page8-v2",
      introLines: ["以下问题用于了解您的 NFT 使用经验。"],
      scaleLabel: fivePointScaleLabel,
      items: nftExperienceItems,
      answerKeys: [
        "nft_experience_1",
        "nft_experience_2",
        "nft_experience_3",
        "nft_experience_4",
        "nft_experience_5",
        "nft_experience_6",
      ],
      questionStyle: "matrix-stars",
      demographicSectionTitle: "基本信息：",
      demographicFields,
    },
  ];
}

function buildStudy2Pages(condition: Condition): ResolvedStudyPage[] {
  return [
    {
      kind: "intro",
      pageNumber: 1,
      pageVersion: "study2-page1-v2",
      paragraphs: [
        "感谢您参与本研究。",
        "本研究旨在了解用户在浏览 NFT marketplace（数字藏品平台）时的看法与决策过程。",
        "在接下来的页面中，您将看到两个 NFT collection 的展示信息。请像平时浏览数字藏品平台一样查看这些内容。",
        "随后，我们会询问您对其中一个 NFT collection 的印象和看法。",
        "本研究仅用于学术研究，所有回答将匿名处理。",
        "请点击“下一页”继续。",
      ],
      sidebarCollectionKeys: [
        "tinyDinosEth",
        condition === "control" ? "goopTroop" : "basedOnChainDinos",
      ],
    },
    {
      kind: "dual-collection",
      pageNumber: 2,
      pageVersion: "study2-page2-v2",
      introLines: [
        "请想象你正在浏览一个 NFT marketplace。",
        "以下是平台上展示的两个 NFT collection。",
        "请认真查看本页展示的信息，后续问题将涉及您刚才浏览页面中的具体内容，请根据页面信息作答。",
      ],
      collectionKeys: [
        "tinyDinosEth",
        condition === "control" ? "goopTroop" : "basedOnChainDinos",
      ],
      collectionLabels: ["第一个 NFT collection", "第二个 NFT collection"],
      cardImageCount: 3,
      metadataEmphasis: true,
      footerLines: [
        "请像平时浏览 NFT marketplace 一样查看这些信息。",
        "请根据您刚才浏览过的两个 NFT collection 的印象，在接下来的问题中作答。",
        "点击“下一页”继续。",
      ],
      sidebarCollectionKeys: [
        "tinyDinosEth",
        condition === "control" ? "goopTroop" : "basedOnChainDinos",
      ],
    },
    {
      kind: "single-choice",
      pageNumber: 3,
      pageVersion: "study2-page3-v2",
      introLines: [
        "以下问题是关于刚才浏览的两个 NFT collection 的关系判断。",
        "请根据您刚才看到的页面信息，选择最符合您判断的一项。",
        "其中，第一个 NFT collection 和第二个 NFT collection 分别对应您刚才浏览页面中的左侧与右侧集合。",
      ],
      question: "您认为刚才看到的两个 NFT collection 中，哪一个在模仿另一个？",
      answerKey: "imitation_direction_2",
      options: [
        {
          value: "first_imitates_second",
          label: "第一个 NFT collection 在模仿第二个 NFT collection",
        },
        {
          value: "second_imitates_first",
          label: "第二个 NFT collection 在模仿第一个 NFT collection",
        },
        {
          value: "no_imitation_relationship",
          label: "我认为两者之间不存在模仿关系",
        },
      ],
    },
    {
      kind: "likert",
      pageNumber: 4,
      pageVersion: "study2-page4-v2",
      introLines: [
        "以下问题是关于刚才浏览的第一个 NFT collection。",
        "请根据您的真实感受回答。",
        "这里的第一个 NFT collection 指您刚才在上一页首先看到的左侧 collection。",
      ],
      scaleLabel: fivePointScaleLabel,
      items: [
        "第一个 NFT collection 吸引了我的注意",
        "浏览页面后，我对第一个 NFT collection 更感兴趣",
        "我想进一步了解第一个 NFT collection",
        "第一个 NFT collection 给我留下了较深的印象",
      ],
      answerKeys: ["awareness_1", "awareness_2", "awareness_3", "awareness_4"],
      questionStyle: "matrix-stars",
      sidebarCollectionKeys: [
        "tinyDinosEth",
        condition === "control" ? "goopTroop" : "basedOnChainDinos",
      ],
      sidebarImageCount: 3,
      showStudySnapshot: false,
    },
    {
      kind: "likert",
      pageNumber: 5,
      pageVersion: "study2-page5-v2",
      introLines: [
        "以下问题仍然关于刚才浏览的第一个 NFT collection。",
        "这里的第一个 NFT collection 指您刚才首先看到的 collection。",
      ],
      scaleLabel: fivePointScaleLabel,
      items: [
        "我会考虑购买第一个 NFT collection 的 NFT",
        "我对购买第一个 NFT collection 的 NFT 感兴趣",
        "第一个 NFT collection 是一个值得考虑购买的 NFT collection",
        "如果价格合适，我愿意购买第一个 NFT collection 的 NFT",
      ],
      answerKeys: [
        "purchase_interest_1",
        "purchase_interest_2",
        "purchase_interest_3",
        "purchase_interest_4",
      ],
      questionStyle: "matrix-stars",
      sidebarCollectionKeys: [
        "tinyDinosEth",
        condition === "control" ? "goopTroop" : "basedOnChainDinos",
      ],
      sidebarImageCount: 3,
      showStudySnapshot: false,
    },
    {
      kind: "likert",
      pageNumber: 6,
      pageVersion: "study2-page6-v2",
      introLines: [
        "以下问题是关于刚才浏览的第一个 NFT collection 与第二个 NFT collection 之间的关系。",
        "其中，第一个 NFT collection 指您先看到的 collection，第二个 NFT collection 指随后看到的 collection。",
      ],
      scaleLabel: fivePointScaleLabel,
      items: [
        "第二个 NFT collection 可以作为第一个 NFT collection 的替代",
        "我可能会购买第二个 NFT collection，而不是第一个 NFT collection",
        "第二个 NFT collection 降低了我对第一个 NFT collection 的购买兴趣",
        "看完第二个 NFT collection 后，我不想再继续搜索第一个 NFT collection 的相关信息。",
      ],
      answerKeys: [
        "substitution_1",
        "substitution_2",
        "substitution_3",
        "search_closure_1",
      ],
      questionStyle: "matrix-stars",
      sidebarCollectionKeys: [
        "tinyDinosEth",
        condition === "control" ? "goopTroop" : "basedOnChainDinos",
      ],
      sidebarImageCount: 3,
      showStudySnapshot: false,
    },
    {
      kind: "demographics",
      pageNumber: 7,
      pageVersion: "study2-page7-v2",
      introLines: ["以下问题用于了解您的 NFT 使用经验。"],
      scaleLabel: fivePointScaleLabel,
      items: nftExperienceItems,
      answerKeys: [
        "nft_experience_1",
        "nft_experience_2",
        "nft_experience_3",
        "nft_experience_4",
        "nft_experience_5",
        "nft_experience_6",
      ],
      questionStyle: "matrix-stars",
      demographicSectionTitle: "基本信息：",
      demographicFields,
      sidebarCollectionKeys: [
        "tinyDinosEth",
        condition === "control" ? "goopTroop" : "basedOnChainDinos",
      ],
      sidebarImageCount: 3,
      showStudySnapshot: false,
    },
  ];
}
