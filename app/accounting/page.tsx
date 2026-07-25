'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';

export default function AccountingPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    expense_type: 'Bến bãi',
    amount: '',
    description: '',
    invoice_number: '',
    inventory_id: '',
    expense_date: new Date().toISOString().split('T')[0]
  });

  async function fetchData() {
    setLoading(true);
    try {
      // Kéo danh sách chi phí
      const { data: expData, error: expError } = await supabase
        .from('expenses')
        .select('*, inventory(license_plate)')
        .order('expense_date', { ascending: false });

      // Kéo danh sách xe để link chi phí (chỉ lấy xe chưa bán để dễ dọn)
      const { data: invData, error: invError } = await supabase
        .from('inventory')
        .select('id, license_plate')
        .neq('status', 'Đã bán');

      if (expError) throw expError;
      if (invError) throw invError;

      setExpenses(expData || []);
      setInventory(invData || []);
    } catch (error) {
      console.error('Lỗi tải dữ liệu kế toán:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('expenses').insert([{
        expense_type: formData.expense_type,
        amount: parseInt(formData.amount),
        description: formData.description,
        invoice_number: formData.invoice_number,
        inventory_id: formData.inventory_id === '' ? null : formData.inventory_id,
        expense_date: formData.expense_date
      }]);

      if (error) throw error;

      // Nếu chi phí này gắn liền với 1 chiếc xe (ví dụ: sửa chữa), hệ thống nên tự động cộng dồn vào repair_cost của xe đó
      if (formData.inventory_id !== '' && (formData.expense_type === 'Sửa chữa' || formData.expense_type === 'Phụ tùng')) {
         // Lấy repair_cost hiện tại
         const { data: carData } = await supabase.from('inventory').select('repair_cost').eq('id', formData.inventory_id).single();
         const currentRepairCost = carData?.repair_cost || 0;
         
         // Cập nhật giá vốn
         await supabase.from('inventory')
           .update({ repair_cost: currentRepairCost + parseInt(formData.amount) })
           .eq('id', formData.inventory_id);
      }

      setFormData({
        expense_type: 'Bến bãi', amount: '', description: '', invoice_number: '',
        inventory_id: '', expense_date: new Date().toISOString().split('T')[0]
      });
      fetchData();
      alert('Đã ghi nhận chi phí thành công!');
    } catch (error: any) {
      alert('Lỗi: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

  const filteredExpenses = expenses.filter(e => 
    e.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.expense_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Kế Toán Phụ Phí (OPEX)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form nhập liệu */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Ghi nhận Chi phí mới</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại chi phí</label>
              <select name="expense_type" value={formData.expense_type} onChange={handleInputChange} className="w-full p-2 border rounded">
                <option value="Bến bãi">Thuê bến bãi</option>
                <option value="Xăng nhớt">Xăng / Nhớt</option>
                <option value="Phụ tùng">Vật tư / Phụ tùng</option>
                <option value="Sửa chữa">Gia công sửa chữa</option>
                <option value="Hoa hồng">Hoa hồng môi giới</option>
                <option value="Khác">Chi phí khác</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền (VNĐ) (*)</label>
              <input type="number" required name="amount" value={formData.amount} onChange={handleInputChange} className="w-full p-2 border rounded focus:ring-red-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gắn với xe (Tùy chọn)</label>
              <select name="inventory_id" value={formData.inventory_id} onChange={handleInputChange} className="w-full p-2 border rounded">
                <option value="">-- Không gắn với xe cụ thể --</option>
                {inventory.map(v => (
                  <option key={v.id} value={v.id}>{v.license_plate}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Nếu chọn xe và loại phí "Sửa chữa", tiền sẽ tự động cộng vào Giá vốn xe.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả / Ghi chú</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} rows={2} className="w-full p-2 border rounded" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày chi</label>
              <input type="date" name="expense_date" value={formData.expense_date} onChange={handleInputChange} className="w-full p-2 border rounded" />
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium">
              {isSubmitting ? 'Đang lưu...' : 'Ghi sổ Kế toán'}
            </button>
          </form>
        </div>

        {/* Bảng liệt kê */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800">Sổ Nhật Ký Chi Tiền</h2>
            <input 
              type="text" placeholder="Tìm theo mô tả..." 
              className="p-2 border rounded-lg text-sm w-64"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm">
                  <th className="px-4 py-3">Ngày</th>
                  <th className="px-4 py-3">Loại phí</th>
                  <th className="px-4 py-3">Diễn giải</th>
                  <th className="px-4 py-3">Xe liên kết</th>
                  <th className="px-4 py-3 text-right">Số tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{new Date(exp.expense_date).toLocaleDateString('vi-VN')}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">{exp.expense_type}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{exp.description}</td>
                    <td className="px-4 py-3 text-sm font-medium text-blue-600">{exp.inventory?.license_plate || '-'}</td>
                    <td className="px-4 py-3 text-sm font-bold text-red-600 text-right">-{formatCurrency(exp.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}