# Next Mind Map App

A lightweight mind mapping app built with Next.js, designed to visualize your markdown notes similar to Obsidian's graph view.

## Features

- **Markdown Integration**: Automatically reads `.md` files from a local directory
- **Wiki-link Support**: Detects `[[wikilinks]]` to create connections between notes
- **Auto-refresh**: Monitors your markdown files and updates the graph every 3 seconds
- **Orphan Detection**: Shows grey nodes for links that don't have corresponding files
- **Interactive Graph**: Drag nodes, add/edit/delete manually, and explore your knowledge graph
- **Export/Import**: Save and restore your mind map layouts as JSON
- **Clean UI**: Minimalist design with floating nodes and smooth animations

## Tech Stack

* **Framework:** Next.js (App Router)
* **UI:** React
* **Styling:** Tailwind CSS
* **Icons:** lucide-react
* **Language:** TypeScript

## Getting Started

### Prerequisites

Make sure you have the following installed:
* Node.js (v18 or later recommended)
* npm, yarn, or pnpm

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/daveydhruti/next-mindmap-app.git
cd next-mindmap-app
npm install
```

### Running the App

Start the development server:

```bash 
npm run dev
```

Open this in your browser:

```
http://localhost:3000
```

### Building for Production

```bash
npm run build
npm start
```

## Usage

### Loading Your Markdown Files

1. When the app starts, enter the full path to your markdown directory (e.g., `/Users/yourname/Documents/notes`)
2. The app will scan all `.md` files and create a visual graph
3. Files become purple nodes, and `[[wikilinks]]` create connections
4. Links to non-existent files appear as grey "orphan" nodes

### Graph Interactions

- **Click** a node to select it
- **Drag** nodes to reposition them
- **Double-click** a node to rename it
- **Right-click** for context menu (add child, edit, delete)
- **Delete/Backspace** key to remove selected node
- **Auto-refresh** toggles automatically update the graph when files change

**Note:** Adding and editing notes will not work when auto-refresh is on. This is because this app is supposed to reflect what's in your markdown files. If you do wish to use these features, turn-off auto-refresh and export it.

### Menu Options

- **Load Directory**: Change the markdown folder being visualized
- **Refresh Now**: Manually reload files
- **Auto-Refresh**: Toggle automatic 3-second refresh (ON by default)
- **Export**: Save current layout as JSON
- **Import**: Restore a previously exported layout

### Markdown Format

Your markdown files should use wiki-style links:

```markdown
# My Note

This connects to [[Another Note]] and [[Some Concept]].

You can have multiple [[links]] in a single file.
```

## Scripts

Available npm scripts:

* `npm run dev` – Start the development server
* `npm run build` – Build the app for production
* `npm start` – Run the production build
* `npm run lint` – Run ESLint

## How It Works

The app uses a Next.js API route (`/api/read-markdown`) to read your local markdown files server-side. It:

1. Scans the specified directory for `.md` files
2. Extracts all `[[wikilinks]]` from each file
3. Creates nodes for each file (purple) and orphan links (grey)
4. Draws connections based on the wiki-links
5. Auto-refreshes every 3 seconds to detect changes

## License

This project is licensed under the **MIT License**. See the [LICENSE](./LICENSE) file for details.

---

Parts of this project (including writing and improvements) were assisted by Claude AI.
