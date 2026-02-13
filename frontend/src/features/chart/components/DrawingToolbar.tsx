import React from 'react';
import { MousePointer2, Minus, PenTool, Eraser } from 'lucide-react';

export const DrawingToolbar: React.FC = () => {
    const tools = [
        { id: 'cursor', icon: MousePointer2 },
        { id: 'trendline', icon: Minus, className: 'rotate-45' }, // Diagonal line
        { id: 'horizontal', icon: Minus },
        { id: 'brush', icon: PenTool },
        { id: 'eraser', icon: Eraser },
    ];

    const [activeTool, setActiveTool] = React.useState('cursor');

    return (
        <div className="flex flex-col border-r border-slate-200 bg-white w-12 py-2 items-center space-y-2">
            {tools.map((tool) => (
                <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={`p-2 rounded hover:bg-slate-100 transition-colors ${
                        activeTool === tool.id ? 'text-blue-600 bg-blue-50' : 'text-slate-500'
                    } ${tool.className || ''}`}
                    title={tool.id}
                >
                    <tool.icon size={20} />
                </button>
            ))}
        </div>
    );
};
