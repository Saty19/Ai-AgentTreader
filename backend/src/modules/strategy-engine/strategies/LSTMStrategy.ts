import { IStrategy } from '../../../core/interfaces/IStrategy';
import { Candle, Signal, Indicator } from '../../../domain/entities';

export class LSTMStrategy implements IStrategy {
  name = 'AI - LSTM Predictor';
  description = 'Deep Learning model for price prediction (Placeholder).';

  getIndicators(): Indicator[] {
    return [];
  }

  async onCandle(candle: Candle): Promise<Signal | null> {
    // Logic to call Python service or TensorFlow.js model would go here
    // console.log('LSTM processing candle...');
    return null;
  }
}
