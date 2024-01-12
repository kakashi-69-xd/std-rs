import { Node } from "./mod.ts";
import { IteratorTrait } from "../../iter.ts";
import { Option,None,Some } from "../../../../mod.ts";

abstract class ToLinkedList<T> {
  public abstract toLinkedList(): LinkedList<T>;
}

export class LinkedList<T> extends IteratorTrait<T> {
  private head: Option<Node<T>>=None(null);
  private size=0;
  private _tail=new WeakRef(this.head);

  constructor(...nodes: T[]) {
    super();
    for(const node of nodes) this.putBack(new Node(node,null));

    this.size=nodes.length;
  }

  public static fromArray<T>(arr: T[]) {
    const ll=new LinkedList<T>();
    let current=ll.head;

    arr.forEach((node,i)=> {
      current.value=new Node(node);
      i===arr.length-1?ll._tail=new WeakRef(current):current=current.value.next;
    });

    ll.size=arr.length;
    return ll;
  }

  public static fromIter<T>(iter: Iterable<T>): LinkedList<T> {
    return iter instanceof LinkedList?iter:iter instanceof ToLinkedList?iter.toLinkedList():new LinkedList(...iter);
  }

  public static fromIterRev<T>(iter: Iterable<T>) {
    const self=new LinkedList<T>();
    for(const element of iter) self.pushFront(element);

    return self;
  }

  *[Symbol.iterator](): Iterator<T> {
    for(let iter=this.head.value;iter&&iter.next.value;iter=iter.next.value) yield iter.data;
  }

  private putBack(node: Node<T>) {
    node.prev=this._tail;
    this.tail.value?this.tail.value.next.insert(node):this.tail.insert(node);
    this._tail=new WeakRef(this.tail.value?.next.value?this.tail.value.next:this.tail);
  }

  public get [Symbol.toStringTag]() {
    return [...this].join(" => ");
  }

  public toString() {
    return this[Symbol.toStringTag];
  }

  public get length() {
    return this.size;
  }

  public get front() {
    return this.head;
  }

  public get back(): Option<Node<T>> {
    return this._tail.deref()!;
  }

  private set tail(node: Option<Node<T>>) {
    this._tail.deref()!=node;
  }
  private get tail() {
    return this._tail.deref()!;
  }

  public pushFront(data: T) {
    this.head=Some(new Node(data,this.head.value));
    this.size++;
  }

  public pushBack(data: T) {
    this.putBack(new Node(data,null));
    this.size++;
  }

  public popBack() {
    const last=new Option(this._tail.deref()?.value?.data);
    
    switch(this.head) {
      case Option.None: return last;
      case this._tail.deref():
        this._tail.deref()?.empty();
      break;
      default:
        this._tail=this._tail.deref()!.value!.prev;
        this.tail.value?.next.empty();
      break;
    }
    
    this.size--;
    return last;
  }

  public popFront() {
    const entity=this.head.value?.data;
    this.head=new Option(this.head.value?.next.value);
    if(entity) --this.size;
    return new Option(entity);
  }

  public append(other: LinkedList<T>) {
    if(!other.head.value) return;
    this.putBack(other.head.value);
    this._tail=other._tail;
    this.size+=other.size;
  }
      
  public appendFront(other: LinkedList<T>) {
    this.head.value && other.putBack(this.head.value);
    this.head=other.head;
    this.size=other.size;
  }

  public empty() {
    this.head=None(null);
    this._tail=new WeakRef(this.head);
    this.size=0;
  }

  public isEmpty() {
    return !this.size;
  }

  public enumerate() {
    return this.iter().enumerate();
  }

  public rev() {
    return this.iter().rev();
  }

  public reverse() {
    this.head=LinkedList.fromIterRev(this).head;
  }

  public at(index: number) {
    if(index<0) index+=this.size;

    for(const [i,element] of this.enumerate()) if(i==index) return new Option(element);
    
    return None<T>();
  }
}









