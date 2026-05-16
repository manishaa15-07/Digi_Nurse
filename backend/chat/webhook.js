import express from 'express';

function registerWebhookRoutes(app, deps) {
    // deps may contain ai client, dialogflow client, etc. For now, expose a placeholder
    app.post('/webhook', async (req, res) => {
        try {
            const body = req.body || {};
            const intent = body?.queryResult?.intent?.displayName;
            const queryText = body?.queryResult?.queryText || '';

            let responseText = 'Hello from webhook!';
            if (intent) {
                responseText = `Intent ${intent} received. Query: ${queryText}`;
            }

            return res.json({ fulfillmentText: responseText });
        } catch (e) {
            console.error('[WEBHOOK ERROR]', e);
            return res.status(500).json({ fulfillmentText: 'Webhook processing error' });
        }
    });
}

export { registerWebhookRoutes };


