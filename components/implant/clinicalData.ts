export type TreatmentStageId = 1 | 2 | 3;
export type CrownMaterialId = "zirconia" | "emax";

export interface TreatmentStage {
  id: TreatmentStageId;
  stepLabel: string;
  title: string;
  duration: string;
  summary: string;
}

export const TREATMENT_STAGES: TreatmentStage[] = [
  {
    id: 1,
    stepLabel: "1. Aşama",
    title: "Cerrahi İmplant Yerleşimi",
    duration: "1. Gün (30-45 dk)",
    summary:
      "Lokal anestezi altında titanyum implant gövdesi çene kemiğine yerleştirilir. Diş eti iyileşmesi için üst yapı (kron) henüz takılmaz.",
  },
  {
    id: 2,
    stepLabel: "2. Aşama",
    title: "Osseointegrasyon (Kemik Kaynaşması)",
    duration: "2 - 3 Ay İyileşme",
    summary:
      "Trabeküler ve kortikal kemik hücreleri titanyum yivlerin arasına tutunarak implantı çene kemiğinin doğal bir parçası haline getirir.",
  },
  {
    id: 3,
    stepLabel: "3. Aşama",
    title: "Abutment ve Kalıcı Kron",
    duration: "Final Uygulaması",
    summary:
      "Kemik kaynaşması tamamlandıktan sonra ara parça (abutment) vidalanır ve kişiye özel üretilen Zirkonyum veya E-Max kron sabitlenir.",
  },
];

export interface CrownMaterialInfo {
  id: CrownMaterialId;
  name: string;
  subtitle: string;
  translucency: string;
  durability: string;
  idealArea: string;
  description: string;
}

export const CROWN_MATERIALS: Record<CrownMaterialId, CrownMaterialInfo> = {
  zirconia: {
    id: "zirconia",
    name: "Zirkonyum Kaplama",
    subtitle: "Yüksek Dayanıklılık • Metal Desteksiz",
    translucency: "Orta (Doğal Beyaz Opak)",
    durability: "Çok Yüksek (1200 MPa)",
    idealArea: "Arka Azı Dişleri & Köprüler",
    description:
      "Çiğneme kuvvetinin en yoğun olduğu azı dişlerinde kırılmaya karşı maksimum direnç sunar; diş etiyle biyolojik uyumu mükemmeldir.",
  },
  emax: {
    id: "emax",
    name: "E-Max Full Porselen",
    subtitle: "Lityum Disilikat • Üstün Estetik",
    translucency: "Yüksek (Mine Işık Geçirgenliği)",
    durability: "Yüksek (400-500 MPa)",
    idealArea: "Ön Estetik Bölge & Tek Diş",
    description:
      "Doğal diş minesinin ışık kırılma ve yarı saydamlık özelliğini birebir taklit eder; gülüş estetiğinde en doğal sonucu verir.",
  },
};