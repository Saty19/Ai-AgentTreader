import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/atoms/Card';
import { Button } from '../../../components/atoms/Button';
import { Input } from '../../../components/atoms/Input';
import { Loader } from '../../../components/atoms/Loader';
import { Settings, Save, RotateCcw } from 'lucide-react';
import { config } from '../../../config';

interface EMASettings {
  emaPeriods: { fast: number; medium: number; slow: number };
  angleThreshold: number;
  retestThresholdPercent: number;
  minCandleBodyPercent: number;
  riskRewardRatio: number;
  stopLossPercent: number;
}

export const StrategySettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<EMASettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/strategies/ema/settings`);
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    setMessage('');

    try {
      const response = await fetch(`${config.apiBaseUrl}/strategies/ema/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to save settings');

      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({
      emaPeriods: { fast: 5, medium: 26, slow: 150 },
      angleThreshold: 40,
      retestThresholdPercent: 0.5,
      minCandleBodyPercent: 0.3,
      riskRewardRatio: 2,
      stopLossPercent: 1.5,
    });
  };

  const updateSetting = (path: string, value: number) => {
    if (!settings) return;

    const keys = path.split('.');
    const newSettings = { ...settings };
    let current: any = newSettings;

    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    setSettings(newSettings);
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <Loader />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6">
        <Card className="p-6 text-center text-red-600">
          Failed to load strategy settings
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-8 h-8" />
            EMA Strategy Settings
          </h1>
          <p className="text-slate-500 mt-1">
            Configure the EMA Trend Follower strategy parameters
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleReset} variant="secondary">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {message && (
        <Card className={`p-4 ${message.includes('success') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* EMA Periods */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">EMA Periods</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Fast EMA Period
              </label>
              <Input
                type="number"
                min="1"
                max="50"
                value={settings.emaPeriods.fast}
                onChange={(e) => updateSetting('emaPeriods.fast', parseInt(e.target.value))}
              />
              <p className="text-xs text-slate-500 mt-1">Default: 5</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Medium EMA Period
              </label>
              <Input
                type="number"
                min="10"
                max="100"
                value={settings.emaPeriods.medium}
                onChange={(e) => updateSetting('emaPeriods.medium', parseInt(e.target.value))}
              />
              <p className="text-xs text-slate-500 mt-1">Default: 26</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Slow EMA Period
              </label>
              <Input
                type="number"
                min="50"
                max="300"
                value={settings.emaPeriods.slow}
                onChange={(e) => updateSetting('emaPeriods.slow', parseInt(e.target.value))}
              />
              <p className="text-xs text-slate-500 mt-1">Default: 150</p>
            </div>
          </div>
        </Card>

        {/* Signal Filters */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Signal Filters</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Angle Threshold (degrees)
              </label>
              <Input
                type="number"
                min="10"
                max="90"
                step="5"
                value={settings.angleThreshold}
                onChange={(e) => updateSetting('angleThreshold', parseFloat(e.target.value))}
              />
              <p className="text-xs text-slate-500 mt-1">
                Minimum angle for valid signal (Default: 40°)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Retest Threshold (%)
              </label>
              <Input
                type="number"
                min="0.1"
                max="2"
                step="0.1"
                value={settings.retestThresholdPercent}
                onChange={(e) => updateSetting('retestThresholdPercent', parseFloat(e.target.value))}
              />
              <p className="text-xs text-slate-500 mt-1">
                Price distance from EMA 26 for retest (Default: 0.5%)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Min Candle Body (%)
              </label>
              <Input
                type="number"
                min="0.1"
                max="2"
                step="0.1"
                value={settings.minCandleBodyPercent}
                onChange={(e) => updateSetting('minCandleBodyPercent', parseFloat(e.target.value))}
              />
              <p className="text-xs text-slate-500 mt-1">
                Minimum candle body for confirmation (Default: 0.3%)
              </p>
            </div>
          </div>
        </Card>

        {/* Risk Management */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Risk Management</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Risk-Reward Ratio
              </label>
              <Input
                type="number"
                min="1"
                max="5"
                step="0.5"
                value={settings.riskRewardRatio}
                onChange={(e) => updateSetting('riskRewardRatio', parseFloat(e.target.value))}
              />
              <p className="text-xs text-slate-500 mt-1">
                Take profit will be this multiple of stop loss (Default: 2)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Stop Loss (%)
              </label>
              <Input
                type="number"
                min="0.5"
                max="5"
                step="0.5"
                value={settings.stopLossPercent}
                onChange={(e) => updateSetting('stopLossPercent', parseFloat(e.target.value))}
              />
              <p className="text-xs text-slate-500 mt-1">
                Maximum percentage loss per trade (Default: 1.5%)
              </p>
            </div>
          </div>
        </Card>

{/* Strategy Info */}
        <Card className="p-6 bg-primary-50 border-primary-200">
          <h2 className="text-xl font-semibold text-primary-900 mb-4">Strategy Rules</h2>
          <div className="space-y-3 text-sm text-primary-800">
            <div>
              <strong>BUY Conditions:</strong>
              <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                <li>EMA {settings.emaPeriods.fast} &gt; EMA {settings.emaPeriods.medium} &gt; EMA {settings.emaPeriods.slow}</li>
                <li>Slope angle &gt; {settings.angleThreshold}°</li>
                <li>Price retest near EMA {settings.emaPeriods.medium} (±{settings.retestThresholdPercent}%)</li>
                <li>Bullish candle confirmation (&gt;{settings.minCandleBodyPercent}% body)</li>
              </ul>
            </div>
            <div>
              <strong>SELL Conditions:</strong>
              <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                <li>EMA {settings.emaPeriods.fast} &lt; EMA {settings.emaPeriods.medium} &lt; EMA {settings.emaPeriods.slow}</li>
                <li>Slope angle &lt; -{settings.angleThreshold}°</li>
                <li>Price retest near EMA {settings.emaPeriods.medium} (±{settings.retestThresholdPercent}%)</li>
                <li>Bearish candle confirmation (&gt;{settings.minCandleBodyPercent}% body)</li>
              </ul>
            </div>
            <div className="pt-2 border-t border-primary-300">
              <strong>Risk Management:</strong>
              <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                <li>Stop Loss: Previous swing or {settings.stopLossPercent}% from entry</li>
                <li>Take Profit: {settings.riskRewardRatio}x risk distance</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
