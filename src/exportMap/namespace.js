import resolve from 'eslint-module-utils/resolve';
import { childContext } from './childContext';

export class Namespace {
  constructor(
    path,
    context,
    ExportMapBuilder,
  ) {
    this.path = path;
    this.context = context;
    this.ExportMapBuilder = ExportMapBuilder;
    this.namespaces = new Map();
  }

  remotePath(value) {
    return resolve.relative(value, this.path, this.context.settings);
  }

  resolveImport(value) {
    const rp = this.remotePath(value);
    if (rp == null) { return null; }
    return this.ExportMapBuilder.for(childContext(rp, this.context));
  }

  getNamespace(identifier) {
    if (!this.namespaces.has(identifier.name)) { return; }
    return () => this.resolveImport(this.namespaces.get(identifier.name));
  }

  add(object, identifier) {
    const nsfn = this.getNamespace(identifier);
    if (nsfn) {
      Object.defineProperty(object, 'namespace', { get: nsfn });
    }

    return object;
  }

  rawSet(name, value) {
    this.namespaces.set(name, value);
  }
}
