import SQLite from 'react-native-sqlite-storage';

SQLite.DEBUG(false);
SQLite.enablePromise(true);

let database = null;

export const initDatabase = async () => {
  if (database) return database;

  try {
    database = await SQLite.openDatabase({
      name: 'ReceiptKeeper.db',
      location: 'default',
    });

    await database.executeSql(`
      CREATE TABLE IF NOT EXISTS receipts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        file_path TEXT NOT NULL,
        onedrive_path TEXT,
        payment_method TEXT NOT NULL,
        card_name TEXT,
        date_captured DATETIME DEFAULT CURRENT_TIMESTAMP,
        upload_status TEXT DEFAULT 'pending',
        year TEXT NOT NULL,
        month TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await database.executeSql(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT
      )
    `);

    console.log('Database initialized successfully');
    return database;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

export const getDatabase = () => {
  if (!database) {
    throw new Error('Database not initialized. Call initDatabase first.');
  }
  return database;
};

export const saveReceipt = async (receiptData) => {
  const db = getDatabase();
  const { filename, filePath, onedrivePath, paymentMethod, cardName, year, month } = receiptData;

  const result = await db.executeSql(
    `INSERT INTO receipts (filename, file_path, onedrive_path, payment_method, card_name, year, month) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [filename, filePath, onedrivePath, paymentMethod, cardName, year, month]
  );

  return result[0].insertId;
};

export const getReceipts = async (limit = 50) => {
  const db = getDatabase();
  const results = await db.executeSql(
    'SELECT * FROM receipts ORDER BY date_captured DESC LIMIT ?',
    [limit]
  );

  const receipts = [];
  for (let i = 0; i < results[0].rows.length; i++) {
    receipts.push(results[0].rows.item(i));
  }
  return receipts;
};

export const updateReceiptUploadStatus = async (id, status, onedrivePath) => {
  const db = getDatabase();
  await db.executeSql(
    'UPDATE receipts SET upload_status = ?, onedrive_path = ? WHERE id = ?',
    [status, onedrivePath, id]
  );
};

export const getSetting = async (key) => {
  const db = getDatabase();
  const results = await db.executeSql(
    'SELECT value FROM settings WHERE key = ?',
    [key]
  );

  if (results[0].rows.length > 0) {
    return results[0].rows.item(0).value;
  }
  return null;
};

export const saveSetting = async (key, value) => {
  const db = getDatabase();
  await db.executeSql(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, value]
  );
};
