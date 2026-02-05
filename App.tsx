
import React, { useState, useRef } from 'react';
import { StoreOrder } from './types';
import { parseCSVData } from './utils/csvParser';
import { PrintHeader } from './components/PrintHeader';
import { OrderTable } from './components/OrderTable';

declare var html2canvas: any;
declare var jspdf: any;

const App: React.FC = () => {
  const [csvInput, setCsvInput] = useState<string>('');
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [showInput, setShowInput] = useState(true);
  const [status, setStatus] = useState<{ loading: boolean; progress: number; total: number }>({
    loading: false,
    progress: 0,
    total: 0
  });

  const handleProcess = () => {
    if (!csvInput.trim()) return;
    const result = parseCSVData(csvInput);
    setOrders(result);
    setShowInput(false);
  };

  const generateExport = async (type: 'pdf' | 'images') => {
    setStatus({ loading: true, progress: 0, total: orders.length });
    
    // 准备 jsPDF (如果需要)
    const { jsPDF } = jspdf;
    const doc = type === 'pdf' ? new jsPDF('p', 'mm', 'a4') : null;
    
    // 临时添加 class 以便移除阴影干扰渲染
    document.body.classList.add('capturing');

    try {
      for (let i = 0; i < orders.length; i++) {
        const order = orders[i];
        const element = document.getElementById(`order-page-${order.posCode}`);
        if (!element) continue;

        // 捕获当前页面
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        if (type === 'pdf') {
          const imgProps = doc.getImageProperties(imgData);
          const pdfWidth = doc.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          
          if (i > 0) doc.addPage();
          doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        } else {
          // 单独下载图片
          const link = document.createElement('a');
          link.download = `Adidas_${order.posCode}_${order.posName}.jpg`;
          link.href = imgData;
          link.click();
        }

        setStatus(prev => ({ ...prev, progress: i + 1 }));
      }

      if (type === 'pdf') {
        doc.save(`Adidas_配货汇总_${new Date().getTime()}.pdf`);
      }
    } catch (err) {
      console.error('Export error:', err);
      alert('导出过程中发生错误，请检查浏览器权限。');
    } finally {
      document.body.classList.remove('capturing');
      setStatus({ loading: false, progress: 0, total: 0 });
    }
  };

  const handleNativePrint = () => {
    window.print();
  };

  const resetData = () => {
    setOrders([]);
    setShowInput(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 overflow-x-hidden">
      {/* 进度提示层 */}
      {status.loading && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center backdrop-blur-xl">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl flex flex-col items-center max-w-sm w-full text-center">
            <div className="relative w-20 h-20 mb-6">
               <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
               <div 
                 className="absolute inset-0 border-4 border-black rounded-full border-t-transparent animate-spin"
                 style={{ animationDuration: '1s' }}
               ></div>
               <div className="absolute inset-0 flex items-center justify-center font-black text-sm">
                 {Math.round((status.progress / status.total) * 100)}%
               </div>
            </div>
            <h3 className="font-black text-xl text-black mb-2">
              正在渲染第 {status.progress} / {status.total} 页
            </h3>
            <p className="text-gray-400 text-xs leading-relaxed px-4">
              为了确保不出现空白，我们正在逐页抓取高清图像，请勿关闭窗口。
            </p>
          </div>
        </div>
      )}

      {/* 首页：数据录入 */}
      {showInput && (
        <div className="max-w-4xl mx-auto p-8 no-print">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 mt-10">
            <div className="flex items-center gap-6 mb-12">
              <div className="bg-black text-white p-5 rounded-2xl shadow-xl transform hover:rotate-6 transition-transform">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
              </div>
              <div>
                <h1 className="text-4xl font-black text-black tracking-tighter">ADIDAS DISPATCH</h1>
                <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Professional Distribution System</p>
              </div>
            </div>
            
            <div className="mb-10">
              <label className="flex items-center gap-3 text-sm font-black text-gray-800 mb-5 uppercase tracking-widest px-1">
                <span className="w-6 h-6 bg-black text-white rounded-lg flex items-center justify-center text-[10px]">IN</span>
                Paste CSV Source Data
              </label>
              <textarea
                className="w-full h-80 p-8 border-2 border-gray-100 rounded-[2rem] font-mono text-xs focus:border-black focus:ring-8 focus:ring-black/5 outline-none transition-all bg-gray-50/50 resize-none shadow-inner leading-relaxed"
                placeholder="POS Code, 店铺名称, 器架类型, 店铺级别, 点位, 器架, 性别, 宽, 高, 宽(出血), 高(出血), 材质, 数量, 画面选图, 工艺"
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
              />
            </div>
            
            <button
              onClick={handleProcess}
              className="group w-full bg-black text-white py-6 rounded-[2rem] font-black text-xl hover:bg-gray-800 transition-all shadow-2xl active:scale-[0.98] flex items-center justify-center gap-4"
            >
              PREVIEW & GENERATE
              <svg className="w-6 h-6 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
            </button>
          </div>
        </div>
      )}

      {/* 预览页 */}
      {!showInput && orders.length > 0 && (
        <div className="py-12">
          {/* 操作中心 (屏幕显示) */}
          <div className="max-w-[210mm] mx-auto mb-12 p-8 bg-white rounded-[2.5rem] shadow-2xl no-print border border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100">
                 <div className="text-2xl font-black text-black">{orders.length}</div>
                 <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">STORES</div>
              </div>
              <div>
                <h2 className="text-xl font-black text-black">预览就绪</h2>
                <p className="text-gray-400 text-xs">请核对下方配货单信息，确认无误后导出。</p>
              </div>
            </div>
            <div className="flex gap-3">
               <button 
                 onClick={handleNativePrint}
                 className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                 打印 (最清晰)
               </button>
            </div>
          </div>

          {/* 渲染区域 */}
          <div id="pdf-content" className="flex flex-col gap-10">
            {orders.map((order, idx) => (
              <div 
                key={order.posCode} 
                id={`order-page-${order.posCode}`}
                className="max-w-[210mm] mx-auto bg-white p-[15mm] sm:p-[20mm] print:p-0 shadow-lg print:shadow-none order-page"
                style={{ minHeight: '297mm', width: '210mm' }}
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
                
                <div className="mt-12 grid grid-cols-3 text-[11px] font-bold gap-8 uppercase tracking-tighter">
                  <div className="border-t-2 border-black pt-4">配货负责人 (SIGN)</div>
                  <div className="border-t-2 border-black pt-4">仓储核对 (CHECK)</div>
                  <div className="border-t-2 border-black pt-4 text-right text-gray-400">
                    DATE: {new Date().toLocaleDateString('zh-CN')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 底部悬浮按钮组 */}
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 no-print z-50">
            <button
              onClick={resetData}
              className="px-8 py-5 bg-white border-2 border-black rounded-3xl font-black text-sm shadow-2xl hover:bg-gray-50 transition-all flex items-center gap-3 active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
              返回修改
            </button>
            
            <button
              onClick={() => generateExport('pdf')}
              className="px-10 py-5 bg-black text-white rounded-3xl font-black text-sm shadow-[0_20px_50px_rgba(0,0,0,0.4)] hover:scale-105 transition-all flex items-center gap-3 active:scale-95"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
              导出 PDF 报表
            </button>

            <button
              onClick={() => generateExport('images')}
              className="px-8 py-5 bg-blue-600 text-white rounded-3xl font-black text-sm shadow-[0_20px_50px_rgba(37,99,235,0.4)] hover:scale-105 transition-all flex items-center gap-3 active:scale-95"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              保存为图片
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
