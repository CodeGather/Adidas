
import React from 'react';
import { OrderItem } from '../types';

interface OrderTableProps {
  items: OrderItem[];
}

export const OrderTable: React.FC<OrderTableProps> = ({ items }) => {
  return (
    <table className="w-full border-collapse border-x-2 border-b-2 border-black text-[11px]">
      <thead>
        <tr className="font-bold text-center">
          <th className="border border-black p-1 w-[60px]">画面选图</th>
          <th className="border border-black p-1 w-[100px]">器架</th>
          <th className="border border-black p-1 w-[50px]">宽</th>
          <th className="border border-black p-1 w-[50px]">高</th>
          <th className="border border-black p-1 w-[70px]">宽（出血）</th>
          <th className="border border-black p-1 w-[70px]">高（出血）</th>
          <th className="border border-black p-1">材质</th>
          <th className="border border-black p-1">工艺</th>
          <th className="border border-black p-1 w-[50px]">数量</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, idx) => (
          <tr key={idx} className="text-center leading-tight">
            <td className="border border-black p-1">{item.id}</td>
            <td className="border border-black p-1">{item.fixture}</td>
            <td className="border border-black p-1">{item.width}</td>
            <td className="border border-black p-1">{item.height}</td>
            <td className="border border-black p-1">{item.bleedWidth}</td>
            <td className="border border-black p-1">{item.bleedHeight}</td>
            <td className="border border-black p-1 text-[10px] break-all">{item.material}</td>
            <td className="border border-black p-1 text-[10px] break-all">{item.process}</td>
            <td className="border border-black p-1 font-bold">{item.quantity}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="font-bold">
          <td colSpan={8} className="border border-black p-1 text-right pr-4">合计数量：</td>
          <td className="border border-black p-1 text-center">
            {items.reduce((sum, item) => sum + item.quantity, 0)}
          </td>
        </tr>
      </tfoot>
    </table>
  );
};
