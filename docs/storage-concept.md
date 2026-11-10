# Storage Concept - CookieCaster 3.0

This document describes how drawing data is stored and managed locally in CookieCaster 3.0.  
All data is stored client-side using the browser's **Local Storage** and **Session Storage**.  
No server or cloud storage is required.

---

## Storage Architecture

| Storage | Purpose | Lifetime |
|----------|----------|-----------|
| **Local Storage** | Stores all saved drawings (graph JSON and SVG path) | Persistent until browser data is cleared |
| **Session Storage** | Temporarily stores the selected drawing ID when switching pages (Gallery → Start) | Removed when the tab is closed |

---
## JSON of Local Storage and Session Storage

### 1. When saving a drawing "permanently, it will be saved in this JSON format under the key "drawings"
```json
{
  "id": "string",                  // Unique ID, e.g. "drawing-<timestamp>" or "temp-autosave"
  "name": "string",                // User-defined name of the drawing
  "graphJSON": {                   // Full serialized graph from Graph.instance.toJSON()
    "nodes": [
      {
        "id": "string",            // Node identifier
        "x": "number",             // X coordinate
        "y": "number"              // Y coordinate
      }
    ],
    "edges": [
      {
        "id": "string",            // Edge identifier
        "source": "string",        // ID of the source node
        "target": "string",        // ID of the target node
        "control": {               // Quadratic control point (optional)
          "x": "number",
          "y": "number"
        }
      }
    ]
  },
  "svgPath": "string",             // SVG path string for quick gallery preview
  "saved": "boolean",              // true for saved drawings, false for temporary autosaves
  "timestamp": "string (ISO8601)"  // e.g. "2025-10-20T14:02:05.123Z"
}

```

### 2. Used for temporary gallery selection
```json
{
  "selectedDrawingId": "string"
}
```

---
## Data Flow Overview

### 1. Initialization / New Drawing

When the drawing tool starts or a new drawing is created, temporary unsaved entries are removed from Local Storage:

```js
const drawings = getAllDrawings().filter(d => d.saved);
saveAllDrawings(drawings);
```

Only drawings with `saved: true` remain.  
Temporary autosaves (`saved: false`) are deleted to ensure a clean start.

---

### 2. Automatic Temporary Save (Autosave)

During drawing, an automatic temporary save is created each time the user interacts with the canvas:

```js
const temp = {
  id: "temp-autosave",
  name: "Temporary",
  graphJSON: graph.toJSON(),
  saved: false,
  timestamp: new Date().toISOString(),
};
```

This object is stored in Local Storage.  
When the page reloads, the system automatically attempts to restore it:

```js
const temp = getAllDrawings().find((d) => !d.saved);
if (temp) Graph.instance.fromJSON(temp.graphJSON);
```

This ensures that unsaved work is not lost during an accidental refresh or tab reload.

---

### 3. Manual Save to Gallery

When the user chooses **"Save to Gallery"**, the current graph is not validated, serialized, and permanently stored:

```js
const payload = {
  id: "drawing-" + Date.now(),
  name: userInputName,
  graphJSON: Graph.instance.toJSON(),
  svgPath: data.forms.map(f => f.path).join(" "),
  saved: true,
  timestamp: new Date().toISOString(),
};

const drawings = getAllDrawings();
drawings.push(payload);
saveAllDrawings(drawings);
```

Saved drawings (`saved: true`) persist in Local Storage and are displayed in the gallery view.

---

### 4. Loading a Drawing from the Gallery

When a drawing is selected in the gallery, its ID is stored in Session Storage:

```js
sessionStorage.setItem("selectedDrawingId", drawing.id);
```

When the user navigates back to `/start`, the app detects the selection and loads the drawing:

```js
document.querySelector("#reset")?.click();
await new Promise((resolve) => setTimeout(resolve, 50));

const json = typeof drawing.graphJSON === "string"
  ? drawing.graphJSON
  : JSON.stringify(drawing.graphJSON);

Graph.instance.fromJSON(json);
SvgHandler.instance.updateMessage();

Controller.instance.mode = Controller.instance.modi.MODE_SELECT;
Controller.instance.mode.enable();
```

The existing canvas is cleared first, and the new drawing is loaded in **Select Mode** to avoid unintended modifications.

---

### 5. Data Lifecycle

| State | Description |
|--------|-------------|
| `saved: false` | Temporary autosave, deleted when starting a new drawing |
| `saved: true` | Permanently stored in Local Storage until cleared manually |
| Session Storage | Contains only `selectedDrawingId`, removed after loading |

---

## Summary

| Action | Result |
|---------|---------|
| Start or New Drawing | Removes all unsaved drawings |
| Drawing | Automatically creates a temporary autosave (`saved: false`) |
| Save to Gallery | Creates a new persistent drawing (`saved: true`) |
| Load from Gallery | Clears current drawing, loads selected one, sets mode to Select |
| Close Browser | Saved drawings remain until manually cleared |

---

## Core Functions

| Function | Description |
|-----------|-------------|
| `getAllDrawings()` | Reads all drawings from Local Storage |
| `saveAllDrawings(drawings)` | Writes drawings back to Local Storage |
| `clearUnsavedDrawings()` | Removes temporary autosave entries |
| `saveGraph()` | Saves the current drawing permanently until it isn't cleared manually |
| `loadDrawing()` | Loads the selected gallery drawing after reset |
| `useEffect(autoSaveRestore)` | Automatically restores temporary autosaves on reload |

---

## Benefits

- Works completely offline  
- Fast and lightweight (no network operations)  
- Safe: no accidental overwrites (thanks to `saved` flag)  
- Simple and extendable (easy to add tags, previews, etc.)

---

Version: October 2025  
Author: CookieCaster Development Team  
Component: Local and Session Storage Management
