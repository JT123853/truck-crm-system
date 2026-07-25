'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';

export default function InventoryPage() {
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
    brand: '', license_plate: '', vin: '', import_date: '',
    purchase_price: '', repair_cost: '', expected_price: '',
    status: 'Có sẵn', notes: ''
  });

  async function fetchInventory() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      if (data) setInventory(data);
    } catch (error) {
      console.error('Lỗi tải dữ liệu kho:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInventory();
  }, []);

  // Đưa về trang 1 khi gõ tìm kiếm
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
    
    // Xử lý chuyển đổi chuỗi sang số tiền
    const payload = {
      brand: formData.brand,
      license_plate: formData.license_plate,
      vin: formData.vin,
      import_date: formData.import_date || null,
      purchase_price: formData.purchase_price ? Number(formData.purchase_price) : 0,
      repair_cost: formData.repair_cost ? Number(formData.repair_cost) : 0,
      expected_price: formData.expected_price ? Number(formData.expected_price) : 0,
      status: formData.status,
      notes: formData.notes
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('inventory').update(payload).eq('id', editingId);
        if (error) throw error;
        alert('Cập nhật thông tin xe thành công!');
      } else {
        const { error } = await supabase.from('inventory').insert([payload]);
        if (error) throw error;
        alert('Đã nhập xe mới vào kho thành công!');
      }
      cancelEdit();
      fetchInventory();
    } catch (error: any) {
      alert('Lỗi: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (car: any) => {
    setEditingId(car.id);
    setFormData({
      brand: car.brand || '',
      license_plate: car.license_plate || '',
      vin: car.vin || '',
      import_date: car.import_date || '',
      purchase_price: car.purchase_price ? car.purchase_price.toString() : '',
      repair_cost: car.repair_cost ? car.repair_cost.toString() : '0',
      expected_price: car.expected_price ? car.expected_price.toString() : '',
      status: car.status || 'Có sẵn',
      notes: car.notes || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      brand: '', license_plate: '', vin: '', import_date: '',
      purchase_price: '', repair_cost: '', expected_price: '',
      status: 'Có sẵn', notes: ''
    });
  };

  const handleDelete = async (id: string, plate: string) => {
    if (!window.confirm(`Xóa xe biển số "${plate}" khỏi kho?`)) return;
    try {
      const { error } = await supabase.from('inventory').delete().eq('id', id);
      if (error) {
        // Mã 23503 là lỗi vướng khóa ngoại (Foreign Key Constraint)
        if (error.code === '23503') throw new Error('Xe này đã nằm trong Hợp đồng bán hàng hoặc có Chi phí sửa chữa liên kết. Không thể xóa!');
        throw error;
      }
      fetchInventory();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const exportToExcel = () => {
    const headers = ['Dòng xe', 'Biển số', 'Số khung (VIN)', 'Ngày nhập', 'Giá vốn (Giá mua)', 'Chi phí dọn/sửa', 'Giá bán dự kiến', 'Trạng thái', 'Ghi chú'];
    const rows = filteredInventory.map(c => [
      `"${c.brand}"`,
      `"${c.license_plate}"`,
      `"${c.vin || ''}"`,
      `"${c.import_date || ''}"`,
      `"${c.purchase_price || 0}"`,
      `"${c.repair_cost || 0}"`,
      `"${c.expected_price || 0}"`,
      `"${c.status}"`,
      `"${c.notes || ''}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Ton_Kho_NguyenTamAuto_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

  // LOGIC TÌM KIẾM (Bao gồm Biển số, Số khung và Tên xe)
  const filteredInventory = inventory.filter(c => 
    c.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.vin && c.vin.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // LOGIC PHÂN TRANG
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInventory.slice(indexOfFirstItem, indexOfLastItem); 

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Tồn Kho Xe</h1>
        <p className="text-gray-500 mt-1">Kiểm soát danh mục xe, chi phí sửa chữa và định giá bán</p>
      </div>

      {/* FORM NHẬP / SỬA LIỆU */}
      <div className={`bg-white rounded-xl shadow-sm border p-6 mb-8 transition-colors ${editingId ? 'border-blue-400 bg-blue-50' : 'border-gray-100'}`}>
        <h2 className="text-lg font-bold text-gray-800 mb-4">{editingId ? `Đang chỉnh sửa xe: ${formData.license_plate}` : 'Nhập Xe Mới Vào Kho'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium mb-1">Dòng xe / Đời xe (*)</label><input required name="brand" value={formData.brand} onChange={handleInputChange} className="w-full p-2 border rounded" placeholder="VD: Hyundai H150 2020" /></div>
            <div><label className="block text-sm font-medium mb-1">Biển số (*)</label><input required name="license_plate" value={formData.license_plate} onChange={handleInputChange} className="w-full p-2 border rounded" placeholder="VD: 51C-123.45" /></div>
            <div><label className="block text-sm font-medium mb-1">Số khung (VIN)</label><input name="vin" value={formData.vin} onChange={handleInputChange} className="w-full p-2 border rounded" /></div>
            
            <div><label className="block text-sm font-medium mb-1">Ngày nhập kho</label><input type="date" name="import_date" value={formData.import_date} onChange={handleInputChange} className="w-full p-2 border rounded" /></div>
            <div><label className="block text-sm font-medium mb-1">Trạng thái</label>
              <select name="status" value={formData.status} onChange={handleInputChange} className="w-full p-2 border rounded bg-white">
                <option value="Có sẵn">Có sẵn trong bãi</option>
                <option value="Đang dọn">Đang dọn/Sửa chữa</option>
                <option value="Đã nhận cọc">Đã nhận cọc</option>
                <option value="Đã bán">Đã bán</option>
              </select>
            </div>
            <div><label className="block text-sm font-medium mb-1">Giá nhập mua (VNĐ)</label><input type="number" name="purchase_price" value={formData.purchase_price} onChange={handleInputChange} className="w-full p-2 border rounded" /></div>
            
            <div><label className="block text-sm font-medium mb-1">Giá bán dự kiến (VNĐ)</label><input type="number" name="expected_price" value={formData.expected_price} onChange={handleInputChange} className="w-full p-2 border rounded" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Tình trạng / Ghi chú</label><input name="notes" value={formData.notes} onChange={handleInputChange} className="w-full p-2 border rounded" placeholder="Ví dụ: Cần sơn lại cản trước, thay lốp..." /></div>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
            {editingId && <button type="button" onClick={cancelEdit} className="px-5 py-2 border rounded hover:bg-gray-100">Hủy</button>}
            <button type="submit" disabled={isSubmitting} className={`px-6 py-2 text-white rounded font-medium transition ${editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu Thông Tin'}
            </button>
          </div>
        </form>
      </div>

      {/* BẢNG DỮ LIỆU & THANH CÔNG CỤ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4 items-center bg-gray-50">
          <input 
            type="text" 
            placeholder="🔍 Tìm theo Tên xe, Biển số hoặc Số khung (VIN)..." 
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
                <th className="px-6 py-4 font-medium">Xe & Đăng ký</th>
                <th className="px-6 py-4 font-medium">Tài chính (VNĐ)</th>
                <th className="px-6 py-4 font-medium">Ghi chú</th>
                <th className="px-6 py-4 font-medium text-center">Trạng thái</th>
                <th className="px-6 py-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">Đang tải dữ liệu...</td></tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Không tìm thấy xe trong kho.</td></tr>
              ) : (
                currentItems.map((car) => (
                  <tr key={car.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 text-base">{car.brand}</div>
                      <div className="text-sm font-medium text-blue-600 mt-1">{car.license_plate}</div>
                      <div className="text-xs text-gray-500">VIN: {car.vin || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="text-gray-500">Vốn nhập: <span className="text-gray-900 font-medium">{formatCurrency(car.purchase_price)}</span></div>
                      <div className="text-gray-500">Chi phí dọn: <span className="text-red-500 font-medium">+{formatCurrency(car.repair_cost)}</span></div>
                      <div className="mt-1 pt-1 border-t border-gray-100 text-gray-500">
                        Dự kiến bán: <span className="text-green-600 font-bold">{formatCurrency(car.expected_price)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <div className="truncate w-40" title={car.notes}>{car.notes || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border
                        ${car.status === 'Có sẵn' ? 'bg-green-50 text-green-700 border-green-200' : 
                          car.status === 'Đang dọn' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          car.status === 'Đã nhận cọc' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {car.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <button onClick={() => handleEditClick(car)} className="text-orange-500 hover:text-orange-700 mr-4">Sửa</button>
                      <button onClick={() => handleDelete(car.id, car.license_plate)} className="text-red-500 hover:text-red-700">Xóa</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ĐIỀU HƯỚNG PHÂN TRANG */}
        {!loading && filteredInventory.length > 0 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
            <div className="text-sm text-gray-500">
              Đang hiển thị <strong>{indexOfFirstItem + 1}</strong> - <strong>{Math.min(indexOfLastItem, filteredInventory.length)}</strong> trong tổng số <strong>{filteredInventory.length}</strong> xe
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