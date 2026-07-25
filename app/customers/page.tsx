'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // TÍNH NĂNG MỚI: State Phân trang (Pagination)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Giới hạn hiển thị 10 khách hàng / 1 trang

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '', phone: '', cccd: '', dob: '', address: '', notes: '', customer_status: 'Tiềm năng'
  });

  async function fetchCustomers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      if (data) setCustomers(data);
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCustomers();
  }, []);

  // TÍNH NĂNG MỚI: Đưa trang về 1 mỗi khi gõ từ khóa tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (editingId) {
        const { error } = await supabase.from('customers').update({
          full_name: formData.full_name, phone: formData.phone, cccd: formData.cccd,
          dob: formData.dob || null, address: formData.address, notes: formData.notes, customer_status: formData.customer_status
        }).eq('id', editingId);
        if (error) throw error;
        alert('Cập nhật thành công!');
      } else {
        const { error } = await supabase.from('customers').insert([{
          full_name: formData.full_name, phone: formData.phone, cccd: formData.cccd,
          dob: formData.dob || null, address: formData.address, notes: formData.notes, customer_status: formData.customer_status
        }]);
        if (error) throw error;
        alert('Đã thêm mới thành công!');
      }
      cancelEdit();
      fetchCustomers();
    } catch (error: any) {
      alert('Lỗi: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (customer: any) => {
    setEditingId(customer.id);
    setFormData({
      full_name: customer.full_name || '', phone: customer.phone || '', cccd: customer.cccd || '',
      dob: customer.dob || '', address: customer.address || '', notes: customer.notes || '', customer_status: customer.customer_status || 'Tiềm năng'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ full_name: '', phone: '', cccd: '', dob: '', address: '', notes: '', customer_status: 'Tiềm năng' });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Xóa khách hàng "${name}"?`)) return;
    try {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) {
        if (error.code === '23503') throw new Error('Khách này đã có hợp đồng. Không thể xóa!');
        throw error;
      }
      fetchCustomers();
    } catch (error: any) {
      alert(error.message);
    }
  };

  // TÍNH NĂNG MỚI: Xuất dữ liệu ra Excel (File CSV)
  const exportToExcel = () => {
    // 1. Tạo tiêu đề cột
    const headers = ['Họ và Tên', 'Số điện thoại', 'CCCD', 'Ngày sinh', 'Địa chỉ', 'Ghi chú', 'Trạng thái'];
    
    // 2. Chuyển đổi dữ liệu (chỉ xuất các khách hàng đang được lọc/tìm kiếm)
    const rows = filteredCustomers.map(c => [
      `"${c.full_name}"`, // Đặt trong ngoặc kép để tránh lỗi dấu phẩy trong nội dung
      `"${c.phone}"`,
      `"${c.cccd || ''}"`,
      `"${c.dob || ''}"`,
      `"${c.address || ''}"`,
      `"${c.notes || ''}"`,
      `"${c.customer_status}"`
    ]);

    // 3. Gộp thành chuỗi định dạng CSV
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    // 4. Mã hóa UTF-8 (Thêm \uFEFF ở đầu để Excel nhận diện chuẩn tiếng Việt)
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // 5. Kích hoạt tải xuống
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Khach_Hang_NguyenTamAuto_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // LOGIC TÌM KIẾM
  const filteredCustomers = customers.filter(c => 
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.cccd.includes(searchTerm)
  );

  // LOGIC PHÂN TRANG (PAGINATION)
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  // Cắt mảng dữ liệu chỉ lấy 10 người của trang hiện tại
  const currentItems = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem); 

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Khách Hàng</h1>
        <p className="text-gray-500 mt-1">Lưu trữ, tìm kiếm và xuất báo cáo khách hàng</p>
      </div>

      {/* FORM NHẬP / SỬA LIỆU */}
      <div className={`bg-white rounded-xl shadow-sm border p-6 mb-8 transition-colors ${editingId ? 'border-blue-400 bg-blue-50' : 'border-gray-100'}`}>
        <h2 className="text-lg font-bold text-gray-800 mb-4">{editingId ? `Đang chỉnh sửa: ${formData.full_name}` : 'Thêm Khách Hàng Mới'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium mb-1">Họ Tên (*)</label><input required name="full_name" value={formData.full_name} onChange={handleInputChange} className="w-full p-2 border rounded" /></div>
            <div><label className="block text-sm font-medium mb-1">Điện thoại (*)</label><input required name="phone" value={formData.phone} onChange={handleInputChange} className="w-full p-2 border rounded" /></div>
            <div><label className="block text-sm font-medium mb-1">CCCD</label><input name="cccd" value={formData.cccd} onChange={handleInputChange} className="w-full p-2 border rounded" /></div>
            <div><label className="block text-sm font-medium mb-1">Ngày sinh</label><input type="date" name="dob" value={formData.dob} onChange={handleInputChange} className="w-full p-2 border rounded" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Địa chỉ</label><input name="address" value={formData.address} onChange={handleInputChange} className="w-full p-2 border rounded" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Lưu ý / Nhu cầu</label><textarea name="notes" value={formData.notes} onChange={handleInputChange} rows={2} className="w-full p-2 border rounded" /></div>
            <div>
              <label className="block text-sm font-medium mb-1">Phân loại</label>
              <select name="customer_status" value={formData.customer_status} onChange={handleInputChange} className="w-full p-2 border rounded bg-white">
                <option value="Tiềm năng">Tiềm năng</option>
                <option value="Đang chăm sóc">Đang chăm sóc</option>
                <option value="Đã mua">Đã mua</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
            {editingId && <button type="button" onClick={cancelEdit} className="px-5 py-2 border rounded hover:bg-gray-100">Hủy</button>}
            <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{isSubmitting ? 'Đang lưu...' : 'Lưu Thông Tin'}</button>
          </div>
        </form>
      </div>

      {/* BẢNG DỮ LIỆU & THANH CÔNG CỤ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Thanh công cụ (Tìm kiếm & Nút Xuất Excel) */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4 items-center bg-gray-50">
          <input 
            type="text" 
            placeholder="🔍 Tìm theo tên, SĐT hoặc CCCD..." 
            className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button 
            onClick={exportToExcel}
            className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2 transition"
          >
            <span>📥 Xuất file Excel</span>
          </button>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-gray-500 text-sm uppercase tracking-wider border-b border-gray-200">
                <th className="px-6 py-4 font-medium">Khách hàng</th>
                <th className="px-6 py-4 font-medium">Liên hệ</th>
                <th className="px-6 py-4 font-medium">Nhu cầu</th>
                <th className="px-6 py-4 font-medium text-center">Trạng thái</th>
                <th className="px-6 py-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">Đang tải dữ liệu...</td></tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Không tìm thấy khách hàng.</td></tr>
              ) : (
                currentItems.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{customer.full_name}</div>
                      <div className="text-xs text-gray-500">CCCD: {customer.cccd || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-blue-600">{customer.phone}</div>
                      <div className="text-xs text-gray-500 truncate w-40" title={customer.address}>{customer.address || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <div className="truncate w-40" title={customer.notes}>{customer.notes || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border">
                        {customer.customer_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <button onClick={() => handleEditClick(customer)} className="text-orange-500 hover:text-orange-700 mr-4">Sửa</button>
                      <button onClick={() => handleDelete(customer.id, customer.full_name)} className="text-red-500 hover:text-red-700">Xóa</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ĐIỀU HƯỚNG PHÂN TRANG */}
        {!loading && filteredCustomers.length > 0 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
            <div className="text-sm text-gray-500">
              Đang hiển thị <strong>{indexOfFirstItem + 1}</strong> - <strong>{Math.min(indexOfLastItem, filteredCustomers.length)}</strong> trong tổng số <strong>{filteredCustomers.length}</strong> khách hàng
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded bg-white text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Trước
              </button>
              
              <div className="px-3 py-1 bg-blue-50 text-blue-600 font-medium rounded border border-blue-100">
                {currentPage} / {totalPages}
              </div>
              
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded bg-white text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Sau
              </button>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}