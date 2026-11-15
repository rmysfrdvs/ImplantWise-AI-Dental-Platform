export interface HotspotItem {
  id: number;
  title: string;
  description: string;
  offset: [number, number, number];
}

export const HOTSPOTS: HotspotItem[] = [
  {
    id: 1,
    title: "Kron (Üst Yapı)",
    description:
      "Doğal diş anatomisine uygun tüberkül (çiğneme çıkıntısı) yapısına sahip, ışık geçirgenliği yüksek porselen veya zirkonyum kaplama.",
    offset: [0, 0.12, 0.64],
  },
  {
    id: 2,
    title: "Abutment (Ara Parça)",
    description:
      "İmplant gövdesi ile protez diş (kron) arasındaki bağlantıyı kuran ve diş eti çıkış profilini destekleyen titanyum parça.",
    offset: [0, 0.28, 0.38],
  },
  {
    id: 3,
    title: "İmplant Gövdesi (Vida)",
    description:
      "Çene kemiğine yerleştirilen ve kemik dokusuyla biyolojik olarak kaynaşan (osseointegrasyon) mikro-yivli titanyum vida.",
    offset: [0, -0.85, 0.36],
  },
];