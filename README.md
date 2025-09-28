# gmTV- IPTV Player UI

A modular, feature-rich IPTV/video player JavaScript controller. This code manages channel loading (m3u/m3u8/mp4/ts/dash), playlist switching, theme toggling, local storage histories, touch/mouse navigation, accessibility, and user feedback (snackbar/notice overlays). Designed for a modern, responsive UI, it leverages [Feather Icons](https://feathericons.com) for elegant SVG icons.

***

## Features

- **Feather Icons Setup** – Dynamic SVG icon replacement and updates.
- **A11y Button Focus & Navigation** – Ensures keyboard-friendly control with [role="button"] and Enter/Space triggers.
- **Snackbar Notifications** – In-app, timed snackbar alerts with color coding for success, warning, and errors.
- **Theme Management** – Four switchable themes, with local storage persistence and icon reflecting the current mode.
- **Channel Playlist Handling** – Load, select, and cache playlists from built-in demos, URL, or file uploads.
- **UI Feedback** – Loading overlays, empty state messages, and status bar messages.
- **History & Favorites** – Save, render, and clear playlist upload history and favorite channels, using localStorage.
- **Player Controls** – Play/pause, mute, volume slider, fullscreen toggle, and feedback updates on status changes.
- **Touch & Swipe Gestures** – Channel switching via horizontal swipe on touch devices, with debounce.
- **Header Bar Auto-Hide** – Desktop/tablet "playlist bar" shows/hides based on user interaction (mouse/touch/keyboard).
- **Resilient Error Handling** – User-friendly messages upon network, format, or player errors.
- **Mobile Responsive Support** – UI adapts for smaller screens; advanced gestures enabled for mobile usability.

***

## Code Structure

### 1. UI Helpers

- **Feather Icon Setup:**  
  ```js
  function runFeather(){ if(window.feather) feather.replace(); }
  document.addEventListener('DOMContentLoaded', runFeather);
  ```
  Runs and updates all Feather icons when DOM is ready.

- **Button Accessibility:**
  ```js
  function focusLargeBtns() { ... }
  ```
  Adds keyboard support and tab order for custom UI buttons.

- **Snackbar**
  ```js
  function showSnackbar(txt, type="") { ... }
  ```
  Displays notification bar with context-based styling.

### 2. Theming

- Themes are switched via `setTheme(mode)`, updating `<body>` classes, icon, and saving selection in `localStorage`.
- Theme types: `'dark' | 'light' | 'purple' | 'green'`.

### 3. Core DOM Reference

All major UI elements are cached at the top for efficient reuse, from player controls to overlays, playlist management components, lists, and upload panels.

### 4. Playlist & Channel Management

- **Default Playlists:**  
  Demo m3u playlist URLs are built-in for instant start.
- **Selection Logic:**  
  Current playlist state is tracked and UI updates accordingly.
- **Parsing:**  
  `parsePlaylist(content)` auto-detects M3U/m3u8 formats and extracts channel metadata.

### 5. Player Logic

- **Handles:**  
  - MPEG-DASH (dash.js)
  - HLS/m3u8 (hls.js)
  - Standard `<video>` (mp4)
- Automatically switches renderer and updates UI elements at each step.

### 6. Upload, URL Handling & History

- Drag-and-drop or manual upload supported (with chunked reads for large files).
- Playlists from external URLs can be loaded.
- Upload/fetch operations are recorded into upload history, capped at 120 records.

### 7. Accessibility & Input

- **Keyboard shortcuts:**  
  Escape to close overlays; key-trap support for custom controls.
- **Touch events:**  
  - Swiping the container changes channel.
  - Tap and focus-based interactions for mobile clarity.

### 8. Playlist Bar & Notice System

- Automated bar hiding on mouse out, focus loss, or timer.  
- Notices provide modal tips, upload/favorite/clear actions.

***

## Main Functional Methods

| Function               | Purpose                                              |
|------------------------|-----------------------------------------------------|
| `runFeather`           | Replace all icon elements with SVGs                 |
| `setTheme`             | Change theme and icon, store in localStorage        |
| `showSnackbar`         | Display action feedback with status coloring        |
| `parsePlaylist`        | Interpret m3u/m3u8 text and extract channels        |
| `renderChannels`       | Display all (or favorite) channels in UI            |
| `selectAndPlayChannel` | Highlight, play, and update UI on chosen channel    |
| `handlePlaylistUpload` | Upload m3u files via FileReader, parse, and display |
| `swipeChannel`         | Allow channel surfing by swipe gesture              |

***

## Usage & Customization

- **Dependencies:**  
  Requires Feather Icons script, Hls.js, dash.js, and a compatible HTML/CSS container structure.
- **Custom Playlists:**  
  Upload m3u/m3u8 via file, drag-drop, or direct URL.
- **Favorites/History:**  
  Always local and private – no server storage.

***

## Accessibility & Responsive Notes

- ARIA role and hotkey support improve keyboard and screen reader navigation.
- Layout and controls adapt for touch/mobile, including swipe channel switching.
- Color variables for themes and feedback states are suitable for dark/light environments.

***

## Contribution

Feel free to fork, extend UI, adapt or submit issues and PRs for new features.  
Test on various browsers and report device-specific edge cases.

***

## License

MIT License. See LICENSE file for details.

***
