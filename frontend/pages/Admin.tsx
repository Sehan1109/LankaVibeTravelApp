import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Map, LogOut, Bell, X,
  Settings, Star, Eye, Users, FileText, 
  TrendingUp, TrendingDown, Loader2 
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  Tooltip, ResponsiveContainer 
} from 'recharts';

import PackagesTab from '../components/admin/PackagesTab'; 
import SettingsTab from '../components/admin/SettingsTab';
import ReviewsTab from '../components/admin/ReviewsTab';
import DraftsTab from '../components/admin/DraftsTab';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'packages' | 'settings' | 'reviews' | 'drafts'>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [showToast, setShowToast] = useState(false);

  // --- NEW: State for Actual Dashboard Data ---
  const [statsData, setStatsData] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // --- NEW: Fetch Real Data from Backend ---
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/plans/stats`);
        if (res.ok) {
          const data = await res.json();
          setStatsData(data);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoadingStats(false);
      }
    };

    if (activeTab === 'dashboard') {
      fetchStats();
      // Auto-refresh stats every 30 seconds when on the dashboard
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

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
      
      {/* --- DESKTOP SIDEBAR --- */}
      <aside 
        className={`
          hidden md:flex 
          ${isSidebarOpen ? 'w-64 sm:w-72' : 'w-20'} 
          relative h-full bg-white flex-col border-r border-emerald-100 transition-all duration-300 z-40 shadow-xl
        `}
      >
        <div className="p-6 flex items-center justify-between shrink-0">
           {isSidebarOpen && <span className="font-black text-xl text-emerald-800 tracking-tight">TripTrix</span>}
           <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-emerald-50 rounded-xl text-emerald-600 transition-colors">
             <LayoutDashboard className="w-5 h-5" />
           </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
          <div onClick={() => setActiveTab('dashboard')} className={getSidebarItemClass('dashboard')}>
            <LayoutDashboard className={`w-5 h-5 min-w-[20px] ${activeTab === 'dashboard' ? 'text-white' : 'text-emerald-600'}`} />
            {isSidebarOpen && <span className="truncate">Dashboard</span>}
          </div>

          <div onClick={() => setActiveTab('packages')} className={getSidebarItemClass('packages')}>
            <Map className={`w-5 h-5 min-w-[20px] ${activeTab === 'packages' ? 'text-white' : 'text-emerald-600'}`} />
            {isSidebarOpen && <span className="truncate">Packages</span>}
          </div>

          <div onClick={() => setActiveTab('drafts')} className={getSidebarItemClass('drafts')}>
            <Eye className={`w-5 h-5 min-w-[20px] ${activeTab === 'drafts' ? 'text-white' : 'text-emerald-600'}`} />
            {isSidebarOpen && <span className="truncate">Live Inputs</span>}
          </div>

          <div onClick={() => setActiveTab('reviews')} className={getSidebarItemClass('reviews')}>
            <Star className={`w-5 h-5 min-w-[20px] ${activeTab === 'reviews' ? 'text-white' : 'text-emerald-600'}`} />
            {isSidebarOpen && <span className="truncate">Reviews</span>}
          </div>

          <div onClick={() => setActiveTab('settings')} className={getSidebarItemClass('settings')}>
            <Settings className={`w-5 h-5 min-w-[20px] ${activeTab === 'settings' ? 'text-white' : 'text-emerald-600'}`} />
            {isSidebarOpen && <span className="truncate">Settings</span>}
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
              {/* Header Title */}
              <div className="mb-6 sm:mb-10 flex justify-between items-end">
                 <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight capitalize mb-1">
                      {activeTab === 'drafts' ? 'Live User Inputs' : activeTab}
                    </h2>
                    <p className="text-sm sm:text-base text-emerald-600/70 font-medium">Manage your {activeTab} details and settings.</p>
                 </div>
              </div>

              {/* View Rendering */}
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
                 
                 {/* ✅ DASHBOARD VIEW WITH GRAPHS */}
                 {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                      
                      {/* Loader while fetching data */}
                      {loadingStats ? (
                        <div className="flex justify-center items-center py-20">
                          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                        </div>
                      ) : (
                        <>
                          {/* STAT CARDS */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100/50 hover:border-emerald-200 transition-all">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <p className="text-sm font-medium text-emerald-600/70 mb-1">Total Visitors (Proxy)</p>
                                  <h3 className="text-2xl font-black text-emerald-950">
                                    {statsData?.summary?.totalVisitors?.toLocaleString() || 0}
                                  </h3>
                                </div>
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                  <Users className="w-5 h-5" />
                                </div>
                              </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100/50 hover:border-emerald-200 transition-all">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <p className="text-sm font-medium text-emerald-600/70 mb-1">Plans Generated</p>
                                  <h3 className="text-2xl font-black text-emerald-950">
                                    {statsData?.summary?.savedPlansCount?.toLocaleString() || 0}
                                  </h3>
                                </div>
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                  <FileText className="w-5 h-5" />
                                </div>
                              </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100/50 hover:border-emerald-200 transition-all">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <p className="text-sm font-medium text-emerald-600/70 mb-1">Conversion Rate</p>
                                  <h3 className="text-2xl font-black text-emerald-950">
                                    {statsData?.summary?.conversionRate || 0}%
                                  </h3>
                                </div>
                                <div className="p-2 bg-yellow-50 text-yellow-600 rounded-xl">
                                  <TrendingUp className="w-5 h-5" />
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100/50 hover:border-emerald-200 transition-all">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <p className="text-sm font-medium text-emerald-600/70 mb-1">Abandoned Drafts</p>
                                  <h3 className="text-2xl font-black text-emerald-950">
                                    {statsData?.summary?.draftsCount?.toLocaleString() || 0}
                                  </h3>
                                </div>
                                <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                                  <LayoutDashboard className="w-5 h-5" />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* CHARTS */}
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            
                            {/* Donut Chart: Plan Status */}
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100/50 lg:col-span-1">
                              <h3 className="font-bold text-emerald-950 mb-6">Plan Generation Stats</h3>
                              <div className="h-64 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={statsData?.planStatsData || []}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={60}
                                      outerRadius={90}
                                      paddingAngle={5}
                                      dataKey="value"
                                      stroke="none"
                                    >
                                      {statsData?.planStatsData?.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                      ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                  </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                                  <span className="text-sm text-emerald-600/60 font-medium">Total Plans</span>
                                  <span className="text-2xl font-black text-emerald-950">
                                    {statsData?.summary?.totalVisitors?.toLocaleString() || 0}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-col gap-3 mt-4">
                                {statsData?.planStatsData?.map((item: any) => (
                                  <div key={item.name} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                      <span className="text-emerald-900 font-medium">{item.name}</span>
                                    </div>
                                    <span className="font-bold text-emerald-950">{item.value.toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Bar Chart: Website Visitors */}
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100/50 lg:col-span-2">
                              <h3 className="font-bold text-emerald-950 mb-6">Website Traffic (Activity per Month)</h3>
                              <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={statsData?.visitorAnalyticsData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#059669', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#059669', fontSize: 12 }} />
                                    <Tooltip cursor={{ fill: '#ecfdf5' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="visitors" fill="#059669" radius={[4, 4, 0, 0]} barSize={24} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Rendering DraftsTab inside Dashboard at the bottom */}
                      <div className="pt-4">
                          <DraftsTab />
                      </div>
                    </div>
                 )}

                 {/* Other Existing Tabs */}
                 {activeTab === 'packages' && <PackagesTab />}
                 {activeTab === 'settings' && <SettingsTab />}
                 {activeTab === 'reviews' && <ReviewsTab />}
                 {activeTab === 'drafts' && <DraftsTab />}
              </div>
           </div>
        </main>
      </div>

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-emerald-100 px-6 py-2 flex justify-between items-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button onClick={() => setActiveTab('dashboard')} className={getBottomNavItemClass('dashboard')}>
            <div className={`p-1.5 rounded-xl mb-1 transition-all ${activeTab === 'dashboard' ? 'bg-emerald-100' : 'bg-transparent'}`}>
                <LayoutDashboard className={`w-6 h-6 ${activeTab === 'dashboard' ? 'fill-emerald-600 text-emerald-600' : 'text-slate-400'}`} />
            </div>
            <span className="text-[10px] font-bold">Dash</span>
          </button>

          <button onClick={() => setActiveTab('packages')} className={getBottomNavItemClass('packages')}>
            <div className={`p-1.5 rounded-xl mb-1 transition-all ${activeTab === 'packages' ? 'bg-emerald-100' : 'bg-transparent'}`}>
                <Map className={`w-6 h-6 ${activeTab === 'packages' ? 'fill-emerald-600 text-emerald-600' : 'text-slate-400'}`} />
            </div>
            <span className="text-[10px] font-bold">Packages</span>
          </button>

          <button onClick={() => setActiveTab('drafts')} className={getBottomNavItemClass('drafts')}>
            <div className={`p-1.5 rounded-xl mb-1 transition-all ${activeTab === 'drafts' ? 'bg-emerald-100' : 'bg-transparent'}`}>
                <Eye className={`w-6 h-6 ${activeTab === 'drafts' ? 'fill-emerald-600 text-emerald-600' : 'text-slate-400'}`} />
            </div>
            <span className="text-[10px] font-bold">Live</span>
          </button>
          
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