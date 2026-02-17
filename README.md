# PosterMakerAI => https://poster-logo-generator-ai.vercel.app/

A full-stack web application for generating professional posters and logos using AI. Powered by Krea AI's flux-1-dev image generation model, PosterMakerAI provides an intuitive interface to create visually appealing designs for your events.

## Features

- **AI-Powered Generation**: Uses Krea AI's advanced image generation model
- **Flexible Design Types**: Generate posters or logos with customizable parameters
- **Customization Options**:
  - Event name and theme specification
  - Event type selection (Tech, Cultural, Academic, Sports, Music)
  - Multiple aspect ratio options (3:2, 1:1, 4:5, 16:9)
  - Additional prompt support for detailed customization
  - Optional event date inclusion
- **Real-time Preview**: View generated designs instantly
- **Download Functionality**: Download generated images as PNG files
- **Modern UI**: Glassmorphism design with dark theme
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

### Frontend

- HTML5
- CSS3 (with Glassmorphism effects)
- Vanilla JavaScript (ES6+)

### Backend

- Node.js with Express.js
- CORS support for cross-origin requests
- Environment-based configuration

### External APIs

- Krea AI API (flux-1-dev model for image generation)

## Project Structure

```
posterMakerAI/
├── package.json        # Project dependencies and scripts
├── vercel.json         # Vercel routing/build config
├── api/
│   └── index.js        # Express app (UI + API routes)
├── public/
│   ├── index.html      # Main HTML structure
│   ├── script.js       # Frontend logic and API interactions
│   └── style.css       # Styling and responsive design
└── img/
    └── logo.svg        # Application logo
```

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd posterMakerAI
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:
   Create a `.env` file in the root directory with:

```
KREA_API_TOKEN=your_krea_api_token_here
PORT=3000
```

## Usage

### Development

Start the backend server:

```bash
npm start
```

The server will run on `http://localhost:3000`

Open your browser and navigate to `http://localhost:3000` to access the application.

### Generating a Poster/Logo

1. Select the design type (Poster or Logo)
2. Enter the event name
3. Specify a theme (optional) - e.g., "Futuristic, neon, tech"
4. Select the event date (optional)
5. Choose the event type from the dropdown
6. Select desired aspect ratio
7. Add any additional design prompts (optional)
8. Click "Generate"

### Downloading Images

After generation:

- Click "Open Image" to view the design in a new tab
- Click "Download" to save the image to your device

## API Endpoints

### POST /generateposter

Generates a poster or logo based on the provided parameters.

**Request Body:**

```json
{
  "generationType": "poster|logo",
  "eventName": "string",
  "theme": "string (optional)",
  "date": "string (optional)",
  "eventType": "string",
  "extraPrompt": "string (optional)",
  "aspect_ratio": "3:2|1:1|4:5|16:9"
}
```

**Response:**

```json
{
  "href": "image_url"
}
```

### GET /download-image

Downloads an image from the Krea AI CDN with proper security validation.

**Query Parameters:**

- `url`: The image URL to download (must be from allowed hosts)

**Response:**

- Binary image file with appropriate content-type header

## Security Features

- CORS enabled for secure cross-origin requests
- Whitelist validation for image hosts (gen.krea.ai, krea.ai, cdn.krea.ai)
- Protocol validation (HTTPS only)
- Input sanitization for URLs
- Secure API token handling via environment variables

## Image Generation Details

### Supported Aspect Ratios

- 1:1 (1024x1024)
- 3:2 (1536x1024) - Default poster size
- 2:3 (1024x1536)
- 4:3 (1365x1024)
- 3:4 (1024x1365)
- 16:9 (1536x864)
- 9:16 (864x1536)

### Prompt Building

If no explicit prompt is provided, a detailed prompt is automatically constructed from:

- Design type (Poster or Logo)
- Event name
- Theme preferences
- Event type
- Default quality parameters (clear readable text, modern typography, high contrast)
- Additional user prompts

## Error Handling

The application handles various error scenarios:

- Missing API token
- Invalid image URLs
- API generation failures
- Network timeouts during image polling
- Download failures

Error messages are displayed in the status field for user feedback.

## Configuration

### Environment Variables

- `KREA_API_TOKEN`: Authentication token for Krea AI API (required)
- `PORT`: Server port (default: 3000)

### Image Processing

- Maximum request body size: 2MB
- Polling interval for job status: 2 seconds
- Maximum polling attempts: 50 (100 seconds timeout)

## Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

- User authentication and project history
- Batch generation capabilities
- Template library for quick customization
- Design editing interface
- Multiple format export options
- Rate limiting and usage analytics

## Dependencies

- **express**: Web server framework
- **cors**: Cross-origin resource sharing middleware
- **dotenv**: Environment variable management
- **@google/genai**: Google AI integration (included in dependencies)

## License

All rights reserved. PosterMakerAI 2025.

## Support

For issues, questions, or feedback, please open an issue in the repository.
