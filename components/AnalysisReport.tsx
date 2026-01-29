
import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { explainTopic } from '../services/geminiService';

interface Props {
  data: AnalysisResult;
}

interface TopicItemProps {
  topic: string;
  colorClass: string;
  subjectName: string;
  isActive: boolean;
  onTopicClick: (topic: string, subject: string) => void;
  explanation: { content: string | null; isLoading: boolean } | null;
}

const TopicItem = ({ 
  topic, 
  colorClass, 
  subjectName, 
  isActive, 
  onTopicClick, 
  explanation 
}: TopicItemProps) => {
  const itemClasses = "list-none mb-2 p-3 rounded-xl transition-all border border-transparent cursor-pointer group flex flex-col " + 
    (isActive ? "bg-orange-50/50 border-orange-100" : "hover:bg-slate-50 hover:border-slate-100");

  const iconClasses = "w-4 h-4 mt-0.5 transition-all flex-shrink-0 " + 
    (isActive ? "rotate-180 text-orange-600" : "text-slate-300 group-hover:text-slate-500");

  return (
    <li onClick={() => onTopicClick(topic, subjectName)} className={itemClasses}>
      <div className="flex items-start gap-3">
        <span className={`${colorClass} font-bold mt-0.5 group-hover:scale-125 transition-transform`}>•</span>
        <span className="flex-1 text-[14px] md:text-[15px] font-semibold text-slate-700 leading-snug">{topic}</span>
        <svg className={iconClasses} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {isActive && (
        <div className="mt-4 pl-4 border-l-2 border-orange-200 animate-in slide-in-from-top-2 fade-in duration-300">
          {explanation?.isLoading ? (
            <div className="flex items-center gap-2 py-2">
              <div className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            </div>
          ) : (
            <div className="text-slate-600 text-[13px] md:text-[14px] leading-relaxed whitespace-pre-wrap font-medium pb-2">
              {explanation?.content || "No explanation available."}
            </div>
          )}
        </div>
      )}
    </li>
  );
};

const AnalysisReport: React.FC<Props> = ({ data }) => {
  const [activeExplanation, setActiveExplanation] = useState<{ topic: string, content: string | null, isLoading: boolean } | null>(null);

  const handleTopicClick = async (topic: string, subjectName: string) => {
    if (activeExplanation?.topic === topic) {
      setActiveExplanation(null);
      return;
    }

    setActiveExplanation({ topic, content: null, isLoading: true });
    try {
      const explanation = await explainTopic(topic, subjectName);
      setActiveExplanation({ topic, content: explanation, isLoading: false });
    } catch (err) {
      setActiveExplanation({ topic, content: "Error generating content. Please retry.", isLoading: false });
    }
  };

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700 max-w-[1400px] mx-auto">
      {data.subjects.map((subject, sIdx) => (
        <section key={sIdx} className="bg-white border border-slate-100 rounded-[1.25rem] md:rounded-[2rem] shadow-sm overflow-hidden p-6 md:p-10 printable-content ring-1 ring-slate-50">
          <div className="flex items-center justify-between gap-4 mb-6 md:mb-8 pb-4 border-b border-slate-50">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-heading tracking-tight">
              Subject: {subject.subjectName}
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Section {sIdx + 1}</span>
          </div>
          
          <div className="space-y-8 md:space-y-12">
            {subject.units.map((unit, uIdx) => (
              <div key={uIdx}>
                <div className="flex items-center gap-4 mb-4 md:mb-6">
                  <span className="fire-gradient text-white w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center font-heading font-bold text-sm md:text-lg">
                    {uIdx + 1}
                  </span>
                  <h3 className="text-base md:text-xl font-bold text-slate-800 font-heading tracking-tight">
                    {unit.unitName}
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  {/* High Intensity */}
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/60 border-t-2 border-t-red-500">
                    <h4 className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-4 font-heading">High Intensity</h4>
                    <ul className="m-0 p-0">
                      {unit.veryImportant.map((item, i) => (
                        <TopicItem 
                          key={i} 
                          topic={item} 
                          colorClass="text-red-500" 
                          subjectName={subject.subjectName}
                          isActive={activeExplanation?.topic === item}
                          onTopicClick={handleTopicClick}
                          explanation={activeExplanation?.topic === item ? activeExplanation : null}
                        />
                      ))}
                    </ul>
                  </div>

                  {/* Core pillars */}
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/60 border-t-2 border-t-orange-500">
                    <h4 className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-4 font-heading">Core Pillars</h4>
                    <ul className="m-0 p-0">
                      {unit.important.map((item, i) => (
                        <TopicItem 
                          key={i} 
                          topic={item} 
                          colorClass="text-orange-500" 
                          subjectName={subject.subjectName}
                          isActive={activeExplanation?.topic === item}
                          onTopicClick={handleTopicClick}
                          explanation={activeExplanation?.topic === item ? activeExplanation : null}
                        />
                      ))}
                    </ul>
                  </div>

                  {/* Supportive */}
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/60 border-t-2 border-t-slate-400">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 font-heading">Supportive</h4>
                    <ul className="m-0 p-0">
                      {unit.optional.map((item, i) => (
                        <TopicItem 
                          key={i} 
                          topic={item} 
                          colorClass="text-slate-400" 
                          subjectName={subject.subjectName}
                          isActive={activeExplanation?.topic === item}
                          onTopicClick={handleTopicClick}
                          explanation={activeExplanation?.topic === item ? activeExplanation : null}
                        />
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Focus Matrix Card */}
      <section className="bg-slate-900 text-white rounded-[1.25rem] md:rounded-[2rem] shadow-lg p-6 md:p-10 relative overflow-hidden">
        <h2 className="text-lg md:text-2xl font-bold mb-6 font-heading tracking-tight">Neural Focus Matrix</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.examFocusPoints.map((point, i) => (
            <div key={i} className="flex items-start bg-white/5 p-4 rounded-xl border border-white/10 text-slate-300 text-sm md:text-base font-medium">
              <span className="text-orange-500 mr-3 font-bold">•</span>
              {point}
            </div>
          ))}
        </div>
      </section>

      {/* Protocol Card */}
      <section className="bg-white border border-slate-200 rounded-[1.25rem] md:rounded-[2rem] p-6 md:p-10 shadow-sm">
        <h2 className="text-lg md:text-2xl font-bold text-slate-900 mb-8 font-heading">Mastery Protocol</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-[10px] font-bold text-orange-600 mb-6 uppercase tracking-widest font-heading">Strategic Phases</h3>
            <div className="space-y-4 relative pl-8">
              <div className="absolute left-[11px] top-0 bottom-0 w-[1px] bg-slate-100"></div>
              {data.suggestedStudyPlan.steps.map((step, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-8 top-1.5 w-4 h-4 rounded-full bg-white border-2 border-orange-600 z-10"></div>
                  <p className="text-slate-700 text-sm md:text-base font-semibold">{step}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h3 className="text-[10px] font-bold text-slate-900 mb-4 uppercase tracking-widest font-heading">Execution Order</h3>
            <div className="space-y-2">
              {data.suggestedStudyPlan.recommendedOrder.map((item, i) => (
                <div key={i} className="flex gap-3 text-slate-800 text-sm md:text-base font-bold items-center bg-white p-3 rounded-lg border border-slate-100">
                  <span className="bg-orange-600 w-6 h-6 rounded flex-shrink-0 flex items-center justify-center text-[10px] text-white font-bold">{i + 1}</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AnalysisReport;
