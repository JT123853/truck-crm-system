'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Kiểm tra xem có đang ở trang login không
  const isLoginPage = pathname === '/login';

  // NẾU LÀ TRANG LOGIN: Trả về giao diện trống (chỉ có form đăng nhập)
  if (isLoginPage) {
    return <div className="flex-1 w-full min-h-screen bg-gray-100">{children}</div>;
  }

  // NẾU LÀ CÁC TRANG KHÁC: Trả về giao diện có Sidebar
  return (
    <div className="h-screen flex w-full overflow-hidden">
      {/* THANH ĐIỀU HƯỚNG (SIDEBAR) */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col shadow-2xl z-10 shrink-0">
        <div className="p-6 text-2xl font-black tracking-wider text-center border-b border-gray-800 text-blue-400">
          NGUYEN TAM<br/><span className="text-white text-lg">AUTO</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4 font-medium">
          <Link href="/dashboard" className={`flex items-center px-4 py-3 rounded-lg transition-all ${pathname === '/dashboard' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
            📊 Bảng Điều Khiển
          </Link>
          <Link href="/customers" className={`flex items-center px-4 py-3 rounded-lg transition-all ${pathname === '/customers' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
            👥 Khách Hàng
          </Link>
          <Link href="/inventory" className={`flex items-center px-4 py-3 rounded-lg transition-all ${pathname === '/inventory' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
            🚘 Tồn Kho Xe
          </Link>
          <Link href="/sales" className={`flex items-center px-4 py-3 rounded-lg transition-all ${pathname === '/sales' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
            📝 Hợp Đồng & Bán Hàng
          </Link>
          <Link href="/accounting" className={`flex items-center px-4 py-3 rounded-lg transition-all ${pathname === '/accounting' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
            💰 Kế Toán Thông Minh
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-800 text-xs text-gray-500 text-center">
          <button 
            onClick={async () => {
              // Thêm tính năng đăng xuất nhanh
              const { supabase } = await import('@/utils/supabase/client');
              await supabase.auth.signOut();
              window.location.href = '/login';
            }}
            className="w-full py-2 mb-2 bg-gray-800 text-red-400 rounded hover:bg-gray-700 transition"
          >
            Đăng xuất
          </button>
          Phiên bản 1.0.0
        </div>
      </aside>

      {/* NỘI DUNG CHÍNH CỦA CÁC MODULE */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {children}
      </main>
    </div>
  );
}