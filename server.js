const express = require('express');
const cors = require('cors');
const path = require('path');
const crispService = require('./services/crispService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Export conversations endpoint
app.post('/api/export-conversations', async (req, res) => {
    try {
        const { crispIdentifier, crispKey, websiteId, startDate, endDate } = req.body;

        // Validate required fields
        if (!crispIdentifier || !crispKey || !websiteId) {
            return res.status(400).json({ 
                error: 'Missing required fields: crispIdentifier, crispKey, and websiteId are required' 
            });
        }

        console.log(`Starting export for website: ${websiteId}`);
        console.log(`Date range: ${startDate || 'all'} to ${endDate || 'all'}`);

        // Initialize Crisp service with credentials
        const crisp = new crispService(crispIdentifier, crispKey);

        // Export conversations to CSV
        const csvData = await crisp.exportConversationsToCSV(websiteId, {
            startDate: startDate || null,
            endDate: endDate || null
        });

        // Set headers for CSV download
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `crisp-conversations-${timestamp}.csv`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Pragma', 'no-cache');

        // Send CSV data
        res.send(csvData);

        console.log(`Export completed successfully for website: ${websiteId}`);

    } catch (error) {
        console.error('Export error:', error);
        
        // Handle different types of errors
        if (error.response) {
            // Axios error with response
            const status = error.response.status;
            const message = error.response.data?.reason || error.response.data?.error || error.message;
            
            if (status === 401) {
                return res.status(401).json({ error: 'Invalid Crisp API credentials' });
            } else if (status === 403) {
                return res.status(403).json({ error: 'Access denied. Check your API permissions.' });
            } else if (status === 404) {
                return res.status(404).json({ error: 'Website ID not found or not accessible' });
            } else {
                return res.status(status).json({ error: `Crisp API error: ${message}` });
            }
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return res.status(503).json({ error: 'Unable to connect to Crisp API. Please check your internet connection.' });
        } else {
            return res.status(500).json({ error: error.message || 'Internal server error during export' });
        }
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Crisp Conversation Exporter running on http://localhost:${PORT}`);
    console.log(`📁 Serving static files from: ${path.join(__dirname, 'public')}`);
    console.log(`🔗 Open your browser and navigate to: http://localhost:${PORT}`);
});

module.exports = app;
