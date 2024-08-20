import { GPT3Tokenizer } from "./GPT3Tokenizer";
import { TextChunk, Tokenizer } from "../utils/types";

const ALPHANUMERIC_CHARS =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export interface TextSplitterConfig {
  separators: string[];
  keepSeparators: boolean;
  chunkSize: number;
  chunkOverlap: number;
  tokenizer: Tokenizer;
  docType?: string;
}

export class TextSplitter {
  private readonly _config: TextSplitterConfig;

  public constructor(config?: Partial<TextSplitterConfig>) {
    this._config = Object.assign(
      {
        keepSeparators: false,
        chunkSize: 400,
        chunkOverlap: 40,
      } as TextSplitterConfig,
      config
    );

    // Create a default tokenizer if none is provided
    if (!this._config.tokenizer) {
      this._config.tokenizer = new GPT3Tokenizer();
    }

    // Use default separators if none are provided
    if (!this._config.separators || this._config.separators.length === 0) {
      this._config.separators = this.getSeparators();
    }

    // Validate the config settings
    if (this._config.chunkSize < 1) {
      throw new Error("chunkSize must be >= 1");
    } else if (this._config.chunkOverlap < 0) {
      throw new Error("chunkOverlap must be >= 0");
    } else if (this._config.chunkOverlap > this._config.chunkSize) {
      throw new Error("chunkOverlap must be <= chunkSize");
    }
  }

  public split(text: string): TextChunk[] {
    // Get basic chunks
    const chunks = this.recursiveSplit(text, this._config.separators, 0);

    const that = this;
    function getOverlapTokens(tokens?: number[]): number[] {
      if (tokens != undefined) {
        const len =
          tokens.length > that._config.chunkOverlap
            ? that._config.chunkOverlap
            : tokens.length;
        return tokens.slice(0, len);
      } else {
        return [];
      }
    }

    // Add overlap tokens and text to the start and end of each chunk
    if (this._config.chunkOverlap > 0) {
      for (let i = 1; i < chunks.length; i++) {
        const previousChunk = chunks[i - 1];
        const chunk = chunks[i];
        const nextChunk = i < chunks.length - 1 ? chunks[i + 1] : undefined;
        chunk.startOverlap = getOverlapTokens(
          previousChunk.tokens.reverse()
        ).reverse();
        chunk.endOverlap = getOverlapTokens(nextChunk?.tokens);
      }
    }

    return chunks;
  }

  private recursiveSplit(
    text: string,
    separators: string[],
    startPos: number
  ): TextChunk[] {
    const chunks: TextChunk[] = [];
    if (text.length > 0) {
      // Split text into parts
      let parts: string[];
      let separator = "";
      const nextSeparators = separators.length > 1 ? separators.slice(1) : [];
      if (separators.length > 0) {
        // Split by separator
        separator = separators[0];
        parts =
          separator == " " ? this.splitBySpaces(text) : text.split(separator);
      } else {
        // Cut text in half
        const half = Math.floor(text.length / 2);
        parts = [text.substring(0, half), text.substring(half)];
      }

      // Iterate over parts
      for (let i = 0; i < parts.length; i++) {
        const lastChunk = i === parts.length - 1;

        // Get chunk text and endPos
        let chunk = parts[i];
        const endPos =
          startPos + (chunk.length - 1) + (lastChunk ? 0 : separator.length);
        if (this._config.keepSeparators && !lastChunk) {
          chunk += separator;
        }

        // Ensure chunk contains text
        if (!this.containsAlphanumeric(chunk)) {
          continue;
        }

        // Optimization to avoid encoding really large chunks
        if (chunk.length / 6 > this._config.chunkSize) {
          // Break the text into smaller chunks
          const subChunks = this.recursiveSplit(
            chunk,
            nextSeparators,
            startPos
          );
          chunks.push(...subChunks);
        } else {
          // Encode chunk text
          const tokens = this._config.tokenizer.encode(chunk);
          if (tokens.length > this._config.chunkSize) {
            // Break the text into smaller chunks
            const subChunks = this.recursiveSplit(
              chunk,
              nextSeparators,
              startPos
            );
            chunks.push(...subChunks);
          } else {
            // Append chunk to output
            chunks.push({
              text: chunk,
              tokens: tokens,
              startPos: startPos,
              endPos: endPos,
              startOverlap: [],
              endOverlap: [],
            });
          }
        }

        // Update startPos
        startPos = endPos + 1;
      }
    }

    return this.combineChunks(chunks);
  }

  private combineChunks(chunks: TextChunk[]): TextChunk[] {
    const combinedChunks: TextChunk[] = [];
    let currentChunk: TextChunk | undefined;
    let currentLength = 0;
    const separator = this._config.keepSeparators ? "" : " ";
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (currentChunk) {
        const length = currentChunk.tokens.length + chunk.tokens.length;
        if (length > this._config.chunkSize) {
          combinedChunks.push(currentChunk);
          currentChunk = chunk;
          currentLength = chunk.tokens.length;
        } else {
          currentChunk.text += separator + chunk.text;
          currentChunk.endPos = chunk.endPos;
          currentChunk.tokens.push(...chunk.tokens);
          currentLength += chunk.tokens.length;
        }
      } else {
        currentChunk = chunk;
        currentLength = chunk.tokens.length;
      }
    }
    if (currentChunk) {
      combinedChunks.push(currentChunk);
    }
    return combinedChunks;
  }

  private containsAlphanumeric(text: string): boolean {
    for (let i = 0; i < text.length; i++) {
      if (ALPHANUMERIC_CHARS.includes(text[i])) {
        return true;
      }
    }
    return false;
  }

  private splitBySpaces(text: string): string[] {
    const parts: string[] = [];
    const words = text.split(" ");
    if (words.length > 0) {
      let part = words[0];
      for (let i = 1; i < words.length; i++) {
        const nextWord = words[i];
        if (
          this._config.tokenizer.encode(part + " " + nextWord).length <=
          this._config.chunkSize
        ) {
          part += " " + nextWord;
        } else {
          parts.push(part);
          part = nextWord;
        }
      }
      parts.push(part);
    } else {
      parts.push(text);
    }

    return parts;
  }

  private getSeparators(): string[] {
    return [
      // For splitting by double newlines, useful for paragraphs
      "\n\n",
      // For splitting by single newlines, useful for lines or sentences
      "\n",
      // For splitting by spaces, useful for words
      " ",
      // JSON-specific separators, can be added if necessary
      // ",", // For array elements or object properties
      // ":", // For key-value pairs
    ];
  }
}
