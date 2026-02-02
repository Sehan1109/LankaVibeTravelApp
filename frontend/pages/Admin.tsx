import React, { useState } from 'react';
import { 
  LayoutDashboard, Map, LogOut, Bell, X,
  Settings,
  Star
} from 'lucide-react';
import PackagesTab from '../components/admin/PackagesTab'; 
import SettingsTab from '../components/admin/SettingsTab';
import ReviewsTab from '../components/admin/ReviewsTab';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'packages' | 'settings' | 'reviews'>('packages');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  
  const [showToast, setShowToast] = useState(false);

  // Helper for Desktop Sidebar Items
  const getSidebarItemClass = (tabName: string) => {
    const isActive = activeTab === tabName;
    return `flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-3.5 rounded-2xl transition-all duration-300 group cursor-pointer font-medium text-sm ${
      isActive 
        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
        : 'text-emerald-600 hover:bg-emerald-50'
    }`;
  };

  // Helper for Mobile Bottom Bar Items
  const getBottomNavItemClass = (tabName: string) => {
    const isActive = activeTab === tabName;
    return `flex flex-col items-center justify-center w-full py-2 transition-colors duration-300 ${
        isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-emerald-500'
    }`;
  };

  return (
    <div className="flex h-screen bg-emerald-50/30 font-poppins text-emerald-900 overflow-hidden relative">
      
      {/* --- DESKTOP SIDEBAR (Hidden on Mobile) --- */}
      <aside 
        className={`
          hidden md:flex 
          ${isSidebarOpen ? 'w-64 sm:w-72' : 'w-20'} 
          relative h-full bg-white flex-col border-r border-emerald-100 transition-all duration-300 z-40 shadow-xl
        `}
      >
        <div className="p-6 flex items-center justify-between shrink-0">
           
           <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-emerald-50 rounded-xl text-emerald-600 transition-colors">
             <LayoutDashboard className="w-5 h-5" />
           </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
          <div onClick={() => setActiveTab('packages')} className={getSidebarItemClass('packages')}>
            <Map className={`w-5 h-5 min-w-[20px] ${activeTab === 'packages' ? 'text-white' : 'text-emerald-600'}`} />
            {isSidebarOpen && <span className="truncate">Packages</span>}
          </div>

          <div onClick={() => setActiveTab('settings')} className={getSidebarItemClass('settings')}>
            <Settings className={`w-5 h-5 min-w-[20px] ${activeTab === 'settings' ? 'text-white' : 'text-emerald-600'}`} />
            {isSidebarOpen && <span className="truncate">Settings</span>}
          </div>

          <div onClick={() => setActiveTab('reviews')} className={getSidebarItemClass('reviews')}>
            <Star className={`w-5 h-5 min-w-[20px] ${activeTab === 'reviews' ? 'text-white' : 'text-emerald-600'}`} />
            {isSidebarOpen && <span className="truncate">Reviews</span>}
          </div>
        </nav>

        <div className="p-4 border-t border-emerald-100 shrink-0">
           <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors ${!isSidebarOpen && 'justify-center'}`}>
             <LogOut className="w-5 h-5 min-w-[20px]" />
             {isSidebarOpen && <span className="font-medium text-sm truncate">Sign Out</span>}
           </button>
        </div>
      </aside>


      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-10 pb-24 md:pb-10 custom-scrollbar relative">
           
           {/* Toast Notification */}
           {showToast && (
             <div className="absolute top-4 right-4 left-4 sm:left-auto sm:top-5 sm:right-5 z-50 animate-in slide-in-from-top-4 sm:slide-in-from-right duration-500">
               <div className="bg-emerald-900 text-white p-4 rounded-xl shadow-2xl flex items-center gap-4 w-full sm:min-w-[300px] border border-emerald-700">
                 <div className="bg-emerald-500/20 p-2 rounded-full shrink-0">
                   <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-300" />
                 </div>
                 <div className="flex-1 min-w-0">
                   <h4 className="font-bold text-sm truncate">New Booking Received!</h4>
                   <p className="text-xs text-emerald-200 truncate">Check the bookings tab.</p>
                 </div>
                 <button onClick={() => setShowToast(false)} className="text-emerald-400 hover:text-white shrink-0"><X className="w-4 h-4"/></button>
               </div>
             </div>
           )}

           <div className="max-w-7xl mx-auto w-full">
              <div className="mb-6 sm:mb-10">
                 <h2 className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight capitalize mb-1">{activeTab}</h2>
                 <p className="text-sm sm:text-base text-emerald-600/70 font-medium">Manage your {activeTab} details and settings.</p>
              </div>

              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
                 {activeTab === 'packages' && <PackagesTab />}
                 {activeTab === 'settings' && <SettingsTab />}
                  {activeTab === 'reviews' && <ReviewsTab />}
              </div>
           </div>
        </main>
      </div>

      {/* --- MOBILE BOTTOM NAVIGATION (Hidden on Desktop) --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-emerald-100 px-6 py-2 flex justify-between items-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          
          <button onClick={() => setActiveTab('packages')} className={getBottomNavItemClass('packages')}>
            <div className={`p-1.5 rounded-xl mb-1 transition-all ${activeTab === 'packages' ? 'bg-emerald-100' : 'bg-transparent'}`}>
                <Map className={`w-6 h-6 ${activeTab === 'packages' ? 'fill-emerald-600 text-emerald-600' : 'text-slate-400'}`} />
            </div>
            <span className="text-[10px] font-bold">Packages</span>
          </button>

          {/* Add a generic home/dashboard tab if you have one, or just replicate the sidebar structure */}
          
          <button onClick={() => setActiveTab('settings')} className={getBottomNavItemClass('settings')}>
            <div className={`p-1.5 rounded-xl mb-1 transition-all ${activeTab === 'settings' ? 'bg-emerald-100' : 'bg-transparent'}`}>
                <Settings className={`w-6 h-6 ${activeTab === 'settings' ? 'text-emerald-600 animate-spin-slow' : 'text-slate-400'}`} />
            </div>
            <span className="text-[10px] font-bold">Settings</span>
          </button>
      </nav>

    </div>
  );
};

export default Admin;