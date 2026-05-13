export function buildNotificationOpenAPI(serverUrl: string) {
  return {
    openapi: '3.0.3',
    info: {
      title: 'HOOPS Notification Service API',
      version: '1.0.0',
      description: 'Notification delivery, device tokens, and user preferences.',
    },
    servers: [{ url: serverUrl }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    paths: {
      '/health': {
        get: {
          summary: 'Health check',
          responses: {
            '200': { description: 'Service healthy' },
          },
        },
      },
      '/notifications': {
        get: {
          summary: 'Get user notifications',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
            { name: 'unread_only', in: 'query', schema: { type: 'boolean' } },
          ],
          responses: {
            '200': { description: 'Notifications fetched' },
            '401': { description: 'Unauthorized' },
          },
        },
      },
      '/notifications/{id}/read': {
        patch: {
          summary: 'Mark one notification as read',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            '200': { description: 'Notification marked as read' },
            '404': { description: 'Notification not found' },
          },
        },
      },
      '/notifications/read-all': {
        post: {
          summary: 'Mark all user notifications as read',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Notifications updated' },
          },
        },
      },
      '/devices': {
        post: {
          summary: 'Register device push token',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['token', 'platform'],
                  properties: {
                    token: { type: 'string' },
                    platform: { type: 'string', enum: ['ios', 'android', 'web'] },
                    deviceName: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Token registered' },
          },
        },
      },
      '/devices/{token}': {
        delete: {
          summary: 'Delete device push token',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'token', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Token removed (or not found)' },
          },
        },
      },
      '/preferences': {
        get: {
          summary: 'Get notification preferences',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Preferences returned' } },
        },
        put: {
          summary: 'Update notification preferences',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    pushEnabled: { type: 'boolean' },
                    emailEnabled: { type: 'boolean' },
                    gameInvites: { type: 'boolean' },
                    gameStarting: { type: 'boolean' },
                    gameResults: { type: 'boolean' },
                    playerJoined: { type: 'boolean' },
                    rankChanges: { type: 'boolean' },
                    nearbyGames: { type: 'boolean' },
                    favoriteCourtIds: {
                      type: 'array',
                      items: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Preferences updated' } },
        },
      },
    },
  };
}

export const unifiedDocsHTML = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>HOOPS Unified API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
    <style>body { margin: 0; }</style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        urls: [
          { url: (window.HOOPS_AUTH_OPENAPI_URL || 'http://localhost:8002/openapi.json'), name: 'Auth / User API' },
          { url: (window.HOOPS_NOTIFICATION_OPENAPI_URL || '/openapi.json'), name: 'Notification API' },
          { url: (window.HOOPS_COURT_OPENAPI_URL || 'http://localhost:8081/openapi.json'), name: 'Court API' }
        ],
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis],
      });
    </script>
  </body>
</html>`;
