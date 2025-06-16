# Crisp Conversation Exporter

A full-stack web application built with Node.js and Express that allows you to export all your Crisp conversations to CSV format.

## Features

- **Easy-to-use web interface** with Bootstrap styling
- **Secure API integration** with Crisp REST API
- **Complete conversation export** including:
  - Conversation ID
  - User Email
  - Operator Names (matched from operator list)
  - All messages with timestamps
  - Message sender information
- **Date range filtering** (optional)
- **CSV download** with proper formatting
- **Loading states** and error handling
- **Responsive design** that works on all devices

## Prerequisites

Before running this application, make sure you have:

1. **Node.js** (version 14 or higher) installed on your system
2. **Crisp API credentials** (New 2024 method):
   - Token Identifier
   - Token Key
   - Website ID

### Getting Crisp API Credentials (Updated 2024)

**⚠️ Important:** Crisp has updated their authentication method. You now need to use the Crisp Marketplace.

#### Step 1: Create Crisp Marketplace Account
1. Go to **[Crisp Marketplace](https://marketplace.crisp.chat/)**
2. **Sign in** or create account (different from main Crisp account)

#### Step 2: Create a Plugin
1. Go to **"Plugins"** → **"New Plugin"**
2. Select **"Private"** plugin type
3. Name it "Conversation Exporter"
4. Click **"Create"**

#### Step 3: Get Your Tokens
1. In your plugin → **"Tokens"** tab
2. Scroll to **"Development Token"** section
3. Copy **Token Identifier** and **Token Key**

#### Step 4: Add Trusted Workspace
1. Go to **[Marketplace Settings](https://marketplace.crisp.chat/settings/)**
2. Click **"Add Trusted Workspace"**
3. Enter your **Website ID** and main Crisp credentials

#### Step 5: Find Website ID
1. Go to **[Crisp Dashboard](https://app.crisp.chat/)**
2. Check URL: `https://app.crisp.chat/website/YOUR-WEBSITE-ID/`
3. Or go to Settings → Website Settings → General

## Installation

1. **Clone or download** this project to your local machine

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   npm start
   ```
   
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to:
   ```
   http://localhost:3000
   ```

## Usage

1. **Fill in the form** with your Crisp credentials:
   - **Crisp Identifier**: Your API Key ID
   - **Crisp Key**: Your API Secret  
   - **Website ID**: Your Crisp Website ID
   - **Date Range** (optional): Filter conversations by date

2. **Click "Export Conversations"**

3. **Wait for processing**: The app will fetch all conversations and compile them into CSV format

4. **Download**: The CSV file will automatically download to your computer

## CSV Output Format

The exported CSV contains the following columns:

| Column | Description |
|--------|-------------|
| `conversation_id` | Unique identifier for each conversation |
| `user_email` | Email address of the user (if available) |
| `message_number` | Sequential number of message in conversation |
| `sender_type` | Type of sender (user, operator, system) |
| `sender_name` | Name of the message sender |
| `message` | The actual message content |
| `timestamp` | ISO timestamp of the message |
| `date` | Human-readable date |
| `time` | Human-readable time |

## API Endpoints

- `GET /` - Serves the main application
- `GET /api/health` - Health check endpoint
- `POST /api/export-conversations` - Export conversations to CSV

## Error Handling

The application includes comprehensive error handling for:

- **Invalid API credentials**
- **Network connectivity issues**
- **Rate limiting**
- **Missing or invalid data**
- **Server errors**

## Security Notes

- API credentials are only used for the duration of the export request
- Credentials are not stored or logged
- All communication with Crisp API uses HTTPS
- The application runs locally on your machine

## Troubleshooting

### Common Issues

1. **"npm: command not found"**
   - Install Node.js from [nodejs.org](https://nodejs.org/)

2. **"Invalid Crisp API credentials"**
   - Double-check your API Key ID and Secret
   - Ensure your API key has the necessary permissions

3. **"Website ID not found"**
   - Verify your Website ID is correct
   - Check that your API key has access to this website

4. **Export takes a long time**
   - This is normal for accounts with many conversations
   - The app processes conversations in batches to avoid rate limits

5. **Empty CSV file**
   - Check your date range filters
   - Verify there are conversations in the specified time period

## Development

### Project Structure

```
crisp-conversation-exporter/
├── public/
│   ├── index.html          # Frontend HTML
│   └── script.js           # Frontend JavaScript
├── services/
│   └── crispService.js     # Crisp API integration
├── server.js               # Express server
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

### Dependencies

- **express**: Web server framework
- **axios**: HTTP client for API requests
- **json2csv**: Convert JSON data to CSV format
- **cors**: Enable cross-origin requests
- **multer**: Handle multipart/form-data

## License

MIT License - feel free to use and modify as needed.

## Support

If you encounter any issues:

1. Check the browser console for error messages
2. Check the server console for detailed logs
3. Verify your Crisp API credentials and permissions
4. Ensure your internet connection is stable

For Crisp API documentation, visit: https://docs.crisp.chat/api/v1/
