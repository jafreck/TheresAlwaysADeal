import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import ReadMoreDescription from '../../src/components/ReadMoreDescription';

const shortText = 'A short description that is under the limit.';
const longText = 'A'.repeat(350);

describe('ReadMoreDescription', () => {
  afterEach(() => cleanup());
  it('should be a function (React component)', () => {
    expect(typeof ReadMoreDescription).toBe('function');
  });

  it('should render short text fully without a toggle button', () => {
    const { container, queryByRole } = render(
      <ReadMoreDescription description={shortText} />,
    );
    expect(container.textContent).toContain(shortText);
    expect(queryByRole('button')).toBeNull();
  });

  it('should render truncated text with a Read more button when text exceeds maxLength', () => {
    const { getByRole, container } = render(
      <ReadMoreDescription description={longText} />,
    );
    const button = getByRole('button');
    expect(button.textContent).toBe('Read more');
    // Text should be truncated (300 chars + ellipsis)
    const p = container.querySelector('p');
    expect(p?.textContent?.length).toBeLessThan(longText.length);
  });

  it('should expand to full text and show "Show less" when Read more is clicked', () => {
    const { getByRole, container } = render(
      <ReadMoreDescription description={longText} />,
    );
    const button = getByRole('button');
    fireEvent.click(button);
    expect(button.textContent).toBe('Show less');
    const p = container.querySelector('p');
    expect(p?.textContent).toBe(longText);
  });

  it('should collapse back when Show less is clicked', () => {
    const { getByRole, container } = render(
      <ReadMoreDescription description={longText} />,
    );
    const button = getByRole('button');
    fireEvent.click(button); // expand
    fireEvent.click(button); // collapse
    expect(button.textContent).toBe('Read more');
    const p = container.querySelector('p');
    expect(p?.textContent?.length).toBeLessThan(longText.length);
  });

  it('should respect custom maxLength', () => {
    const text = 'B'.repeat(60);
    const { getByRole } = render(
      <ReadMoreDescription description={text} maxLength={50} />,
    );
    expect(getByRole('button').textContent).toBe('Read more');
  });

  it('should not show toggle when text equals maxLength exactly', () => {
    const text = 'C'.repeat(300);
    const { queryByRole } = render(
      <ReadMoreDescription description={text} />,
    );
    expect(queryByRole('button')).toBeNull();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ReadMoreDescription description={shortText} className="custom-class" />,
    );
    expect(container.firstElementChild?.className).toContain('custom-class');
  });

  it('should render empty string without a toggle button', () => {
    const { container, queryByRole } = render(
      <ReadMoreDescription description="" />,
    );
    expect(container.querySelector('p')?.textContent).toBe('');
    expect(queryByRole('button')).toBeNull();
  });

  it('should show toggle when text is exactly maxLength + 1', () => {
    const text = 'D'.repeat(301);
    const { getByRole } = render(
      <ReadMoreDescription description={text} />,
    );
    expect(getByRole('button').textContent).toBe('Read more');
  });

  it('should append ellipsis to truncated text', () => {
    const { container } = render(
      <ReadMoreDescription description={longText} />,
    );
    const p = container.querySelector('p');
    expect(p?.textContent?.endsWith('…')).toBe(true);
  });
});
