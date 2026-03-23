import { describe, it, expect } from 'vitest';
import { parseExtractionFromText, parseSSEChunk } from '@/lib/ai-intake';

const VALID_EXTRACTION = {
  levels: ['havo'] as const,
  studentCountsPerLevel: null,
  selectedModules: ['rekenwiskunde'] as const,
  moduleSetups: [],
  unsureAbout: [],
};

const VALID_V2_EXTRACTION = {
  levels: ['vwo'] as const,
  studentCountsPerLevel: { vwo: 300 },
  selectedModules: ['nederlands'] as const,
  moduleSetups: [{
    moduleId: 'nederlands' as const,
    currentProvider: 'dia' as const,
    pricePerStudent: 5.20,
  }],
  unsureAbout: ['Controleer licentiemodel'],
  contactPersonen: [{
    naam: 'Jan de Vries',
    rol: 'Toetscoordinator',
    dmuPositie: 'coordinator' as const,
  }],
  actiePunten: [{
    wat: 'Offerte opvragen',
    wanneer: 'Volgende week',
  }],
  pipelineSignaal: 'interesse' as const,
};

describe('parseSSEChunk', () => {
  it('extracts text from content_block_delta events', () => {
    const chunk = [
      'data: {"type":"content_block_delta","text":"hello"}',
      'data: {"type":"content_block_delta","text":" world"}',
      '',
    ].join('\n');

    const result = parseSSEChunk(chunk);
    expect(result.texts).toEqual(['hello', ' world']);
    expect(result.error).toBeUndefined();
  });

  it('returns error from error events', () => {
    const chunk = 'data: {"type":"error","error":"Rate limit exceeded"}';
    const result = parseSSEChunk(chunk);
    expect(result.error).toBe('Rate limit exceeded');
  });
});

describe('parseExtractionFromText', () => {
  it('parses raw JSON directly', () => {
    const result = parseExtractionFromText(JSON.stringify(VALID_EXTRACTION));
    expect(result.levels).toEqual(['havo']);
    expect(result.selectedModules).toEqual(['rekenwiskunde']);
  });

  it('strips markdown fences at start/end', () => {
    const text = '```json\n' + JSON.stringify(VALID_EXTRACTION) + '\n```';
    const result = parseExtractionFromText(text);
    expect(result.levels).toEqual(['havo']);
  });

  it('strips markdown fences with text before and after', () => {
    const text = 'Hier is de data:\n\n```json\n' + JSON.stringify(VALID_EXTRACTION) + '\n```\n\nHoop dat dit helpt!';
    const result = parseExtractionFromText(text);
    expect(result.levels).toEqual(['havo']);
  });

  it('extracts JSON from mixed text with preamble/postamble', () => {
    const text = 'Hier is het resultaat:\n\n' + JSON.stringify(VALID_EXTRACTION) + '\n\nLaat me weten als je meer nodig hebt.';
    const result = parseExtractionFromText(text);
    expect(result.levels).toEqual(['havo']);
  });

  it('handles JSON with leading whitespace and newlines', () => {
    const text = '\n\n  ' + JSON.stringify(VALID_EXTRACTION) + '\n\n';
    const result = parseExtractionFromText(text);
    expect(result.levels).toEqual(['havo']);
  });

  it('validates V2 schema with contacts, actions, pipeline', () => {
    const result = parseExtractionFromText(JSON.stringify(VALID_V2_EXTRACTION));
    expect(result.contactPersonen).toHaveLength(1);
    expect(result.contactPersonen[0].naam).toBe('Jan de Vries');
    expect(result.actiePunten).toHaveLength(1);
    expect(result.pipelineSignaal).toBe('interesse');
  });

  it('applies V2 defaults for missing optional fields', () => {
    const result = parseExtractionFromText(JSON.stringify(VALID_EXTRACTION));
    expect(result.contactPersonen).toEqual([]);
    expect(result.actiePunten).toEqual([]);
  });

  it('throws descriptive error on completely invalid text', () => {
    expect(() => parseExtractionFromText('not json at all')).toThrow(
      'AI-antwoord kon niet worden verwerkt',
    );
  });

  it('includes preview of failed text in error message', () => {
    expect(() => parseExtractionFromText('Dit is geen JSON maar gewone tekst')).toThrow(
      'Begin van antwoord:',
    );
  });

  it('throws Dutch error on schema validation failure', () => {
    const invalidJson = JSON.stringify({
      levels: ['invalid-level'],
      studentCountsPerLevel: null,
      selectedModules: [],
      moduleSetups: [],
      unsureAbout: [],
    });

    expect(() => parseExtractionFromText(invalidJson)).toThrow(
      'Geëxtraheerde gegevens voldoen niet aan het verwachte schema',
    );
  });
});
