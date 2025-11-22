export interface Disease {
  id: string;
  name: string;
  description: string;
}

export const DISEASES: Disease[] = [
  {
    id: "dm",
    name: "당뇨병",
    description: "당분과 탄수화물 섭취를 조절해야 하는 질환. 단 음식, 밥/면/빵 등 탄수화물이 높은 음식 주의.",
  },
  {
    id: "htn",
    name: "고혈압",
    description: "나트륨(소금) 섭취를 줄여야 하는 질환. 짠 음식, 국물 요리, 가공식품 등이 위험함.",
  },
  {
    id: "dyslipidemia",
    name: "이상지질혈증",
    description: "포화지방과 콜레스테롤을 제한해야 하는 질환. 기름진 음식, 튀김, 고기 기름 등이 위험함.",
  },
  {
    id: "osa",
    name: "폐쇄성수면무호흡증",
    description: "체중 관리와 과식을 피해야 하는 질환. 고칼로리 음식, 알코올, 늦은 저녁 식사 주의.",
  },
];

// O(1) 조회를 위한 Map 객체
export const DISEASES_MAP = new Map<string, Disease>(
  DISEASES.map(disease => [disease.id, disease])
);
