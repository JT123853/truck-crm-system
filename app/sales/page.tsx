'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // TÌM KIẾM & PHÂN TRANG
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // QUẢN LÝ FORM (THÊM / SỬA)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customer_id: '',
    inventory_id: '',
    sale_date: '',
    sale_price: '',
    payment_1_amount: '',
    payment_1_date: '',
    payment_2_amount: '',
    payment_2_date: '',
    sale_status: 'Đang thanh toán',
    notes: ''
  });

  async function fetchData() {
    setLoading(true);
    try {
      // Tải danh sách hợp đồng (kèm thông tin tên khách và biển số xe)
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*, customers(full_name, phone), inventory(brand, license_plate)')
        .order('created_at', { ascending: false });
      if (salesError) throw salesError;

      // Tải danh sách khách hàng để chọn trong dropdown
      const { data: customersData } = await supabase.from('customers').select('id, full_name, phone');
      
      // Tải danh sách xe để chọn trong dropdown
      const { data: inventoryData } = await supabase.from('inventory').select('id, brand, license_plate, status');

      if (salesData) setSales(salesData);
      if (customersData) setCustomers(customersData);
      if (inventoryData) setInventory(inventoryData);
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_id || !formData.inventory_id) {
      alert('Vui lòng chọn Khách hàng và Xe!');
      return;
    }
    
    setIsSubmitting(true);
    
    const payload = {
      customer_id: formData.customer_id,
      inventory_id: formData.inventory_id,
      sale_date: formData.sale_date || null,
      sale_price: formData.sale_price ? Number(formData.sale_price) : 0,
      payment_1_amount: formData.payment_1_amount ? Number(formData.payment_1_amount) : 0,
      payment_1_date: formData.payment_1_date || null,
      payment_2_amount: formData.payment_2_amount ? Number(formData.payment_2_amount) : 0,
      payment_2_date: formData.payment_2_date || null,
      sale_status: formData.sale_status,
      notes: formData.notes
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('sales').update(payload).eq('id', editingId);
        if (error) throw error;
        alert('Cập nhật hợp đồng thành công!');
      } else {
        const { error } = await supabase.from('sales').insert([payload]);
        if (error) throw error;
        
        // Tự động cập nhật trạng thái xe thành "Đã bán"
        await supabase.from('inventory').update({ status: 'Đã bán' }).eq('id', formData.inventory_id);
        
        alert('Tạo hợp đồng mới thành công!');
      }
      cancelEdit();
      fetchData();
    } catch (error: any) {
      alert('Lỗi: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (sale: any) => {
    setEditingId(sale.id);
    setFormData({
      customer_id: sale.customer_id || '',
      inventory_id: sale.inventory_id || '',
      sale_date: sale.sale_date || '',
      sale_price: sale.sale_price ? sale.sale_price.toString() : '',
      payment_1_amount: sale.payment_1_amount ? sale.payment_1_amount.toString() : '',
      payment_1_date: sale.payment_1_date || '',
      payment_2_amount: sale.payment_2_amount ? sale.payment_2_amount.toString() : '',
      payment_2_date: sale.payment_2_date || '',
      sale_status: sale.sale_status || 'Đang thanh toán',
      notes: sale.notes || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      customer_id: '', inventory_id: '', sale_date: '', sale_price: '',
      payment_1_amount: '', payment_1_date: '', payment_2_amount: '', payment_2_date: '',
      sale_status: 'Đang thanh toán', notes: ''
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa hợp đồng này không? Dữ liệu kế toán liên quan sẽ bị ảnh hưởng.')) return;
    try {
      const { error } = await supabase.from('sales').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const exportToExcel = () => {
    const headers = ['Khách hàng', 'Số điện thoại', 'Tên Xe', 'Biển số', 'Ngày bán', 'Giá bán (VNĐ)', 'Đã thanh toán đợt 1', 'Đã thanh toán đợt 2', 'Còn nợ', 'Trạng thái', 'Ghi chú'];
    const rows = filteredSales.map(s => {
      const remaining = Number(s.sale_price) - Number(s.payment_1_amount) - Number(s.payment_2_amount);
      return [
        `"${s.customers?.full_name || ''}"`,
        `"${s.customers?.phone || ''}"`,
        `"${s.inventory?.brand || ''}"`,
        `"${s.inventory?.license_plate || ''}"`,
        `"${s.sale_date || ''}"`,
        `"${s.sale_price || 0}"`,
        `"${s.payment_1_amount || 0}"`,
        `"${s.payment_2_amount || 0}"`,
        `"${remaining || 0}"`,
        `"${s.sale_status}"`,
        `"${s.notes || ''}"`
      ];
    });
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Hop_Dong_NguyenTamAuto_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

  // LOGIC TÌM KIẾM (Tìm theo Tên khách, Số điện thoại hoặc Biển số xe)
  const filteredSales = sales.filter(s => {
    const term = searchTerm.toLowerCase();
    const custName = s.customers?.full_name?.toLowerCase() || '';
    const custPhone = s.customers?.phone || '';
    const licensePlate = s.inventory?.license_plate?.toLowerCase() || '';
    return custName.includes(term) || custPhone.includes(term) || licensePlate.includes(term);
  });

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSales.slice(indexOfFirstItem, indexOfLastItem); 

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Hợp Đồng & Bán Hàng</h1>
        <p className="text-gray-500 mt-1">Theo dõi tiến độ thanh toán và chốt giao dịch xe</p>
      </div>

      {/* FORM NHẬP / SỬA LIỆU */}
      <div className={`bg-white rounded-xl shadow-sm border p-6 mb-8 transition-colors ${editingId ? 'border-blue-400 bg-blue-50' : 'border-gray-100'}`}>
        <h2 className="text-lg font-bold text-gray-800 mb-4">{editingId ? 'Đang chỉnh sửa Hợp Đồng' : 'Tạo Hợp Đồng Mới'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Nếu muốn thêm hoặc xóa trường dữ liệu, bạn chỉnh sửa các thẻ <input> ở khu vực này */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium mb-1">Khách hàng (*)</label>
              <select required name="customer_id" value={formData.customer_id} onChange={handleInputChange} className="w-full p-2 border rounded bg-white">
                <option value="">-- Chọn khách hàng --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.full_name} - {c.phone}</option>
                ))}
              </select>
            </div>
            
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium mb-1">Xe bán (*)</label>
              <select required name="inventory_id" value={formData.inventory_id} onChange={handleInputChange} className="w-full p-2 border rounded bg-white">
                <option value="">-- Chọn xe --</option>
                {inventory.map(car => (
                  <option key={car.id} value={car.id}>{car.brand} ({car.license_plate}) - {car.status}</option>
                ))}
              </select>
            </div>

            <div><label className="block text-sm font-medium mb-1">Ngày lập hợp đồng</label><input type="date" name="sale_date" value={formData.sale_date} onChange={handleInputChange} className="w-full p-2 border rounded" /></div>
            <div><label className="block text-sm font-medium mb-1">Tổng giá bán (VNĐ)</label><input required type="number" name="sale_price" value={formData.sale_price} onChange={handleInputChange} className="w-full p-2 border rounded" /></div>
            
            <div><label className="block text-sm font-medium mb-1">Thanh toán đợt 1 (Cọc)</label><input type="number" name="payment_1_amount" value={formData.payment_1_amount} onChange={handleInputChange} className="w-full p-2 border rounded" /></div>
            <div><label className="block text-sm font-medium mb-1">Ngày nộp đợt 1</label><input type="date" name="payment_1_date" value={formData.payment_1_date} onChange={handleInputChange} className="w-full p-2 border rounded" /></div>
            
            <div><label className="block text-sm font-medium mb-1">Thanh toán đợt 2</label><input type="number" name="payment_2_amount" value={formData.payment_2_amount} onChange={handleInputChange} className="w-full p-2 border rounded" /></div>
            <div><label className="block text-sm font-medium mb-1">Ngày nộp đợt 2</label><input type="date" name="payment_2_date" value={formData.payment_2_date} onChange={handleInputChange} className="w-full p-2 border rounded" /></div>

            <div>
              <label className="block text-sm font-medium mb-1">Trạng thái hợp đồng</label>
              <select name="sale_status" value={formData.sale_status} onChange={handleInputChange} className="w-full p-2 border rounded bg-white">
                <option value="Đang thanh toán">Đang thanh toán</option>
                <option value="Hoàn tất">Hoàn tất (Đã giao xe)</option>
                <option value="Đã hủy">Đã hủy</option>
              </select>
            </div>
            <div className="lg:col-span-3"><label className="block text-sm font-medium mb-1">Ghi chú (Tặng kèm, bảo hành...)</label><input name="notes" value={formData.notes} onChange={handleInputChange} className="w-full p-2 border rounded" /></div>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
            {editingId && <button type="button" onClick={cancelEdit} className="px-5 py-2 border rounded hover:bg-gray-100">Hủy</button>}
            <button type="submit" disabled={isSubmitting} className={`px-6 py-2 text-white rounded font-medium transition ${editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu Hợp Đồng'}
            </button>
          </div>
        </form>
      </div>

      {/* BẢNG DỮ LIỆU & THANH CÔNG CỤ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4 items-center bg-gray-50">
          <input 
            type="text" 
            placeholder="🔍 Tìm Tên khách hàng hoặc Biển số xe..." 
            className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button onClick={exportToExcel} className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2 transition">
            <span>📥 Xuất file Excel</span>
          </button>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-gray-500 text-sm uppercase tracking-wider border-b border-gray-200">
                <th className="px-6 py-4 font-medium">Khách hàng & Xe</th>
                <th className="px-6 py-4 font-medium">Tiến độ thanh toán</th>
                <th className="px-6 py-4 font-medium text-center">Trạng thái</th>
                <th className="px-6 py-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-500">Đang tải dữ liệu...</td></tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400">Không có dữ liệu hợp đồng.</td></tr>
              ) : (
                currentItems.map((sale) => {
                  const totalPaid = Number(sale.payment_1_amount) + Number(sale.payment_2_amount);
                  const remaining = Number(sale.sale_price) - totalPaid;

                  return (
                  <tr key={sale.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{sale.customers?.full_name || 'Khách bị xóa'}</div>
                      <div className="text-xs text-gray-500 mb-1">{sale.customers?.phone || ''}</div>
                      <div className="text-sm font-medium text-blue-600 bg-blue-50 inline-block px-2 py-0.5 rounded">
                        {sale.inventory?.brand} ({sale.inventory?.license_plate})
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Ngày lập: {sale.sale_date || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-500">Tổng giá bán:</span>
                        <span className="font-bold text-gray-900">{formatCurrency(sale.sale_price)}</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-500">Đã thu:</span>
                        <span className="text-green-600 font-medium">+{formatCurrency(totalPaid)}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-gray-100">
                        <span className="text-gray-500">Còn nợ:</span>
                        <span className="text-red-500 font-bold">{formatCurrency(remaining)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border
                        ${sale.sale_status === 'Hoàn tất' ? 'bg-green-50 text-green-700 border-green-200' : 
                          sale.sale_status === 'Đang thanh toán' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          'bg-red-50 text-red-700 border-red-200'}`}>
                        {sale.sale_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <button onClick={() => handleEditClick(sale)} className="text-orange-500 hover:text-orange-700 mr-4">Sửa</button>
                      <button onClick={() => handleDelete(sale.id)} className="text-red-500 hover:text-red-700">Xóa</button>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ĐIỀU HƯỚNG PHÂN TRANG */}
        {!loading && filteredSales.length > 0 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
            <div className="text-sm text-gray-500">
              Đang hiển thị <strong>{indexOfFirstItem + 1}</strong> - <strong>{Math.min(indexOfLastItem, filteredSales.length)}</strong> trong tổng số <strong>{filteredSales.length}</strong> hợp đồng
            </div>
            
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50">Trước</button>
              <div className="px-3 py-1 bg-blue-50 text-blue-600 font-medium rounded border border-blue-100">{currentPage} / {totalPages}</div>
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50">Sau</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}