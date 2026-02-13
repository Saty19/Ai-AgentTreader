import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '../../../components/atoms/Button';
import { Input } from '../../../components/atoms/Input';

interface StrategyConfig {
  maxPositionSize: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  enablePaperTrading: boolean;
}

interface StrategyConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: StrategyConfig) => void;
  initialConfig?: Partial<StrategyConfig>;
  strategyName: string;
}

export const StrategyConfigModal: React.FC<StrategyConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialConfig,
  strategyName,
}) => {
  const [config, setConfig] = useState<StrategyConfig>({
    maxPositionSize: 1.0,
    stopLossPercent: 2.0,
    takeProfitPercent: 4.0,
    enablePaperTrading: true,
    ...initialConfig,
  });

  useEffect(() => {
    if (isOpen) {
        setConfig({
            maxPositionSize: 1.0,
            stopLossPercent: 2.0,
            takeProfitPercent: 4.0,
            enablePaperTrading: true,
            ...initialConfig,
        });
    }
  }, [isOpen, initialConfig]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(config);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Panel */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 z-10 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-slate-900">
            Configure {strategyName}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-500 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    Max Position Size (Units)
                </label>
                <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={config.maxPositionSize}
                    onChange={(e) => setConfig({ ...config, maxPositionSize: parseFloat(e.target.value) })}
                    className="w-full"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Stop Loss (%)
                    </label>
                    <Input
                        type="number"
                        step="0.1"
                        min="0"
                        value={config.stopLossPercent}
                        onChange={(e) => setConfig({ ...config, stopLossPercent: parseFloat(e.target.value) })}
                        className="w-full"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Take Profit (%)
                    </label>
                    <Input
                        type="number"
                        step="0.1"
                        min="0"
                        value={config.takeProfitPercent}
                        onChange={(e) => setConfig({ ...config, takeProfitPercent: parseFloat(e.target.value) })}
                        className="w-full"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3 py-2">
                <input
                    type="checkbox"
                    id="paperTrading"
                    checked={config.enablePaperTrading}
                    onChange={(e) => setConfig({ ...config, enablePaperTrading: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
                <label htmlFor="paperTrading" className="text-sm text-slate-700 cursor-pointer select-none">
                    Enable Paper Trading (Simulation)
                </label>
            </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                Save Config
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
