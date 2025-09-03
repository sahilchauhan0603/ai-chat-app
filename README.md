# AI Chat App - HelloAI

> **Live Demo**: [https://helloai-5ucr.onrender.com/](https://helloai-5ucr.onrender.com/)

A modern AI-powered chat application built with React, TypeScript, and Stream Chat. Features real-time messaging, AI writing assistance, and file upload capabilities.

## ✨ Features

### 🤖 AI Writing Assistant
- **Smart Writing Help**: Get assistance with business emails, content creation, and creative writing
- **Real-time Responses**: AI generates responses as you type
- **Context Awareness**: Maintains conversation context for better assistance

### 💬 Real-time Chat
- **Instant Messaging**: Real-time message delivery with Stream Chat
- **Message Editing**: Edit your messages within 24 hours
- **Message History**: Complete chat history and conversation threads
- **User Presence**: See when users are online/offline

### 📁 File Upload & Analysis
- **Multiple File Types**: Upload PDFs, images, documents, and text files
- **Drag & Drop**: Intuitive file upload interface
- **File Previews**: View images and file information before sending
- **AI Analysis**: Ask questions about uploaded files and get AI-powered insights

### 🎨 Modern UI/UX
- **Responsive Design**: Works perfectly on desktop and mobile
- **Dark/Light Mode**: Automatic theme switching based on system preference
- **Beautiful Components**: Built with shadcn/ui and Tailwind CSS
- **Smooth Animations**: Polished interactions and transitions

### 🔒 Security & Privacy
- **User Authentication**: Secure login and user management
- **Channel Privacy**: Private chat channels for each conversation
- **File Security**: Secure file handling and storage
- **Real-time Updates**: Live status updates and notifications

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Stream Chat account
- OpenAI API key or Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-chat-app.git
   cd ai-chat-app
   ```

2. **Install dependencies**
   ```bash
   # Install client dependencies
   cd client
   npm install
   
   # Install server dependencies
   cd ../server
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Client (.env)
   VITE_STREAM_API_KEY=your_stream_chat_api_key
   VITE_BACKEND_URL=http://localhost:3000
   
   # Server (.env)
   STREAM_API_KEY=your_stream_chat_api_key
   STREAM_API_SECRET=your_stream_chat_api_secret
   TAVILY_API_KEY=your_tavily_api_key
   GEMINI_API_KEY=your_gemini_api_key
   GEMINI_MODEL=gemini-2.5-pro
   GEMINI_TEMPERATURE=0.7
   GEMINI_TOP_P=0.95
   GEMINI_TOP_K=40
   ```

4. **Run the application**
   ```bash
   # Start server
   cd server
   npm run dev
   
   # Start client (in new terminal)
   cd client
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Stream Chat React** for real-time messaging
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Vite** for fast development

### Backend
- **Node.js** with TypeScript
- **Stream Chat** for chat infrastructure
- **AI Integration** with OpenAI and Google Gemini
- **WebSocket** for real-time communication

### Key Components
- **Chat Interface**: Main messaging area with AI assistance
- **File Upload**: Drag & drop file handling
- **Message Editing**: In-place message editing
- **AI Agent Control**: Manage AI assistant status
- **Responsive Sidebar**: Channel management and navigation

## 🔧 Configuration

### AI Models
- **OpenAI GPT-4**: Advanced language model for writing assistance
- **Google Gemini**: Alternative AI model for diverse responses
  - **Model**: Configurable (default: `gemini-2.5-pro`)
  - **Temperature**: Controls creativity (default: `0.7`)
  - **Top-P**: Controls response diversity (default: `0.95`)
  - **Top-K**: Controls vocabulary selection (default: `40`)
- **Web Search**: Real-time information gathering capabilities

### File Support
- **Images**: JPG, PNG, GIF, BMP, WebP
- **Documents**: PDF, DOC, DOCX, TXT, MD
- **Size Limits**: Configurable file size restrictions

### Gemini AI Configuration
You can customize the Gemini AI behavior by setting these environment variables:

```bash
# Model selection (default: gemini-2.5-pro)
GEMINI_MODEL=gemini-2.5-pro

# Response creativity (0.0 = focused, 1.0 = creative, default: 0.7)
GEMINI_TEMPERATURE=0.7

# Response diversity (0.0 = deterministic, 1.0 = diverse, default: 0.95)
GEMINI_TOP_P=0.95

# Vocabulary selection (higher = more diverse, default: 40)
GEMINI_TOP_K=40
```

## 📱 Usage

### Starting a Chat
1. Click "New Chat" to begin
2. Type your message or upload files
3. AI assistant automatically joins the conversation
4. Ask questions or request writing help

### File Upload
1. Drag & drop files onto the chat area
2. Or click the 📎 button to select files
3. Add your question about the files
4. AI analyzes content and responds

### Message Editing
1. Hover over your message
2. Click the edit button
3. Modify your text
4. Press Enter to send the edited version

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Stream Chat](https://getstream.io/) for real-time chat infrastructure
- [OpenAI](https://openai.com/) for AI language models
- [Google Gemini](https://ai.google.dev/) for alternative AI capabilities
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for utility-first CSS framework

---

**Made with ❤️ by [Your Name]**

For support, email: support@yourdomain.com

## UI Enhancements

### Custom Scrollbar
- Implemented custom scrollbar styling in `index.css` for improved visual appeal across WebKit and Firefox browsers, including width, height, track background, thumb color, opacity, border-radius, and hover effects.

### Loading Animation
- Created a new `LoadingAnimation` component in `src/components/ui/loading-animation.tsx` with customizable size and color, featuring spinning and pulsing CSS effects.
- Integrated `LoadingAnimation` into `chat-message.tsx` to replace the previous loading state, enhancing visual feedback.

### Animated Button
- Developed an `AnimatedButton` component in `src/components/ui/animated-button.tsx` supporting various animation types (pulse, bounce, scale, glow) and a gradient variant for dynamic interactions.
- Replaced the standard `Button` with `AnimatedButton` in `chat-input.tsx` for the send button, applying a `gradient` variant and `glow` animation when input is present.
- Integrated `AnimatedButton` into `chat-interface.tsx` for prompt suggestion buttons, using an `outline` variant and `scale` animation for consistency and dynamism.

### Animated Card
- Introduced an `AnimatedCard` component in `src/components/ui/animated-card.tsx` with animation types (hover, pulse, none) and variants (default, outline, ghost) to enhance UI elements.
- Utilized `AnimatedCard` in `chat-interface.tsx` for the `MessageListEmptyIndicator`, replacing the static div with a `ghost` variant and `pulse` animation for a more engaging empty state.

### Theme Toggle
- Created a `ThemeToggle` component in `src/components/ui/theme-toggle.tsx` for animated light/dark mode switching, leveraging `next-themes` and `lucide-react` for icons and smooth transitions.
- Integrated `ThemeToggle` into the header of `chat-interface.tsx` alongside `AIAgentControl` to provide easy access to theme switching.

## Server Explanations

### `server/src/index.ts`
- This file serves as the main entry point for the AI Writing Assistant server. It sets up the Express application, integrates middleware, and manages AI agent lifecycles.
- Key functionalities include:
    - **Initialization**: Sets up the Express app, body parsers, CORS, and initializes Stream Chat.
    - **AI Agent Management**: Uses `aiAgentCache` to store active AI agents and `pendingAiAgents` to track agents being created. Implements an inactivity timer to dispose of agents after 5 minutes of inactivity.
    - **API Endpoints**:
        - `GET /`: Basic health check endpoint.
        - `POST /start-ai-agent`: Initiates an AI agent for a given user and channel, creating a new agent if one doesn't exist or reactivating an existing one.
        - `POST /stop-ai-agent`: Stops and disposes of an AI agent for a specific channel.
        - `GET /agent-status`: Retrieves the current status of an AI agent for a given channel.
        - `POST /token`: Generates a client-side token for Stream Chat authentication.
    - **`disposeAiAgent` Function**: Handles the cleanup of AI agent resources, including stopping the agent and removing it from the cache.
    - **Server Startup**: Starts the Express server and listens for incoming requests on the configured port.

### `server/src/agents/createAgent.ts`
- This file contains the `createAgent` function, responsible for initializing and configuring AI agents based on the specified platform (e.g., `gemini`).
- Key functionalities include:
    - **Imports**: Imports necessary modules like `StreamChat`, `AIWritingAgent`, and `AgentPlatform`.
    - **`createAgent` Function**: Takes `user_id`, `channel_id`, and `platform` as parameters.
    - **Stream Chat Initialization**: Initializes the Stream Chat client with API key and secret.
    - **User Connection**: Connects the specified user to Stream Chat.
    - **Channel Watching**: Sets up a channel watcher to monitor messages in the given channel.
    - **Agent Instantiation**: Creates an instance of `AIWritingAgent` based on the provided `platform`.
    - **Return Value**: Returns the initialized `AIWritingAgent` instance.

### `server/src/agents/types.ts`
- This file defines the TypeScript interfaces and enums used for AI agents and messages within the application.
- Key definitions include:
    - **`AIAgent` Interface**: Defines the structure for an AI agent, including properties like `id`, `platform`, `status`, and methods for starting and stopping the agent.
    - **`AgentPlatform` Enum**: Enumerates the supported AI agent platforms (e.g., `gemini`).
    - **`WritingMessage` Interface**: Describes the structure of a message, including `id`, `text`, `user`, and `timestamp`.

## Data Persistence

This project leverages Stream Chat for user state and conversation history persistence, rather than a traditional database. Here's how it works:

1.  **User Authentication and Token Generation**: When a user interacts with the application, a `user_id` is generated (as seen in <mcfile name="index.ts" path="server/src/index.ts"></mcfile> in the `/start-ai-agent` and `/token` endpoints). This `user_id` is then used to create a secure token via `serverClient.createToken(userId)`. This token is essential for authenticating the user with the Stream Chat service.

2.  **Stream Chat as the Backend**: Instead of storing messages and user data in a local database, the application offloads this responsibility to Stream Chat. When you send a message, it's sent to the Stream Chat API, which then stores it in its own highly scalable and persistent infrastructure. This includes:
    -   **User Profiles**: Stream Chat maintains user profiles, including their `user_id` and any associated metadata.
    -   **Channel Data**: Each conversation is essentially a "channel" in Stream Chat. All messages sent within a channel are stored by Stream Chat.
    -   **Message History**: When you reconnect to a channel, Stream Chat provides the entire message history, making it appear as if your conversations are being saved locally.

3.  **AI Agent Management**: The server-side logic (<mcfile name="index.ts" path="server/src/index.ts"></mcfile>) manages the lifecycle of AI agents. While `aiAgentCache` and `pendingAiAgents` are in-memory caches on your server, they are primarily for managing the active instances of the AI agents and their immediate state (like inactivity). The actual conversation data that the AI agent processes and generates is sent to and stored by Stream Chat.

4.  **Client-Side Connection**: On the client side, the StreamChat client (<mcfile name="main.tsx" path="client/src/main.tsx"></mcfile> and `chat-provider.tsx`) connects to Stream Chat using the generated token. This connection allows the client to subscribe to channel updates, send messages, and retrieve past messages from Stream Chat's servers.

In summary, the persistence of user state and conversations is achieved by leveraging Stream Chat as a robust, cloud-based backend for all chat-related data. Your local application acts as a client that interacts with this service, rather than managing its own database for chat history.


## Room, Channel and Session

- Room: A user-facing term for a private conversation space. In this app, a “room” is just a Stream Chat channel shown in the UI (e.g., a “Writing Session” in the sidebar).

- Channel: The Stream Chat object that stores one conversation’s state—ID, members, messages, attachments, typing, etc. We create a messaging channel (UUID), add the user, then attach the AI agent via the backend `/start-ai-agent` flow. Routes map to it as `/chat/:channelId`.

- Session: The product term “Writing Session,” i.e., one persisted channel used for a specific task or thread. Sessions appear in the sidebar, can be renamed/deleted, have per-session AI controls (connect/disconnect, status), and keep their own history and members (user + AI).