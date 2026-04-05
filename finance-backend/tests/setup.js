import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envTestPath = resolve(__dirname, '../.env.test');
const dotenvResult = dotenv.config({ path: envTestPath, override: true });

if (dotenvResult.error) {
  throw dotenvResult.error;
}
