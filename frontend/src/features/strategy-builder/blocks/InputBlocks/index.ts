import type { BlockTemplate } from '../../types/blocks';
import { BlockType, BlockCategory, DataType } from '../../types/blocks';

export const MarketDataBlockTemplate: BlockTemplate = {
  type: BlockType.MARKET_DATA,
  category: BlockCategory.INPUT,
  name: 'Market Data',
  description: 'Provides real-time market data (OHLCV)',
  icon: '💹',
  inputs: [],
  outputs: [
    {
      name: 'Open',
      dataType: DataType.NUMBER,
      description: 'Opening price'
    },
    {
      name: 'High',
      dataType: DataType.NUMBER,
      description: 'High price'
    },
    {
      name: 'Low',
      dataType: DataType.NUMBER,
      description: 'Low price'
    },
    {
      name: 'Close',
      dataType: DataType.NUMBER,
      description: 'Closing price'
    },
    {
      name: 'Volume',
      dataType: DataType.NUMBER,
      description: 'Trading volume'
    },
    {
      name: 'Candle',
      dataType: DataType.CANDLE,
      description: 'Complete candle data'
    }
  ],
  properties: [
    {
      name: 'symbol',
      type: 'select',
      required: true,
      options: [
        { label: 'BTC/USD', value: 'BTCUSD' },
        { label: 'ETH/USD', value: 'ETHUSD' },
        { label: 'SPY', value: 'SPY' },
        { label: 'AAPL', value: 'AAPL' },
        { label: 'TSLA', value: 'TSLA' }
      ],
      description: 'Trading symbol'
    },
    {
      name: 'timeframe',
      type: 'select',
      required: true,
      options: [
        { label: '1 minute', value: '1m' },
        { label: '5 minutes', value: '5m' },
        { label: '15 minutes', value: '15m' },
        { label: '1 hour', value: '1h' },
        { label: '4 hours', value: '4h' },
        { label: '1 day', value: '1d' }
      ],
      description: 'Chart timeframe'
    }
  ],
  defaultSize: { width: 200, height: 180 },
  implementation: `
    class MarketDataProvider {
      private symbol: string;
      private timeframe: string;
      private currentCandle: any = null;
      
      constructor(symbol: string, timeframe: string) {
        this.symbol = symbol;
        this.timeframe = timeframe;
      }
      
      update(marketData: any): any {
        this.currentCandle = marketData;
        return {
          open: marketData.open,
          high: marketData.high,
          low: marketData.low,
          close: marketData.close,
          volume: marketData.volume,
          candle: marketData
        };
      }
      
      getCurrentCandle(): any {
        return this.currentCandle;
      }
      
      reset(): void {
        this.currentCandle = null;
      }
    }
  `
};

export const ParameterBlockTemplate: BlockTemplate = {
  type: BlockType.PARAMETER,
  category: BlockCategory.INPUT,
  name: 'Parameter',
  description: 'Configurable parameter input for strategy tuning',
  icon: '⚙️',
  inputs: [],
  outputs: [
    {
      name: 'Value',
      dataType: DataType.ANY,
      description: 'Parameter value'
    }
  ],
  properties: [
    {
      name: 'parameterName',
      type: 'string',
      required: true,
      description: 'Name of the parameter'
    },
    {
      name: 'dataType',
      type: 'select',
      required: true,
      options: [
        { label: 'Number', value: 'number' },
        { label: 'Boolean', value: 'boolean' },
        { label: 'String', value: 'string' }
      ],
      description: 'Data type of the parameter'
    },
    {
      name: 'defaultValue',
      type: 'string',
      required: true,
      description: 'Default value for the parameter'
    },
    {
      name: 'minValue',
      type: 'number',
      required: false,
      description: 'Minimum value (for numbers)'
    },
    {
      name: 'maxValue',
      type: 'number',
      required: false,
      description: 'Maximum value (for numbers)'
    }
  ],
  defaultSize: { width: 160, height: 140 },
  implementation: `
    class ParameterProvider {
      private name: string;
      private value: any;
      private dataType: string;
      
      constructor(name: string, defaultValue: any, dataType: string) {
        this.name = name;
        this.dataType = dataType;
        this.value = this.parseValue(defaultValue, dataType);
      }
      
      private parseValue(value: any, type: string): any {
        switch (type) {
          case 'number':
            return parseFloat(value) || 0;
          case 'boolean':
            return value === 'true' || value === true;
          case 'string':
            return String(value);
          default:
            return value;
        }
      }
      
      getValue(): any {
        return this.value;
      }
      
      setValue(newValue: any): void {
        this.value = this.parseValue(newValue, this.dataType);
      }
      
      reset(): void {
        // Parameters don't need reset as they maintain their configuration
      }
    }
  `
};

export const TimeConditionBlockTemplate: BlockTemplate = {
  type: BlockType.TIME_CONDITION,
  category: BlockCategory.INPUT,
  name: 'Time Condition',
  description: 'Triggers based on time conditions (market hours, specific times)',
  icon: '⏰',
  inputs: [],
  outputs: [
    {
      name: 'Is Active',
      dataType: DataType.BOOLEAN,
      description: 'True when time condition is met'
    }
  ],
  properties: [
    {
      name: 'conditionType',
      type: 'select',
      required: true,
      options: [
        { label: 'Market Hours', value: 'market_hours' },
        { label: 'Specific Time', value: 'specific_time' },
        { label: 'Time Range', value: 'time_range' },
        { label: 'Day of Week', value: 'day_of_week' }
      ],
      description: 'Type of time condition'
    },
    {
      name: 'startTime',
      type: 'string',
      required: false,
      description: 'Start time (HH:MM format)'
    },
    {
      name: 'endTime',
      type: 'string',
      required: false,
      description: 'End time (HH:MM format)'
    },
    {
      name: 'daysOfWeek',
      type: 'multiselect',
      required: false,
      options: [
        { label: 'Monday', value: 1 },
        { label: 'Tuesday', value: 2 },
        { label: 'Wednesday', value: 3 },
        { label: 'Thursday', value: 4 },
        { label: 'Friday', value: 5 },
        { label: 'Saturday', value: 6 },
        { label: 'Sunday', value: 0 }
      ],
      description: 'Days of the week when condition is active'
    },
    {
      name: 'timezone',
      type: 'select',
      required: true,
      options: [
        { label: 'UTC', value: 'UTC' },
        { label: 'EST', value: 'America/New_York' },
        { label: 'PST', value: 'America/Los_Angeles' },
        { label: 'GMT', value: 'Europe/London' },
        { label: 'JST', value: 'Asia/Tokyo' }
      ],
      description: 'Timezone for time calculations'
    }
  ],
  defaultSize: { width: 180, height: 160 },
  implementation: `
    class TimeConditionChecker {
      private conditionType: string;
      private startTime?: string;
      private endTime?: string;
      private daysOfWeek?: number[];
      private timezone: string;
      
      constructor(config: any) {
        this.conditionType = config.conditionType;
        this.startTime = config.startTime;
        this.endTime = config.endTime;
        this.daysOfWeek = config.daysOfWeek;
        this.timezone = config.timezone;
      }
      
      check(currentTime?: Date): boolean {
        const now = currentTime || new Date();
        
        switch (this.conditionType) {
          case 'market_hours':
            return this.isMarketHours(now);
          case 'specific_time':
            return this.isSpecificTime(now);
          case 'time_range':
            return this.isInTimeRange(now);
          case 'day_of_week':
            return this.isDayOfWeek(now);
          default:
            return true;
        }
      }
      
      private isMarketHours(date: Date): boolean {
        const day = date.getDay();
        const hour = date.getHours();
        // Simplified market hours: Mon-Fri, 9:30 AM - 4:00 PM EST
        return day >= 1 && day <= 5 && hour >= 9 && hour < 16;
      }
      
      private isSpecificTime(date: Date): boolean {
        if (!this.startTime) return false;
        const [hours, minutes] = this.startTime.split(':').map(Number);
        return date.getHours() === hours && date.getMinutes() === minutes;
      }
      
      private isInTimeRange(date: Date): boolean {
        if (!this.startTime || !this.endTime) return false;
        const [startH, startM] = this.startTime.split(':').map(Number);
        const [endH, endM] = this.endTime.split(':').map(Number);
        
        const currentMinutes = date.getHours() * 60 + date.getMinutes();
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        
        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
      }
      
      private isDayOfWeek(date: Date): boolean {
        if (!this.daysOfWeek || this.daysOfWeek.length === 0) return true;
        return this.daysOfWeek.includes(date.getDay());
      }
      
      reset(): void {
        // Time conditions don't need reset
      }
    }
  `
};

// Export all input block templates
export const InputBlocks: BlockTemplate[] = [
  MarketDataBlockTemplate,
  ParameterBlockTemplate,
  TimeConditionBlockTemplate
];