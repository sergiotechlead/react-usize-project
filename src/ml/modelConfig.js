import * as tf from '@tensorflow/tfjs';

// [back_cm, height_cm, weight_kg, age_years]
export const DEFAULT_INPUT_DATA = [
  [41, 157, 56, 22], [47, 174, 56, 28], [48, 157, 56, 35], [49, 157, 56, 42],
  [41, 174, 65, 23], [47, 170, 65, 30], [48, 170, 65, 37], [49, 170, 65, 45],
  [41, 183, 72, 24], [47, 183, 72, 32], [48, 174, 72, 39], [49, 183, 72, 48],
  [41, 157, 56, 26], [47, 157, 56, 33], [48, 157, 56, 40], [49, 174, 56, 44],
  [41, 170, 65, 27], [47, 174, 65, 31], [48, 170, 65, 38], [49, 170, 65, 46],
  [41, 174, 72, 25], [47, 183, 72, 34], [48, 183, 72, 41], [49, 174, 72, 50],
];

// One-hot labels [S, M, L, XL]
export const DEFAULT_LABELS = [
  [1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1],
  [1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1],
  [1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1],
  [1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1],
  [1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1],
  [1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1],
];

export const SIZE_LABELS = ['S', 'M', 'L', 'XL'];
export const SIZE_POSITIONS = { S: 12, M: 38, L: 62, XL: 88 };
export const SIZE_MAP = { S: [1,0,0,0], M: [0,1,0,0], L: [0,0,1,0], XL: [0,0,0,1] };
export const MODEL_KEY = 'localstorage://my-model-thm-size';

export function buildModel() {
  const model = tf.sequential({
    layers: [
      tf.layers.dense({ inputShape: [4], units: 100, activation: 'relu' }),
      tf.layers.dense({ units: 1000, activation: 'relu' }),
      tf.layers.dense({ units: 100,  activation: 'relu' }),
      tf.layers.dense({ units: 4,    activation: 'softmax' }),
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
  const data   = inputData ?? DEFAULT_INPUT_DATA;
  const targets = labels   ?? DEFAULT_LABELS;

  const xs = data.map(r => [r[0] / 200, r[1] / 250, r[2] / 250, r[3] / 100]);
  const inputTensor  = tf.tensor(xs, [xs.length, 4]);
  const outputTensor = tf.tensor(targets, [targets.length, 4]);
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
  const model = await tf.loadLayersModel(MODEL_KEY);
  const input = tf.tensor([[back / 200, height / 250, weight / 250, age / 100]], [1, 4]);
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
    const size = String(row.talla ?? row.Talla ?? row.TALLA ?? '').trim().toUpperCase();
    if (!SIZE_MAP[size]) { errors.push(`Fila ${i + 2}: talla inválida "${size}"`); return; }

    const back   = parseFloat(row.espalda_cm ?? row.espalda   ?? 0);
    const height = parseFloat(row.altura_cm  ?? row.altura    ?? 0);
    const weight = parseFloat(row.peso_kg    ?? row.peso      ?? 0);
    const age    = parseFloat(row['edad_años'] ?? row.edad    ?? 0);

    if (!back || !height || !weight || !age) {
      errors.push(`Fila ${i + 2}: valores incompletos`);
      return;
    }
    inputData.push([back, height, weight, age]);
    labels.push(SIZE_MAP[size]);
  });

  return { inputData, labels, errors };
}
