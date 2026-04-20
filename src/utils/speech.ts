
/**
 * Utility for Text-to-Speech using the Web Speech API.
 */

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth && this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = this.loadVoices.bind(this);
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  /**
   * Speaks the given text in English (US or UK if available).
   */
  public speak(text: string) {
    if (!this.synth) {
      console.warn('Speech synthesis not supported in this browser.');
      return;
    }

    // Try to reload voices if none are available yet (common in Chrome)
    if (this.voices.length === 0) {
      this.voices = this.synth.getVoices();
    }

    // Cancel any ongoing speech
    this.synth.cancel();

    // Clean text: remove blank spaces like "_____" but keep ? and !
    const cleanedText = text
      .replace(/[_\-.]{2,}/g, ' ') // Remove sequences of underscores, dashes or dots
      .replace(/\s+/g, ' ')       // Unify spaces
      .trim();

    if (!cleanedText) return;

    // Small delay to ensure previous speech is fully cancelled
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(cleanedText);
      
      // Prioritize a "modern woman's" voice
      const voicePriorities = [
        'Google US English',
        'Samantha',
        'Microsoft Zira',
        'Microsoft Aria',
        'female'
      ];

      let enVoice: SpeechSynthesisVoice | null = null;
      
      // First, look for a specific priority voice that is English
      for (const priority of voicePriorities) {
        enVoice = this.voices.find(v => 
          v.lang.startsWith('en') && 
          v.name.toLowerCase().includes(priority.toLowerCase())
        ) || null;
        if (enVoice) break;
      }

      // Fallback to any English voice if no priority found
      if (!enVoice) {
        enVoice = this.voices.find(v => v.lang.startsWith('en-US')) || 
                  this.voices.find(v => v.lang.startsWith('en')) || null;
      }

      if (enVoice) {
        utterance.voice = enVoice;
      }

      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0; // Ensure volume is max
      
      if (this.synth) {
        this.synth.speak(utterance);
      }
    }, 50);
  }

  /**
   * Pre-warms the speech engine.
   */
  public preload() {
    this.loadVoices();
  }
}

export const speechService = new SpeechService();
