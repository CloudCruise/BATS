# BATS (Browser Automation Testing Suite)

BATS is a specialized platform designed to generate dynamic UIs and websites that serve as testing environments for browser automation agents. The system creates realistic, interactive web pages with various UI elements, popups, and dynamic behaviors to challenge and validate browser automation tools.

## Purpose

This project addresses the need for comprehensive testing environments for browser automation agents by:

- **Generating Dynamic Test Sites**: Creates websites with complex UI patterns, modals, forms, and interactive elements
- **Agent Mode Testing**: Provides an integrated agent that can modify websites in real-time to test automation resilience
- **Disruption Simulation**: Intentionally moves buttons, adds decoy elements, and creates challenging scenarios for automation tools
- **Real-time Feedback**: Offers visual feedback and activity monitoring for agent interactions

## Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Modern UI component library
- **Lucide React** - Icon library

### AI & Automation

- **AI SDK** - Vercel's AI SDK for streaming and tool calling
- **OpenAI** - Language model for intelligent agent behavior
- **Langfuse** - LLM observability and prompt management
- **Zod** - Schema validation for tool inputs

### Development Tools

- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **TypeScript Config** - Type checking configuration

## Key Features

- **Website Generation**: AI-powered creation of test websites with various UI patterns
- **Agent Mode**: Integrated browser automation agent that can interact with and modify websites
- **Visual Highlighting**: Red outlines show agent-modified elements for easy identification
- **Streaming Interface**: Real-time updates and reasoning display during agent execution
- **Resizable Panels**: Flexible UI with draggable sidebars and responsive layout
- **Tool Integration**: Extensible tool system for various automation tasks

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Langfuse Configuration (Optional)
LANGFUSE_SECRET_KEY=your_langfuse_secret_key
LANGFUSE_PUBLIC_KEY=your_langfuse_public_key
LANGFUSE_BASEURL=https://cloud.langfuse.com
```

## Getting Started

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd BATS
   ```

2. **Install dependencies**

   ```bash
   cd frontend
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## Usage

### Generating Test Websites

1. Use the main interface to describe the type of website you want to generate
2. The AI will create a functional HTML page with interactive elements
3. Generated sites are saved and can be reused for testing

### Agent Mode

1. Select a generated website from the sidebar
2. Click "Start Agent" to begin automated testing
3. Watch as the agent analyzes and modifies the page in real-time
4. Monitor agent reasoning and tool usage in the activity feed

### Testing Browser Automation

- Use the generated websites as targets for your automation tools
- Test how your automation handles moved buttons, decoy elements, and dynamic content
- Validate resilience against UI changes and unexpected behaviors

## Architecture

The system consists of several key components:

- **Website Generator**: AI-powered HTML generation with realistic UI patterns
- **Agent Engine**: Browser automation agent with tool-calling capabilities
- **Tool System**: Extensible set of page manipulation tools (moveButton, insertButton, openPopup)
- **Visual Feedback**: Real-time highlighting of agent-modified elements
- **Activity Monitor**: Streaming display of agent reasoning and actions

## Contributing

This project is designed for testing and validating browser automation systems. Contributions that add new UI patterns, agent tools, or testing scenarios are welcome.
