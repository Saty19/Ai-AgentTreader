import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Target, Zap, Edit, Play, Pause, Settings as SettingsIcon, Sliders } from 'lucide-react';
import { Card } from '../../../components/atoms/Card';
import { useStrategies } from '../api/useStrategies';
import { 
  useStrategies as useVisualStrategies,
  useDeployStrategy,
  useStopStrategy,
  useUpdateStrategy
} from '../../strategy-builder/api/queries';
import { Loader } from '../../../components/atoms/Loader';
import { StrategyConfigModal } from '../components/StrategyConfigModal';

export const StrategiesPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: strategies, isLoading } = useStrategies();
  const { data: visualStrategies, isLoading: isLoadingVisual } = useVisualStrategies();
  const deployStrategy = useDeployStrategy();
  const stopStrategy = useStopStrategy();
  const updateStrategy = useUpdateStrategy();

  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<any>(null);

  const handleToggleStatus = (e: React.MouseEvent, strategy: any) => {
    e.stopPropagation();
    // Only support visual strategies for now as they match the builder API
    if (strategy.type !== 'visual') return;

    if (strategy.status === 'Active' || strategy.status === 'ACTIVE') {
      stopStrategy.mutate(strategy.id);
    } else {
      // Use stored config if available
      const config = strategy.strategyDefinition?.metadata?.deploymentConfig;
      deployStrategy.mutate({ strategyId: strategy.id, config });
    }
  };

  const openConfig = (e: React.MouseEvent, strategy: any) => {
    e.stopPropagation();
    setSelectedStrategy(strategy);
    setConfigModalOpen(true);
  };

  const handleSaveConfig = async (config: any) => {
    if (!selectedStrategy) return;
    
    // Update strategy metadata with new config
    const definition = selectedStrategy.strategyDefinition || {};
    const metadata = definition.metadata || {};
    
    const newDefinition = {
        ...definition,
        metadata: {
            ...metadata,
            deploymentConfig: config
        }
    };

    try {
        await updateStrategy.mutateAsync({
            strategyId: selectedStrategy.id,
            request: { strategyDefinition: newDefinition }
        });
        setConfigModalOpen(false);
        setSelectedStrategy(null);
    } catch (err) {
        console.error("Failed to save config", err);
        alert("Failed to save configuration");
    }
  };


  if (isLoading || isLoadingVisual) return <div className="p-6"><Loader /></div>;

  const allStrategies = [
    ...(strategies || []).map(s => ({ ...s, type: 'registered', status: 'Active' })),
    ...(visualStrategies?.strategies || []).map(s => ({ 
      ...s, 
      type: 'visual', 
      status: (s as any).status || 'DRAFT' 
    })),
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Strategies</h1>
          <p className="text-slate-500 mt-1">Manage and monitor your trading strategies</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate('/strategies/settings')}
            className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <SettingsIcon className="w-4 h-4" />
            Configure Strategy
          </button>
          <button 
            onClick={() => navigate('/strategy-builder')}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Build Strategy
          </button>
        </div>
      </div>

      {allStrategies.length === 0 ? (
        <Card className="p-12 text-center">
          <Activity className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">No Strategies Yet</h3>
          <p className="text-slate-500 mb-6">Create your first trading strategy to get started</p>
          <button 
            onClick={() => navigate('/strategy-builder')}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors inline-flex items-center gap-2"
          >
            <Zap className="w-5 h-5" />
            Create Your First Strategy
          </button>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allStrategies.map((strategy: any, idx) => (
              <Card key={strategy.id || idx} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-lg bg-slate-50 text-primary-600">
                    <Activity className="w-6 h-6" />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    strategy.status === 'Active' || strategy.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {strategy.status}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{strategy.name}</h3>
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                  {strategy.description || 'No description available'}
                </p>
                
                <div className="space-y-2 text-sm mb-4">
                  {strategy.type === 'visual' && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Type:</span>
                      <span className="font-semibold text-slate-900">Visual Builder</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Indicators:</span>
                    <span className="font-semibold text-slate-900">
                      {strategy.indicators?.length || strategy.strategyDefinition?.blocks?.length || 0}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                  {strategy.type === 'visual' ? (
                    <button 
                      onClick={() => navigate(`/strategy-builder/${strategy.id}`)}
                      className="flex-1 px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </button>
                  ) : (
                    <button className="flex-1 px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                      View
                    </button>
                  )}
                  <button 
                    onClick={(e) => handleToggleStatus(e, strategy)}
                    disabled={strategy.type !== 'visual' || deployStrategy.isPending || stopStrategy.isPending}
                    className={`flex-1 px-3 py-2 text-sm text-white rounded-lg transition-colors flex items-center justify-center gap-1 ${
                      strategy.type !== 'visual' ? 'bg-slate-400 cursor-not-allowed' :
                      strategy.status === 'Active' || strategy.status === 'ACTIVE' 
                        ? 'bg-amber-600 hover:bg-amber-700' 
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {strategy.status === 'Active' || strategy.status === 'ACTIVE' ? (
                      <><Pause className="w-3 h-3" /> Pause</>
                    ) : (
                      <><Play className="w-3 h-3" /> Deploy</>
                    )}
                  </button>
                  {strategy.type === 'visual' && (
                    <button
                        onClick={(e) => openConfig(e, strategy)}
                        className="px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center"
                        title="Configure Deployment"
                    >
                        <Sliders className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-6 h-6 text-slate-400" />
              <h2 className="text-xl font-semibold text-slate-900">Strategy Performance</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-500 mb-1">Active Strategies</p>
                <p className="text-2xl font-bold text-slate-900">
                  {allStrategies.filter(s => s.status === 'Active' || s.status === 'ACTIVE').length}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-500 mb-1">Total Strategies</p>
                <p className="text-2xl font-bold text-slate-900">{allStrategies.length}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-500 mb-1">Avg Performance</p>
                <p className="text-2xl font-bold text-emerald-600">+12.5%</p>
              </div>
            </div>
          </Card>
          
          {selectedStrategy && (
            <StrategyConfigModal
                isOpen={configModalOpen}
                onClose={() => {
                    setConfigModalOpen(false);
                    setSelectedStrategy(null);
                }}
                onSave={handleSaveConfig}
                strategyName={selectedStrategy.name}
                initialConfig={selectedStrategy.strategyDefinition?.metadata?.deploymentConfig}
            />
          )}
        </>
      )}
    </div>
  );
};
