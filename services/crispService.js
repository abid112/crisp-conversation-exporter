const axios = require('axios');
const { Parser } = require('json2csv');

class CrispService {
    constructor(identifier, key) {
        this.identifier = identifier;
        this.key = key;
        this.baseURL = 'https://api.crisp.chat/v1';

        // Create axios instance with new authentication method
        this.api = axios.create({
            baseURL: this.baseURL,
            auth: {
                username: this.identifier,
                password: this.key
            },
            headers: {
                'X-Crisp-Tier': 'plugin',
                'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 seconds timeout
        });
    }

    /**
     * Get all conversation sessions for a website
     */
    async getConversationSessions(websiteId, options = {}) {
        try {
            const { startDate, endDate } = options;
            let url = `/website/${websiteId}/conversations`;
            
            // Add date filters if provided
            const params = new URLSearchParams();
            if (startDate) {
                params.append('filter_date_start', new Date(startDate).toISOString());
            }
            if (endDate) {
                params.append('filter_date_end', new Date(endDate).toISOString());
            }
            
            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            console.log(`Fetching conversations from: ${url}`);
            const response = await this.api.get(url);
            
            return response.data.data || [];
        } catch (error) {
            console.error('Error fetching conversation sessions:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Get conversation messages for a specific session
     */
    async getConversationMessages(websiteId, sessionId) {
        try {
            const response = await this.api.get(`/website/${websiteId}/conversation/${sessionId}/messages`);
            return response.data.data || [];
        } catch (error) {
            console.error(`Error fetching messages for session ${sessionId}:`, error.response?.data || error.message);
            // Return empty array if conversation messages can't be fetched
            return [];
        }
    }

    /**
     * Get conversation metadata (including user email)
     */
    async getConversationMeta(websiteId, sessionId) {
        try {
            const response = await this.api.get(`/website/${websiteId}/conversation/${sessionId}/meta`);
            return response.data.data || {};
        } catch (error) {
            console.error(`Error fetching meta for session ${sessionId}:`, error.response?.data || error.message);
            return {};
        }
    }

    /**
     * Get list of operators for the website
     */
    async getOperators(websiteId) {
        try {
            const response = await this.api.get(`/website/${websiteId}/operators`);
            const operators = response.data.data || [];
            
            // Create a map of operator ID to operator name
            const operatorMap = {};
            operators.forEach(operator => {
                operatorMap[operator.user_id] = operator.details?.nickname || operator.email || 'Unknown Operator';
            });
            
            return operatorMap;
        } catch (error) {
            console.error('Error fetching operators:', error.response?.data || error.message);
            return {};
        }
    }

    /**
     * Export all conversations to CSV format
     */
    async exportConversationsToCSV(websiteId, options = {}) {
        try {
            console.log('Starting conversation export...');
            
            // Get operators first
            console.log('Fetching operators...');
            const operators = await this.getOperators(websiteId);
            console.log(`Found ${Object.keys(operators).length} operators`);

            // Get all conversation sessions
            console.log('Fetching conversation sessions...');
            const sessions = await this.getConversationSessions(websiteId, options);
            console.log(`Found ${sessions.length} conversation sessions`);

            if (sessions.length === 0) {
                console.log('No conversations found for the specified criteria');
                return this.generateEmptyCSV();
            }

            // Limit sessions for Vercel timeout (max 50 conversations per export)
            const maxSessions = 50;
            const limitedSessions = sessions.slice(0, maxSessions);
            
            if (sessions.length > maxSessions) {
                console.log(`Limiting export to ${maxSessions} conversations due to server timeout constraints. Total available: ${sessions.length}`);
            }

            const conversationData = [];
            let processedCount = 0;
            const startTime = Date.now();
            const maxProcessingTime = 45000; // 45 seconds max (leaving 5s buffer for Vercel)

            // Process each conversation session
            for (const session of limitedSessions) {
                try {
                    // Check if we're approaching timeout
                    if (Date.now() - startTime > maxProcessingTime) {
                        console.log(`Approaching timeout limit. Processed ${processedCount} conversations.`);
                        break;
                    }

                    processedCount++;
                    console.log(`Processing conversation ${processedCount}/${limitedSessions.length}: ${session.session_id}`);

                    // Get conversation metadata and messages in parallel
                    const [meta, messages] = await Promise.all([
                        this.getConversationMeta(websiteId, session.session_id),
                        this.getConversationMessages(websiteId, session.session_id)
                    ]);

                    // Extract user email from metadata
                    const userEmail = meta.email || meta.user?.email || 'Unknown';
                    
                    // Process each message in the conversation
                    if (messages && messages.length > 0) {
                        messages.forEach((message, index) => {
                            const senderName = this.getSenderName(message, operators);
                            
                            conversationData.push({
                                conversation_id: session.session_id,
                                user_email: userEmail,
                                message_number: index + 1,
                                sender_type: message.type || 'unknown',
                                sender_name: senderName,
                                message: this.cleanMessage(message.content),
                                timestamp: new Date(message.timestamp).toISOString(),
                                date: new Date(message.timestamp).toLocaleDateString(),
                                time: new Date(message.timestamp).toLocaleTimeString()
                            });
                        });
                    } else {
                        // Add entry for conversations with no messages
                        conversationData.push({
                            conversation_id: session.session_id,
                            user_email: userEmail,
                            message_number: 0,
                            sender_type: 'system',
                            sender_name: 'System',
                            message: 'No messages in this conversation',
                            timestamp: new Date(session.created_at || Date.now()).toISOString(),
                            date: new Date(session.created_at || Date.now()).toLocaleDateString(),
                            time: new Date(session.created_at || Date.now()).toLocaleTimeString()
                        });
                    }

                    // Add small delay to avoid rate limiting (reduced for faster processing)
                    if (processedCount % 5 === 0) {
                        await new Promise(resolve => setTimeout(resolve, 50));
                    }

                } catch (error) {
                    console.error(`Error processing session ${session.session_id}:`, error.message);
                    // Continue with next session
                }
            }

            console.log(`Processed ${conversationData.length} total messages from ${processedCount} conversations`);

            // Convert to CSV
            return this.convertToCSV(conversationData);

        } catch (error) {
            console.error('Error in exportConversationsToCSV:', error);
            throw error;
        }
    }

    /**
     * Get sender name based on message type and operators list
     */
    getSenderName(message, operators) {
        if (message.type === 'text' && message.from === 'operator') {
            return operators[message.user_id] || 'Unknown Operator';
        } else if (message.type === 'text' && message.from === 'user') {
            return 'User';
        } else if (message.from === 'operator') {
            return operators[message.user_id] || 'Operator';
        } else {
            return message.from || 'Unknown';
        }
    }

    /**
     * Clean and format message content
     */
    cleanMessage(content) {
        if (!content) return '';
        
        // Handle different content types
        if (typeof content === 'string') {
            return content.replace(/\n/g, ' ').replace(/\r/g, '').trim();
        } else if (typeof content === 'object') {
            // Handle structured content (like file uploads, etc.)
            if (content.text) {
                return content.text.replace(/\n/g, ' ').replace(/\r/g, '').trim();
            } else {
                return JSON.stringify(content);
            }
        }
        
        return String(content);
    }

    /**
     * Convert data to CSV format
     */
    convertToCSV(data) {
        if (!data || data.length === 0) {
            return this.generateEmptyCSV();
        }

        const fields = [
            'conversation_id',
            'user_email', 
            'message_number',
            'sender_type',
            'sender_name',
            'message',
            'timestamp',
            'date',
            'time'
        ];

        const parser = new Parser({ fields });
        return parser.parse(data);
    }

    /**
     * Generate empty CSV with headers
     */
    generateEmptyCSV() {
        const fields = [
            'conversation_id',
            'user_email',
            'message_number', 
            'sender_type',
            'sender_name',
            'message',
            'timestamp',
            'date',
            'time'
        ];

        const parser = new Parser({ fields });
        return parser.parse([]);
    }
}

module.exports = CrispService;
