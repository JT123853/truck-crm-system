'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase/client'
import Link from 'next/link'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // State cho form thêm khách hàng (Đã bổ sung phone và notes)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    cccd: '',
    dob: '',
    address: '',
    notes: '',
    customer_status: 'Tiềm năng'
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Lỗi khi tải khách hàng:', error)
    } else {
      setCustomers(data || [])
    }
    setLoading(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data, error } = await supabase
      .from('customers')
      .insert([
        {
          full_name: formData.full_name,
          phone: formData.phone,
          cccd: formData.cccd,
          dob: formData.dob || null,
          address: formData.address,
          notes: formData.notes,
          customer_status: formData.customer_status
        }
      ])

    if (error) {
      alert('Có lỗi xảy ra khi thêm khách hàng! Vui lòng kiểm tra lại.')
      console.error(error)
    } else {
      alert('Đã thêm khách hàng thành công!')
      setFormData({ full_name: '', phone: '', cccd: '', dob: '', address: '', notes: '', customer_status: 'Tiềm năng' })
      setShowAddForm(false)
      fetchCustomers() // Tải lại danh sách
    }
  }

  // Lọc khách hàng (Tìm theo Tên, Số điện thoại, hoặc CCCD)
  const filteredCustomers = customers.filter(c => 
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.phone && c.phone.includes(searchTerm)) ||
    (c.cccd && c.cccd.includes(searchTerm))
  )

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      
      {/* Sidebar thu gọn */}
      <aside className="w-20 bg-slate-900 text-white shadow-xl flex flex-col items-center py-6">
        <Link href="/" className="mb-8 text-blue-400 font-bold text-xl">CRM</Link>
        <Link href="/" className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl mb-2" title="Dashboard">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
        </Link>
        <div className="p-3 bg-blue-600 text-white rounded-xl mb-2 shadow-lg" title="Khách hàng">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Quản lý Khách hàng</h1>
            <p className="text-gray-500 text-sm mt-1">Lưu trữ thông tin và lịch sử giao dịch</p>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition shadow-sm flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            {showAddForm ? 'Đóng form' : 'Thêm Khách hàng'}
          </button>
        </div>

        {/* Form thêm khách hàng */}
        {showAddForm && (
          <form onSubmit={handleAddCustomer} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Họ và Tên *</label>
              <input required type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-500" placeholder="Nguyễn Văn A" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại *</label>
              <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-500" placeholder="0901234567" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Số CCCD</label>
              <input type="text" name="cccd" value={formData.cccd} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-500" placeholder="0123456789" />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ</label>
              <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-500" placeholder="Số nhà, Đường, Quận/Huyện, Tỉnh/TP" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phân loại</label>
              <select name="customer_status" value={formData.customer_status} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-500">
                <option value="Tiềm năng">Tiềm năng</option>
                <option value="Đang thương lượng">Đang thương lượng</option>
                <option value="Đã chốt">Đã chốt</option>
              </select>
            </div>
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Lưu ý (Sở thích, nhu cầu đặc biệt...)</label>
              <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows={2} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-500" placeholder="Khách hàng đang cần tìm xe tải 8 tấn, tài chính khoảng 500 triệu..."></textarea>
            </div>
            <div className="md:col-span-2 lg:col-span-3 flex justify-end">
              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition shadow-sm">
                Lưu thông tin
              </button>
            </div>
          </form>
        )}

        {/* Thanh tìm kiếm */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex items-center gap-3">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên, số điện thoại hoặc CCCD..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full focus:outline-none text-gray-700"
          />
        </div>

        {/* Bảng danh sách */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-500 font-medium whitespace-nowrap">
                <tr>
                  <th className="px-6 py-4 border-b">Họ và Tên</th>
                  <th className="px-6 py-4 border-b">SĐT</th>
                  <th className="px-6 py-4 border-b">Trạng thái</th>
                  <th className="px-6 py-4 border-b">Lưu ý</th>
                  <th className="px-6 py-4 border-b">CCCD</th>
                  <th className="px-6 py-4 border-b">Địa chỉ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-8">Đang tải dữ liệu...</td></tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">Không tìm thấy khách hàng nào.</td></tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{customer.full_name}</td>
                      <td className="px-6 py-4 font-medium text-blue-600 whitespace-nowrap">{customer.phone || '---'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium 
                          ${customer.customer_status === 'Đã chốt' ? 'bg-green-100 text-green-700' : 
                            customer.customer_status === 'Đang thương lượng' ? 'bg-orange-100 text-orange-700' : 
                            'bg-blue-100 text-blue-700'}`}>
                          {customer.customer_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate" title={customer.notes}>{customer.notes || '---'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{customer.cccd || '---'}</td>
                      <td className="px-6 py-4 max-w-xs truncate" title={customer.address}>{customer.address || '---'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}