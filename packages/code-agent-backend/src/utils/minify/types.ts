export interface StyleMap {
  idMap: Map<string, string>; // Old ID -> New ID
  valueMap: Map<string, string>; // Hash of value -> New ID (for deduplication)
}
