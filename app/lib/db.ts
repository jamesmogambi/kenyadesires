import mysqlPool from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

export const sql = async (strings: TemplateStringsArray, ...values: any[]) => {
  let query = '';
  const params: any[] = [];
  strings.forEach((str, i) => {
    query += str;
    if (i < values.length) {
      params.push(values[i]);
      query += '?';
    }
  });
  const [rows] = await mysqlPool.query(query, params);
  return rows as RowDataPacket[];
};

export default sql;