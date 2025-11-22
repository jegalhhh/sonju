export interface Disease {
  id: string;
  name: string;
  description: string;
  concerns: string;
}

export const DISEASES: Disease[] = [
  {
    id: "htn",
    name: "고혈압",
    description: "혈압이 정상보다 높은 상태",
    concerns: "나트륨 함량이 높으면 위험",
  },
  {
    id: "dm",
    name: "당뇨병",
    description: "혈당이 정상보다 높은 상태",
    concerns: "당분과 탄수화물 함량이 높으면 위험",
  },
  {
    id: "dyslipidemia",
    name: "고지혈증",
    description: "혈중 지질 수치가 높은 상태",
    concerns: "포화지방과 콜레스테롤이 높으면 위험",
  },
  {
    id: "obesity",
    name: "비만",
    description: "체질량지수가 높은 상태",
    concerns: "칼로리와 지방이 높으면 위험",
  },
  {
    id: "kidney",
    name: "신장질환",
    description: "신장 기능이 저하된 상태",
    concerns: "나트륨, 칼륨, 인이 높으면 위험",
  },
  {
    id: "liver",
    name: "간질환",
    description: "간 기능이 저하된 상태",
    concerns: "지방과 알코올이 많으면 위험",
  },
  {
    id: "gout",
    name: "통풍",
    description: "요산이 과다하게 축적되는 상태",
    concerns: "퓨린 함량이 높으면 위험",
  },
];
