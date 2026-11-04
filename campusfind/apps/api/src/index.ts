import { env } from './utils/env';
import { logger } from './utils/logger';
import app from './app';

const PORT = env.PORT;

app.listen(PORT, () => {
  logger.info(`CampusFind API server started successfully in ${env.NODE_ENV} mode on port ${PORT}`);
});
