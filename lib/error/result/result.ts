// deno-lint-ignore-file no-explicit-any
import { Option,None,Some } from '../option/option.ts';
import { Exception } from '../exception.ts';
import { $panic } from "../../../mod.ts";
import { Res } from './mod.ts';
import { Fn } from "../../types.ts";
import { PartailEq,$eq } from '../../cmp/mod.ts';

/**
 * {@linkcode Ok} value of type {@linkcode T}
 */
export type Ok<T>=T;

/**
 * {@linkcode E} value of type {@linkcode E}
 */
export type Err<E=Error>=E;

/**
 * Result is a type that represents either success ({@linkcode Ok}) or failure ({@linkcode Err}).
 */
export class Result<T,E> extends Exception<T,E> implements PartailEq<T|E|Result<T,E>> {
  protected isException: boolean;

  constructor(private _result: Res<T,E>) {
    super();
    this.isException=Object.hasOwn(_result,"err");
  }

  protected match<T1,E1>(t: (t: T)=> T1,e: (e: E)=> E1): T1|E1 {
    const res=this._result as any;
    return Object.hasOwn(res,"ok")?t(res.ok):e(res.err);
  }

  protected res(): any {
    const res=this._result as any;
    return res[Object.hasOwn(res,"ok")?"ok":"err"];
  }

  /**
   * Inner value of the result.
   */
  public get result(): T|E {
    return this.res();
  }

  public eq(rhs: Result<T,E>|T|E): boolean {
    return $eq(this.res(),rhs instanceof Result?rhs.res():rhs);
  }

  /**
   * Returns `Err` if the value is `Err`,otherwise returns {@linkcode optb}.
   * 
   * Arguments passed to {@linkcode and} are eagerly evaluated; if you are passing the result of a function call, it is recommended to use {@linkcode andThen}.
   * 
   * # Example
   * ```ts
   * const x=Ok(0);
   * const y=Ok(69)
   * $assertEq(x.and(y),Ok(69));
   * ```
   */
  public override and(optb: Result<T,E>): Result<T,E> {
    return this.isException?this.clone():optb;
  }

  /**
   * Returns `Err` if the option is `Err`, otherwise calls {@linkcode f} with the wrapped value and returns the result.
   * 
   * Some languages call this operation `flatmap`.
   * 
   * # Example
   * ```ts
   * const xd=Ok("xd");
   * $assertEq(xd.andThen(x=> Ok("69")),Ok("69"));
   * ```
   */
  public override andThen(f: (xd: T)=> Result<T,E>) {
    return this.match(f,_=> this.clone());
  }

  /**
   * Returns the {@linkcode Result} if it contains a value,otherwise returns {@linkcode optb}.
   * 
   * # Example
   * ```ts
   * const xd=Err("im an Err");
   * $assertEq(xd.or(Ok(69)),Ok(69));
   * ```
   */
  public override or(optb: this): this {
    return this.isException?optb:this.res();
  }

  /**
   * Returns the {@linkcode Result} if it contains a value, otherwise calls {@linkcode f} and returns the result.
   * 
   * # Example
   * ```ts
   * const xd=Err("im an Err..xd");
   * $assertEq(xd.orElse(()=> Ok(69)),Ok(69));
   * ```
   */
  public override orElse(f: (err: E)=> this) {
    return this.match(_=> this.clone(),f);
  }

  public err(): Option<E> {
    return this.match(_=> None(null),err=> Some(err));
  }

  public ok(): Option<T> {
    return this.match(ok=> Some(ok),_=> None(null));
  }

  /**
   * Returns the contained `Ok` value.
   * 
   * # Panics
   * Panics if the value is a `Err` with a custom panic message provided by {@linkcode msg}.
   * 
   * # Example
   * ```ts
   * const xd=Ok(69);
   * console.log(xd.expect("xd is an Err"));
   * ```
   */
  public override expect(msg: string): T {
    return this.match(t=> t,()=> $panic(msg));
  }

  /**
   * Returns the contained `Err` value.
   * 
   * # Panics
   * Panics if the value is a `Ok` with a custom {@linkcode callback}.
   * 
   * # Example
   * ```ts
   * const xd=Ok(69);
   * xd.expectNone(()=> $panic("xd is Ok"));
   * ```
   */
  public expectErr(callback: (s: T)=> never): E {
    return this.match(callback,e=> e);
  }

  /**
   * Returns whether the object contains a `Ok` value.
   */
  public override contains(): boolean {
    return !this.isException;
  }

  /**
   * Returns whether the object contains an `Err` value.
   */
  public containsErr() {
    return this.isException;
  }

  /**
   * Inserts the given `Ok` value in the current {@linkcode Result}
   * # Example
   * ```ts
   * const xd=Err("Err");
   * $assertEq(xd.insert(69),Ok(69));
   * ```
   */
  public insert(ok: T) {
    this._result={ok};
    this.isException=false;
  }

  /**
   * Returns the contained `Ok` value or Inserts the given `Ok` value in the current {@linkcode Result} and returns it
   * # Example
   * ```ts
   * const xd=Err("Err");
   * $assertEq(xd.getOrInsert(69),Ok(69));
   * ```
   */
  public getOrInsert(ok: T): T {
    if(this.isException) this._result={ ok };
    return (this._result as any).ok;
  }

  /**
   * Maps a {@linkcode Result<T,E>} to {@linkcode Result<U,E>} by applying a function to a contained `Ok` value, leaving an `Err` value untouched.
   * 
   * This function can be used to compose the results of two functions.
   */
  public override map<U>(f: Fn<[val: T], U>): Result<U,E> {
    return this.match(ok=> Ok(f(ok)),err=> Err(err));
  }

  /**
   * Maps a {@linkcode Result<T,E>} to {@linkcode Result<T,F>} by applying a function to a contained `Err` value, leaving an `Ok` value untouched.
   * 
   * This function can be used to pass through a successful result while handling an error.
   */
  public mapErr<F>(f: Fn<[err: E], F>) {
    return this.match(ok=> Ok(ok),err=> Err(f(err)));
  }

  /**
   * Returns the provided default `Err`, or applies a function to the contained value `Ok`.
   * 
   * Arguments passed to {@linkcode mapOr} are eagerly evaluated; if you are passing the result of a function call, it is recommended to use {@linkcode mapOrElse}, which is lazily evaluated.
   */
  public mapOr<U>(def: U,f: Fn<[val: T],U>) {
    return this.match(f,_=> def);
  }

  /**
   * Maps a {@linkcode Result<T,E>} to {@linkcode U} by applying fallback function default to a contained `Err` value, or function f to a contained `Ok` value.
   * 
   * This function can be used to unpack a successful result while handling an error.
   */
  public mapOrElse<U>(def: Fn<[err: E],U>,f: Fn<[val: T],U>) {
    return this.match(f,def);
  }


  /**
   * Returns the contained `Ok` value.
   * 
   * Because this function may panic, its use is generally discouraged. Instead, prefer to use pattern matching and handle the None case explicitly, or call {@linkcode unwrapOr}, {@linkcode unwrapOrElse}.
   * # Panics
   * Panics if the self value equals `Err`.
   * # Example
   * ```ts
   * const xd=Ok(69);
   * $assertEq(xd.unwrap(),69);
   * ```
   */
  public override unwrap(): T {
    return this.match(t=> t,e=> $panic(e as any));
  }

  /**
   * Returns the contained `Ok` value or a provided default {@linkcode optb}.
   * 
   * Arguments passed to {@linkcode unwrapOr} are eagerly evaluated.
   * 
   * If you are passing the result of a function call, it is recommended to use {@linkcode unwrapOrElse}.
   * 
   * # Example
   * ```ts
   * const xd=Err("Err");
   * $assertEq(xd.unwrapOr(69),Ok(69));
   * ```
   */
  public override unwrapOr(optb: T): T {
    return this.match(t=> t,_=> optb);
  }

  /**
   * Returns the contained `Ok` value or if the value is `Err` calls {@linkcode f} and returns the result.
   * # Example
   * ```ts
   * const xd=Err("Err");
   * $assertEq(xd.unwrapOrElse(()=> Ok(69)),Ok(69));
   * ```
   */
  public override unwrapOrElse(f: (err: E) => T): T {
    return this.match(t=> t,f);
  }

  /**
   * Returns the contained `Ok` value or if the value is `Err` throws an exception.
   * #### Not recommended to use.
   */
  public override unwrapOrThrow() {
    return this.match(t=> t,e=> { throw e });
  }


  /**
   * Returns the contained value without checking it.
   * 
   * #### It may lead the code to undefined behavior.
   * #### Not recommended to use.
   */
  public override unwrapUnchecked(): T|E {
    return this.res();
  }


  /**
   * {@linkcode Ok} value of type {@linkcode T}
   */
  public static Ok<T,E=any>(ok: T) {
    return new Result<T,E>({ ok });
  }


  /**
   * {@linkcode Err} value of type {@linkcode E}
   */
  public static Err<E,T=any>(err: E) {
    return new Result<T,E>({ err });
  }
}


export function Err<T,E>(err: E) {
  return new Result<T,E>({ err });
}

export function Ok<T,E>(ok: T) {
  return new Result<T,E>({ ok });
}
