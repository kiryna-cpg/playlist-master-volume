# Playlist Master Volume

System-agnostic Foundry VTT module for managing playlist volumes more conveniently.

This module adds:

- A **Master Volume** control to **Edit Playlist** (Playlist configuration) to set the volume of **all tracks** in the playlist at once.
- A **gear icon (⚙️)** next to playlist titles in the **Playlists sidebar** to open **Edit Playlist** directly (permission-aware).
- **Module Settings** configuration to show/hide the icon and decide its position.

---

## Features

### Master Volume (Edit Playlist)

- Adds a **Master Volume** slider (same look & feel as Foundry’s native *Sound Volume* control).
- Includes an **Apply** button to apply changes immediately (no need to click *Update Playlist*).
- When you click **Update Playlist**, the module also enforces the current Master Volume value for all tracks.
- The numeric value is clamped to **0.00–1.00** and always shown with **2 decimals**.
- Uses Foundry’s internal audio mapping (`AudioHelper.inputToVolume / volumeToInput`) so values behave exactly like the native controls.

### Sidebar gear button (permission-aware)

- Adds a ⚙️ button next to each playlist name in the **Playlists** directory.
- **Only shown** to users who can edit that playlist (GM or users with OWNER permission).
- Clicking opens the playlist’s **Edit Playlist** sheet.

### Localization

- English (`en`) and Spanish (`es`) translations are included.
- All UI strings are pulled from i18n files (system-agnostic).

---

## Requirements

- Foundry VTT: **v13**
- No system dependencies (system agnostic)
- No module dependencies

---

## Installation

1. Foundry → **Add-on Modules** → **Install Module**
2. Paste the module’s manifest URL (from your release / repository)
3. Install, then enable it in your world:
   - **World → Manage Modules → enable “Playlist Master Volume”**

---

## Support / Issues

Report issues or request improvements here:

```txt
https://github.com/kiryna-cpg/playlist-master-volume/issues
```

---

## License

MIT. See `LICENSE`.
