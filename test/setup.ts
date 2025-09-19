import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .dev.vars for testing
config({ path: path.resolve(process.cwd(), '.dev.vars') });