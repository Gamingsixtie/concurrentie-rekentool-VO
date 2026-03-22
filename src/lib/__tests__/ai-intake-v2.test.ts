import { describe, it, expect } from 'vitest';
import { parseExtractionFromText, parseSSEChunk } from '@/lib/ai-intake';

describe('streamIntakeFromNotes v2', () => {
  it('parseSSEChunk extracts text from content_block_delta events', () => {
    const chunk = [
      'data: {"type":"content_block_delta","text":"hello"}',
      'data: {"type":"content_block_delta","text":" world"}',
      '',
    ].join('\n');

    const result = parseSSEChunk(chunk);
    expect(result.texts).toEqual(['hello', ' world']);
    expect(result.error).toBeUndefined();
  });

  it('parseSSEChunk returns error from error events', () => {
    const chunk = 'data: {"type":"error","error":"Rate limit exceeded"}';
    const result = parseSSEChunk(chunk);
    expect(result.error).toBe('Rate limit exceeded');
  });

  it('parseExtractionFromText strips markdown fences and parses JSON', () => {
    const text = '```json\n{"levels":["havo"],"studentCountsPerLevel":null,"selectedModules":["rekenwiskunde"],"moduleSetups":[],"unsureAbout":[]}\n```';
    const result = parseExtractionFromText(text);
    expect(result.levels).toEqual(['havo']);
    expect(result.selectedModules).toEqual(['rekenwiskunde']);
    // V2 defaults should be applied
    expect(result.contactPersonen).toEqual([]);
    expect(result.actiePunten).toEqual([]);
  });

  it('parseExtractionFromText validates against IntakeExtractionSchemaV2', () => {
    const validJson = JSON.stringify({
      levels: ['vwo'],
      studentCountsPerLevel: { vwo: 300 },
      selectedModules: ['nederlands'],
      moduleSetups: [{
        moduleId: 'nederlands',
        currentProvider: 'dia',
        pricePerStudent: 5.20,
      }],
      unsureAbout: ['Controleer licentiemodel'],
      contactPersonen: [{
        naam: 'Jan de Vries',
        rol: 'Toetscoordinator',
        dmuPositie: 'coordinator',
      }],
      actiePunten: [{
        wat: 'Offerte opvragen',
        wanneer: 'Volgende week',
      }],
      pipelineSignaal: 'interesse',
    });

    const result = parseExtractionFromText(validJson);
    expect(result.contactPersonen).toHaveLength(1);
    expect(result.contactPersonen[0].naam).toBe('Jan de Vries');
    expect(result.actiePunten).toHaveLength(1);
    expect(result.pipelineSignaal).toBe('interesse');
  });

  it('parseExtractionFromText throws descriptive Dutch error on invalid JSON', () => {
    expect(() => parseExtractionFromText('not json at all')).toThrow(
      'AI-antwoord kon niet worden verwerkt',
    );
  });

  it('parseExtractionFromText throws Dutch error on schema validation failure', () => {
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
