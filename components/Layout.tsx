import React from 'react';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen relative overflow-hidden text-white selection:bg-indigo-500 selection:text-white">
            {/* Dynamic Background */}
            <div className="fixed inset-0 z-[-1]">
                <div className="absolute inset-0 bg-slate-900"></div>
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[120px] animate-pulse delay-1000"></div>
                <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-pink-600/10 blur-[100px] animate-pulse delay-2000"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
                {children}
            </div>
        </div>
    );
};

export default Layout;
