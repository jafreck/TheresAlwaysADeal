import { describe, it, expect } from 'vitest';
import AdSlot from '../../src/components/AdSlot';

describe('AdSlot', () => {
  it('should be a function (React component)', () => {
    expect(typeof AdSlot).toBe('function');
  });

  it('should render a div element', () => {
    const element = AdSlot({ slotId: 'sidebar-1' });
    expect(element.type).toBe('div');
  });

  it('should set data-slot attribute to the slotId', () => {
    const element = AdSlot({ slotId: 'hero-ad' });
    expect(element.props['data-slot']).toBe('hero-ad');
  });

  it('should set aria-hidden to true', () => {
    const element = AdSlot({ slotId: 'test-slot' });
    expect(element.props['aria-hidden']).toBe('true');
  });

  it('should include hidden class by default', () => {
    const element = AdSlot({ slotId: 'test-slot' });
    expect(element.props.className).toContain('hidden');
  });

  it('should accept a custom className', () => {
    const element = AdSlot({ slotId: 'test-slot', className: 'mt-4' });
    expect(element.props.className).toContain('mt-4');
  });

  it('should retain hidden class when custom className is provided', () => {
    const element = AdSlot({ slotId: 'test-slot', className: 'custom' });
    expect(element.props.className).toContain('hidden');
  });
});
