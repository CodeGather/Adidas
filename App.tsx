
import React, { useState } from 'react';
import { StoreOrder } from './types';
import { parseExcelFile } from './utils/excelParser';
import { PrintHeader } from './components/PrintHeader';
import { OrderTable } from './components/OrderTable';

declare var html2canvas: any;
declare var jspdf: any;

const App: React.FC = () => {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [showInput, setShowInput] = useState(true);
  const [exporting, setExporting] = useState<{ active: boolean; current: number; total: number }>({
    active: false,
    current: 0,
    total: 0
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        const result = parseExcelFile(evt.target.result as ArrayBuffer);
        if (result.length === 0) {
          alert("未能从 Excel 中识别到有效数据，请检查表格格式。");
          return;
        }
        setOrders(result);
        setShowInput(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const generatePDF = async () => {
    if (orders.length === 0) return;
    
    // 总页数 = 目录页 + 所有店铺页
    const totalPages = 1 + orders.length;
    setExporting({ active: true, current: 0, total: totalPages });
    
    const { jsPDF } = jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = doc.internal.pageSize.getWidth();
    
    // 强制进入捕获状态样式（移除阴影等干扰）
    document.body.classList.add('is-capturing');
    // 核心修复：回到顶部确保 Canvas 捕获位置正确
    window.scrollTo(0, 0);

    try {
      // 1. 导出目录页作为 PDF 第一页
      setExporting(prev => ({ ...prev, current: 1 }));
      const summaryElement = document.getElementById('summary-page');
      if (summaryElement) {
        const canvas = await html2canvas(summaryElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff'
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        const imgProps = doc.getImageProperties(imgData);
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }

      // 2. 逐页导出各店铺配货单
      for (let i = 0; i < orders.length; i++) {
        setExporting(prev => ({ ...prev, current: i + 2 }));
        
        const order = orders[i];
        const element = document.getElementById(`order-page-${order.posCode}`);
        if (!element) continue;

        // 给浏览器重绘时间
        await new Promise(resolve => setTimeout(resolve, 200));

        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: element.offsetWidth,
          height: element.offsetHeight,
          x: 0,
          y: 0
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        const imgProps = doc.getImageProperties(imgData);
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        doc.addPage();
        doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }

      doc.save(`Adidas_配货汇总_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error(err);
      alert("PDF 生成失败，请尝试减少单次导出的店铺数量。");
    } finally {
      document.body.classList.remove('is-capturing');
      setExporting({ active: false, current: 0, total: 0 });
    }
  };

  const generateImages = async () => {
    setExporting({ active: true, current: 0, total: orders.length });
    document.body.classList.add('is-capturing');
    window.scrollTo(0, 0);

    try {
      for (let i = 0; i < orders.length; i++) {
        setExporting(prev => ({ ...prev, current: i + 1 }));
        const order = orders[i];
        const element = document.getElementById(`order-page-${order.posCode}`);
        if (!element) continue;

        await new Promise(resolve => setTimeout(resolve, 150));
        const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
        
        const link = document.createElement('a');
        link.download = `Adidas_${order.posCode}_${order.posName}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();
      }
    } finally {
      document.body.classList.remove('is-capturing');
      setExporting({ active: false, current: 0, total: 0 });
    }
  };

  const reset = () => {
    setShowInput(true);
    setOrders([]);
    setFileName('');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* 进度遮罩 */}
      {exporting.active && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center backdrop-blur-md">
          <div className="bg-white p-12 rounded-[3rem] shadow-2xl flex flex-col items-center max-w-sm w-full text-center">
            <div className="w-20 h-20 mb-6 relative">
              <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-black rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center font-black text-sm text-black">
                {Math.round((exporting.current / exporting.total) * 100)}%
              </div>
            </div>
            <h3 className="font-black text-2xl text-black mb-2">正在导出文件</h3>
            <p className="text-gray-400 text-sm">正在处理第 {exporting.current} / {exporting.total} 页</p>
          </div>
        </div>
      )}

      {/* 录入界面 */}
      {showInput && (
        <div className="max-w-3xl mx-auto pt-20 px-8">
          <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-gray-100 text-center">
            <div className="inline-flex bg-black text-white p-6 rounded-3xl mb-8 shadow-2xl">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <h1 className="text-4xl font-black text-black tracking-tight mb-4 uppercase">Adidas Dispatch</h1>
            <p className="text-gray-400 font-medium mb-12 uppercase tracking-[0.3em] text-[10px]">Excel Data Distribution Tool</p>
            
            <div className="relative group">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="border-4 border-dashed border-gray-100 rounded-[2.5rem] p-16 transition-all group-hover:border-black group-hover:bg-gray-50 flex flex-col items-center">
                <svg className="w-16 h-16 text-gray-200 group-hover:text-black mb-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                <p className="text-xl font-black text-black mb-2">点击或拖拽 Excel 文件</p>
                <p className="text-gray-400 text-sm font-medium italic">系统将自动过滤首行表头，请确保数据从第二行开始</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 预览与内容 */}
      {!showInput && orders.length > 0 && (
        <div className="py-12 px-6">
          <div className="max-w-[210mm] mx-auto mb-10 no-print flex items-center justify-between bg-white p-8 rounded-[2rem] shadow-xl border border-gray-50">
            <div>
              <h2 className="text-2xl font-black text-black">解析完成</h2>
              <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Store Count: {orders.length}</p>
            </div>
            <div className="flex gap-4">
              <button onClick={reset} className="px-6 py-3 border-2 border-black rounded-2xl font-black text-sm hover:bg-black hover:text-white transition-all">重新上传</button>
              <button onClick={() => window.print()} className="px-6 py-3 bg-black text-white rounded-2xl font-black text-sm hover:bg-gray-800 transition-all shadow-lg flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                打印全部
              </button>
            </div>
          </div>

          <div id="pdf-content" className="flex flex-col gap-10">
            {/* 目录页 - 方便打印时预览，作为 PDF 的第一页 */}
            <div 
              id="summary-page"
              className="max-w-[210mm] mx-auto bg-white p-[20mm] shadow-2xl print:shadow-none order-page"
              style={{ width: '210mm', minHeight: '297mm' }}
            >
              <div className="border-4 border-black p-8 mb-10 text-center">
                <h1 className="text-4xl font-black uppercase tracking-widest mb-2">配货单总目录</h1>
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.4em]">Dispatch Summary Catalog Index</p>
              </div>
              <div className="grid grid-cols-2 gap-x-10 gap-y-4">
                {orders.map((o, idx) => (
                  <div key={o.posCode} className="flex items-center justify-between border-b border-gray-100 pb-2 text-[12px]">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-black/30">{(idx + 1).toString().padStart(2, '0')}</span>
                      <span className="font-bold text-gray-800 tracking-tight">{o.posCode}</span>
                      <span className="text-gray-600 truncate max-w-[120px]">{o.posName}</span>
                    </div>
                    <span className="text-black font-black uppercase text-[9px] bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">{o.items.length} PCS</span>
                  </div>
                ))}
              </div>
              <div className="mt-auto pt-20 text-center text-[10px] text-gray-300 font-black uppercase tracking-[0.5em]">
                ADIDAS DISPATCH SYSTEM • GEN: {new Date().toLocaleDateString()}
              </div>
            </div>

            {/* 店铺配货单页 */}
            {orders.map((order) => (
              <div 
                key={order.posCode} 
                id={`order-page-${order.posCode}`}
                className="max-w-[210mm] mx-auto bg-white p-[15mm] sm:p-[20mm] print:p-0 shadow-2xl print:shadow-none order-page"
                style={{ width: '210mm', minHeight: '297mm' }}
              >
                <PrintHeader 
                  posCode={order.posCode} 
                  posName={order.posName} 
                  level={order.level} 
                  fixtureType={order.fixtureType} 
                />
                <div className="mt-[-2px]">
                   <OrderTable items={order.items} />
                </div>
                
                <div className="mt-12 grid grid-cols-3 text-[11px] font-bold gap-8 uppercase">
                  <div className="border-t-2 border-black pt-4">配货负责人 (SIGN)</div>
                  <div className="border-t-2 border-black pt-4">仓储复核 (CHECK)</div>
                  <div className="border-t-2 border-black pt-4 text-right text-gray-300">
                    DATE: {new Date().toLocaleDateString('zh-CN')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 底部功能栏 */}
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex gap-4 no-print z-50">
            <button
              onClick={generatePDF}
              className="px-10 py-5 bg-black text-white rounded-[2rem] font-black text-sm shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-110 transition-all flex items-center gap-3 active:scale-95 border-2 border-black"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              导出高清 PDF (含目录)
            </button>
            <button
              onClick={generateImages}
              className="px-10 py-5 bg-white text-black border-2 border-black rounded-[2rem] font-black text-sm shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:scale-110 transition-all flex items-center gap-3 active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              保存单页图片
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
