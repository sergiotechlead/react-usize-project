# USize — AI Size Predictor

A React application that uses a TensorFlow.js neural network to predict clothing sizes based on body measurements. Built as a portfolio project demonstrating machine learning in the browser.

![USize Preview](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white) ![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-4.x-FF6F00?logo=tensorflow&logoColor=white) ![Node](https://img.shields.io/badge/Node-20.x-339933?logo=nodedotjs&logoColor=white)

---

## Features

- **AI size prediction** — Feed-forward neural network trained in-browser using TensorFlow.js
- **In-browser training** — No server required; model weights are persisted to `localStorage`
- **Responsive dark UI** — Clean design with smooth animations and a modal overlay
- **No jQuery** — Pure React state management throughout

## How it works

1. **Train the model** — Click "Entrenar el modelo" to train the neural network in your browser. It learns to classify body measurements (back width, height, weight) into sizes S / M / L / XL using categorical cross-entropy and the Adam optimizer.
2. **Predict your size** — After training, open the predictor modal and enter your measurements. The model runs locally on your device.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 18.3 |
| ML Engine | TensorFlow.js 4.x |
| Bundler | Create React App (react-scripts 5) |
| Styling | CSS with custom properties |
| Runtime | Node 20 / npm 11 |

## Getting Started

### Prerequisites

- Node.js ≥ 20.0.0
- npm ≥ 11.0.0

### Install & run

```bash
npm install
npm start
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

### Build for production

```bash
npm run build
```

Output goes to the `build/` folder.

## Neural Network Architecture

```
Input  [3]   →  back_width / 200, height / 250, weight / 250
Dense  [100] →  ReLU
Dense  [1000] → ReLU
Dense  [100] →  ReLU
Output [4]   →  Softmax  →  [S, M, L, XL]
```

**Training config:** Adam (lr=0.001) · 201 epochs · categorical cross-entropy · shuffle

## Project Structure

```
src/
├── App/
│   ├── App.js              # Root component — layout, modal, routing
│   ├── App.css             # App-level styles
│   └── files/
│       └── styles-product.css  # Global CSS variables & reset
├── UsizeForm/
│   ├── index.js            # Measurement form & size result display
│   └── UsizeForm.css
├── TrainingModel/
│   ├── index.js            # In-browser training UI (no jQuery)
│   └── training-styles.css
└── index.js                # React entry point
```

## Deployment

The app is configured for GitHub Pages deployment:

```bash
npm run build
# Deploy the build/ folder to GitHub Pages
```

Live demo: [sergiotechlead.github.io/react-usize-project/build](https://sergiotechlead.github.io/react-usize-project/build/)

## License

MIT — see [LICENSE](LICENSE) for details.
