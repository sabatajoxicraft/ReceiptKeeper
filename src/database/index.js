import SQLite from 'react-native-sqlite-storage';

SQLite.DEBUG(false);
SQLite.enablePromise(true);

let database = null;

export const getDatabase = async () => {
  if (database) {
    return database;
  }

  database = await SQLite.openDatabase({
    name: 'AppDatabase.db',
    location: 'default',
  });

  return database;
};

export const closeDatabase = async () => {
  if (database) {
    await database.close();
    database = null;
  }
};

export const executeSql = async (sql, params = []) => {
  const db = await getDatabase();
  const results = await db.executeSql(sql, params);
  return results[0];
};

export const createTable = async (tableName, columns) => {
  const columnDefs = columns.map(col => `${col.name} ${col.type}`).join(', ');
  await executeSql(`CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefs})`);
};

export const insert = async (tableName, data) => {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map(() => '?').join(', ');

  const result = await executeSql(
    `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`,
    values
  );

  return result.insertId;
};

export const query = async (tableName, where = null, params = []) => {
  const sql = where
    ? `SELECT * FROM ${tableName} WHERE ${where}`
    : `SELECT * FROM ${tableName}`;

  const result = await executeSql(sql, params);

  const rows = [];
  for (let i = 0; i < result.rows.length; i++) {
    rows.push(result.rows.item(i));
  }
  return rows;
};

export const update = async (tableName, data, where, params = []) => {
  const setClause = Object.keys(data)
    .map(key => `${key} = ?`)
    .join(', ');
  const values = [...Object.values(data), ...params];

  await executeSql(
    `UPDATE ${tableName} SET ${setClause} WHERE ${where}`,
    values
  );
};

export const remove = async (tableName, where, params = []) => {
  await executeSql(`DELETE FROM ${tableName} WHERE ${where}`, params);
};
