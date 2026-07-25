'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    cogs: 0, 
    opex: 0, 
    pendingCashInflow: 0, 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFinancials() {
      try {
        const { data: salesData } = await supabase
          .from('sales')
          .select('sale_price, payment_1_amount, payment_2_amount, sale_status, inventory(purchase_price, repair_cost)');

        const { data: expensesData } = await supabase
          .from('expenses')
          .select('amount')
          .is('inventory_id', null);

        let rev = 0;
        let cogsCost = 0;
        let cashInflow = 0;

        salesData?.forEach((sale: any) => {
          if (sale.sale_status === 'Hoàn tất') {
            rev += Number(sale.sale_price);
            
            // Xử lý an toàn nếu inventory là mảng hoặc object
            const inv = Array.isArray(sale.inventory) ? sale.inventory[0] : sale.inventory;
            if (inv) {
              cogsCost += (Number(inv.purchase_price || 0) + Number(inv.repair_cost || 0));
            }
          } 
          
          if (sale.sale_status === 'Đang thanh toán') {
            cashInflow += (Number(sale.sale_price) - Number(sale.payment_1_amount) - Number(sale.payment_2_amount));
          }
        });

        const totalOpex = expensesData?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;

        setMetrics({
          totalRevenue: rev,
          cogs: cogsCost,
          opex: totalOpex,
          pendingCashInflow: cashInflow
        });

      } catch (error) {
        console.error('Lỗi tính toán tài chính:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchFinancials();
  }, []);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

  const grossProfit = metrics.totalRevenue - metrics.cogs;
  const netOperatingIncome = grossProfit - metrics.opex;
  const grossMarginPercentage = metrics.totalRevenue > 0 ? ((grossProfit / metrics.totalRevenue) * 100).toFixed(1) : '0';

  if (loading) return <div className="p-8 text-center text-gray-500">Đang chạy mô hình phân tích dữ liệu...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Báo Cáo Hiệu Quả Tài Chính (P&L)</h1>
        <p className="text-gray-500 mt-1">Chỉ báo Dòng tiền và Lợi nhuận vận hành (Real-time)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
          <div className="text-sm font-medium text-gray-500 mb-1">Doanh Thu Thuần (Đã chốt)</div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalRevenue)}</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
          <div className="text-sm font-medium text-gray-500 mb-1">Lợi Nhuận Gộp (Gross Profit)</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(grossProfit)}</div>
          <div className="text-sm text-gray-500 mt-1">Biên lợi nhuận: <strong>{grossMarginPercentage}%</strong></div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500">
          <div className="text-sm font-medium text-gray-500 mb-1">Chi Phí Vận Hành (OPEX)</div>
          <div className="text-2xl font-bold text-red-500">-{formatCurrency(metrics.opex)}</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
          <div className="text-sm font-medium text-gray-500 mb-1">Lợi Nhuận Thuần (NOI)</div>
          <div className="text-2xl font-bold text-purple-600">{formatCurrency(netOperatingIncome)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Dự phóng Dòng tiền (Cash Flow Projection)</h2>
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-100 flex justify-between items-center">
            <div>
              <div className="text-sm text-orange-800 font-medium">Khoản phải thu ngắn hạn (Receivables)</div>
              <div className="text-xs text-orange-600 mt-1">Từ các hợp đồng đang trả góp/nhận cọc</div>
            </div>
            <div className="text-xl font-bold text-orange-600">+{formatCurrency(metrics.pendingCashInflow)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}