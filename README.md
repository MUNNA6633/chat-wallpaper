<div align="center">

# Chat Wallpaper

**Set an image or video wallpaper behind your AI chats, like WhatsApp.**

Works on ChatGPT, Gemini, Claude, Copilot, Perplexity, DeepSeek and Grok.

![Version](https://img.shields.io/badge/version-2.0.0-10a37f)
![Manifest](https://img.shields.io/badge/Manifest-V3-blue)
![License](https://img.shields.io/badge/license-MIT-lightgrey)
![Browsers](https://img.shields.io/badge/Chrome%20%7C%20Brave%20%7C%20Edge-supported-success)

</div>

<!-- Add a screenshot or GIF here once you have one:
![Chat Wallpaper in action](docs/screenshot.png)
-->

---

## Features

- **Image or video wallpaper**: use a photo, a GIF, or a short looping video (MP4 or WebM).
- **Full control**: adjust opacity, dim, blur, fit and video speed from the popup.
- **Two display modes**: *Behind* gives the cleanest look, *Overlay* works on any site.
- **Light on resources**: video pauses when the tab is hidden and is fully released when you turn it off.
- **Private by design**: no accounts, no tracking, no network requests. Everything stays in your browser.
- **Free and open source**.

## Supported sites

| Site | Address |
|------|---------|
| ChatGPT | chatgpt.com, chat.openai.com |
| Gemini | gemini.google.com |
| Claude | claude.ai |
| Copilot | copilot.microsoft.com |
| Perplexity | www.perplexity.ai |
| DeepSeek | chat.deepseek.com |
| Grok | grok.com |

## Installation

This extension is not on the Chrome Web Store yet, so you install it manually. It takes about a minute.

### Step 1: Download

- Go to the [**Releases**](../../releases) page and download `chat-wallpaper-v2.zip`, **or**
- Click the green **Code** button, then **Download ZIP**.

Unzip the file. You should see a folder that contains `manifest.json`.

### Step 2: Load it in your browser

1. Open the extensions page:
   - **Chrome:** `chrome://extensions`
   - **Brave:** `brave://extensions`
   - **Edge:** `edge://extensions`
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked**.
4. Select the folder that contains `manifest.json`.
5. Click the puzzle-piece icon in the toolbar and **pin** Chat Wallpaper.

### Step 3: Set your wallpaper

1. Open a supported chat site.
2. Click the Chat Wallpaper icon and choose an image or video.
3. Reload the chat tab if you don't see it right away.

## How to use

| Control | What it does |
|---------|--------------|
| **Enabled** | Turns the wallpaper on or off. |
| **Play video** | Pauses or plays a video wallpaper. |
| **Mode** | *Behind chat*: the wallpaper sits behind the page (best look). *Overlay*: the wallpaper sits on top at low opacity (works everywhere). |
| **Fit** | Cover, Contain, Stretch, or Tile (tile is for images and patterns). |
| **Opacity** | How visible the wallpaper is. Most useful in Overlay mode. |
| **Dim** | Darkens the wallpaper so text is easier to read. |
| **Blur** | Softens the wallpaper. Keep it modest on video. |
| **Speed** | Changes video playback speed. |

**Tips**

- Videos should be MP4 or WebM, under 20 MB. A 10 to 15 second 720p loop works best.
- A still image uses far less battery than a video.
- Subtle, low-contrast patterns (like the ones WhatsApp uses) are the easiest to read over.
- If the popup closes when you pick a file, click **Open in tab** and choose the file there.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Nothing shows up | Reload the chat tab. Check the extension is enabled and a file is chosen. |
| Looks wrong on one site | Switch **Mode** to **Overlay** and lower **Opacity**. |
| Text is hard to read | Increase **Dim**, add some **Blur**, or pick a calmer image. |
| Video won't load | Use MP4 (H.264) or WebM, under 20 MB. |
| Changes to the code don't appear | Click the refresh icon on the extension card, then reload the chat tab. |
| Browser is slow or battery drains | Use an image instead of a video, lower the blur, or use a lower-resolution clip. |

If something still doesn't work, open the chat page, press **F12**, check the **Console** for red errors, and [open an issue](../../issues) with what you see.

## Privacy

- Your wallpaper and settings are stored only in your browser's local extension storage.
- The extension does **not** read your conversations, send data anywhere, or use analytics.
- Permissions requested: `storage` and `unlimitedStorage` (to save your wallpaper), plus access to the supported chat sites (to draw the wallpaper on them).

You can verify all of this in the source code.

## How it works

1. The wallpaper is drawn inside a small page owned by the extension (`wallpaper.html`) and shown in a frame on top of or behind the chat page. Running it this way keeps the site's own security rules from blocking your image or video.
2. In **Behind** mode, a content script makes the large opaque background panels of the site transparent so the wallpaper shows through. It skips code blocks, buttons, inputs and dialogs, and re-checks as the chat changes.
3. In **Overlay** mode, the frame is simply placed above the page at low opacity.

## Project structure

```
chat-wallpaper/
├── manifest.json     Extension configuration (Manifest V3)
├── content.js        Places the wallpaper and clears page backgrounds
├── content.css       Backup styles for transparent containers
├── wallpaper.html    The wallpaper page shown inside the frame
├── wallpaper.css     Styles for the wallpaper page
├── wallpaper.js      Loads and plays the image or video
├── app.html          Popup and settings page
├── app.css           Settings page styles
├── app.js            Settings page logic and file handling
└── icons/            Extension icons (16, 48 and 128 px)
```

## Known limitations

- Chat sites change their layouts often. If a redesign breaks **Behind** mode, use **Overlay** until the code is updated.
- Large panels such as Claude's artifact view can become see-through in **Behind** mode.
- Videos are limited to 20 MB so they load quickly in every tab.

## Roadmap

- [ ] Different wallpaper per site
- [ ] Built-in gallery of patterns
- [ ] Separate light and dark wallpapers
- [ ] Firefox support
- [ ] Chrome Web Store release

## Contributing

Bug reports and pull requests are welcome.

1. Fork this repository.
2. Create a branch: `git checkout -b my-change`
3. Make your changes and test them by loading the folder as an unpacked extension.
4. Commit and push, then open a pull request.

## License

Released under the [MIT License](LICENSE).

## Disclaimer

Chat Wallpaper is an independent project. It is not affiliated with, endorsed by, or sponsored by OpenAI, Google, Anthropic, Microsoft, Perplexity, DeepSeek or xAI. All product names are trademarks of their respective owners and are used only to describe compatibility.
