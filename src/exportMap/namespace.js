import childContext from './childContext';
import { RemotePath } from './remotePath';

export default class Namespace {
  constructor(
    path,
    context,
    ExportMapBuilder,
  ) {
    this.remotePathResolver = new RemotePath(path, context);
    this.context = context;
    this.ExportMapBuilder = ExportMapBuilder;
    this.namespaces = new Map();
  }

  resolveImport(value) {
    const rp = this.remotePathResolver.resolve(value);
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
