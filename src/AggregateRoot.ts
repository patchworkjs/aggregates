
import { IEvent, IEventHandler,IAggregateRoot } from '@patchworkjs/events';


export interface Type<T = any> extends Function {
    new (...args: any[]): T;
  }


export abstract class AggregateRoot<Event extends IEvent=IEvent> implements  IAggregateRoot {
  public isAutoCommitEnabled = false;
  private readonly internalEvents: any[] = []; //should be Event, but there is arichtecure problem  in apply method
  [keys: string]: any

  set autoCommit(value: boolean) {
    this.isAutoCommitEnabled = value;
  }

  get autoCommit(): boolean {
    return this.isAutoCommitEnabled;
  }

  publish<Event>(event: Event):void{}

  
  publishAll<Event>(event: Event[]) {}

  commit() {
    this.publishAll(this.internalEvents);
    this.internalEvents.length = 0;
  }

  uncommit() {
    this.internalEvents.length = 0;
  }

  getUncommittedEvents(): Event[] {
    return this.internalEvents;
  }

  loadFromHistory(history: Event[]) {
    history.forEach((event) => this.apply(event, true));
  }

  apply<Event>(event: Event, isFromHistory = false):void {
    if (!isFromHistory && !this.autoCommit) {
      this.internalEvents.push(event);
    }
    this.autoCommit && this.publish(event);

    const handler = this.getEventHandler(event);
    handler && handler.call(this, event);
  }

  protected getEventHandler<Event>(
    event: Event,
  ): Type<IEventHandler> | undefined {
    const handler:string = `on${this.getEventName(event)}`;
    return this[handler];
  }

  protected getEventName(event: any): string {
    const { constructor } = Object.getPrototypeOf(event);
    return constructor.name as string;
  }
}