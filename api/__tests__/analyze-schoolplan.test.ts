import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock external dependencies before importing the module
vi.mock('pdf-parse', () => ({
  default: vi.fn(),
}));

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn(),
  },
}));

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn(),
    },
  })),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({
    auth: {
      getUser: vi.fn(),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        download: vi.fn(),
      }),
    },
  }),
}));

// Set environment variables before importing module
process.env.ANTHROPIC_API_KEY = 'test-key';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';

import {
  extractTextFromFile,
  buildSummarizePrompt,
  buildMatchingPrompt,
  POST,
} from '../analyze-schoolplan';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

describe('extractTextFromFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns text for PDF buffer', async () => {
    const mockPdfParse = vi.mocked(pdfParse);
    mockPdfParse.mockResolvedValue({ text: 'PDF text content' } as never);

    const buffer = Buffer.from('fake pdf');
    const result = await extractTextFromFile(buffer, 'schoolplan.pdf');

    expect(result).toBe('PDF text content');
    expect(mockPdfParse).toHaveBeenCalledWith(buffer);
  });

  it('returns text for DOCX buffer', async () => {
    const mockMammoth = vi.mocked(mammoth.extractRawText);
    mockMammoth.mockResolvedValue({ value: 'DOCX text content', messages: [] });

    const buffer = Buffer.from('fake docx');
    const result = await extractTextFromFile(buffer, 'schoolplan.docx');

    expect(result).toBe('DOCX text content');
    expect(mockMammoth).toHaveBeenCalledWith({ buffer });
  });

  it('returns text for TXT buffer', async () => {
    const buffer = Buffer.from('Plain text content');
    const result = await extractTextFromFile(buffer, 'schoolplan.txt');

    expect(result).toBe('Plain text content');
  });

  it('throws for unsupported extensions (xlsx, csv)', async () => {
    const buffer = Buffer.from('data');

    await expect(extractTextFromFile(buffer, 'data.xlsx')).rejects.toThrow(
      'Niet-ondersteund bestandsformaat',
    );
    await expect(extractTextFromFile(buffer, 'data.csv')).rejects.toThrow(
      'Niet-ondersteund bestandsformaat',
    );
  });
});

describe('buildSummarizePrompt', () => {
  it('includes instruction to classify whether document is a schoolplan', () => {
    const prompt = buildSummarizePrompt();

    expect(prompt).toContain('schoolplan');
    expect(prompt).toContain('isSchoolplan');
    // Should instruct to detect non-schoolplan documents
    expect(prompt.toLowerCase()).toMatch(/niet.*schoolplan|geen.*schoolplan|false/);
  });
});

describe('buildMatchingPrompt', () => {
  it('includes MODULE_CATALOG module names and MODULE_DIFFERENTIATORS data', () => {
    const prompt = buildMatchingPrompt('Summary text', ['thema 1', 'thema 2']);

    // Should include module names from MODULE_CATALOG dynamically
    expect(prompt).toContain('Reken-Wiskunde');
    expect(prompt).toContain('Nederlands');
    expect(prompt).toContain('Engels');
    expect(prompt).toContain('Cognitieve capaciteitentoets');

    // Should include differentiator data
    expect(prompt).toContain('Remediering');
    expect(prompt).toContain('dia');
    expect(prompt).toContain('jij');
  });

  it('includes school context (levels, selectedModules) when provided', () => {
    const prompt = buildMatchingPrompt(
      'Summary text',
      ['thema 1'],
      {
        levels: ['havo', 'vwo'],
        selectedModules: ['rekenwiskunde', 'nederlands'],
      },
    );

    expect(prompt).toContain('havo');
    expect(prompt).toContain('vwo');
    expect(prompt).toContain('rekenwiskunde');
    expect(prompt).toContain('nederlands');
  });
});

describe('POST handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SKIP_AUTH;
  });

  it('returns 401 without auth header when SKIP_AUTH is not true', async () => {
    process.env.SKIP_AUTH = 'false';

    const request = new Request('http://localhost/api/analyze-schoolplan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ storagePath: 'test/path', fileName: 'test.pdf' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('returns 400 when storagePath is missing', async () => {
    process.env.SKIP_AUTH = 'true';

    const request = new Request('http://localhost/api/analyze-schoolplan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileName: 'test.pdf' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
