
import { StoreOrder, OrderItem } from '../types';

export const parseCSVData = (csvText: string): StoreOrder[] => {
  const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const storeMap: Map<string, StoreOrder> = new Map();

  lines.forEach(line => {
    const parts = line.split(',').map(p => p.trim());
    
    // 识别数据行：通常以 P 开头的 POS Code
    if (parts[0] && parts[0].startsWith('P') && parts[0].length >= 5) {
      const posCode = parts[0];
      const posName = parts[1] || '';
      const fixtureType = parts[2] || '';
      const level = parts[3] || '';

      const item: OrderItem = {
        point: parts[4] || '',
        fixture: parts[5] || '',
        gender: parts[6] || '',
        width: parts[7] || '',
        height: parts[8] || '',
        bleedWidth: parts[9] || '',
        bleedHeight: parts[10] || '',
        material: parts[11] || '',
        quantity: parseInt(parts[12]) || 1,
        id: parts[13] || '',
        process: parts[14] || ''
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
      storeMap.get(posCode)!.items.push(item);
    }
  });

  return Array.from(storeMap.values());
};
