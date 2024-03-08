import { $panic } from '../../std/mod.ts';
import { Clone } from '../clone.ts';
import { Fn } from "../types.ts";


export abstract class Exception<T,E> implements Clone {

  /**
   * Function to match the value stored in the derived-class
   */
  protected abstract match<T1,E1>(t: (t: T)=> T1,e: (e: E)=> E1): T1|E1;

  /**
   * Function to access the value stored in the derived-class
   */
  protected abstract res(): T|E;

  /**
   * # {@linkcode isException}
   * * It must be defined as it tells whether the stored value is an `Exception`.
   */
  protected abstract isException: boolean;
  
  /**
   * * Returns {@linkcode Exception} if the value is an {@linkcode Exception},otherwise returns `optb`.
   * * Arguments passed to {@linkcode and} are eagerly evaluated; if you are passing the result of a function call, it is recommended to use {@linkcode andThen}.
   */
  public abstract and(optb: this): unknown;

  /**
   * * Returns {@linkcode Exception} if the object is {@linkcode Exception}, otherwise calls f with the wrapped value and returns the result.
   * * Some languages call this operation `flatmap`.
   */
  public abstract andThen(f: (xd: T)=> unknown): unknown;

  /**
   * * Returns the `this` if it isn't an {@linkcode Exception},otherwise returns `optb`.
   */
  public or(optb: this): this {
    return this.isException?optb:this.clone();
  }
  /**
   * * Returns the `this` if it isn't an {@linkcode Exception},otherwise calls `f` and returns the result.
   */
  public orElse(f: (err: E)=> this): this {
    return this.match(_=> this.clone(),f);
  }
  
  /**
   * * Returns the contained value.
   * # Panics
   * * Panics if the value is a `None` with a custom panic message provided by msg.
   */
  public expect(msg: string): T {
    return this.match(t=> t,_=> $panic(msg));
  }

  /**
   * Maps a {@linkcode Exception<T,E>} to {@linkcode Exception<U,E>} by applying a function to a contained {@linkcode T} value, leaving an {@linkcode E} value untouched.
   * 
   * This function can be used to compose the results of two functions.
   */
  public abstract map<U>(f: Fn<[val: T],U>): unknown;

  /**
   * Returns the provided default {@linkcode E}, or applies a function to the contained value {@linkcode T}.
   * 
   * Arguments passed to {@linkcode mapOr} are eagerly evaluated; if you are passing the result of a function call, it is recommended to use {@linkcode mapOrElse}, which is lazily evaluated.
   */
  public mapOr<U>(def: U,f: Fn<[val: T],U>) {
    return this.match(f,_=> def);
  }

  /**
   * Maps a {@linkcode Exception<T,E>} to {@linkcode U} by applying fallback function default to a contained {@linkcode E} value, or function f to a contained {@linkcode T} value.
   * 
   * This function can be used to unpack a successful result while handling an error.
   */
  public mapOrElse<U>(def: Fn<[err?: E],U>,f: Fn<[val: T],U>) {
    return this.match(f,def);
  }


  /**
   * * Returns the contained non {@linkcode Exception} value or a provided default.
   * * Arguments passed to {@linkcode unwrapOr} are eagerly evaluated; if you are passing the result of a function call, it is recommended to use {@linkcode unwrapOrElse}.
   */
  public unwrapOr(op: T): T {
    return this.match(t=> t,_=> op);
  }
  
  /**
   * Returns whether the object contains a non {@linkcode Exception} value.
   */
  public contains() {
    return !this.isException;
  }
  
  public unwrap(): T {
    // deno-lint-ignore no-explicit-any
    return this.match(t=> t,e=> $panic(e as any));
  }
  
  public unwrapOrElse(f: (err: E)=> T): T {
    return this.match(t=> t,f);
  }

  public unwrapOrThrow() {
    return this.match(t=> t,e=> { throw e });
  }

  public unwrapUnchecked(): T|E {
    return this.res();
  }
  
  clone(): this {
    return structuredClone(this);
  }
}