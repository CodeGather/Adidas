
import React from 'react';

interface PrintHeaderProps {
  posCode: string;
  posName: string;
  level: string;
  fixtureType: string;
}

export const PrintHeader: React.FC<PrintHeaderProps> = ({ posCode, posName, level, fixtureType }) => {
  return (
    <div className="w-full">
      {/* 主标题 */}
      <div className="border-2 border-black border-b-0 py-1 text-center font-bold text-lg tracking-widest">
        adidas配货清单
      </div>
      
      {/* 店铺信息条 */}
      <div className="grid grid-cols-[80px_120px_1fr_80px_120px_80px_80px] border-2 border-black text-[11px]">
        <div className="border-r border-black p-1 font-bold flex items-center justify-center bg-gray-50">店铺编号</div>
        <div className="border-r border-black p-1 flex items-center justify-center">{posCode}</div>
        <div className="border-r border-black p-1 flex items-center justify-center font-bold text-center leading-tight">
          {posName}
        </div>
        <div className="border-r border-black p-1 font-bold flex items-center justify-center bg-gray-50">店铺级别</div>
        <div className="border-r border-black p-1 flex items-center justify-center">{level}</div>
        <div className="border-r border-black p-1 font-bold flex items-center justify-center bg-gray-50">器架类型</div>
        <div className="p-1 flex items-center justify-center font-bold">{fixtureType}</div>
      </div>
    </div>
  );
};
