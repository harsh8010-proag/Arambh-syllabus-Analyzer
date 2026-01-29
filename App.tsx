
import React, { useState, useRef, useEffect } from 'react';
import { analyzeSyllabus } from './services/geminiService';
import { AppState, ViewType, FileData, HistoryItem, AnalysisResult } from './types';
import AnalysisReport from './components/AnalysisReport';
import PlatformAssistant from './components/PlatformAssistant';
import atharv from './assets/atharw.png';
import harish from './assets/harish.jpeg';
import pawan from './assets/pawan.png';
import amitsir from './assets/amitsir.jpeg';
import bhosalemam from './assets/bhsalemam.jpg';


// Professional Icons
const FlameIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

const CameraIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
  </svg>
);

const PenIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const BookmarkIcon = ({ className, filled }: { className?: string, filled?: boolean }) => (
  <svg className={className} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
  </svg>
);

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const savedHistory = localStorage.getItem('arambh_history');
    return {
      currentView: 'home',
      isAnalyzing: false,
      error: null,
      result: null,
      selectedFile: null,
      textInput: '',
      history: savedHistory ? JSON.parse(savedHistory) : [],
    };
  });

  const [query, setQuery] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'bookmarks'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('arambh_history', JSON.stringify(state.history));
  }, [state.history]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result?.toString().split(',')[1];
      if (!base64) return;
      
      const fileData: FileData = {
        base64,
        mimeType: file.type,
        name: file.name,
        previewUrl: URL.createObjectURL(file)
      };

      setState(prev => ({ ...prev, selectedFile: fileData, error: null }));
    };
    reader.readAsDataURL(file);
  };

  const startAnalysis = async (customQuery: string = "") => {
    if (!state.selectedFile && !state.textInput.trim()) {
      setState(prev => ({ ...prev, error: "Please provide a document or syllabus text." }));
      return;
    }

    setState(prev => ({ ...prev, isAnalyzing: true, error: null, result: null }));
    try {
      const result = await analyzeSyllabus(state.selectedFile, state.textInput, customQuery);
      
      const now = new Date();
      const newItem: HistoryItem = {
        id: now.getTime().toString(),
        timestamp: now.getTime(),
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        name: state.selectedFile?.name || (state.textInput.slice(0, 30) + "..."),
        result,
        isBookmarked: false,
      };

      setState(prev => ({ 
        ...prev, 
        isAnalyzing: false, 
        result, 
        history: [newItem, ...prev.history] 
      }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isAnalyzing: false, error: err.message || "Protocol analysis failed.", result: null }));
    }
  };

  const setView = (view: ViewType) => setState(prev => ({ ...prev, currentView: view }));

  const resetAnalyzer = () => {
    setState(prev => ({ ...prev, selectedFile: null, textInput: '', result: null, error: null }));
    setQuery('');
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setState(prev => ({
      ...prev,
      history: prev.history.filter(item => item.id !== id)
    }));
  };

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setState(prev => ({
      ...prev,
      history: prev.history.map(item => 
        item.id === id ? { ...item, isBookmarked: !item.isBookmarked } : item
      )
    }));
  };

  const loadFromHistory = (item: HistoryItem) => {
    setState(prev => ({ ...prev, result: item.result, currentView: 'analyzer' }));
  };

  const renderHome = () => (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="bg-white rounded-[1.25rem] md:rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-6 ring-1 ring-slate-50">
        <div className="md:flex items-stretch">
          <div className="p-8 md:p-12 lg:p-16 md:w-3/5">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-[2px] w-6 bg-orange-600 rounded-full"></span>
              <span className="text-orange-600 font-bold uppercase tracking-[0.2em] text-[9px] md:text-[10px] font-heading">The Arambh Initiative</span>
            </div>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-6 leading-[1.1] tracking-tight font-heading">
              Forge Your <br /><span className="fire-text">Academic Path.</span>
            </h2>
            <p className="text-sm md:text-base text-slate-500 mb-8 leading-relaxed max-w-lg font-medium">
              High-precision roadmaps for your success through advanced syllabus intelligence.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-4">
              <button onClick={() => setView('analyzer')} className="fire-gradient text-white px-8 py-3.5 rounded-xl font-bold shadow-md hover:shadow-orange-400/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 font-heading uppercase text-xs tracking-widest">
                Start Analysis
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </button>
              <button onClick={() => setView('about')} className="bg-white text-slate-900 px-8 py-3.5 rounded-xl font-bold border border-slate-200 hover:border-orange-200 transition-all font-heading uppercase text-xs tracking-widest active:scale-95">
                Meet the Team
              </button>
            </div>
          </div>
          <div className="hidden md:flex md:w-2/5 fire-gradient p-10 items-center justify-center relative overflow-hidden">
             <div className="text-white text-center transform z-10">
                <FlameIcon className="w-24 h-24 md:w-40 md:h-40 drop-shadow-lg mb-4" />
                <div className="text-xl md:text-3xl font-extrabold uppercase tracking-[0.2em] font-heading">ARAMBH</div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalyzer = () => (
    <div className="animate-in fade-in duration-500">
      {!state.result && !state.isAnalyzing && (
        <div className="max-w-5xl mx-auto px-2">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 mb-2 font-heading tracking-tight">Intelligence Hub</h2>
            <p className="text-slate-500 text-sm md:text-base font-medium max-w-xl mx-auto">Upload documents or paste content for an instant breakdown.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8 items-stretch">
            {/* Visual Capture */}
            <div className="bg-white rounded-[1.25rem] shadow-sm p-6 md:p-8 border border-slate-100 flex flex-col ring-1 ring-slate-50 transition-all hover:shadow-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-heading">Scanner</h3>
                <span className="text-[9px] font-bold text-orange-500 uppercase tracking-widest">Ready</span>
              </div>
              
              {state.selectedFile ? (
                <div className="relative group rounded-xl overflow-hidden bg-slate-50 flex-1 flex flex-col items-center justify-center border border-slate-200">
                  <img src={state.selectedFile.previewUrl} className="max-h-56 w-full object-contain p-4" />
                  <button 
                    onClick={() => setState(prev => ({ ...prev, selectedFile: null }))}
                    className="absolute top-3 right-3 bg-slate-900/10 backdrop-blur text-white p-1.5 rounded-full hover:bg-red-600 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  <div className="p-4 bg-white w-full border-t border-slate-100">
                    <button 
                      onClick={() => startAnalysis(query)}
                      className="w-full fire-gradient text-white font-bold py-3.5 rounded-xl shadow-sm transition-all uppercase tracking-widest text-[11px] font-heading active:scale-95"
                    >
                      Process Analysis
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full flex-1 border border-dashed border-slate-300 rounded-xl bg-slate-50/30 hover:bg-orange-50/20 hover:border-orange-200 cursor-pointer transition-all group">
                  <div className="text-center p-6">
                    <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm group-hover:scale-110 transition-transform">
                      <CameraIcon className="w-5 h-5 text-slate-400 group-hover:text-orange-500" />
                    </div>
                    <p className="font-bold text-slate-800 font-heading text-sm">Upload Syllabus</p>
                    <p className="text-[9px] text-slate-400 uppercase font-bold mt-1">PDF / IMAGE</p>
                  </div>
                  <input ref={fileInputRef} type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />
                </label>
              )}
            </div>

            {/* Manual Input */}
            <div className="bg-white rounded-[1.25rem] shadow-sm p-6 md:p-8 border border-slate-100 flex flex-col ring-1 ring-slate-50 transition-all hover:shadow-md">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-heading">Dataset</h3>
                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Text Input</span>
               </div>
               <textarea 
                  value={state.textInput}
                  onChange={(e) => setState(prev => ({ ...prev, textInput: e.target.value }))}
                  placeholder="Paste syllabus text content here..."
                  className="w-full flex-1 min-h-[200px] md:min-h-[280px] bg-slate-50/50 border border-slate-200 rounded-xl p-5 text-sm font-medium focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 outline-none resize-none transition-all placeholder:text-slate-300 leading-relaxed"
               ></textarea>
               <button 
                  onClick={() => startAnalysis()}
                  disabled={!state.textInput.trim() && !state.selectedFile}
                  className={`mt-4 w-full font-bold py-3.5 rounded-xl transition-all uppercase tracking-widest text-[11px] font-heading active:scale-95 ${!state.textInput.trim() && !state.selectedFile ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
               >
                  Analyze Dataset
               </button>
            </div>
          </div>
        </div>
      )}

      {state.isAnalyzing && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-orange-600 rounded-full animate-spin mb-4"></div>
          <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest font-heading">Constructing Insights...</h3>
        </div>
      )}

      {state.error && (
        <div className="bg-white border border-red-100 p-6 rounded-xl text-red-900 mb-6 max-w-xl mx-auto shadow-sm animate-in slide-in-from-top-4">
          <p className="font-semibold text-slate-700 text-sm leading-relaxed">{state.error}</p>
          <button onClick={() => setState(prev => ({...prev, error: null}))} className="mt-4 text-[10px] font-bold uppercase tracking-widest text-red-700 bg-red-50 px-5 py-2 rounded-lg border border-red-100 transition-all">Retry Analysis</button>
        </div>
      )}

      {state.result && (
        <div className="animate-in fade-in duration-700">
          <div className="bg-white border border-slate-100 p-4 rounded-[1.25rem] mb-8 flex flex-col md:flex-row justify-between items-center no-print shadow-sm gap-4 ring-1 ring-slate-50">
            <div className="flex items-center gap-4">
               <div className="fire-gradient p-2.5 rounded-lg text-white shadow-sm">
                 <FlameIcon className="w-5 h-5" />
               </div>
               <div>
                  <p className="text-[8px] font-bold text-orange-600 uppercase tracking-[0.2em] font-heading">Protocol Output</p>
                  <p className="text-slate-900 font-bold text-sm md:text-base font-heading tracking-tight truncate max-w-[200px]">{state.selectedFile?.name || "Manual Data"}</p>
               </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button onClick={() => window.print()} className="flex-1 md:flex-none fire-gradient text-white px-6 py-2.5 rounded-lg font-bold shadow-sm transition-all uppercase text-[10px] tracking-widest font-heading active:scale-95">PDF Export</button>
              <button onClick={resetAnalyzer} className="flex-1 md:flex-none bg-slate-50 text-slate-800 px-6 py-2.5 rounded-lg font-bold border border-slate-200 hover:bg-slate-100 transition-all uppercase text-[10px] tracking-widest font-heading active:scale-95">New Analysis</button>
            </div>
          </div>
          <AnalysisReport data={state.result} />
        </div>
      )}
    </div>
  );

  const renderHistory = () => {
    const filteredHistory = historyFilter === 'all' 
      ? state.history 
      : state.history.filter(item => item.isBookmarked);

    return (
      <div className="animate-in fade-in duration-500 max-w-5xl mx-auto px-2">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 mb-4 font-heading tracking-tight">Archives</h2>
          <div className="inline-flex bg-slate-100 p-1 rounded-xl mb-8">
            <button 
              onClick={() => setHistoryFilter('all')}
              className={`px-6 py-1.5 rounded-lg font-bold uppercase text-[9px] tracking-widest transition-all ${historyFilter === 'all' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400'}`}
            >
              All Records
            </button>
            <button 
              onClick={() => setHistoryFilter('bookmarks')}
              className={`px-6 py-1.5 rounded-lg font-bold uppercase text-[9px] tracking-widest transition-all ${historyFilter === 'bookmarks' ? 'bg-white shadow-sm text-red-600' : 'text-slate-400'}`}
            >
              Bookmarks
            </button>
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-[1.25rem] p-12 text-center shadow-sm">
            <p className="text-slate-400 text-sm font-medium">No archived analyses found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHistory.map((item) => (
              <div 
                key={item.id} 
                onClick={() => loadFromHistory(item)}
                className="bg-white rounded-[1.25rem] p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-pointer ring-1 ring-slate-50"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="fire-gradient p-1.5 rounded text-white">
                    <FlameIcon className="w-4 h-4" />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={(e) => toggleBookmark(item.id, e)} className={`p-1.5 rounded transition-all ${item.isBookmarked ? 'text-red-600' : 'text-slate-300 hover:text-red-400'}`}>
                      <BookmarkIcon className="w-3.5 h-3.5" filled={item.isBookmarked} />
                    </button>
                    <button onClick={(e) => deleteHistoryItem(item.id, e)} className="p-1.5 rounded text-slate-300 hover:text-red-600">
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 text-[14px] mb-2 line-clamp-1 leading-tight">{item.name}</h3>
                <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-50 pt-3 flex gap-2">
                  {item.date} • {item.time}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderAbout = () => {
    const team = [
      {
  name: "S. Bhosle",
  role: "Head of Department (HOD)",
  College: "Shivchhatrapati College",
  img: bhosalemam,
  desc: "S. Bhosle Ma’am is a humble and supportive leader who encouraged our initiative from the beginning. She granted permissions, provided access to college resources, and inspired us to build innovative projects for student growth."
},
{
  name: "Amit Yelekar",
  role: "Technical Head",
  College: "Shivchhatrapati College",
  img:amitsir ,
  desc: "Amit Yelekar Sir has been a strong technical backbone for the ARAMBH Group. He consistently guides our team, provides technical support whenever needed, and motivates students to apply practical knowledge beyond the classroom."
},
      { name: "Harish Wavre", role: "Founder & Full-Stack Developer",College: 'Shivchhatrapati College', img: harish, desc: "Founder of ARAMBH Group, focused on building platforms that simplify education and innovation." },
      { name: "Atharv Pawar", role: "(CEO)", img: atharv,College: 'Shivchhatrapati College', desc: "Actively learning and contributing to frontend development and collaborative environments." },
      { name: "Pawan Dhoke", role: "Community Member", img: pawan, College: 'Shivchhatrapati College', desc: "Strengthening peer-to-peer learning through active involvement and support." }
    ];

    return (
      <div className="animate-in fade-in duration-700 max-w-5xl mx-auto  ">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 mb-2 font-heading tracking-tight">Our Core Team</h2>
          <p className="text-sm md:text-base text-slate-500 font-medium max-w-xl mx-auto text-red-700">Empowering students through technology and collaboration.</p>
           <p className="text-sm md:text-base text-slate-500 font-medium max-w-xl mx-auto">Shivchhatrapati College has played a vital role in shaping our learning journey by providing continuous guidance, encouragement, and technical support.</p>
            <p className="text-sm md:text-base text-slate-500 font-medium max-w-xl mx-auto">The institution’s supportive environment and access to resources have empowered the <spam className='text-orange-500 font-bold'>ARAMBH</spam>  Group to explore, build, and innovate with confidence.</p>
         
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {team.map((member, idx) => (
            <div key={idx} className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm hover:-translate-y-1 transition-all duration-300 ring-1 ring-slate-50 flex flex-col group text-center">
               <img src={member.img} alt={member.name} className="w-20 h-20 rounded-full border-2 border-slate-50 mx-auto mb-4 grayscale group-hover:grayscale-0 transition-all" />
               <h3 className="text-lg font-bold text-slate-900 mb-1 font-heading">{member.name}</h3>
               <p className="text-orange-600 font-bold uppercase tracking-widest text-[9px] mb-3">{member.role}</p>
               
               <p className="text-slate-500 text-[13px] leading-relaxed font-medium">{member.desc}</p>
               
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderContact = () => (
    <div className="animate-in fade-in duration-500 bg-white p-10 md:p-16 rounded-[1.5rem] shadow-sm border border-slate-50 max-w-3xl mx-auto text-center ring-1 ring-slate-100">
      <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 mb-4 uppercase tracking-tighter font-heading">Initiate Contact</h2>
      <p className="text-sm text-slate-500 mb-8 max-w-lg mx-auto font-medium">Questions regarding our infrastructure? Our mentors are ready to respond.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-100">
          <h4 className="font-bold text-orange-600 mb-1 uppercase text-[9px] tracking-widest font-heading">Direct Email</h4>
          <p className="text-slate-900 font-bold text-sm md:text-base">arambh112@gmail.com</p>
        </div>
        <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-100">
          <h4 className="font-bold text-red-600 mb-1 uppercase text-[9px] tracking-widest font-heading">Instagram</h4>
          <p className="text-slate-900 font-bold text-sm md:text-base">arambh_group112</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col">
      <nav className="bg-white/95 backdrop-blur-2xl border-b border-slate-100 sticky top-0 z-40 no-print shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('home')}>
            <div className="fire-gradient p-2 rounded-lg text-white shadow-sm">
              <FlameIcon className="w-6 h-6" />
            </div>
            <h1 className="text-lg md:text-xl font-extrabold tracking-tighter text-slate-900 font-heading uppercase">ARAMBH</h1>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 md:gap-10 font-bold text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-slate-900 font-heading">
            {[
              { id: 'home', label: 'Home' },
              { id: 'analyzer', label: 'Scanner' },
              { id: 'history', label: 'Archives' },
              { id: 'about', label: 'Team' },
              { id: 'contact', label: 'Connect' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setView(tab.id as ViewType)} className={`transition-all py-1 border-b-2 ${state.currentView === tab.id ? 'text-red-600 border-red-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-6 md:py-8">
        {state.currentView === 'home' && renderHome()}
        {state.currentView === 'analyzer' && renderAnalyzer()}
        {state.currentView === 'history' && renderHistory()}
        {state.currentView === 'about' && renderAbout()}
        {state.currentView === 'contact' && renderContact()}
      </main>

      <footer className="bg-white border-t border-slate-100 py-8 text-center text-slate-400 no-print">
        <p className="font-bold uppercase tracking-[0.2em] text-[9px] font-heading">© Arambh Educational Group • Strategic Intelligence Infrastructure</p>
      </footer>

      <PlatformAssistant />
    </div>
  );
};

export default App;
