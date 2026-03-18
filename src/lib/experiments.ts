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

const likertScaleLabel = "1 = 非常不同意，7 = 非常同意";

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
    totalPages: 7,
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
  "pixelPaws",
  "pixelPawsX",
  "cyberWhales",
];

export function isStudyId(value: string): value is StudyId {
  return value === "study1" || value === "study2";
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
      sidebarCollectionKeys: [condition === "control" ? "cyberWhales" : "pixelPawsX"],
    },
    {
      kind: "single-collection",
      pageNumber: 2,
      pageVersion: "study1-page2-v1",
      introLines: [
        "请想象你正在浏览一个 NFT marketplace。",
        "下面展示的是平台上的一个 NFT collection。",
      ],
      collectionKey: condition === "control" ? "cyberWhales" : "pixelPawsX",
      footerLines: [
        "请根据平时浏览 NFT marketplace 的习惯查看以上信息。",
        "点击“下一页”继续。",
      ],
      sidebarCollectionKeys: [condition === "control" ? "cyberWhales" : "pixelPawsX"],
    },
    {
      kind: "single-collection",
      pageNumber: 3,
      pageVersion: "study1-page3-v1",
      introLines: ["现在请继续浏览下面这个 NFT collection。"],
      collectionKey: "pixelPaws",
      collectionNameOverride: "PixelPaws（被模仿的原创）",
      footerLines: [
        "请根据你对这个 NFT collection 的印象，在接下来的问题中作答。",
        "点击“下一页”继续。",
      ],
      sidebarCollectionKeys: ["pixelPaws"],
    },
    {
      kind: "likert",
      pageNumber: 4,
      pageVersion: "study1-page4-v1",
      introLines: [
        "以下问题是关于 PixelPaws collection--（被模仿的原创）。",
        "请根据你的真实感受回答。",
      ],
      scaleLabel: likertScaleLabel,
      items: [
        "PixelPaws 吸引了我的注意",
        "PixelPaws 在页面中比较显眼",
        "浏览页面后，我对 PixelPaws 更感兴趣",
        "我想进一步了解 PixelPaws collection",
        "PixelPaws 给我留下了较深的印象",
      ],
      answerKeys: [
        "attention_1",
        "attention_2",
        "attention_3",
        "attention_4",
        "attention_5",
      ],
      sidebarCollectionKeys: ["pixelPaws"],
    },
    {
      kind: "likert",
      pageNumber: 5,
      pageVersion: "study1-page5-v1",
      introLines: ["以下问题仍然关于 PixelPaws collection。"],
      scaleLabel: likertScaleLabel,
      items: [
        "我会考虑购买 PixelPaws collection 的 NFT",
        "我对购买 PixelPaws NFT 感兴趣",
        "PixelPaws 是一个值得考虑购买的 NFT collection",
        "如果价格合适，我愿意购买 PixelPaws collection 的 NFT",
      ],
      answerKeys: [
        "purchase_interest_1",
        "purchase_interest_2",
        "purchase_interest_3",
        "purchase_interest_4",
      ],
      sidebarCollectionKeys: ["pixelPaws"],
    },
    {
      kind: "likert",
      pageNumber: 6,
      pageVersion: "study1-page6-v1",
      introLines: ["以下问题是关于之前看到的 NFT collection 与 PixelPaws 的关系。"],
      scaleLabel: likertScaleLabel,
      items: [
        "我觉得之前看到的 NFT collection 与 PixelPaws 风格相似",
        "之前看到的 NFT collection 让我联想到 PixelPaws",
        "根据页面信息，PixelPaws 似乎比之前看到的 collection 更早出现",
        "之前看到的 NFT collection 可以作为 PixelPaws 的替代",
        "我可能会购买之前看到的 NFT collection 而不是 PixelPaws",
        "之前看到的 NFT collection 降低了我对 PixelPaws 的购买兴趣",
      ],
      answerKeys: [
        "relationship_1",
        "relationship_2",
        "relationship_3",
        "relationship_4",
        "relationship_5",
        "relationship_6",
      ],
      sidebarCollectionKeys: [
        "pixelPaws",
        condition === "control" ? "cyberWhales" : "pixelPawsX",
      ],
    },
    {
      kind: "demographics",
      pageNumber: 7,
      pageVersion: "study1-page7-v1",
      introLines: ["以下问题用于了解您的 NFT 使用经验。"],
      scaleLabel: likertScaleLabel,
      items: nftExperienceItems,
      answerKeys: [
        "nft_experience_1",
        "nft_experience_2",
        "nft_experience_3",
        "nft_experience_4",
        "nft_experience_5",
        "nft_experience_6",
      ],
      demographicSectionTitle: "基本信息：",
      demographicFields,
      sidebarCollectionKeys: ["pixelPaws"],
    },
  ];
}

function buildStudy2Pages(condition: Condition): ResolvedStudyPage[] {
  return [
    {
      kind: "intro",
      pageNumber: 1,
      pageVersion: "study2-page1-v1",
      paragraphs: [
        "感谢您参与本研究。",
        "本研究旨在了解用户在浏览 NFT marketplace（数字藏品平台）时的看法与决策过程。",
        "在接下来的页面中，您将看到两个 NFT collection 的展示信息。请像平时浏览数字藏品平台一样查看这些内容。",
        "随后，我们会询问您对其中一个 NFT collection 的印象和看法。",
        "本研究仅用于学术研究，所有回答将匿名处理。",
        "请点击“下一页”继续。",
      ],
      sidebarCollectionKeys: ["pixelPaws", condition === "control" ? "cyberWhales" : "pixelPawsX"],
    },
    {
      kind: "dual-collection",
      pageNumber: 2,
      pageVersion: "study2-page2-v1",
      introLines: [
        "请想象你正在浏览一个 NFT marketplace。",
        "以下是平台上展示的两个 NFT collection。",
      ],
      collectionKeys: [
        "pixelPaws",
        condition === "control" ? "cyberWhales" : "pixelPawsX",
      ],
      collectionLabels: ["Collection 1", "Collection 2"],
      footerLines: [
        "请像平时浏览 NFT marketplace 一样查看这些信息。",
        "点击“下一页”继续。",
      ],
      sidebarCollectionKeys: [
        "pixelPaws",
        condition === "control" ? "cyberWhales" : "pixelPawsX",
      ],
    },
    {
      kind: "likert",
      pageNumber: 3,
      pageVersion: "study2-page3-v1",
      introLines: ["以下问题是关于刚才看到的两个 NFT collection。"],
      scaleLabel: likertScaleLabel,
      items: [
        "这两个 NFT collection 风格相似",
        "这两个 NFT collection 看起来属于相似主题",
        "其中一个 NFT collection 看起来像是在模仿另一个",
        "根据页面信息，PixelPaws 似乎比另一个 collection 更早出现",
      ],
      answerKeys: [
        "pair_impression_1",
        "pair_impression_2",
        "pair_impression_3",
        "pair_impression_4",
      ],
      sidebarCollectionKeys: [
        "pixelPaws",
        condition === "control" ? "cyberWhales" : "pixelPawsX",
      ],
    },
    {
      kind: "likert",
      pageNumber: 4,
      pageVersion: "study2-page4-v1",
      introLines: ["接下来的问题是关于 PixelPaws collection。"],
      scaleLabel: likertScaleLabel,
      items: [
        "PixelPaws 吸引了我的注意",
        "PixelPaws 在页面中比较显眼",
        "浏览页面后，我对 PixelPaws 更感兴趣",
        "我想进一步了解 PixelPaws collection",
        "PixelPaws 给我留下了较深的印象",
      ],
      answerKeys: [
        "attention_1",
        "attention_2",
        "attention_3",
        "attention_4",
        "attention_5",
      ],
      sidebarCollectionKeys: ["pixelPaws"],
    },
    {
      kind: "likert",
      pageNumber: 5,
      pageVersion: "study2-page5-v1",
      introLines: ["以下问题仍然关于 PixelPaws collection。"],
      scaleLabel: likertScaleLabel,
      items: [
        "我会考虑购买 PixelPaws collection 的 NFT",
        "我对购买 PixelPaws NFT 感兴趣",
        "PixelPaws 是一个值得考虑购买的 NFT collection",
        "如果价格合适，我愿意购买 PixelPaws collection 的 NFT",
      ],
      answerKeys: [
        "purchase_interest_1",
        "purchase_interest_2",
        "purchase_interest_3",
        "purchase_interest_4",
      ],
      sidebarCollectionKeys: ["pixelPaws"],
    },
    {
      kind: "likert",
      pageNumber: 6,
      pageVersion: "study2-page6-v1",
      introLines: ["以下问题仍然围绕 PixelPaws 与另一个 NFT collection 的关系。"],
      scaleLabel: likertScaleLabel,
      items: [
        "另一个 NFT collection 可以作为 PixelPaws 的替代",
        "我可能会购买另一个 NFT collection 而不是 PixelPaws",
        "另一个 NFT collection 降低了我对 PixelPaws 的购买兴趣",
        "对我来说，另一个 NFT collection 与 PixelPaws 在功能上是可替代的",
      ],
      answerKeys: [
        "substitution_1",
        "substitution_2",
        "substitution_3",
        "substitution_4",
      ],
      sidebarCollectionKeys: [
        "pixelPaws",
        condition === "control" ? "cyberWhales" : "pixelPawsX",
      ],
    },
    {
      kind: "demographics",
      pageNumber: 7,
      pageVersion: "study2-page7-v1",
      introLines: ["以下问题用于了解您的 NFT 使用经验。"],
      scaleLabel: likertScaleLabel,
      items: nftExperienceItems,
      answerKeys: [
        "nft_experience_1",
        "nft_experience_2",
        "nft_experience_3",
        "nft_experience_4",
        "nft_experience_5",
        "nft_experience_6",
      ],
      demographicSectionTitle: "基本信息：",
      demographicFields,
      sidebarCollectionKeys: ["pixelPaws"],
    },
  ];
}
