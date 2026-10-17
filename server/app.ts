// Vercel's Express adapter imports this application without opening a port.
// Local `npm run dev` continues to use src/main.ts and its process lifecycle.
import { createApp } from './src/app';

export default createApp();
