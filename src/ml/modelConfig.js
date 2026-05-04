import * as tf from '@tensorflow/tfjs';

// [back_cm, height_cm, weight_kg, age_years]
// 15 samples × 6 sizes = 90 rows, ordered XS → S → M → L → XL → XXL
export const DEFAULT_INPUT_DATA = [
  // XS  (back 36–39, height 150–163, weight 43–55)
  [36, 152, 43, 20], [37, 155, 46, 23], [36, 158, 44, 26], [37, 152, 48, 19],
  [38, 155, 50, 31], [36, 160, 46, 25], [37, 158, 47, 33], [38, 152, 45, 22],
  [36, 163, 52, 28], [37, 155, 44, 36], [38, 160, 48, 21], [36, 152, 43, 41],
  [37, 158, 51, 27], [38, 155, 46, 30], [37, 163, 47, 24],

  // S   (back 39–43, height 155–170, weight 50–63)
  [41, 157, 56, 22], [40, 163, 52, 25], [42, 160, 57, 29], [40, 165, 55, 21],
  [41, 170, 58, 35], [42, 157, 54, 31], [40, 163, 61, 28], [41, 168, 56, 19],
  [42, 160, 58, 37], [41, 155, 53, 42], [40, 165, 57, 26], [42, 157, 60, 22],
  [41, 170, 54, 33], [40, 163, 56, 44], [42, 168, 59, 27],

  // M   (back 43–47, height 160–175, weight 60–76)
  [45, 168, 64, 31], [44, 165, 62, 27], [46, 172, 67, 24], [47, 170, 65, 38],
  [45, 175, 70, 22], [46, 168, 63, 33], [44, 172, 68, 29], [47, 165, 66, 41],
  [45, 170, 71, 25], [46, 175, 64, 36], [44, 168, 69, 30], [47, 163, 62, 19],
  [45, 172, 67, 43], [46, 165, 73, 28], [44, 175, 65, 34],

  // L   (back 47–51, height 165–183, weight 72–88)
  [48, 170, 73, 35], [49, 174, 78, 32], [50, 178, 82, 28], [48, 165, 75, 39],
  [49, 183, 80, 25], [50, 170, 76, 34], [48, 175, 79, 41], [49, 170, 75, 27],
  [50, 178, 84, 36], [48, 163, 74, 44], [49, 183, 81, 30], [50, 170, 77, 22],
  [48, 175, 83, 38], [49, 165, 72, 46], [50, 178, 80, 31],

  // XL  (back 51–55, height 168–188, weight 85–102)
  [51, 170, 86, 38], [52, 178, 88, 35], [53, 183, 92, 29], [54, 175, 95, 42],
  [51, 183, 89, 27], [52, 170, 90, 45], [53, 178, 93, 33], [54, 183, 96, 41],
  [51, 168, 87, 23], [52, 175, 91, 48], [53, 170, 88, 36], [54, 183, 94, 30],
  [51, 178, 86, 44], [52, 168, 97, 27], [53, 175, 92, 38],

  // XXL (back 55–62, height 168–190, weight 100–122)
  [56, 178, 102, 35], [58, 183, 108, 41], [60, 175, 115, 28], [57, 188, 105, 45],
  [59, 178, 110, 32], [61, 183, 118, 38], [56, 175, 103, 48], [58, 188, 112, 29],
  [60, 183, 120, 43], [57, 178, 107, 36], [59, 175, 114, 25], [61, 188, 119, 50],
  [56, 183, 104, 40], [58, 178, 109, 33], [60, 175, 116, 27],
];

// One-hot labels: [XS, S, M, L, XL, XXL]
export const DEFAULT_LABELS = [
  // XS
  [1,0,0,0,0,0],[1,0,0,0,0,0],[1,0,0,0,0,0],[1,0,0,0,0,0],[1,0,0,0,0,0],
  [1,0,0,0,0,0],[1,0,0,0,0,0],[1,0,0,0,0,0],[1,0,0,0,0,0],[1,0,0,0,0,0],
  [1,0,0,0,0,0],[1,0,0,0,0,0],[1,0,0,0,0,0],[1,0,0,0,0,0],[1,0,0,0,0,0],
  // S
  [0,1,0,0,0,0],[0,1,0,0,0,0],[0,1,0,0,0,0],[0,1,0,0,0,0],[0,1,0,0,0,0],
  [0,1,0,0,0,0],[0,1,0,0,0,0],[0,1,0,0,0,0],[0,1,0,0,0,0],[0,1,0,0,0,0],
  [0,1,0,0,0,0],[0,1,0,0,0,0],[0,1,0,0,0,0],[0,1,0,0,0,0],[0,1,0,0,0,0],
  // M
  [0,0,1,0,0,0],[0,0,1,0,0,0],[0,0,1,0,0,0],[0,0,1,0,0,0],[0,0,1,0,0,0],
  [0,0,1,0,0,0],[0,0,1,0,0,0],[0,0,1,0,0,0],[0,0,1,0,0,0],[0,0,1,0,0,0],
  [0,0,1,0,0,0],[0,0,1,0,0,0],[0,0,1,0,0,0],[0,0,1,0,0,0],[0,0,1,0,0,0],
  // L
  [0,0,0,1,0,0],[0,0,0,1,0,0],[0,0,0,1,0,0],[0,0,0,1,0,0],[0,0,0,1,0,0],
  [0,0,0,1,0,0],[0,0,0,1,0,0],[0,0,0,1,0,0],[0,0,0,1,0,0],[0,0,0,1,0,0],
  [0,0,0,1,0,0],[0,0,0,1,0,0],[0,0,0,1,0,0],[0,0,0,1,0,0],[0,0,0,1,0,0],
  // XL
  [0,0,0,0,1,0],[0,0,0,0,1,0],[0,0,0,0,1,0],[0,0,0,0,1,0],[0,0,0,0,1,0],
  [0,0,0,0,1,0],[0,0,0,0,1,0],[0,0,0,0,1,0],[0,0,0,0,1,0],[0,0,0,0,1,0],
  [0,0,0,0,1,0],[0,0,0,0,1,0],[0,0,0,0,1,0],[0,0,0,0,1,0],[0,0,0,0,1,0],
  // XXL
  [0,0,0,0,0,1],[0,0,0,0,0,1],[0,0,0,0,0,1],[0,0,0,0,0,1],[0,0,0,0,0,1],
  [0,0,0,0,0,1],[0,0,0,0,0,1],[0,0,0,0,0,1],[0,0,0,0,0,1],[0,0,0,0,0,1],
  [0,0,0,0,0,1],[0,0,0,0,0,1],[0,0,0,0,0,1],[0,0,0,0,0,1],[0,0,0,0,0,1],
];

export const SIZE_LABELS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

// Position on fit-meter (0–100): XS = tight side, XXL = loose side
export const SIZE_POSITIONS = { XS: 8, S: 22, M: 38, L: 55, XL: 70, XXL: 86 };

export const SIZE_MAP = {
  XS:  [1,0,0,0,0,0],
  S:   [0,1,0,0,0,0],
  M:   [0,0,1,0,0,0],
  L:   [0,0,0,1,0,0],
  XL:  [0,0,0,0,1,0],
  XXL: [0,0,0,0,0,1],
};

// Size aliases accepted in uploaded Excel files
const SIZE_ALIASES = { '2XL': 'XXL', '2X': 'XXL', 'XXLARGE': 'XXL', 'XLARGE': 'XL', 'XSMALL': 'XS' };

// v2 key — forces re-train when users had the old 4-class model cached
export const MODEL_KEY = 'localstorage://usize-model-v2';

export function buildModel() {
  const numClasses = SIZE_LABELS.length;
  const model = tf.sequential({
    layers: [
      tf.layers.dense({ inputShape: [4], units: 100,        activation: 'relu' }),
      tf.layers.dense({                  units: 1000,       activation: 'relu' }),
      tf.layers.dense({                  units: 100,        activation: 'relu' }),
      tf.layers.dense({                  units: numClasses, activation: 'softmax' }),
    ],
  });
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });
  return model;
}

export async function trainModel({ inputData, labels, epochs = 201, onEpoch } = {}) {
  const data    = inputData ?? DEFAULT_INPUT_DATA;
  const targets = labels    ?? DEFAULT_LABELS;
  const numClasses = SIZE_LABELS.length;

  const xs = data.map(r => [r[0] / 200, r[1] / 250, r[2] / 250, r[3] / 100]);
  const inputTensor  = tf.tensor(xs,      [xs.length,      4]);
  const outputTensor = tf.tensor(targets, [targets.length, numClasses]);
  const model = buildModel();

  const result = await model.fit(inputTensor, outputTensor, {
    epochs,
    shuffle: true,
    callbacks: onEpoch
      ? {
          onEpochEnd: async (epoch, logs) => {
            onEpoch(epoch, logs);
            await tf.nextFrame();
          },
        }
      : undefined,
  });

  await model.save(MODEL_KEY);
  tf.dispose([inputTensor, outputTensor]);
  return result;
}

export async function predictSize(back, height, weight, age) {
  const model  = await tf.loadLayersModel(MODEL_KEY);
  const input  = tf.tensor([[back / 200, height / 250, weight / 250, age / 100]], [1, 4]);
  const output = model.predict(input);
  const values = Array.from(output.dataSync()).map(v => Math.round(v * 100) / 100);
  const maxIndex = values.indexOf(Math.max(...values));
  tf.dispose([input, output]);
  return SIZE_LABELS[maxIndex] ?? 'M';
}

export function parseExcelRows(rows) {
  const inputData = [];
  const labels    = [];
  const errors    = [];

  rows.forEach((row, i) => {
    const raw  = String(row.talla ?? row.Talla ?? row.TALLA ?? '').trim().toUpperCase();
    const size = SIZE_ALIASES[raw] || raw;

    if (!SIZE_MAP[size]) {
      const valid = SIZE_LABELS.join(', ');
      errors.push(`Fila ${i + 2}: talla inválida "${raw}" — válidas: ${valid}`);
      return;
    }

    const back   = parseFloat(row.espalda_cm  ?? row.espalda ?? 0);
    const height = parseFloat(row.altura_cm   ?? row.altura  ?? 0);
    const weight = parseFloat(row.peso_kg     ?? row.peso    ?? 0);
    const age    = parseFloat(row['edad_años'] ?? row.edad   ?? 0);

    if (!back || !height || !weight || !age) {
      errors.push(`Fila ${i + 2}: valores incompletos`);
      return;
    }
    inputData.push([back, height, weight, age]);
    labels.push(SIZE_MAP[size]);
  });

  return { inputData, labels, errors };
}
