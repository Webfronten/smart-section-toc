<?php

/**
 * Plugin Name: Smart Section TOC
 * Plugin URI: https://www.webfronten.dk
 * Description: Automatically generates a dynamic table of contents from H2 headings with smooth scrolling and active section highlighting.
 * Version: 1.0.0
 * Requires at least: 6.8
 * Requires PHP: 8.2
 * Author: Webfronten ApS
 * Author URI: https://www.webfronten.dk
 * License: GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: smart-section-toc
 * Domain Path: /languages
 *
 * @package SmartSectionTOC
 */

// Prevent direct access to this file for security reasons
if (! defined('ABSPATH')) {
    exit;
}

/**
 * Define plugin constants for easy reference throughout the plugin
 *
 * Using constants ensures consistency and makes future updates easier
 * when paths or versions need to be changed.
 */
define('SMART_SECTION_TOC_VERSION', '1.0.0');
define('SMART_SECTION_TOC_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('SMART_SECTION_TOC_PLUGIN_URL', plugin_dir_url(__FILE__));
define('SMART_SECTION_TOC_PLUGIN_BASENAME', plugin_basename(__FILE__));

/**
 * Main plugin class that encapsulates all functionality
 *
 * Using a class-based approach provides better organization and prevents
 * naming conflicts with other plugins or themes.
 *
 * @since 1.0.0
 *
 * Example usage of filters:
 *
 * // Change content selector for custom themes
 * add_filter( 'smart_section_toc_content_selector', function() {
 *     return '.entry-content, .dynamic-entry-content, .sideindhold-wrapper';
 * });
 *
 * // Include H3 headings as well
 * add_filter( 'smart_section_toc_heading_selector', function() {
 *     return 'h2, h3';
 * });
 */
class Smart_Section_TOC
{

    /**
     * Singleton instance of the plugin
     *
     * @var Smart_Section_TOC|null
     */
    private static ?Smart_Section_TOC $instance = null;

    /**
     * Flag to track if assets should be enqueued
     *
     * We only want to load CSS/JS when the shortcode is actually used
     * to improve performance on pages that don't need the TOC.
     *
     * @var bool
     */
    private bool $enqueue_assets = false;

    /**
     * Get the singleton instance of the plugin
     *
     * Singleton pattern ensures only one instance of the plugin exists,
     * preventing duplicate hooks and improving performance.
     *
     * @return Smart_Section_TOC The plugin instance
     */
    public static function get_instance(): Smart_Section_TOC
    {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor - Initialize the plugin
     *
     * Private constructor enforces singleton pattern.
     * Sets up all necessary hooks and filters.
     */
    private function __construct()
    {
        // Load plugin text domain for translations
        add_action('init', array($this, 'load_textdomain'));

        // Register the shortcode
        add_shortcode('smart_section_toc', array($this, 'render_shortcode'));

        // Enqueue assets only when needed
        add_action('wp_enqueue_scripts', array($this, 'maybe_enqueue_assets'));

        // Add plugin action links
        add_filter('plugin_action_links_' . SMART_SECTION_TOC_PLUGIN_BASENAME, array($this, 'add_action_links'));
    }

    /**
     * Load plugin translations
     *
     * Enables the plugin to be translated into different languages.
     * Translation files should be placed in the /languages directory.
     *
     * @return void
     */
    public function load_textdomain(): void
    {
        load_plugin_textdomain(
            'smart-section-toc',
            false,
            dirname(SMART_SECTION_TOC_PLUGIN_BASENAME) . '/languages'
        );
    }

    /**
     * Render the TOC shortcode
     *
     * This method is called whenever [smart_section_toc] is used in content.
     * It sets a flag to enqueue assets and returns the TOC HTML structure.
     *
     * @param array $atts Shortcode attributes (currently unused but available for future enhancements)
     * @return string The HTML output for the TOC container
     */
    public function render_shortcode($atts): string
    {
        // Flag that we need to load assets
        $this->enqueue_assets = true;

        // Allow customization through shortcode attributes in future versions
        $atts = shortcode_atts(array(
            'title' => __('Content on the site', 'smart-section-toc'),
            'container_class' => 'smart-toc-navigation',
        ), $atts, 'smart_section_toc');

        // Build the TOC HTML structure with proper accessibility attributes
        $output = sprintf(
            '<div class="%s">
                <h3>%s</h3>
                <nav id="smart-article-toc" aria-label="%s">
                    <ul class="smart-toc-list" role="list"></ul>
                </nav>
            </div>',
            esc_attr($atts['container_class']),
            esc_html($atts['title']),
            esc_attr($atts['title']) // Use same text for aria-label
        );

        return $output;
    }

    /**
     * Conditionally enqueue plugin assets
     *
     * This method checks if the current post/page contains our shortcode
     * and only loads CSS/JS files when needed. This improves performance
     * by not loading unnecessary assets on every page.
     *
     * @return void
     */
    public function maybe_enqueue_assets(): void
    {
        // Debug: Force load on specific page for testing
        if (is_page(11906)) { // Your page ID
            $this->enqueue_assets_files();
            return;
        }

        // First check: if render_shortcode was called, we know we need assets
        if ($this->enqueue_assets) {
            $this->enqueue_assets_files();
            return;
        }

        // Second check: look for shortcode in post content
        if (is_singular()) {
            global $post;
            if ($post && has_shortcode($post->post_content, 'smart_section_toc')) {
                $this->enqueue_assets_files();
            }
        }
    }

    /**
     * Actually enqueue the CSS and JavaScript files
     *
     * Separate method to avoid code duplication and make the logic clearer.
     * Uses versioning based on plugin version for cache busting.
     *
     * @return void
     */
    private function enqueue_assets_files(): void
    {
        // Enqueue CSS with proper dependencies and versioning
        wp_enqueue_style(
            'smart-section-toc',
            SMART_SECTION_TOC_PLUGIN_URL . 'assets/css/smart-section-toc.css',
            array(), // No dependencies
            SMART_SECTION_TOC_VERSION,
            'all' // Media type
        );

        // Enqueue JavaScript in footer for better performance
        wp_enqueue_script(
            'smart-section-toc',
            SMART_SECTION_TOC_PLUGIN_URL . 'assets/js/smart-section-toc.js',
            array(), // No jQuery dependency - using vanilla JS for better performance
            SMART_SECTION_TOC_VERSION,
            true // Load in footer
        );

        // Pass translatable strings and settings to JavaScript
        wp_localize_script(
            'smart-section-toc',
            'smartSectionTOC',
            array(
                'contentSelector' => apply_filters('smart_section_toc_content_selector', '.site-content'),
                'headingSelector' => apply_filters('smart_section_toc_heading_selector', 'h2'),
                'scrollOffset' => apply_filters('smart_section_toc_scroll_offset', 80),
                'strings' => array(
                    'goToSection' => __('Go to section:', 'smart-section-toc'),
                ),
            )
        );
    }

    /**
     * Add action links to the plugins page
     *
     * Adds helpful links that appear under the plugin name on the
     * WordPress plugins page for easy access to documentation.
     *
     * @param array $links Existing plugin action links
     * @return array Modified array of plugin action links
     */
    public function add_action_links(array $links): array
    {
        $plugin_links = array(
            '<a href="https://www.webfronten.dk" target="_blank" rel="noopener noreferrer">' .
                esc_html__('Documentation', 'smart-section-toc') .
                '</a>',
        );

        return array_merge($plugin_links, $links);
    }
}

/**
 * Initialize the plugin
 *
 * This function is called when WordPress loads the plugin file.
 * It creates the singleton instance which sets up all hooks.
 *
 * @return void
 */
function smart_section_toc_init(): void
{
    Smart_Section_TOC::get_instance();
}

// Initialize the plugin
smart_section_toc_init();
