import { IBroker } from '../../../core/interfaces/IBroker';
import { PaperBroker } from '../brokers/PaperBroker';

export class BrokerManager {
  private activeBroker: IBroker;
  private brokers: Map<string, IBroker> = new Map();

  constructor() {
    // Register default
    const paper = new PaperBroker();
    this.brokers.set('paper', paper);
    this.activeBroker = paper;
  }

  registerBroker(id: string, broker: IBroker) {
    this.brokers.set(id, broker);
  }

  selectBroker(id: string) {
    if (this.brokers.has(id)) {
        this.activeBroker = this.brokers.get(id)!;
        console.log(`Switched to broker: ${this.activeBroker.name}`);
    } else {
        throw new Error(`Broker ${id} not found.`);
    }
  }

  getBroker(): IBroker {
    return this.activeBroker;
  }
}
