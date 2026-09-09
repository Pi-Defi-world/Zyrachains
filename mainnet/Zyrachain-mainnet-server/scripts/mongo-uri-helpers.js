/**
 * Shared helpers for mongodump/mongorestore scripts.
 */

function databaseNameFromUri(uri) {
  if (!uri || typeof uri !== 'string') return undefined;
  const noQuery = uri.split('?')[0].trim();
  const withoutProtocol = noQuery.replace(/^mongodb(\+srv)?:\/\//i, '');
  const at = withoutProtocol.lastIndexOf('@');
  const hostAndPath = at >= 0 ? withoutProtocol.slice(at + 1) : withoutProtocol;
  const slash = hostAndPath.indexOf('/');
  if (slash === -1) return undefined;
  let name = hostAndPath.slice(slash + 1).trim();
  if (!name) return undefined;
  try {
    name = decodeURIComponent(name);
  } catch {
    /* ignore */
  }
  if (name.includes('@')) return undefined;
  return name;
}

/** Remove /dbname from URI (keeps ?options). Needed so mongorestore does not mix URI db + nsFrom/nsTo incorrectly. */
function uriWithoutDatabase(uri) {
  const qIndex = uri.indexOf('?');
  const query = qIndex >= 0 ? uri.slice(qIndex) : '';
  const noQuery = qIndex >= 0 ? uri.slice(0, qIndex) : uri;
  const db = databaseNameFromUri(uri);
  if (!db) return uri;
  const suf = '/' + db;
  if (noQuery.endsWith(suf)) {
    return noQuery.slice(0, -suf.length) + query;
  }
  const encSuf = '/' + encodeURIComponent(db);
  if (noQuery.endsWith(encSuf)) {
    return noQuery.slice(0, -encSuf.length) + query;
  }
  return uri;
}

/** Append /dbname before ?query */
function uriWithDatabase(uri, dbName) {
  if (!dbName) return uri;
  const stripped = uriWithoutDatabase(uri);
  const qIndex = stripped.indexOf('?');
  if (qIndex >= 0) {
    return `${stripped.slice(0, qIndex)}/${encodeURIComponent(dbName)}${stripped.slice(qIndex)}`;
  }
  return `${stripped}/${encodeURIComponent(dbName)}`;
}

module.exports = {
  databaseNameFromUri,
  uriWithoutDatabase,
  uriWithDatabase,
};
