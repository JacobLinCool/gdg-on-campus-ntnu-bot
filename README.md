# GDG on Campus: NTNU Bot

A Discord bot that helps GDG on Campus: NTNU (National Taiwan Normal University) instructors manage students in a classroom environment, track lab completion, and organize students into groups.

## Features

### Classroom & Lab Management

- **Classroom & Group Setup**: Create classrooms and assign students to discussion or lab groups.
- **Live Enrollment Tracking**: Monitor student enrollment and group assignments in real time.
- **Lab Session Control**: Start lab sessions, let students mark completion, and track their progress live.
- **Completion Insights**: View lab completion statistics by group and student.

### Simple QA Chatbot

- **In-Chat Support**: Mention the bot or reply to its messages to ask questions about GDG events.
- **Bevy API Integration**: Pulls real-time data from GDG community events.
- **Powered by Gemini**: Uses Google Gemini models for accurate, conversational answers.

> Currently, the bot is designed to be stateless, meaning it does not retain any information about users or their interactions in the database or any other persistent storage.

## Setup

### Prerequisites

- Node.js 22 or higher
- pnpm 10.x (recommended)
- Discord Bot Token and Application ID
- Google Gemini API Key

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```sh
DISCORD_TOKEN=your_discord_bot_token
DISCORD_APP_ID=your_discord_application_id
GEMINI_API_KEY=your_gemini_api_key
```

### Installation

```sh
# Install dependencies
pnpm install

# Build the project
pnpm build

# Start the bot
pnpm start
```

### Development

```bash
# Run in development mode with hot reloading
pnpm dev
```

## Deployment

### Docker Deployment

Ｕse Docker Compose:

```sh
docker compose up -d
```

### Kubernetes Deployment

1. Build and push your Docker image to a container registry:

   ```sh
   docker build -t your-registry/gdg-on-campus-ntnu-bot:latest .
   docker push your-registry/gdg-on-campus-ntnu-bot:latest
   ```

2. Update the image reference in `k8s/deployment.yaml` to match your registry path.

3. Create a secrets file from the template:

   ```sh
   cp k8s/secrets-template.yaml k8s/secrets.yaml
   ```

4. Edit `k8s/secrets.yaml` to include your actual credentials and ensure to add it to `.gitignore` to prevent committing secrets.

5. Apply the Kubernetes configurations:

   ```sh
   kubectl apply -f k8s/secrets.yaml
   kubectl apply -f k8s/deployment.yaml
   ```

6. Check deployment status:

   ```sh
   kubectl get pods -l app=gdg-on-campus-ntnu-bot
   kubectl logs -l app=gdg-on-campus-ntnu-bot
   ```

## Commands

| Command              | Description                                              |
| -------------------- | -------------------------------------------------------- |
| `/create-classroom`  | Creates a new classroom thread with optional group count |
| `/start-lab`         | Starts a new lab session in the current classroom        |
| `/check-status`      | Check completion status for a specific student           |
| `/lab-stats`         | Shows overall lab completion statistics                  |
| `/enrollment-status` | Displays current student enrollment across groups        |
| `/invite-link`       | Generates an invite link for the bot                     |

## AI Interactions

Mention the bot or reply to its messages to ask questions about GDG events. The bot uses Google's Gemini AI to provide information about:

- Upcoming events
- Past events
- Event details (speakers, locations, tickets, etc.)

## License

MIT
