
mod vec;
mod slice;
mod thread;
#[macro_use]
pub(crate) mod util_macro;


pub use vec::*;
pub use slice::*;
pub use thread::*;



pub(crate) const fn saturation_cast(x: isize)-> usize {
  if x<0 {
    0usize
  } else {
    x as _
  }
}

pub(crate) const fn cast_or(int: isize,or: usize)-> usize {
  if int<0 || int as usize>or {
    or
  } else {
    int as _
  }
}

