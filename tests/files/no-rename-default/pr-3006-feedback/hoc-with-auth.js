export default function withAuth(fn) {
  return function innerAuth(...args) {
    const auth = {};
    return fn.call(null, auth, ...args);
  }
}
