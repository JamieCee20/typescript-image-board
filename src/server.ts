import app from "./app.js";

// Entry point. Deliberately minimal — all wiring lives in app.ts, so
// the app can be imported (and tested) without opening a port.
const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
