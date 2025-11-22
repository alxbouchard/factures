import React from 'react';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen relative overflow-hidden text-white selection:bg-indigo-500 selection:text-white bg-slate-900">
            {/* Dynamic Background - Optimized for performance */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] rounded-full bg-indigo-600/10 blur-[120px] animate-pulse duration-[10000ms]"></div>
                <div className="absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] rounded-full bg-purple-600/10 blur-[120px] animate-pulse duration-[12000ms] delay-1000"></div>
                <div className="absolute top-[30%] left-[30%] w-[40%] h-[40%] rounded-full bg-pink-600/5 blur-[100px] animate-pulse duration-[15000ms] delay-2000"></div>
            </div>

            {/* Content with Safe Area support */}
            <div className="relative z-10 container mx-auto px-4 py-6 max-w-7xl pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
                {children}
            </div>
        </div>
    );
};

export default Layout;
