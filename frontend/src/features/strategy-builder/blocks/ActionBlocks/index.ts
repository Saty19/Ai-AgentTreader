import type { BlockTemplate } from '../../types/blocks';
import { BlockType, BlockCategory, DataType } from '../../types/blocks';

export const BuyOrderBlockTemplate: BlockTemplate = {
  type: BlockType.BUY_ORDER,
  category: BlockCategory.ACTIONS,
  name: 'Buy Order',
  description: 'Places a buy order when condition is met',
  icon: '🟢',
  inputs: [
    {
      name: 'Condition',
      dataType: DataType.BOOLEAN,
      required: true,
      description: 'Condition to trigger buy order'
    },
    {
      name: 'Price',
      dataType: DataType.NUMBER,
      required: false,
      description: 'Custom price (optional, uses market price if not connected)'
    }
  ],
  outputs: [
    {
      name: 'Order Placed',
      dataType: DataType.SIGNAL,
      description: 'Signal when buy order is placed'
    },
    {
      name: 'Order Details',
      dataType: DataType.ORDER,
      description: 'Details of the placed order'
    }
  ],
  properties: [
    {
      name: 'orderType',
      type: 'select',
      required: true,
      options: [
        { label: 'Market Order', value: 'market' },
        { label: 'Limit Order', value: 'limit' },
        { label: 'Stop Order', value: 'stop' }
      ],
      description: 'Type of buy order'
    },
    {
      name: 'quantity',
      type: 'number',
      required: true,
      min: 0.001,
      max: 10000,
      step: 0.001,
      description: 'Quantity to buy'
    },
    {
      name: 'quantityType',
      type: 'select',
      required: true,
      options: [
        { label: 'Fixed Amount', value: 'fixed' },
        { label: 'Percentage of Portfolio', value: 'percentage' },
        { label: 'Risk-Based', value: 'risk_based' }
      ],
      description: 'How to calculate quantity'
    },
    {
      name: 'limitOffset',
      type: 'number',
      required: false,
      min: -10,
      max: 10,
      step: 0.01,
      description: 'Price offset for limit orders (percentage)'
    }
  ],
  defaultSize: { width: 180, height: 140 },
  implementation: `
    class BuyOrderExecutor {
      private orderType: string;
      private quantity: number;
      private quantityType: string;
      private limitOffset?: number;
      private lastOrderTime?: number;
      
      constructor(config: any) {
        this.orderType = config.orderType;
        this.quantity = config.quantity;
        this.quantityType = config.quantityType;
        this.limitOffset = config.limitOffset;
      }
      
      execute(condition: boolean, marketPrice: number, customPrice?: number): any {
        if (!condition) {
          return { orderPlaced: false, orderDetails: null };
        }
        
        // Prevent rapid-fire orders (minimum 1 second between orders)
        const currentTime = Date.now();
        if (this.lastOrderTime && currentTime - this.lastOrderTime < 1000) {
          return { orderPlaced: false, orderDetails: null };
        }
        
        const executionPrice = this.calculateExecutionPrice(marketPrice, customPrice);
        const orderQuantity = this.calculateQuantity(marketPrice);
        
        const orderDetails = {
          type: 'BUY',
          orderType: this.orderType,
          quantity: orderQuantity,
          price: executionPrice,
          timestamp: currentTime,
          status: 'PENDING'
        };
        
        this.lastOrderTime = currentTime;
        
        return {
          orderPlaced: true,
          orderDetails: orderDetails
        };
      }
      
      private calculateExecutionPrice(marketPrice: number, customPrice?: number): number {
        let basePrice = customPrice || marketPrice;
        
        switch (this.orderType) {
          case 'market':
            return basePrice;
          case 'limit':
            const offset = this.limitOffset || 0;
            return basePrice * (1 + offset / 100);
          case 'stop':
            return basePrice;
          default:
            return basePrice;
        }
      }
      
      private calculateQuantity(marketPrice: number): number {
        switch (this.quantityType) {
          case 'fixed':
            return this.quantity;
          case 'percentage':
            // This would need access to portfolio value
            return this.quantity; // Simplified
          case 'risk_based':
            // This would need risk management calculations
            return this.quantity; // Simplified
          default:
            return this.quantity;
        }
      }
      
      reset(): void {
        this.lastOrderTime = undefined;
      }
    }
  `
};

export const SellOrderBlockTemplate: BlockTemplate = {
  type: BlockType.SELL_ORDER,
  category: BlockCategory.ACTIONS,
  name: 'Sell Order',
  description: 'Places a sell order when condition is met',
  icon: '🔴',
  inputs: [
    {
      name: 'Condition',
      dataType: DataType.BOOLEAN,
      required: true,
      description: 'Condition to trigger sell order'
    },
    {
      name: 'Price',
      dataType: DataType.NUMBER,
      required: false,
      description: 'Custom price (optional, uses market price if not connected)'
    }
  ],
  outputs: [
    {
      name: 'Order Placed',
      dataType: DataType.SIGNAL,
      description: 'Signal when sell order is placed'
    },
    {
      name: 'Order Details',
      dataType: DataType.ORDER,
      description: 'Details of the placed order'
    }
  ],
  properties: [
    {
      name: 'orderType',
      type: 'select',
      required: true,
      options: [
        { label: 'Market Order', value: 'market' },
        { label: 'Limit Order', value: 'limit' },
        { label: 'Stop Order', value: 'stop' }
      ],
      description: 'Type of sell order'
    },
    {
      name: 'quantity',
      type: 'number',
      required: true,
      min: 0.001,
      max: 10000,
      step: 0.001,
      description: 'Quantity to sell'
    },
    {
      name: 'quantityType',
      type: 'select',
      required: true,
      options: [
        { label: 'Fixed Amount', value: 'fixed' },
        { label: 'Percentage of Position', value: 'percentage' },
        { label: 'Close All', value: 'close_all' }
      ],
      description: 'How to calculate quantity'
    },
    {
      name: 'limitOffset',
      type: 'number',
      required: false,
      min: -10,
      max: 10,
      step: 0.01,
      description: 'Price offset for limit orders (percentage)'
    }
  ],
  defaultSize: { width: 180, height: 140 },
  implementation: `
    class SellOrderExecutor {
      private orderType: string;
      private quantity: number;
      private quantityType: string;
      private limitOffset?: number;
      private lastOrderTime?: number;
      
      constructor(config: any) {
        this.orderType = config.orderType;
        this.quantity = config.quantity;
        this.quantityType = config.quantityType;
        this.limitOffset = config.limitOffset;
      }
      
      execute(condition: boolean, marketPrice: number, customPrice?: number): any {
        if (!condition) {
          return { orderPlaced: false, orderDetails: null };
        }
        
        const currentTime = Date.now();
        if (this.lastOrderTime && currentTime - this.lastOrderTime < 1000) {
          return { orderPlaced: false, orderDetails: null };
        }
        
        const executionPrice = this.calculateExecutionPrice(marketPrice, customPrice);
        const orderQuantity = this.calculateQuantity(marketPrice);
        
        const orderDetails = {
          type: 'SELL',
          orderType: this.orderType,
          quantity: orderQuantity,
          price: executionPrice,
          timestamp: currentTime,
          status: 'PENDING'
        };
        
        this.lastOrderTime = currentTime;
        
        return {
          orderPlaced: true,
          orderDetails: orderDetails
        };
      }
      
      private calculateExecutionPrice(marketPrice: number, customPrice?: number): number {
        let basePrice = customPrice || marketPrice;
        
        switch (this.orderType) {
          case 'market':
            return basePrice;
          case 'limit':
            const offset = this.limitOffset || 0;
            return basePrice * (1 + offset / 100);
          case 'stop':
            return basePrice;
          default:
            return basePrice;
        }
      }
      
      private calculateQuantity(marketPrice: number): number {
        switch (this.quantityType) {
          case 'fixed':
            return this.quantity;
          case 'percentage':
            // This would need access to current position size
            return this.quantity; // Simplified
          case 'close_all':
            // This would need access to current position size
            return this.quantity; // Simplified
          default:
            return this.quantity;
        }
      }
      
      reset(): void {
        this.lastOrderTime = undefined;
      }
    }
  `
};

export const StopLossBlockTemplate: BlockTemplate = {
  type: BlockType.STOP_LOSS,
  category: BlockCategory.ACTIONS,
  name: 'Stop Loss',
  description: 'Automatically closes position when loss threshold is reached',
  icon: '🛑',
  inputs: [
    {
      name: 'Current Price',
      dataType: DataType.NUMBER,
      required: true,
      description: 'Current market price'
    },
    {
      name: 'Entry Price',
      dataType: DataType.NUMBER,
      required: false,
      description: 'Position entry price (optional)'
    }
  ],
  outputs: [
    {
      name: 'Stop Triggered',
      dataType: DataType.BOOLEAN,
      description: 'True when stop loss is triggered'
    },
    {
      name: 'Stop Order',
      dataType: DataType.ORDER,
      description: 'Stop loss order details'
    }
  ],
  properties: [
    {
      name: 'stopType',
      type: 'select',
      required: true,
      options: [
        { label: 'Fixed Price', value: 'fixed_price' },
        { label: 'Percentage Loss', value: 'percentage' },
        { label: 'ATR Multiple', value: 'atr_multiple' },
        { label: 'Trailing Stop', value: 'trailing' }
      ],
      description: 'Type of stop loss'
    },
    {
      name: 'stopValue',
      type: 'number',
      required: true,
      min: 0.01,
      max: 50,
      step: 0.01,
      description: 'Stop loss value (price, percentage, or multiple)'
    },
    {
      name: 'positionType',
      type: 'select',
      required: true,
      options: [
        { label: 'Long Position', value: 'long' },
        { label: 'Short Position', value: 'short' }
      ],
      description: 'Type of position to protect'
    }
  ],
  defaultSize: { width: 160, height: 130 },
  implementation: `
    class StopLossManager {
      private stopType: string;
      private stopValue: number;
      private positionType: string;
      private entryPrice?: number;
      private highWaterMark?: number; // For trailing stops
      private lowWaterMark?: number; // For trailing stops
      
      constructor(config: any) {
        this.stopType = config.stopType;
        this.stopValue = config.stopValue;
        this.positionType = config.positionType;
      }
      
      check(currentPrice: number, entryPrice?: number): any {
        if (entryPrice) {
          this.entryPrice = entryPrice;
        }
        
        if (!this.entryPrice) {
          return { stopTriggered: false, stopOrder: null };
        }
        
        this.updateWaterMarks(currentPrice);
        
        const isTriggered = this.isStopTriggered(currentPrice);
        
        if (isTriggered) {
          const stopOrder = {
            type: this.positionType === 'long' ? 'SELL' : 'BUY',
            orderType: 'market',
            quantity: 0, // Would be calculated based on position size
            price: currentPrice,
            reason: 'STOP_LOSS',
            timestamp: Date.now()
          };
          
          return { stopTriggered: true, stopOrder };
        }
        
        return { stopTriggered: false, stopOrder: null };
      }
      
      private updateWaterMarks(currentPrice: number): void {
        if (this.stopType === 'trailing') {
          if (this.positionType === 'long') {
            if (!this.highWaterMark || currentPrice > this.highWaterMark) {
              this.highWaterMark = currentPrice;
            }
          } else {
            if (!this.lowWaterMark || currentPrice < this.lowWaterMark) {
              this.lowWaterMark = currentPrice;
            }
          }
        }
      }
      
      private isStopTriggered(currentPrice: number): boolean {
        if (!this.entryPrice) return false;
        
        switch (this.stopType) {
          case 'fixed_price':
            return this.positionType === 'long' 
              ? currentPrice <= this.stopValue
              : currentPrice >= this.stopValue;
              
          case 'percentage':
            const percentageLoss = Math.abs((currentPrice - this.entryPrice) / this.entryPrice) * 100;
            const isLoss = this.positionType === 'long' 
              ? currentPrice < this.entryPrice 
              : currentPrice > this.entryPrice;
            return isLoss && percentageLoss >= this.stopValue;
            
          case 'trailing':
            if (this.positionType === 'long' && this.highWaterMark) {
              const trailingStopPrice = this.highWaterMark * (1 - this.stopValue / 100);
              return currentPrice <= trailingStopPrice;
            } else if (this.positionType === 'short' && this.lowWaterMark) {
              const trailingStopPrice = this.lowWaterMark * (1 + this.stopValue / 100);
              return currentPrice >= trailingStopPrice;
            }
            return false;
            
          default:
            return false;
        }
      }
      
      reset(): void {
        this.entryPrice = undefined;
        this.highWaterMark = undefined;
        this.lowWaterMark = undefined;
      }
    }
  `
};

export const TakeProfitBlockTemplate: BlockTemplate = {
  type: BlockType.TAKE_PROFIT,
  category: BlockCategory.ACTIONS,
  name: 'Take Profit',
  description: 'Automatically closes position when profit target is reached',
  icon: '✅',
  inputs: [
    {
      name: 'Current Price',
      dataType: DataType.NUMBER,
      required: true,
      description: 'Current market price'
    },
    {
      name: 'Entry Price',
      dataType: DataType.NUMBER,
      required: false,
      description: 'Position entry price (optional)'
    }
  ],
  outputs: [
    {
      name: 'Target Reached',
      dataType: DataType.BOOLEAN,
      description: 'True when take profit target is reached'
    },
    {
      name: 'Profit Order',
      dataType: DataType.ORDER,
      description: 'Take profit order details'
    }
  ],
  properties: [
    {
      name: 'targetType',
      type: 'select',
      required: true,
      options: [
        { label: 'Fixed Price', value: 'fixed_price' },
        { label: 'Percentage Profit', value: 'percentage' },
        { label: 'Risk-Reward Ratio', value: 'risk_reward' }
      ],
      description: 'Type of take profit target'
    },
    {
      name: 'targetValue',
      type: 'number',
      required: true,
      min: 0.01,
      max: 1000,
      step: 0.01,
      description: 'Target value (price, percentage, or ratio)'
    },
    {
      name: 'positionType',
      type: 'select',
      required: true,
      options: [
        { label: 'Long Position', value: 'long' },
        { label: 'Short Position', value: 'short' }
      ],
      description: 'Type of position'
    }
  ],
  defaultSize: { width: 160, height: 130 },
  implementation: `
    class TakeProfitManager {
      private targetType: string;
      private targetValue: number;
      private positionType: string;
      private entryPrice?: number;
      
      constructor(config: any) {
        this.targetType = config.targetType;
        this.targetValue = config.targetValue;
        this.positionType = config.positionType;
      }
      
      check(currentPrice: number, entryPrice?: number): any {
        if (entryPrice) {
          this.entryPrice = entryPrice;
        }
        
        if (!this.entryPrice) {
          return { targetReached: false, profitOrder: null };
        }
        
        const isTargetReached = this.isTargetReached(currentPrice);
        
        if (isTargetReached) {
          const profitOrder = {
            type: this.positionType === 'long' ? 'SELL' : 'BUY',
            orderType: 'market',
            quantity: 0, // Would be calculated based on position size
            price: currentPrice,
            reason: 'TAKE_PROFIT',
            timestamp: Date.now()
          };
          
          return { targetReached: true, profitOrder };
        }
        
        return { targetReached: false, profitOrder: null };
      }
      
      private isTargetReached(currentPrice: number): boolean {
        if (!this.entryPrice) return false;
        
        switch (this.targetType) {
          case 'fixed_price':
            return this.positionType === 'long' 
              ? currentPrice >= this.targetValue
              : currentPrice <= this.targetValue;
              
          case 'percentage':
            const percentageProfit = Math.abs((currentPrice - this.entryPrice) / this.entryPrice) * 100;
            const isProfit = this.positionType === 'long' 
              ? currentPrice > this.entryPrice 
              : currentPrice < this.entryPrice;
            return isProfit && percentageProfit >= this.targetValue;
            
          case 'risk_reward':
            // This would need stop loss distance to calculate risk-reward ratio
            // Simplified implementation
            const profitDistance = Math.abs(currentPrice - this.entryPrice);
            const targetDistance = this.entryPrice * (this.targetValue / 100);
            return profitDistance >= targetDistance;
            
          default:
            return false;
        }
      }
      
      reset(): void {
        this.entryPrice = undefined;
      }
    }
  `
};

export const NotificationBlockTemplate: BlockTemplate = {
  type: BlockType.NOTIFICATION,
  category: BlockCategory.ACTIONS,
  name: 'Notification',
  description: 'Sends notifications when conditions are met',
  icon: '🔔',
  inputs: [
    {
      name: 'Trigger',
      dataType: DataType.BOOLEAN,
      required: true,
      description: 'Condition to trigger notification'
    },
    {
      name: 'Message',
      dataType: DataType.STRING,
      required: false,
      description: 'Dynamic message content (optional)'
    }
  ],
  outputs: [
    {
      name: 'Notification Sent',
      dataType: DataType.BOOLEAN,
      description: 'True when notification is sent'
    }
  ],
  properties: [
    {
      name: 'notificationType',
      type: 'multiselect',
      required: true,
      options: [
        { label: 'Browser Notification', value: 'browser' },
        { label: 'Email', value: 'email' },
        { label: 'SMS', value: 'sms' },
        { label: 'Discord Webhook', value: 'discord' },
        { label: 'Telegram Bot', value: 'telegram' }
      ],
      description: 'Types of notifications to send'
    },
    {
      name: 'defaultMessage',
      type: 'string',
      required: true,
      description: 'Default notification message'
    },
    {
      name: 'priority',
      type: 'select',
      required: true,
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Normal', value: 'normal' },
        { label: 'High', value: 'high' },
        { label: 'Critical', value: 'critical' }
      ],
      description: 'Notification priority level'
    },
    {
      name: 'cooldownMinutes',
      type: 'number',
      required: false,
      min: 0,
      max: 1440,
      step: 1,
      description: 'Minimum minutes between notifications (0 = no cooldown)'
    }
  ],
  defaultSize: { width: 160, height: 140 },
  implementation: `
    class NotificationSender {
      private notificationTypes: string[];
      private defaultMessage: string;
      private priority: string;
      private cooldownMinutes: number;
      private lastNotificationTime?: number;
      
      constructor(config: any) {
        this.notificationTypes = config.notificationTypes || ['browser'];
        this.defaultMessage = config.defaultMessage;
        this.priority = config.priority;
        this.cooldownMinutes = config.cooldownMinutes || 0;
      }
      
      send(trigger: boolean, customMessage?: string): any {
        if (!trigger) {
          return { notificationSent: false };
        }
        
        // Check cooldown period
        const currentTime = Date.now();
        if (this.lastNotificationTime && this.cooldownMinutes > 0) {
          const timeSinceLastNotification = (currentTime - this.lastNotificationTime) / (1000 * 60);
          if (timeSinceLastNotification < this.cooldownMinutes) {
            return { notificationSent: false };
          }
        }
        
        const message = customMessage || this.defaultMessage;
        
        try {
          this.notificationTypes.forEach(type => {
            this.sendNotification(type, message);
          });
          
          this.lastNotificationTime = currentTime;
          return { notificationSent: true };
        } catch (error) {
          console.error('Failed to send notification:', error);
          return { notificationSent: false };
        }
      }
      
      private sendNotification(type: string, message: string): void {
        switch (type) {
          case 'browser':
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Trading Strategy Alert', {
                body: message,
                icon: '/favicon.ico'
              });
            }
            break;
          case 'email':
            // Would integrate with email service
            console.log(\`Email notification: \${message}\`);
            break;
          case 'sms':
            // Would integrate with SMS service
            console.log(\`SMS notification: \${message}\`);
            break;
          case 'discord':
            // Would integrate with Discord webhook
            console.log(\`Discord notification: \${message}\`);
            break;
          case 'telegram':
            // Would integrate with Telegram bot
            console.log(\`Telegram notification: \${message}\`);
            break;
        }
      }
      
      reset(): void {
        this.lastNotificationTime = undefined;
      }
    }
  `
};

// Export all action block templates
export const ActionBlocks: BlockTemplate[] = [
  BuyOrderBlockTemplate,
  SellOrderBlockTemplate,
  StopLossBlockTemplate,
  TakeProfitBlockTemplate,
  NotificationBlockTemplate
];