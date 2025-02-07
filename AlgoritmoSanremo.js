import _ from 'lodash';
import { winners } from './winners.js';
import { songs2025 } from './songs2025.js';

// Funzione per pulire e analizzare il testo
function analyzeText(text) {
    const cleanText = text.toLowerCase()
        .replace(/[.,\/#!?$%\^&\*;:{}=\-_`~()]/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();
    
    const words = cleanText.split(" ");
    const sentences = text.split(/[.!?]+/).filter(s => s.length > 0);
    
    // TTR
    const uniqueWords = new Set(words);
    const ttr = uniqueWords.size / words.length;
    
    // Densità ripetizioni
    const wordFreq = _.countBy(words);
    const repeatedWords = Object.values(wordFreq).filter(count => count > 1);
    const repetitionDensity = repeatedWords.length / words.length;
    
    // Temi ricorrenti
    const themes = [
        'amore', 'vita', 'tempo', 'cuore', 'mondo', 
        'solitudine', 'memoria', 'famiglia', 'notte',
        'cielo', 'strada', 'luce', 'mare', 'sole', 
        'casa', 'occhi', 'mano', 'silenzio', 'vento',
        'anima', 'dolore', 'stelle', 'luna', 'sogno'
    ];
    
    const themeMatches = themes.filter(theme => cleanText.includes(theme));
    const themeScore = themeMatches.length / themes.length;
    
    // Pattern strutturali
    const repeatedPhrases = text.match(/(.{10,}?).*?\1/g) || [];
    const structureScore = Math.min((repeatedPhrases.length / sentences.length) * 1.5, 1);
    
    return {
        ttr,
        repetitionDensity,
        themeScore,
        structureScore
    };
}

// Analizza i vincitori e crea benchmark
const winningMetrics = Object.entries(winners).map(([id, text]) => analyzeText(text));

const benchmarks = {
    ttr: _.meanBy(winningMetrics, 'ttr'),
    repetitionDensity: _.meanBy(winningMetrics, 'repetitionDensity'),
    themeScore: _.meanBy(winningMetrics, 'themeScore'),
    structureScore: _.meanBy(winningMetrics, 'structureScore')
};

const stdDevs = {
    ttr: Math.sqrt(_.meanBy(winningMetrics, m => Math.pow(m.ttr - benchmarks.ttr, 2))) || 0.1,
    repetitionDensity: Math.sqrt(_.meanBy(winningMetrics, m => Math.pow(m.repetitionDensity - benchmarks.repetitionDensity, 2))) || 0.1,
    themeScore: Math.sqrt(_.meanBy(winningMetrics, m => Math.pow(m.themeScore - benchmarks.themeScore, 2))) || 0.1,
    structureScore: Math.sqrt(_.meanBy(winningMetrics, m => Math.pow(m.structureScore - benchmarks.structureScore, 2))) || 0.1
};

// Funzione per calcolare similarità
function calculateSimilarity(metrics, benchmarks, stdDevs) {
    const zScores = {
        ttr: Math.abs(metrics.ttr - benchmarks.ttr) / stdDevs.ttr,
        repetitionDensity: Math.abs(metrics.repetitionDensity - benchmarks.repetitionDensity) / stdDevs.repetitionDensity,
        themeScore: Math.abs(metrics.themeScore - benchmarks.themeScore) / stdDevs.themeScore,
        structureScore: Math.abs(metrics.structureScore - benchmarks.structureScore) / stdDevs.structureScore
    };
    
    const similarities = _.mapValues(zScores, z => Math.exp(-z));
    
    const weights = {
        ttr: 0.25,
        repetitionDensity: 0.25,
        themeScore: 0.30,
        structureScore: 0.20
    };
    
    return _.sum(_.map(similarities, (val, key) => val * weights[key]));
}

// Analizza canzoni 2025
const results = Object.entries(songs2025).map(([artist, text]) => {
    const metrics = analyzeText(text);
    const similarity = calculateSimilarity(metrics, benchmarks, stdDevs);
    return {
        artist,
        similarity,
        metrics
    };
}).sort((a, b) => b.similarity - a.similarity);

// Output CSV
console.log("Artista,Similarità con i vincitori");
results.forEach(({artist, similarity}) => {
    console.log(`${artist},${similarity.toFixed(3)}`);
});

// Output dettagli
console.log("\nDETTAGLI ANALISI:");
results.forEach(({artist, similarity, metrics}) => {
    console.log(`\n${artist}:`);
    console.log(`- Similarità con i vincitori: ${similarity.toFixed(3)}`);
    console.log(`- TTR: ${metrics.ttr.toFixed(3)}`);
    console.log(`- Densità ripetizioni: ${metrics.repetitionDensity.toFixed(3)}`);
    console.log(`- Score temi: ${metrics.themeScore.toFixed(3)}`);
    console.log(`- Score struttura: ${metrics.structureScore.toFixed(3)}`);
});