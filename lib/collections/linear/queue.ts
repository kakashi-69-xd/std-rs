import { Option } from "../../../mod.ts";
import { LinkedList } from './linked_list/linked_list.ts';
import { IteratorTrait } from "../mod.ts";


export class Queue<T> extends IteratorTrait<T> {
  private queue: LinkedList<T>;
  constructor(...queue: T[]) {
    super();
    this.queue=LinkedList.fromArray(queue);
  }

  *[Symbol.iterator](): Iterator<T> {
    for(let entity=this.dequeue().value;entity!=null;entity=this.dequeue().value) yield entity;
  }

  public get length() {
    return this.queue.length;
  }

  public get front() {
    return new Option(this.queue.front.value?.data);
  }

  public get back() {
    return new Option(this.queue.back.value?.data);
  }

  public enqueue(entity: T) {
    this.queue.pushBack(entity);
  }

  public dequeue(): Option<T> {
    return this.queue.popFront();
  }

  public toString() {
    return `{ ${this.queue.toString()} }`;
  }
}


