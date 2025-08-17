=== Smart Section TOC ===
Contributors: webfronten
Donate link: https://www.webfronten.dk
Tags: table of contents, toc, navigation, smooth scroll, accessibility
Requires at least: 6.8
Tested up to: 6.7
Stable tag: 1.0.0
Requires PHP: 8.2
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Automatically generates a dynamic table of contents from H2 headings with smooth scrolling and active section highlighting.

== Description ==

Smart Section TOC creates an intelligent, accessible table of contents that automatically detects all H2 headings within your content area. Perfect for long-form content, documentation, and blog posts.

**Key Features:**

* **Automatic Detection** - Finds all H2 headings in your content area automatically
* **Smooth Scrolling** - Elegant smooth scroll to sections when clicking TOC links
* **Active Highlighting** - Current section is highlighted in bold as you scroll
* **Accessibility First** - Built with ARIA labels, keyboard navigation, and screen reader support
* **Performance Optimized** - Uses Intersection Observer API and only loads assets when needed
* **Responsive Design** - Works beautifully on all devices
* **Duplicate Handling** - Smart slug generation prevents ID conflicts
* **Dynamic Offset** - Automatically adjusts for sticky headers

**How It Works:**

1. Add `[smart_section_toc]` shortcode where you want the table of contents to appear
2. The plugin automatically finds all H2 headings in your content
3. Generates a clean, accessible navigation menu
4. Updates dynamically as users scroll through your content

**Perfect For:**

* Long blog posts and articles
* Documentation pages
* Tutorial and guide content
* FAQ pages
* Any content with multiple sections

**Developer Friendly:**

The plugin includes several filters for customization:

* `smart_section_toc_content_selector` - Change the content container selector (default: `.site-content`)
* `smart_section_toc_heading_selector` - Change which headings to include (default: `h2`)
* `smart_section_toc_scroll_offset` - Adjust the scroll offset (default: 80)

== Installation ==

1. Upload the `smart-section-toc` folder to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Add the `[smart_section_toc]` shortcode to any post or page where you want the table of contents to appear

**Manual Installation:**

1. Download the plugin zip file
2. Log in to your WordPress admin panel
3. Go to Plugins > Add New > Upload Plugin
4. Choose the downloaded zip file and click 'Install Now'
5. Activate the plugin after installation

== Frequently Asked Questions ==

= Where should I place the shortcode? =

The shortcode `[smart_section_toc]` can be placed anywhere in your content. Common placements include:
- At the beginning of your post/page
- In a sidebar widget (if your theme supports shortcodes in widgets)
- In a sticky sidebar for easy access

= Can I customize which headings are included? =

Yes! By default, the plugin detects H2 headings. Developers can use the `smart_section_toc_heading_selector` filter to change this.

= Does it work with my theme? =

The plugin looks for content within the `.site-content` container by default, which works with most themes. If your theme uses a different container, you can customize it using the `smart_section_toc_content_selector` filter.

= Is it accessible? =

Yes! The plugin is built with accessibility in mind, including:
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly markup
- Focus indicators for keyboard users

= Does it slow down my site? =

No. The plugin only loads its CSS and JavaScript files on pages where the shortcode is used. It uses modern, performant JavaScript APIs and is optimized for speed.

= Can I style the table of contents? =

Yes! The plugin uses semantic CSS classes that you can target in your theme's stylesheet. All classes are prefixed with `smart-` to avoid conflicts.

== Screenshots ==

1. Table of contents in action on a blog post
2. Active section highlighting as you scroll
3. Responsive mobile view
4. Smooth scrolling animation
5. Accessibility features in action

== Changelog ==

= 1.0.17 - 2025-08-17 =
* Improved: Always show TOC.

= 1.0.16 - 2025-08-17 =
* Improved: Always show TOC.

= 1.0.15 - 2025-08-17 =
* Improved: Always show TOC.

= 1.0.14 - 2025-08-17 =
* Improved: Always show TOC.

= 1.0.13 - 2025-08-17 =
* Improved: Always show TOC.

= 1.0.12 - 2025-08-17 =
* Improved: Always show TOC.

= 1.0.11 - 2025-08-17 =
* Added: Intelligent asset loading system for improved performance and reliability
* Added: Automatic TOC detection for content-rich pages (3+ H2 headings)
* Added: Auto-injection of TOC container for pages with 5+ headings
* Added: Enhanced shortcode detection with multiple fallback methods
* Added: WordPress filter support for content selector, heading selector, and scroll offset
* Fixed: Asset loading inconsistencies between identical content pages
* Fixed: TOC not appearing on duplicated/copied pages
* Fixed: Page builder compatibility issues
* Improved: Plugin reliability and edge case handling
* Improved: Performance by loading assets only when needed

= 1.0.10 - 2025-08-16 =
* Added admin settings page under "Settings > Smart Section TOC" with usage instructions and shortcode guide
* Added "Settings" and "Documentation" links on the Plugins page for easier access
* Improved accessibility markup with support for aria-label on TOC navigation landmark

= 1.0.9 - 2025-08-13 =
* Improved: Tower versioning.

= 1.0.8 - 2025-08-13 =
* Improved: Tower versioning.

= 1.0.7 - 2025-08-13 =
* Improved: Tower versioning.

= 1.0.6 - 2025-08-13 =
* Improved: Tower versioning.

= 1.0.5 - 2025-08-13 =
* Improved: Tower versioning.

= 1.0.4 - 2025-08-13 =
* Improved: Tower versioning.

= 1.0.3 - 2025-08-13 =
* Improved: Tower versioning.

= 1.0.2 - 2025-08-13 =
* Added: Automatic update support via Plugin Update Checker (PUC) with GitHub Release assets.
* Added: GitHub Actions workflow to build and attach release ZIPs on tag/release.
* Improved: Internal structure for update handling; no functional changes for end users.

= 1.0.1 - 2025-08-13 =
* Initial public GitHub release.
* Feature: Dynamic table of contents from H2 headings.
* Feature: Smooth scrolling and active section highlighting.
* Feature: Translation-ready (textdomain: smart-section-toc).
* Feature: Shortcode-based output and separate stylesheet using CSS variables.
* Performance: Lazy asset loading and class-based architecture for lightweight runtime.

= 1.0.0 - 2025-07-22 =
* Initial release
* Automatic H2 heading detection
* Smooth scrolling functionality
* Active section highlighting
* Full accessibility support
* Performance optimized with Intersection Observer
* Responsive design
* Smart duplicate heading handling

== Upgrade Notice ==

= 1.0.0 =
Initial release of Smart Section TOC. No upgrade necessary.

== Additional Information ==

**Requirements:**
* WordPress 6.8 or higher
* PHP 8.2 or higher
* Modern browser with JavaScript enabled

**Browser Support:**
* Chrome (last 2 versions)
* Firefox (last 2 versions)
* Safari (last 2 versions)
* Edge (last 2 versions)
* Mobile browsers on iOS and Android

**Credits:**
Developed by Webfronten ApS - https://www.webfronten.dk

**Support:**
For support, feature requests, or bug reports, please visit https://www.webfronten.dk