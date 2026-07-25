'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';

export default function InventoryPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Trạng thái quản lý Modal thêm xe mới
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State lưu trữ dữ liệu form
  const [formData, setFormData] = useState({
    license_plate: '',
    brand: '',
    year: '',
    color: '',
    mileage: '',
    condition_engine: '',
    condition_chassis: '',
    accident_history: '',
    purchase_price: '',
    repair_cost: '',
    status: 'Sẵn sàng bán'
  });

  // Hàm tải dữ liệu
  async function fetchInventory() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      if (data) setVehicles(data);
    } catch (error) {
      console.error('Lỗi tải dữ liệu xe:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInventory();
  }, []);

  // Xử lý thay đổi input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Hàm gửi dữ liệu lên Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('inventory')
        .insert([
          {
            license_plate: formData.license_plate,
            brand: formData.brand,
            year: formData.year ? parseInt(formData.year) : null,
            color: formData.color,
            mileage: formData.mileage ? parseInt(formData.mileage) : null,
            condition_engine: formData.condition_engine,
            condition_chassis: formData.condition_chassis,
            accident_history: formData.accident_history,
            purchase_price: formData.purchase_price ? parseInt(formData.purchase_price) : 0,
            repair_cost: formData.repair_cost ? parseInt(formData.repair_cost) : 0,
            status: formData.status
          }
        ]);

      if (error) throw error;
      
      // Đóng modal, reset form và tải lại bảng
      setIsModalOpen(false);
      setFormData({
        license_plate: '', brand: '', year: '', color: '', mileage: '',
        condition_engine: '', condition_chassis: '', accident_history: '',
        purchase_price: '', repair_cost: '', status: 'Sẵn sàng bán'
      });
      fetchInventory();
      alert('Nhập xe mới thành công!');
    } catch (error: any) {
      console.error('Lỗi thêm xe:', error);
      alert('Có lỗi xảy ra: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const filteredVehicles = vehicles.filter(v => 
    v.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Tồn kho Xe</h1>
        <div className="flex gap-4">
          <button className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-100 transition font-medium">
            Quản lý Phụ tùng / Xăng nhớt
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition font-medium shadow-sm"
          >
            + Nhập xe mới
          </button>
        </div>
      </div>

      {/* Bảng Dữ Liệu */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <input 
            type="text" 
            placeholder="Tìm kiếm theo biển số hoặc hãng xe..." 
            className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-medium border-b border-gray-200">Biển số / Xe</th>
                <th className="px-6 py-4 font-medium border-b border-gray-200">Tình trạng</th>
                <th className="px-6 py-4 font-medium border-b border-gray-200 text-right">Giá vốn tổng</th>
                <th className="px-6 py-4 font-medium border-b border-gray-200 text-center">Trạng thái</th>
                <th className="px-6 py-4 font-medium border-b border-gray-200 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">Đang tải dữ liệu...</td></tr>
              ) : filteredVehicles.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Chưa có dữ liệu xe tồn kho.</td></tr>
              ) : (
                filteredVehicles.map((vehicle) => {
                  const totalCost = Number(vehicle.purchase_price) + Number(vehicle.repair_cost || 0);
                  return (
                    <tr key={vehicle.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{vehicle.license_plate}</div>
                        <div className="text-sm text-gray-500">{vehicle.brand} - {vehicle.year || 'N/A'} ({vehicle.color})</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div><span className="font-medium">Odo:</span> {vehicle.mileage?.toLocaleString('vi-VN')} km</div>
                        <div><span className="font-medium">Máy:</span> {vehicle.condition_engine}</div>
                        <div className="truncate w-48" title={vehicle.accident_history}>
                          <span className="font-medium">Lịch sử:</span> {vehicle.accident_history}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-bold text-red-600">{formatCurrency(totalCost)}</div>
                        <div className="text-xs text-gray-500">
                          Mua: {formatCurrency(vehicle.purchase_price).replace('₫', '')} | Sửa: {formatCurrency(vehicle.repair_cost).replace('₫', '')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium 
                          ${vehicle.status === 'Sẵn sàng bán' ? 'bg-green-100 text-green-700' : 
                            vehicle.status === 'Đang thanh toán' ? 'bg-blue-100 text-blue-700' : 
                            'bg-orange-100 text-orange-700'}`}>
                          {vehicle.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900">Sửa</button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm Xe Mới */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Nhập Thông Tin Xe Mới</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 font-bold text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Thông tin cơ bản */}
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Biển số (*)</label>
                  <input required name="license_plate" value={formData.license_plate} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500" placeholder="VD: 29H-123.45" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Hãng xe</label>
                  <input name="brand" value={formData.brand} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded" placeholder="VD: Hyundai, Isuzu" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Năm sản xuất</label>
                  <input type="number" name="year" value={formData.year} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Màu sắc</label>
                  <input name="color" value={formData.color} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded" /></div>
                
                {/* Thông tin tình trạng */}
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Số Km đã đi (Odo)</label>
                  <input type="number" name="mileage" value={formData.mileage} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Tình trạng máy</label>
                  <input name="condition_engine" value={formData.condition_engine} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded" /></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Tình trạng khung gầm / Lịch sử đâm đụng</label>
                  <textarea name="accident_history" value={formData.accident_history} onChange={handleInputChange} rows={2} className="w-full p-2 border border-gray-300 rounded" placeholder="Mô tả chi tiết tình trạng..." /></div>
                
                {/* Thông tin tài chính */}
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Giá Mua Vào (VNĐ) (*)</label>
                  <input type="number" required name="purchase_price" value={formData.purchase_price} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Chi phí Dọn / Sửa chữa (VNĐ)</label>
                  <input type="number" name="repair_cost" value={formData.repair_cost} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded" /></div>
                
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái hiện tại</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded bg-white">
                    <option value="Sẵn sàng bán">Sẵn sàng bán</option>
                    <option value="Đang dọn">Đang dọn / Sửa chữa</option>
                    <option value="Đã cọc">Đã nhận cọc</option>
                  </select>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50">Hủy bỏ</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                  {isSubmitting ? 'Đang lưu...' : 'Lưu Thông Tin Xe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}