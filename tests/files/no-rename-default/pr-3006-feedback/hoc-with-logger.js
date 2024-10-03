export default function withLogger(fn) {
  return function innerLogger(...args) {
    console.log(`${fn.name} called`);
    return fn.apply(null, args);
  }
}
