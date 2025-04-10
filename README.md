### README for Chrome Extension

## Fireflies`<>`Asana Connect Chrome Extension

A Chrome extension that connects Fireflies.ai meeting transcripts with Asana and Monday.com, allowing you to easily send meeting summaries, notes, and action items to your project management tools.





### Features

- **Fireflies.ai Integration**: Access your recent meeting transcripts directly from the extension
- **Asana Integration**: Send meeting summaries and notes to Asana projects
- **Monday.com Integration**: Create or update items in Monday.com boards with meeting information
- **Action Item Management**: Automatically extract and create tasks from meeting action items
- **Duplicate Prevention**: Intelligently detects existing meetings to prevent duplicates
- **Meeting History**: Maintains a chronological record of meetings in your Asana project


### Installation

#### From Chrome Web Store (Recommended)

1. Visit the [Chrome Web Store](https://chrome.google.com/webstore) and search for "Fireflies`<>`Asana Connect"
2. Click "Add to Chrome" and confirm the installation
3. The extension icon will appear in your browser toolbar


#### Manual Installation (Developer Mode)

1. Download or clone this repository to your local machine
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top-right corner
4. Click "Load unpacked" and select the folder containing the extension files
5. The extension icon will appear in your browser toolbar


### Required API Keys

To use this extension, you'll need:

1. **Fireflies.ai API Key**: Obtain from your Fireflies.ai account settings
2. **Asana Personal Access Token**: Generate from your Asana account settings
3. **Monday.com API Token** (Optional): Generate from your Monday.com developer settings


### Setup

1. Click the extension icon in your browser toolbar
2. Enter your API keys in the setup screen
3. Click "Save API Keys"


### Usage

#### Viewing Meeting Transcripts

1. Click the extension icon to open the popup
2. Select a meeting from the dropdown menu
3. View the meeting summary, notes, and action items


#### Sending to Asana

1. Select a meeting from the dropdown
2. Ensure "Enable Asana integration" is checked
3. Select your Asana workspace and project
4. Review and select action items to be created as tasks
5. Click "Send to Integrations"


#### Sending to Monday.com

1. Select a meeting from the dropdown
2. Ensure "Enable Monday CRM integration" is checked
3. Select your Monday workspace and board
4. Either:

1. Select an existing item to update, or
2. Check "Create new item instead" and enter a name



5. Click "Send to Integrations"


### How It Works

- **Meeting Notes**: The extension adds a "FIREFLIES MEETING NOTES" section to your Asana project description, containing chronologically ordered meeting summaries
- **Action Items**: Selected action items are created as tasks in your Asana project
- **Monday.com Updates**: Meeting information is added as updates to existing or new items in Monday.com


### Troubleshooting

- **API Key Issues**: Ensure your API keys are correct and have the necessary permissions
- **No Meetings Showing**: Try clicking the "Refresh" button to reload meetings
- **Duplicate Prevention**: The extension checks for existing meetings by URL to prevent duplicates
- **Error Messages**: Check the status message at the bottom of the popup for specific error details


### Privacy & Security

- Your API keys are stored locally in your browser's secure storage
- No data is sent to our servers; all API calls are made directly from your browser to the respective services
- The extension requires minimal permissions, only accessing the specific APIs needed for functionality


### Support

For issues, feature requests, or questions, please [open an issue](https://github.com/yourusername/fireflies-asana-connect/issues) on our GitHub repository.


### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request


### License

This project is licensed under the MIT License - see the LICENSE file for details.

### Support

For issues, feature requests, or questions, please [open an issue](https://github.com/yourusername/fireflies-integration-portal/issues) on our GitHub repository.