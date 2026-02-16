# Changelog

All notable changes to this project will be documented in this file.

This project follows Semantic Versioning with a compatibility convention: the major version matches the supported Foundry VTT major version (e.g. 13.x for Foundry v13), and minor/patch versions reflect feature and fix releases.


## [13.1.1] - 2026-02-16
### Fixed
- Custom Settings UI: fixed selector logic so the custom settings layout is correctly applied in Foundry v13 by targeting settings form groups via the underlying input/select `name` attributes (instead of relying on a missing `data-setting-id` attribute). This ensures the `{gear}` placeholder is replaced with the native gear icon in the settings descriptions.


## [13.1.0] - 2026-02-14
### Added
- Module Settings: added a custom Settings UI for the module, with a native gear icon and a cleaner layout:
  - **Quick Edit** toggle (show/hide the Edit Playlist shortcut in the Playlists sidebar).
  - **Position** selector (Left of title / Right in controls).
- Reload confirmation dialog shown when module settings change:
  - Title: **Reload Required**
  - Buttons: **Reload Now** / **Reload Later**

### Changed
- Sidebar Edit Playlist shortcut (⚙) placement can now be configured (left of title or right in controls).
- Settings labels and descriptions updated to shorter, release-ready wording.

### Fixed
- Prevented the sidebar shortcut icon from wrapping to a second line when the playlist control strip contains additional buttons (e.g., Create Sound + Mode + Play).
- Localization now works correctly for all module strings (EN/ES), including settings and reload dialog.

## [0.0.10] - 2026-02-14
### Fixed
- Wrap fix for gear icon.
- Adjustment in setting options' texts.
### Added
- Standard reload dialog.

## [0.0.9] - 2026-02-14
### Added
- Module Setting for hiding/show Edit Playlist's icon.
- Module Setting for Edit Playlist's icon position.

## [0.0.8] - 2026-02-14
### Fixed
- Sidebar gear button was not appearing in Foundry v13 Playlists sidebar due to using `data-document-id`. The sidebar uses `data-entry-id` for playlist entries; the injection now supports both.
- Sidebar injection now targets the native controls container (`.playlist-header .playlist-controls`) and renders the gear as a native-looking icon button to match Foundry UI.

## [0.0.7] - 2026-02-14
### Added
- Full localization (i18n) support:
  - Added `lang/en.json` and `lang/es.json`.
  - All UI strings (labels, hints, tooltips, notifications) are now pulled from i18n keys.
- Added `languages` section to `module.json` for proper Foundry language loading.

## [0.0.6] - 2026-02-14
### Changed
- Master Volume control now uses Foundry's native `<range-picker>` component to match core UI styling (same look & feel as the Sound Volume control).
- Master Volume numeric input is now clamped to 0–1 and always displayed/rounded to **2 decimals**.

### Added
- Added a permission-aware gear icon (⚙️) in the Playlists sidebar to open **Edit Playlist** directly.
  - Visible only to users who can edit the playlist (GM or OWNER).

## [0.0.5] - 2026-02-14
### Added
- Added an **Apply** button to the Master Volume control to apply changes immediately (without needing to click Update Playlist).
- Clicking **Update Playlist** now also enforces the current Master Volume value across all sounds before saving.

## [0.0.4] - 2026-02-14
### Fixed
- Master Volume values now behave consistently with Foundry audio controls by converting between UI input and stored volume using:
  - `AudioHelper.inputToVolume`
  - `AudioHelper.volumeToInput`

## [0.0.3] - 2026-02-14
### Added
- Master Volume control injected into **Edit Playlist (PlaylistConfig)** to set the volume of all tracks in a playlist at once.

---
