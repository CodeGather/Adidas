
import { StoreOrder, OrderItem } from '../types';

declare var XLSX: any;

export const parseExcelFile = (arrayBuffer: ArrayBuffer): StoreOrder[] => {
  const data = new Uint8Array(arrayBuffer);
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // 将表格转为 JSON 数组（无表头模式，我们按索引取值）
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  // 核心修复：过滤掉第一行表头数据
  const dataRows = rows.slice(1);
  
  const storeMap: Map<string, StoreOrder> = new Map();

  dataRows.forEach((row) => {
    // 假设 Excel 列顺序:
    // 0: POS Code, 1: POS Name, 2: Fixture Type, 3: Level, 4: Point, 5: Fixture, 6: Gender, 
    // 7: Width, 8: Height, 9: BleedW, 10: BleedH, 11: Material, 12: Qty, 13: ID, 14: Process
    
    const posCode = String(row[0] || '').trim();
    
    // 识别真实的 POS Code 行：避免识别到表头文字
    const isHeaderLiteral = posCode.toLowerCase() === 'pos code' || posCode === '店铺编号' || posCode === 'POS编号';
    
    if (posCode && (posCode.startsWith('P') || posCode.startsWith('p')) && !isHeaderLiteral) {
      const posName = String(row[1] || '').trim();
      const fixtureType = String(row[2] || '').trim();
      const level = String(row[3] || '').trim();

      const item: OrderItem = {
        point: String(row[4] || '').trim(),
        fixture: String(row[5] || '').trim(),
        gender: String(row[6] || '').trim(),
        width: String(row[7] || '').trim(),
        height: String(row[8] || '').trim(),
        bleedWidth: String(row[9] || '').trim(),
        bleedHeight: String(row[10] || '').trim(),
        material: String(row[11] || '').trim(),
        quantity: parseInt(row[12]) || 0,
        id: String(row[13] || '').trim(),
        process: String(row[14] || '').trim()
      };

      if (!storeMap.has(posCode)) {
        storeMap.set(posCode, {
          posCode,
          posName,
          fixtureType,
          level,
          items: []
        });
      }
      
      // 只有当有具体项目内容时才加入（防止只有 POS Code 的空行）
      if (item.id || item.fixture || item.point) {
        storeMap.get(posCode)!.items.push(item);
      }
    }
  });

  // 最终过滤掉没有任何物品的店铺
  return Array.from(storeMap.values()).filter(s => s.items.length > 0);
};
