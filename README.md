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
