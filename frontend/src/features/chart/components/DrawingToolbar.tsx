import React from 'react';
import { MousePointer2, Minus, PenTool, Eraser } from 'lucide-react';
import { useChartStore } from '../store/ChartContext';

export const DrawingToolbar: React.FC = () => {
    const { state, dispatch } = useChartStore();
    const { activeTool } = state;

    const tools = [
        { id: 'cursor', icon: MousePointer2 },
        // { id: 'trendline', icon: Minus, className: 'rotate-45' }, // Diagonal - complex to implement
        { id: 'horizontal', icon: Minus, title: 'Horizontal Line' },
        // { id: 'brush', icon: PenTool }, // complex
        // { id: 'eraser', icon: Eraser },
    ] as const;

    return (
        <div className="flex flex-col border-r border-slate-200 bg-white w-12 py-2 items-center space-y-2">
            {tools.map((tool) => (
                <button
                    key={tool.id}
                    onClick={() => dispatch({ type: 'SET_TOOL', payload: tool.id })}
                    className={`p-2 rounded hover:bg-slate-100 transition-colors ${
                        activeTool === tool.id ? 'text-blue-600 bg-blue-50' : 'text-slate-500'
                    } ${(tool as any).className || ''}`}
                    title={(tool as any).title || tool.id}
                >
                    <tool.icon size={20} />
                </button>
            ))}
             <div className="h-px w-8 bg-slate-200 my-2" />
             <button
                onClick={() => dispatch({ type: 'SET_TOOL', payload: 'eraser' })}
                className={`p-2 rounded hover:bg-slate-100 transition-colors ${
                        activeTool === 'eraser' ? 'text-blue-600 bg-blue-50' : 'text-slate-500'
                    }`}
                title="Eraser (Click drawing to remove)"
             >
                 <Eraser size={20} />
             </button>
        </div>
    );
};
