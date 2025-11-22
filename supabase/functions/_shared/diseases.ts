export interface Disease {
  id: string;
  name: string;
  description: string;
}

export const DISEASES: Disease[] = [
  {
    id: "htn",
    name: "고혈압",
    description: "나트륨(소금) 섭취를 줄여야 하는 질환. 짠 음식, 국물 요리, 가공식품 등이 위험함.",
  },
  {
    id: "dm",
    name: "당뇨병",
    description: "당분과 탄수화물 섭취를 조절해야 하는 질환. 단 음식, 밥/면/빵 등 탄수화물이 높은 음식 주의.",
  },
  {
    id: "dyslipidemia",
    name: "고지혈증",
    description: "포화지방과 콜레스테롤을 제한해야 하는 질환. 기름진 음식, 튀김, 고기 기름 등이 위험함.",
  },
  {
    id: "obesity",
    name: "비만",
    description: "전체 칼로리와 지방 섭취를 제한해야 하는 상태. 고칼로리 음식, 기름진 음식 주의.",
  },
  {
    id: "kidney",
    name: "신장질환",
    description: "나트륨, 칼륨, 인 섭취를 제한해야 하는 질환. 짠 음식, 과일, 견과류, 유제품 등 주의.",
  },
  {
    id: "liver",
    name: "간질환",
    description: "지방 섭취를 제한하고 알코올을 피해야 하는 질환. 기름진 음식, 술 등이 위험함.",
  },
  {
    id: "gout",
    name: "통풍",
    description: "퓨린 함량이 높은 음식을 피해야 하는 질환. 내장, 등푸른 생선, 육수 등이 위험함.",
  },
];

// O(1) 조회를 위한 Map 객체
export const DISEASES_MAP = new Map<string, Disease>(
  DISEASES.map(disease => [disease.id, disease])
);
