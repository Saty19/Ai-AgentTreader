import type { BlockTemplate } from '../../types/blocks';
import { BlockType, BlockCategory, DataType } from '../../types/blocks';

export const SignalOutputBlockTemplate: BlockTemplate = {
  type: BlockType.SIGNAL_OUTPUT,
  category: BlockCategory.OUTPUTS,
  name: 'Signal Output',
  description: 'Outputs trading signals for external systems or logging',
  icon: '📡',
  inputs: [
    {
      name: 'Signal',
      dataType: DataType.SIGNAL,
      required: true,
      description: 'Trading signal to output'
    },
    {
      name: 'Confidence',
      dataType: DataType.NUMBER,
      required: false,
      description: 'Signal confidence level (0-1)'
    },
    {
      name: 'Metadata',
      dataType: DataType.STRING,
      required: false,
      description: 'Additional signal metadata'
    }
  ],
  outputs: [],
  properties: [
    {
      name: 'outputFormat',
      type: 'select',
      required: true,
      options: [
        { label: 'JSON', value: 'json' },
        { label: 'CSV', value: 'csv' },
        { label: 'XML', value: 'xml' },
        { label: 'Custom', value: 'custom' }
      ],
      description: 'Output format for signals'
    },
    {
      name: 'destination',
      type: 'select',
      required: true,
      options: [
        { label: 'Console Log', value: 'console' },
        { label: 'File Export', value: 'file' },
        { label: 'Webhook', value: 'webhook' },
        { label: 'Database', value: 'database' },
        { label: 'WebSocket', value: 'websocket' }
      ],
      description: 'Where to send the signals'
    },
    {
      name: 'webhookUrl',
      type: 'string',
      required: false,
      description: 'Webhook URL (if destination is webhook)'
    },
    {
      name: 'includeTimestamp',
      type: 'boolean',
      required: false,
      description: 'Include timestamp in output'
    },
    {
      name: 'bufferSize',
      type: 'number',
      required: false,
      min: 1,
      max: 1000,
      step: 1,
      description: 'Number of signals to buffer before sending'
    }
  ],
  defaultSize: { width: 180, height: 120 },
  implementation: `
    class SignalOutputManager {
      private outputFormat: string;
      private destination: string;
      private webhookUrl?: string;
      private includeTimestamp: boolean;
      private bufferSize: number;
      private signalBuffer: any[] = [];
      
      constructor(config: any) {
        this.outputFormat = config.outputFormat;
        this.destination = config.destination;
        this.webhookUrl = config.webhookUrl;
        this.includeTimestamp = config.includeTimestamp || true;
        this.bufferSize = config.bufferSize || 1;
      }
      
      output(signal: any, confidence?: number, metadata?: string): void {
        const signalData = {
          signal: signal,
          confidence: confidence || 1.0,
          metadata: metadata || '',
          ...(this.includeTimestamp && { timestamp: new Date().toISOString() })
        };
        
        this.signalBuffer.push(signalData);
        
        if (this.signalBuffer.length >= this.bufferSize) {
          this.flushBuffer();
        }
      }
      
      private flushBuffer(): void {
        if (this.signalBuffer.length === 0) return;
        
        const formattedData = this.formatData(this.signalBuffer);
        this.sendToDestination(formattedData);
        this.signalBuffer = [];
      }
      
      private formatData(signals: any[]): string {
        switch (this.outputFormat) {
          case 'json':
            return JSON.stringify(signals, null, 2);
          case 'csv':
            return this.formatAsCSV(signals);
          case 'xml':
            return this.formatAsXML(signals);
          case 'custom':
            return this.formatAsCustom(signals);
          default:
            return JSON.stringify(signals);
        }
      }
      
      private formatAsCSV(signals: any[]): string {
        if (signals.length === 0) return '';
        
        const headers = Object.keys(signals[0]);
        const csvHeaders = headers.join(',');
        const csvRows = signals.map(signal => 
          headers.map(header => signal[header] || '').join(',')
        );
        
        return [csvHeaders, ...csvRows].join('\\n');
      }
      
      private formatAsXML(signals: any[]): string {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\\n<signals>\\n';
        signals.forEach((signal, index) => {
          xml += \`  <signal id="\${index}">\\n\`;
          Object.entries(signal).forEach(([key, value]) => {
            xml += \`    <\${key}>\${value}</\${key}>\\n\`;
          });
          xml += '  </signal>\\n';
        });
        xml += '</signals>';
        return xml;
      }
      
      private formatAsCustom(signals: any[]): string {
        // Custom format implementation
        return signals.map(signal => 
          \`[\${signal.timestamp}] \${signal.signal.type}: \${signal.confidence}\`
        ).join('\\n');
      }
      
      private sendToDestination(data: string): void {
        switch (this.destination) {
          case 'console':
            console.log('Signal Output:', data);
            break;
          case 'file':
            this.saveToFile(data);
            break;
          case 'webhook':
            this.sendToWebhook(data);
            break;
          case 'database':
            this.saveToDatabase(data);
            break;
          case 'websocket':
            this.sendToWebSocket(data);
            break;
        }
      }
      
      private saveToFile(data: string): void {
        // Implementation would depend on environment (browser/node)
        console.log('Saving to file:', data);
      }
      
      private sendToWebhook(data: string): void {
        if (!this.webhookUrl) return;
        
        fetch(this.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: data
        }).catch(error => console.error('Webhook error:', error));
      }
      
      private saveToDatabase(data: string): void {
        // Database save implementation
        console.log('Saving to database:', data);
      }
      
      private sendToWebSocket(data: string): void {
        // WebSocket send implementation
        console.log('Sending to WebSocket:', data);
      }
      
      forceFlush(): void {
        this.flushBuffer();
      }
      
      reset(): void {
        this.signalBuffer = [];
      }
    }
  `
};

export const LogOutputBlockTemplate: BlockTemplate = {
  type: BlockType.LOG_OUTPUT,
  category: BlockCategory.OUTPUTS,
  name: 'Log Output',
  description: 'Logs data for debugging and monitoring purposes',
  icon: '📝',
  inputs: [
    {
      name: 'Data',
      dataType: DataType.ANY,
      required: true,
      description: 'Data to log'
    },
    {
      name: 'Level',
      dataType: DataType.STRING,
      required: false,
      description: 'Log level (optional)'
    }
  ],
  outputs: [],
  properties: [
    {
      name: 'logLevel',
      type: 'select',
      required: true,
      options: [
        { label: 'Debug', value: 'debug' },
        { label: 'Info', value: 'info' },
        { label: 'Warning', value: 'warning' },
        { label: 'Error', value: 'error' }
      ],
      description: 'Default log level'
    },
    {
      name: 'prefix',
      type: 'string',
      required: false,
      description: 'Prefix to add to all log messages'
    },
    {
      name: 'includeTimestamp',
      type: 'boolean',
      required: false,
      description: 'Include timestamp in log messages'
    },
    {
      name: 'logToConsole',
      type: 'boolean',
      required: false,
      description: 'Output to browser console'
    },
    {
      name: 'logToFile',
      type: 'boolean',
      required: false,
      description: 'Save to log file'
    },
    {
      name: 'maxLogSize',
      type: 'number',
      required: false,
      min: 100,
      max: 10000,
      step: 100,
      description: 'Maximum number of log entries to keep'
    }
  ],
  defaultSize: { width: 160, height: 100 },
  implementation: `
    class LogOutputManager {
      private logLevel: string;
      private prefix?: string;
      private includeTimestamp: boolean;
      private logToConsole: boolean;
      private logToFile: boolean;
      private maxLogSize: number;
      private logEntries: any[] = [];
      
      constructor(config: any) {
        this.logLevel = config.logLevel;
        this.prefix = config.prefix;
        this.includeTimestamp = config.includeTimestamp || true;
        this.logToConsole = config.logToConsole !== false;
        this.logToFile = config.logToFile || false;
        this.maxLogSize = config.maxLogSize || 1000;
      }
      
      log(data: any, customLevel?: string): void {
        const level = customLevel || this.logLevel;
        
        const logEntry = {
          level: level,
          data: data,
          ...(this.includeTimestamp && { timestamp: new Date().toISOString() }),
          ...(this.prefix && { prefix: this.prefix })
        };
        
        this.addToLogBuffer(logEntry);
        
        if (this.logToConsole) {
          this.outputToConsole(logEntry);
        }
        
        if (this.logToFile) {
          this.outputToFile(logEntry);
        }
      }
      
      private addToLogBuffer(entry: any): void {
        this.logEntries.push(entry);
        
        // Maintain max log size
        if (this.logEntries.length > this.maxLogSize) {
          this.logEntries.shift();
        }
      }
      
      private outputToConsole(entry: any): void {
        const message = this.formatLogMessage(entry);
        
        switch (entry.level) {
          case 'debug':
            console.debug(message);
            break;
          case 'info':
            console.info(message);
            break;
          case 'warning':
            console.warn(message);
            break;
          case 'error':
            console.error(message);
            break;
          default:
            console.log(message);
        }
      }
      
      private outputToFile(entry: any): void {
        // File output implementation would depend on environment
        console.log('File log:', this.formatLogMessage(entry));
      }
      
      private formatLogMessage(entry: any): string {
        let message = '';
        
        if (entry.timestamp) {
          message += \`[\${entry.timestamp}] \`;
        }
        
        message += \`[\${entry.level.toUpperCase()}] \`;
        
        if (entry.prefix) {
          message += \`[\${entry.prefix}] \`;
        }
        
        message += typeof entry.data === 'object' 
          ? JSON.stringify(entry.data) 
          : String(entry.data);
        
        return message;
      }
      
      getLogEntries(): any[] {
        return [...this.logEntries];
      }
      
      clearLogs(): void {
        this.logEntries = [];
      }
      
      reset(): void {
        // Keep logs but don't clear them automatically
      }
    }
  `
};

// Export all output block templates
export const OutputBlocks: BlockTemplate[] = [
  SignalOutputBlockTemplate,
  LogOutputBlockTemplate
];