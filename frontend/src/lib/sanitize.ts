/**
 * Text Sanitization Utilities
 *
 * Provides XSS protection for user-generated and API-sourced content.
 * Uses DOMPurify for HTML sanitization (client-side only).
 *
 * @module lib/sanitize
 */
import DOMPurify from "dompurify";

/**
 * Sanitize configuration for plain text content.
 * Strips all HTML tags, leaving only text content.
 */
const TEXT_ONLY_CONFIG = {
  ALLOWED_TAGS: [] as string[],
  ALLOWED_ATTR: [] as string[],
};

/**
 * Sanitize configuration for basic formatted text.
 * Allows only safe inline formatting tags.
 */
const BASIC_HTML_CONFIG = {
  ALLOWED_TAGS: ["b", "i", "em", "strong", "br"],
  ALLOWED_ATTR: [] as string[],
};

/**
 * Sanitizes text content by removing all HTML tags and potential XSS vectors.
 *
 * @param text - The text to sanitize
 * @returns Sanitized plain text with all HTML removed
 *
 * @example
 * ```ts
 * const unsafe = '<script>alert("xss")</script>Hello';
 * const safe = sanitizeText(unsafe); // Returns: "Hello"
 * ```
 */
export function sanitizeText(text: string | null | undefined): string {
  if (!text) return "";
  return DOMPurify.sanitize(text, TEXT_ONLY_CONFIG);
}

/**
 * Sanitizes HTML content, allowing only safe inline formatting tags.
 *
 * @param html - The HTML content to sanitize
 * @returns Sanitized HTML with only safe tags preserved
 *
 * @example
 * ```ts
 * const unsafe = '<script>alert("xss")</script><b>Bold</b>';
 * const safe = sanitizeHtml(unsafe); // Returns: "<b>Bold</b>"
 * ```
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, BASIC_HTML_CONFIG);
}

/**
 * Escapes special HTML characters for safe display in text contexts.
 * Use this when you need to display content that might contain HTML
 * but want to show it as literal text.
 *
 * @param text - The text to escape
 * @returns Text with HTML special characters escaped
 *
 * @example
 * ```ts
 * const code = '<div class="test">';
 * const escaped = escapeHtml(code); // Returns: "&lt;div class=&quot;test&quot;&gt;"
 * ```
 */
export function escapeHtml(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default {
  sanitizeText,
  sanitizeHtml,
  escapeHtml,
};
