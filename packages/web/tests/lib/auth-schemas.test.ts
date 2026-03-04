import { describe, it, expect } from 'vitest';
import {
  registerFormSchema,
  loginFormSchema,
  forgotPasswordFormSchema,
  resetPasswordFormSchema,
} from '../../src/lib/auth-schemas';

describe('registerFormSchema', () => {
  it('should parse valid registration data', () => {
    const result = registerFormSchema.parse({
      email: 'user@example.com',
      password: 'securepass',
      confirmPassword: 'securepass',
    });
    expect(result.email).toBe('user@example.com');
    expect(result.password).toBe('securepass');
    expect(result.confirmPassword).toBe('securepass');
  });

  it('should accept an optional name field', () => {
    const result = registerFormSchema.parse({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'securepass',
      confirmPassword: 'securepass',
    });
    expect(result.name).toBe('Alice');
  });

  it('should allow omitting the name field', () => {
    const result = registerFormSchema.parse({
      email: 'user@example.com',
      password: 'securepass',
      confirmPassword: 'securepass',
    });
    expect(result.name).toBeUndefined();
  });

  it('should reject invalid email', () => {
    expect(() =>
      registerFormSchema.parse({
        email: 'not-email',
        password: 'securepass',
        confirmPassword: 'securepass',
      }),
    ).toThrow();
  });

  it('should reject password shorter than 8 characters', () => {
    expect(() =>
      registerFormSchema.parse({
        email: 'user@example.com',
        password: 'short',
        confirmPassword: 'short',
      }),
    ).toThrow();
  });

  it('should reject mismatched passwords', () => {
    expect(() =>
      registerFormSchema.parse({
        email: 'user@example.com',
        password: 'securepass',
        confirmPassword: 'different',
      }),
    ).toThrow();
  });

  it('should accept password of exactly 8 characters', () => {
    const result = registerFormSchema.parse({
      email: 'user@example.com',
      password: '12345678',
      confirmPassword: '12345678',
    });
    expect(result.password).toBe('12345678');
  });

  it('should reject missing email', () => {
    expect(() =>
      registerFormSchema.parse({
        password: 'securepass',
        confirmPassword: 'securepass',
      }),
    ).toThrow();
  });

  it('should reject missing password', () => {
    expect(() =>
      registerFormSchema.parse({
        email: 'user@example.com',
        confirmPassword: 'securepass',
      }),
    ).toThrow();
  });

  it('should reject missing confirmPassword', () => {
    expect(() =>
      registerFormSchema.parse({
        email: 'user@example.com',
        password: 'securepass',
      }),
    ).toThrow();
  });
});

describe('loginFormSchema', () => {
  it('should parse valid login data', () => {
    const result = loginFormSchema.parse({
      email: 'user@example.com',
      password: 'mypassword',
    });
    expect(result).toEqual({ email: 'user@example.com', password: 'mypassword' });
  });

  it('should reject invalid email', () => {
    expect(() =>
      loginFormSchema.parse({ email: 'bad', password: 'mypassword' }),
    ).toThrow();
  });

  it('should reject empty password', () => {
    expect(() =>
      loginFormSchema.parse({ email: 'user@example.com', password: '' }),
    ).toThrow();
  });

  it('should accept password of 1 character', () => {
    const result = loginFormSchema.parse({ email: 'user@example.com', password: 'x' });
    expect(result.password).toBe('x');
  });

  it('should reject missing email', () => {
    expect(() => loginFormSchema.parse({ password: 'x' })).toThrow();
  });

  it('should reject missing password', () => {
    expect(() => loginFormSchema.parse({ email: 'user@example.com' })).toThrow();
  });
});

describe('forgotPasswordFormSchema', () => {
  it('should parse valid email', () => {
    const result = forgotPasswordFormSchema.parse({ email: 'user@example.com' });
    expect(result).toEqual({ email: 'user@example.com' });
  });

  it('should reject invalid email', () => {
    expect(() => forgotPasswordFormSchema.parse({ email: 'not-email' })).toThrow();
  });

  it('should reject missing email', () => {
    expect(() => forgotPasswordFormSchema.parse({})).toThrow();
  });
});

describe('resetPasswordFormSchema', () => {
  it('should parse valid matching passwords', () => {
    const result = resetPasswordFormSchema.parse({
      password: 'newpasswd',
      confirmPassword: 'newpasswd',
    });
    expect(result.password).toBe('newpasswd');
    expect(result.confirmPassword).toBe('newpasswd');
  });

  it('should reject mismatched passwords', () => {
    expect(() =>
      resetPasswordFormSchema.parse({
        password: 'newpasswd',
        confirmPassword: 'different',
      }),
    ).toThrow();
  });

  it('should reject password shorter than 8 characters', () => {
    expect(() =>
      resetPasswordFormSchema.parse({
        password: 'short',
        confirmPassword: 'short',
      }),
    ).toThrow();
  });

  it('should accept password of exactly 8 characters', () => {
    const result = resetPasswordFormSchema.parse({
      password: '12345678',
      confirmPassword: '12345678',
    });
    expect(result.password).toBe('12345678');
  });

  it('should reject missing password', () => {
    expect(() =>
      resetPasswordFormSchema.parse({ confirmPassword: 'newpasswd' }),
    ).toThrow();
  });

  it('should reject missing confirmPassword', () => {
    expect(() =>
      resetPasswordFormSchema.parse({ password: 'newpasswd' }),
    ).toThrow();
  });
});
