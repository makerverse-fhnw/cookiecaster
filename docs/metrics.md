# Cookiecaster Metrics

## Introduction
This page defines all useful metrics about Cookiecaster 2.0 and Cookiecaster 3.0 to compare them

## Current Versions

| Library | Version |
|----------|----------|
| canny-edge-detector | 1.0.0 |
| cropperjs | 1.5.11 |
| d3 | 5.7.0 |
| distance-to-line-segment | 0.2.0 |
| image-js | 0.31.4 |
| jquery | 3.3.1 |
| js-canny-edge-detector | github:petarjs/js-canny-edge-detector |
| js-file-download | 0.4.4 |
| parse-svg-path | 0.1.2 |
| point-in-polygon | 1.0.1 |
| prop-types | 15.6.2 |
| react | 16.6.0 |
| react-bootstrap | 0.32.4 |
| react-cropper | 2.1.7 |
| react-device-detect | 1.6.1 |
| react-dom | 16.6.0 |
| react-intl | 2.7.2 |
| react-popup | 0.9.3 |
| react-router-dom | 4.3.1 |
| react-scripts | 2.0.5 |
| stl | 1.1.1 |
| svg-path-contours | 2.0.0 |
| svgpath | 2.2.1 |
| video-react | 0.13.0 |
| body-parser | 1.19.0 |
| express | 4.17.1 |
| mongodb | 3.6.9 |
| path | 0.12.7 |



## Cookiecaster 2.0 Summary

### Frontend 
| Filename | Lines of Code | Imports Count | Classes | Class Functions | Functions | Comments Count | Description |
|----------|----------|----------|----------|----------|----------|----------|----------|
| imageuploadPopup.js   | 207 | 2 | - Prompt | - compontentDidUpdate<br>- onScaleModeChange<br>- onFileUrlChange<br>- openFileInput<br>- render<br> | - registerPopup | 6 |Render Popup for Image Upload |
| index.js | 11 | 8 | 0 | N/A | N/A | 0 |Entrypoint |
| registerPopup.js | 57 | 2 | - Prompt | - compontentDidUpdate<br>- _onChange_<br>- render | - registerPopup | 2 | Template for creating normal Popups |
| registerServiceWorker.js | 107 | 0 | 0 | N/A | - register<br>- registerValidSW<br>- checkValidServiceWorker<br>- unregiser | 28 | This file registers and manages a service worker to enable offline capabilities and faster loading by caching assets in a production React app |
| App.jsx | 31 | 16 | - App | - render | - addLocaleData | 0 | Entrypoint of React App |
| api/graph/Analysis.js | 81 | 2 | 0 | N/A | - analyzeGraph<br>- calcAngle<br>- createSegments<br>- checkDist | 23 | Calculation for Analyzing the Graph |
| api/graph/Edge.js | 40 | 0 | - Edge | - removeFromAdjacentNode<br>- getOtherNode<br>- asSvgPath | N/A | 12 | This Edge class represents a connection (edge) between two nodes in a graph, storing their endpoints and an optional control point for a curved path. |
| api/graph/Graph.js | 252 | 6 | - Graph | - instance<br>- backup<br>- restore<br>- nodeSize<br>- hasNode<br>- addNode<br>-getNode<br>- removeNode<br>- forEachNode<br>- edgeSize<br>- hasEdge<br>- addEdge<br>- getEdge<br>- removeEdge<br>- forEachEdge<br>- clear<br>- validate<br>- analyze<br>- toJSON<br>- fromJSON<br>- fromSvg | N/A | 79 | Heart of CookieCaster, the Graph itself |
| api/graph/Node.js | 55 | 0 | - Node | - registerAdjacentEdge<br>- unregisterAdjacentEdge<br>- getAdjacentNodes | N/A | 26 | This Node class represents a graph node that stores its position, connection limit, and adjacent edges, providing methods to register/unregister edges and retrieve connected nodes |
| api/graph/Rastering.js | 48 | 0 | 0 | N/A | - raster<br>- gx | 2 | Converts a line between two points into grid coordinates based on spacing |
| api/graph/Validation.js | 155 | 3 | 0 | N/A | - validateGraph<br>- trace<br>- traceForm<br>- traceEdge<br>- calcPathMeta<br> | 33 | Used for Validating the Graph |
| api/mesh/CreateMesh.js | 311 | 2 | 0 | N/A | - createMesh<br>- calcQ<br>- createOuterVertices<br>- createInnerVertices<br>- createConnectionVertices<br>- createFacet<br>- createFace<br>- createMeshSingleForm<br>- createMeshIOForm | 87 | Generates a 3D mesh from 2D shapes for STL export, adding thickness and height to create solid models |
| api/mesh/Vec.js | 125 | 0 | - Vec2<br>- Vec3 | - Vec2.add<br>- Vec2.sub<br>- Vec2.scale<br>- Vec2.cross<br>- Vec2.dot<br>- Vec2.lengthSquared<br>- Vec2.length<br>- Vec2.normalize<br>- Vec2.toVec3<br>- Vec3.add<br>- Vec3.sub<br>- Vec3.scale<br>- Vec3.cross<br>- Vec3.dot<br>- Vec3.lengthSquared<br>- Vec3.length<br>- Vec3.normalize | N/A | 0 | Defines 2D and 3D vector classes with basic math operations for geometry and mesh calculations |
| api/modi/AbstractMode.js | 18 | 1 | - AbstraceMode | - enableButtons<br>- enable<br>- onMouseDown<br>- onMouseMove<br>- onMouseUp<br>- onEscape<br>- disable | N/A | 5 | Abstract base class for interaction modes, managing UI button states and mouse event handlers. |
| api/modi/ModeDraw.js | 88 | 8 | - ModeDraw | - prev (2x) <br>- enable<br>- onMouseDown<br>- onMouseMove<br>- onEscape<br>- disable | N/A | 5 | Behavior in Mode Draw |
| api/modi/ModeMove.js | 57 | 5 | - ModeMove | - enable<br>- onMouseDown<br>- onMouseMove<br>- MouseUp<br>- onEscape<br>- disable | N/A | 5 | Behavior in Mode Move |
| api/modi/ModeRoate.js | 93 | 5 | - ModeRotate | - enable<br>- onMouseDown<br>- onMouseMove<br>- MouseUp<br>- onEscape<br>- disable | N/A | 6 | Behavior in Mode Rotate |
| api/modi/ModeSelect.js | 128 | 4 | - ModeSelect | - enable<br>- onMouseDown<br>- onMouseMove<br>- MouseUp<br>- onEscape<br>- disable | - checkMirror | 8 | Behavior in Mode Select |
| api/Controller.js | 241 | 9 | - Controller | - instance<br>- grid (2x)<br>- mode(2x)<br>- fixAtBoundary<br>- updatePoint<br>- mouseDown<br>- mouseUp<br>- mouseMove<br>- reset<br>- erase<br>- copy<br>- mirror<br>- escape | N/A | 9 | Behavior of the Control Buttons in CookieCaster |
| api/DBHandler.js | 105 | 0 | - DBHandler | - instance<br>- sendReq<br>- svae<br>- getAll<br>- get<br>- update<br>- delete | N/A | 46 | Handle Requests to DB |
| api/Intersections.js | 94 | 1 | 0 | N/A | - intersections<br>- intersect<br> | 22 | Finds intersection points between line segments using a sweep-line algorithm |
| api/Map.js | 102 | 0 | - Map | - size<br>- hasKey<br>- put<br>- putIfAbsent<br>- get<br>- remove<br>- clear<br>- forEach<br>- keys<br>- values | N/A | 43 | Own written Map for CookieCaster |
| api/SelectionHandler.js | 195 | 3 | - SelectionHandler | - singleEdge<br>- instance<br>- isAnySelected<br>- isNodeSelected<br>- selectedNodes<br>- isEdgeSelected<br>- selectedEdges<br>- isEdgeAffected<br>- affectedEdges<br>- selectNode<br>- selectEdge<br>- startRectSelection<br>- moveRectSelection<br>- endRectSelection<br>- cancelRectSelection<br>- isRectActive<br>- clear | N/A | 32 | How to handle Selects |
| api/SvgHandler.js | 372 | 3 | - SvgHandler | - get<br>- instance<br>- getRasterSpace<br>- getDrawingAreaSize<br>- resetMoveEdge<br>- setMoveEdgeTo<br>- setMoveEdgeVisible<br>- setRectSelection<br>- setRectSelectionVisible<br>- addNode<br>- updateNode<br>- selectNode<br>- removeNode<br>- setQEdgeVisibility<br>- setQEdge<br>- addEdge<br>- updateEdge<br>- removeEdge<br>- selectEdge<br>- setCritNodes<br>- setCritSeg<br>- setIntersections<br>- setZoomLevel<br>- getZoomLevels<br>- getZoomLevel<br>- getActZoomValue<br>- updateMessage<br>- clearWarnings<br>- clear | - rect | 53 | Manages SVG rendering of nodes, edges, selections, and warnings in a graph, including zoom and interactive updates |
| components/Imprint.jsx | 78 | 3 | - Imprint | - render | N/A | 0 | Appearence of Imprint Page |
| components/CustomNavBar.jsx | 58 | 5 | - CustomNavbar | - render | N/A | 0 | Appearance Custom Navigaation Bar |
| components/Error.jsx | 21 | 4 | - Error | - render | N/A | 0 | Appearance Error Page |
| components/Export.jsx | 155 | 11 | - Export | - handleChangeSize<br>- handleChangeThickness<br>- handleChangeHeight<br>- handleChangeFilename<br>- createMesh<br>- render | - validateGraph | 0 | Handle Export Page |
| components/Gallery.jsx | 84 | 9 | - Gallery | - handleSelect<br>- render<br>- componentnDidMount | N/A | 5 | Handle Gallery Page |
| componentes/Home.jsx | 48 | 6 | - Home | - render | N/A | 0 | Handle Home Page |
| components/Start.jsx | 646 | 17 | - Start | - changeGrid<br>- changeBackground<br>- loadProfile<br>- saveGraph<br>- imageHandler<br>- cropImage<br>- analyzeGraph<br>- createLinesY<br>- createLinesX<br>- render<br>- handleChange<br>- changeZoom<br>- componentDidMount | - validateGraph | 26 | Handle Start Page |
| components/About.jsx | 40 | 6 | - About | - render | N/A | 0 | Handler About Page |
| components/Templates/Dropdown.jsx | 33 | 3 | - Dropdown | - handleSelect<br>- render | N/A | 0 | Template for Dropdown Menues |
| components/Templates/SwitchButton.jsx | 33 | 3 | - SwitchButton | - change<br>- render | N/A | 0 | Template for Switch Buttons |

### Backend

| Filename | Lines of Code | Imports Count | Classes | Class Functions | Functions | Comments Count | Description |
|----------|----------|----------|----------|----------|----------|----------|----------|
| app.js | 35 | 0 | 0 | N/A | N/A | 1 | Entrypoint to API f Backend Service |
| dbs.js | 13 | 0 | 0 | N/A | - connect<br>- async | 0 | MongoDB Connection |
| routes.js | 106 | 0 | 0 | N/A | - createQuery<br>- checkName<br>- checkSvg<br>- 6x API routes | 1 | API Routes to handle REST Requests against the Backend |

## Metrics
### Cookiecaster 2.0
| Total Lines of Code | Total Count of Libraries | Total Count of CSS Files | Total Count of Files | Count of JSX Files | Count of JS Files | Count of Classes | Count of Functions | Count of Comments from Code | Count of Imports |
|----------|----------|----------|----------|----------|----------|----------|----------|----------|----------|
| 4323 | 31 | 10 | 38 | 11 | 37 | 28 | 238 | 565 | 147 |

* Imports are excluded from `Total Lines of Code`
