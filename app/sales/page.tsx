'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Khởi tạo form với mã hợp đồng ngẫu nhiên ban đầu
  const generateContractCode = () => `HD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const [formData, setFormData] = useState({
    contract_number: generateContractCode(),
    customer_id: '',
    inventory_id: '',
    sale_price: '',
    contract_date: new Date().toISOString().split('T')[0], // Ngày hiện tại
    payment_1_amount: '',
    payment_2_amount: '',
    sale_status: 'Đang thanh toán'
  });

  // Tải dữ liệu Bán hàng, Khách hàng và Tồn kho
  async function fetchData() {
    setLoading(true);
    try {
      // 1. Kéo dữ liệu Sales kèm thông tin liên kết
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*, customers(full_name, cccd, phone, address), inventory(license_plate, brand, year)')
        .order('created_at', { ascending: false });

      // 2. Kéo danh sách khách hàng cho Dropdown
      const { data: customersData, error: custError } = await supabase
        .from('customers')
        .select('id, full_name, phone');

      // 3. Kéo danh sách xe "Sẵn sàng bán" cho Dropdown
      const { data: invData, error: invError } = await supabase
        .from('inventory')
        .select('id, license_plate, brand, purchase_price, repair_cost')
        .eq('status', 'Sẵn sàng bán'); // Chỉ lấy xe chưa bán

      if (salesError) throw salesError;
      if (custError) throw custError;
      if (invError) throw invError;

      setSales(salesData || []);
      setCustomers(customersData || []);
      setInventory(invData || []);
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1. Tạo giao dịch mới
      const { error: saleError } = await supabase
        .from('sales')
        .insert([{
          contract_number: formData.contract_number,
          customer_id: formData.customer_id,
          inventory_id: formData.inventory_id,
          sale_price: formData.sale_price ? parseInt(formData.sale_price) : 0,
          contract_date: formData.contract_date,
          payment_1_amount: formData.payment_1_amount ? parseInt(formData.payment_1_amount) : 0,
          payment_2_amount: formData.payment_2_amount ? parseInt(formData.payment_2_amount) : 0,
          sale_status: formData.sale_status
        }]);

      if (saleError) throw saleError;

      // 2. Cập nhật trạng thái xe bên bảng Inventory
      const newCarStatus = formData.sale_status === 'Hoàn tất' ? 'Đã bán' : 'Đang thanh toán';
      const { error: invUpdateError } = await supabase
        .from('inventory')
        .update({ status: newCarStatus })
        .eq('id', formData.inventory_id);

      if (invUpdateError) throw invUpdateError;

      setIsModalOpen(false);
      setFormData({
        contract_number: generateContractCode(), customer_id: '', inventory_id: '',
        sale_price: '', contract_date: new Date().toISOString().split('T')[0],
        payment_1_amount: '', payment_2_amount: '', sale_status: 'Đang thanh toán'
      });
      fetchData(); // Refresh lại toàn bộ dữ liệu
      alert('Tạo hợp đồng bán xe thành công!');
    } catch (error: any) {
      console.error('Lỗi tạo hợp đồng:', error);
      alert('Có lỗi xảy ra: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tính năng in hợp đồng tự động
  const handlePrintContract = (sale: any) => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return alert('Vui lòng cho phép popup để in hợp đồng!');

    const htmlContent = `
      <html>
        <head>
          <title>Hợp Đồng Mua Bán - ${sale.contract_number}</title>
          <style>
            body { font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6; color: #000; }
            h1 { text-align: center; font-size: 24px; margin-bottom: 5px; }
            h2 { text-align: center; font-size: 16px; font-weight: normal; margin-top: 0; margin-bottom: 30px; }
            .section-title { font-weight: bold; text-transform: uppercase; margin-top: 20px; font-size: 16px; border-bottom: 1px solid #000; padding-bottom: 5px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .col { flex: 1; }
            .signature-box { display: flex; justify-content: space-between; margin-top: 50px; text-align: center; }
          </style>
        </head>
        <body>
          <h1>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h1>
          <h2>Độc lập - Tự do - Hạnh phúc</h2>
          <h1 style="margin-top: 40px;">HỢP ĐỒNG MUA BÁN XE Ô TÔ</h1>
          <p style="text-align: center;">Số: <strong>${sale.contract_number}</strong></p>
          <p style="text-align: right;"><i>Hôm nay, ngày ${new Date(sale.contract_date).toLocaleDateString('vi-VN')}</i></p>

          <div class="section-title">ĐIỀU 1: BÊN BÁN VÀ BÊN MUA</div>
          <p><strong>BÊN BÁN (BÊN A): CỬA HÀNG NGUYEN TAM AUTO</strong></p>
          <p>- Đại diện: Ông Nguyễn Tâm</p>
          
          <p><strong>BÊN MUA (BÊN B): ${sale.customers?.full_name?.toUpperCase()}</strong></p>
          <p>- Số CCCD: ${sale.customers?.cccd || '.........................'}</p>
          <p>- Điện thoại: ${sale.customers?.phone || '.........................'}</p>
          <p>- Địa chỉ: ${sale.customers?.address || '.........................'}</p>

          <div class="section-title">ĐIỀU 2: ĐẶC ĐIỂM TÀI SẢN MUA BÁN</div>
          <p>Bên A đồng ý bán và Bên B đồng ý mua chiếc xe ô tô với các đặc điểm sau:</p>
          <p>- Biển số kiểm soát: <strong>${sale.inventory?.license_plate}</strong></p>
          <p>- Nhãn hiệu: ${sale.inventory?.brand} - Đời xe: ${sale.inventory?.year}</p>

          <div class="section-title">ĐIỀU 3: GIÁ BÁN VÀ PHƯƠNG THỨC THANH TOÁN</div>
          <p>- Tổng giá bán: <strong>${formatCurrency(sale.sale_price)}</strong></p>
          <p>- Số tiền đã thanh toán đợt 1: <strong>${formatCurrency(sale.payment_1_amount)}</strong></p>
          <p>- Trạng thái hợp đồng: <strong>${sale.sale_status}</strong></p>

          <div class="signature-box">
            <div class="col">
              <strong>ĐẠI DIỆN BÊN MUA</strong><br>
              <i>(Ký và ghi rõ họ tên)</i>
              <br><br><br><br>
              ${sale.customers?.full_name}
            </div>
            <div class="col">
              <strong>ĐẠI DIỆN BÊN BÁN</strong><br>
              <i>(Ký và đóng dấu)</i>
              <br><br><br><br>
              Nguyễn Tâm
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    // Chờ HTML load xong rồi tự động gọi lệnh in của trình duyệt
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

  const filteredSales = sales.filter(s => 
    s.contract_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.customers?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Giao dịch Bán Hàng</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition font-medium shadow-sm"
        >
          + Tạo Hợp Đồng Mới
        </button>
      </div>

      {/* Bảng Danh sách hợp đồng */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <input 
            type="text" 
            placeholder="Tìm kiếm theo mã HĐ hoặc tên khách hàng..." 
            className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-medium border-b border-gray-200">Mã Hợp Đồng</th>
                <th className="px-6 py-4 font-medium border-b border-gray-200">Khách Hàng</th>
                <th className="px-6 py-4 font-medium border-b border-gray-200">Thông Tin Xe</th>
                <th className="px-6 py-4 font-medium border-b border-gray-200 text-right">Tổng Giá Trị</th>
                <th className="px-6 py-4 font-medium border-b border-gray-200 text-center">Trạng Thái</th>
                <th className="px-6 py-4 font-medium border-b border-gray-200 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Đang tải dữ liệu...</td></tr>
              ) : filteredSales.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Chưa có giao dịch nào.</td></tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-bold text-gray-900">{sale.contract_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <div className="font-medium">{sale.customers?.full_name}</div>
                      <div className="text-xs text-gray-500">{sale.customers?.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-bold text-blue-600">{sale.inventory?.license_plate}</div>
                      <div className="text-xs text-gray-500">{sale.inventory?.brand}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-gray-900">{formatCurrency(sale.sale_price)}</div>
                      <div className="text-xs text-gray-500">Đã trả: {formatCurrency(Number(sale.payment_1_amount) + Number(sale.payment_2_amount))}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium 
                        ${sale.sale_status === 'Hoàn tất' ? 'bg-green-100 text-green-700' : 
                          sale.sale_status === 'Đang thanh toán' ? 'bg-orange-100 text-orange-700' : 
                          'bg-red-100 text-red-700'}`}>
                        {sale.sale_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      {/* Nút In Hợp Đồng */}
                      <button 
                        onClick={() => handlePrintContract(sale)}
                        className="text-white bg-gray-800 px-3 py-1 rounded hover:bg-gray-700 mr-2"
                      >
                        🖨️ In
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tạo Hợp Đồng Mới */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Tạo Hợp Đồng Bán Xe</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 font-bold text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[75vh]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã hợp đồng</label>
                    <input disabled value={formData.contract_number} className="w-full p-2 border border-gray-300 rounded bg-gray-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày ký</label>
                    <input type="date" required name="contract_date" value={formData.contract_date} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded" />
                  </div>
                </div>

                {/* Dropdown Khách hàng */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chọn Khách Hàng (*)</label>
                  <select required name="customer_id" value={formData.customer_id} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded bg-white">
                    <option value="" disabled>-- Chọn khách hàng --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.full_name} - {c.phone}</option>
                    ))}
                  </select>
                </div>

                {/* Dropdown Xe tồn kho */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chọn Xe Bán (*)</label>
                  <select required name="inventory_id" value={formData.inventory_id} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded bg-white">
                    <option value="" disabled>-- Chọn xe (Chỉ hiện xe Sẵn sàng bán) --</option>
                    {inventory.map(v => (
                      <option key={v.id} value={v.id}>{v.license_plate} - {v.brand}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giá Bán Chốt (VNĐ) (*)</label>
                    <input type="number" required name="sale_price" value={formData.sale_price} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái Hợp đồng</label>
                    <select name="sale_status" value={formData.sale_status} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded bg-white">
                      <option value="Đang thanh toán">Đang thanh toán (Cọc/Góp)</option>
                      <option value="Hoàn tất">Hoàn tất (Trả đủ)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Thanh toán Đợt 1 (VNĐ)</label>
                    <input type="number" name="payment_1_amount" value={formData.payment_1_amount} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Thanh toán Đợt 2 (VNĐ)</label>
                    <input type="number" name="payment_2_amount" value={formData.payment_2_amount} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded" />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50">Hủy</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                  {isSubmitting ? 'Đang xử lý...' : 'Xác nhận tạo Hợp đồng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}