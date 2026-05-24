export interface WordObject {
  text: string;
  delay: number;
  isNewLine: boolean;
}

export function calculateWordDelays(text: string): WordObject[] {
  const BASE_DELAY = 0.3;
  const PUNCTUATION_PAUSE = 0.4;
  const LINE_BREAK_PAUSE = 0.6;
  
  const words: WordObject[] = [];
  let currentDelay = 0;
  
  const lines = text.split("\n");
  
  lines.forEach((line, lineIndex) => {
    const lineWords = line.split(/\s+/).filter(w => w.length > 0);
    
    lineWords.forEach((word, wordIndex) => {
      words.push({
        text: word,
        delay: Number(currentDelay.toFixed(2)),
        isNewLine: lineIndex > 0 && wordIndex === 0
      });
      
      currentDelay += BASE_DELAY;
      
      // If the word ends with punctuation, add a pause
      if (/[.,!?;...]$/.test(word)) {
        currentDelay += PUNCTUATION_PAUSE;
      }
    });
    
    if (lineIndex < lines.length - 1) {
      currentDelay += LINE_BREAK_PAUSE;
    }
  });
  
  return words;
}
