import { memo, useState } from 'react';
import { useOS } from '@/hooks/useOSStore';
import { Activity, Shield, Zap, Cpu, Settings, Globe } from 'lucide-react';

const IPMasterControl = memo(function IPMasterControl() {
  const { state, dispatch } = useOS();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', icon: <Activity size={16} />, label: 'Overview' },
    { id: 'performance', icon: <Zap size={16} />, label: 'Performance' },
    { id: 'security', icon: <Shield size={16} />, label: 'Security' },
  ];

  return (
    <div className="flex h-full bg-[rgba(20,20,20,0.6)] text-[#E0E0E0] select-none">
      <div className="w-48 border-r border-[rgba(255,255,255,0.08)] flex flex-col p-2 gap-1 bg-[rgba(10,10,10,0.5)]">
        <div className="px-3 py-4 mb-2">
          <h2 className="text-lg font-bold text-white tracking-widest" style={{ textShadow: '0 0 10px rgba(124, 77, 255, 0.8)' }}>IP LINUX</h2>
          <p className="text-[10px] text-[#9E9E9E] uppercase mt-1">Master Control</p>
        </div>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-[rgba(124,77,255,0.2)] text-[#7C4DFF] border border-[rgba(124,77,255,0.3)]'
                : 'text-[#9E9E9E] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#E0E0E0]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
        {activeTab === 'overview' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-2xl font-bold mb-6">System Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(30,30,30,0.4)]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[#9E9E9E]">CPU Usage</span>
                  <Cpu size={20} className="text-[#00BCD4]" />
                </div>
                <div className="text-3xl font-light">12%</div>
                <div className="w-full h-1 bg-[rgba(255,255,255,0.1)] rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-[#00BCD4] w-[12%]"></div>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(30,30,30,0.4)]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[#9E9E9E]">Memory</span>
                  <Activity size={20} className="text-[#7C4DFF]" />
                </div>
                <div className="text-3xl font-light">4.2 GB</div>
                <div className="w-full h-1 bg-[rgba(255,255,255,0.1)] rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-[#7C4DFF] w-[45%]"></div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-6 rounded-xl border border-[rgba(124,77,255,0.3)] bg-[rgba(124,77,255,0.05)]">
              <h4 className="text-lg font-semibold mb-2">Welcome to IP Linux 1.0</h4>
              <p className="text-sm text-[#9E9E9E] leading-relaxed">
                This is your new spectacular, personalized operating system environment. 
                Experience top-tier performance, deep customization, and visually stunning effects engineered exclusively for your daily workflows.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-2xl font-bold mb-6">Performance Matrix</h3>
            <p className="text-sm text-[#9E9E9E] mb-6">Fine-tune your IP Linux environment for maximum efficiency.</p>
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(30,30,30,0.4)] flex justify-between items-center">
                <div>
                  <h5 className="font-medium">Hardware Acceleration</h5>
                  <p className="text-xs text-[#9E9E9E]">Utilize GPU for rendering window effects and animations</p>
                </div>
                <div className="w-10 h-6 bg-[#7C4DFF] rounded-full relative shadow-[0_0_10px_rgba(124,77,255,0.5)]">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(30,30,30,0.4)] flex justify-between items-center">
                <div>
                  <h5 className="font-medium">Extreme Visuals</h5>
                  <p className="text-xs text-[#9E9E9E]">Enable spectacular background and blur effects</p>
                </div>
                <div className="w-10 h-6 bg-[#7C4DFF] rounded-full relative shadow-[0_0_10px_rgba(124,77,255,0.5)]">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-2xl font-bold mb-6">Security & Privacy</h3>
            <div className="p-8 rounded-xl border border-[rgba(76,175,80,0.3)] bg-[rgba(76,175,80,0.05)] flex flex-col items-center text-center">
              <Shield size={48} className="text-[#4CAF50] mb-4" />
              <h4 className="text-xl font-bold text-[#4CAF50]">System Secure</h4>
              <p className="text-sm text-[#9E9E9E] mt-2">IP Linux Defender is actively protecting your environment against malicious threats and telemetry.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default IPMasterControl;
