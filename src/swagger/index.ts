import yaml from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url'; // 추가

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pathName = path.join(__dirname, './openapi.yaml');
const swaggerSpec = yaml.load(pathName);

export default swaggerSpec;
