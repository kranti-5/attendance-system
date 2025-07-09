# Face++ API Setup Guide

This attendance system now uses Face++ API for face recognition, which offers a generous free tier.

## Getting Started with Face++

### 1. Sign Up for Face++ API
1. Go to [Face++ Console](https://console.faceplusplus.com/)
2. Create a free account
3. Navigate to "API Key" section
4. Create a new API Key and API Secret

### 2. Free Tier Limits
- **1,000 API calls per month** (free)
- **Face Detection**: 1,000 calls/month
- **Face Search**: 1,000 calls/month  
- **Face Compare**: 1,000 calls/month
- **Face Set Management**: 1,000 calls/month

### 3. Environment Variables
Add your Face++ credentials to your environment variables:

```bash
# .env file (if using Expo with dotenv)
FACEPP_API_KEY=your_api_key_here
FACEPP_API_SECRET=your_api_secret_here
```

Or set them in your app configuration:

```typescript
// In your app configuration
process.env.FACEPP_API_KEY = 'your_api_key_here';
process.env.FACEPP_API_SECRET = 'your_api_secret_here';
```

### 4. How It Works

#### Face Detection
- Detects faces in captured images
- Returns face tokens for further processing
- Validates single face detection for attendance

#### Employee Registration
- When adding/updating employees, faces are stored in a Face++ faceset
- Each employee gets a unique face token
- Faces are automatically added to the "attendance-system-employees" faceset

#### Attendance Verification
- Captured attendance photos are searched against the faceset
- Returns confidence scores and employee matches
- Requires 60% confidence threshold for verification

### 5. API Endpoints Used

- **Face Detection**: `/detect` - Detects faces in images
- **Face Search**: `/search` - Searches for faces in faceset
- **Face Compare**: `/compare` - Compares two face tokens
- **Faceset Management**: `/faceset/create`, `/faceset/addface`

### 6. Fallback Mode
If API credentials are not configured, the system runs in simulation mode:
- Simulates face detection and recognition
- Provides realistic confidence scores
- Allows testing without API setup

### 7. Security Notes
- API keys are stored securely in environment variables
- Face data is stored on Face++ servers (not locally)
- All API calls use HTTPS encryption
- Face tokens are used instead of raw images for comparisons

### 8. Troubleshooting

#### Common Issues:
1. **"API credentials not configured"** - Set your Face++ API key and secret
2. **"No face detected"** - Ensure good lighting and clear face visibility
3. **"Multiple faces detected"** - Ensure only one person is in the frame
4. **"Person not found"** - Employee may not be registered or photo quality is poor

#### API Limits:
- Monitor your usage in the Face++ console
- Free tier resets monthly
- Consider upgrading for production use

### 9. Production Considerations
- Upgrade to paid plan for higher limits
- Implement rate limiting
- Add error handling for API failures
- Consider local face recognition for offline capability
- Implement face data backup strategies

## Alternative Free APIs

If Face++ doesn't meet your needs, consider these alternatives:

1. **Kairos API** - 500 free API calls/month
2. **Lambda Labs** - 1,000 free API calls/month  
3. **DeepAI** - 5,000 free API calls/month
4. **Cloudinary** - Face detection included in free tier

Each API has different features and limits, so choose based on your specific requirements. 