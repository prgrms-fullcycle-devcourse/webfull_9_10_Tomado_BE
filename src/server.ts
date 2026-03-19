import { createApp } from './app.js';
import { env } from './env.js';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`[tomado-be] listening on http://localhost:${env.PORT}`);
});
