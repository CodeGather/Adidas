
export interface OrderItem {
  id: string; // 画面选图
  fixture: string; // 器架
  width: string; // 宽
  height: string; // 高
  bleedWidth: string; // 宽（出血）
  bleedHeight: string; // 高（出血）
  material: string; // 材质
  process: string; // 工艺+备注
  quantity: number; // 数量
  gender: string; // 性别
  point: string; // 点位
}

export interface StoreOrder {
  posCode: string;
  posName: string;
  fixtureType: string;
  level: string;
  items: OrderItem[];
}
