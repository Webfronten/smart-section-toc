<?php

/**
 * Plugin Name: Smart Section TOC
 * Plugin URI: https://www.webfronten.dk
 * Description: Automatically generates a dynamic table of contents from H2 headings with smooth scrolling and active section highlighting.
 * Version: 1.0.37
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

// Plugin Update Checker (GitHub)
require plugin_dir_path(__FILE__) . 'includes/plugin-update-checker/plugin-update-checker.php';

use YahnisElsts\PluginUpdateChecker\v5\PucFactory;

$myUpdateChecker = PucFactory::buildUpdateChecker(
    'https://github.com/Webfronten/smart-section-toc/',
    __FILE__,
    'smart-section-toc'
);

$myUpdateChecker->setBranch('main');

$api = $myUpdateChecker->getVcsApi();
if ($api) {
    $api->enableReleaseAssets();
}

/**
 * Define plugin constants for easy reference throughout the plugin
 *
 * Using constants ensures consistency and makes future updates easier
 * when paths or versions need to be changed.
 */
define('SMART_SECTION_TOC_VERSION', '1.0.37');
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

        // Add Admin Menu
        add_action('admin_menu', array($this, 'add_admin_menu'));
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
            '<div class="%1$s">
        <h3>%2$s</h3>

        <button class="smart-toc-toggle"
                type="button"
                aria-label="%3$s"
                aria-controls="smart-article-toc"
                aria-expanded="false">
            <span aria-hidden="true" class="smart-toc-toggle__dot"></span>
            <span aria-hidden="true" class="smart-toc-toggle__dot"></span>
            <span aria-hidden="true" class="smart-toc-toggle__dot"></span>
        </button>

        <!-- Popup til mobil -->
        <div class="smart-toc-popup" role="dialog" aria-modal="true" aria-label="%2$s">
            <h3>%2$s</h3>
            <nav id="smart-article-toc-mobile" aria-label="%2$s">
                <ul class="smart-toc-list" role="list"></ul>
            </nav>
        </div>

        <!-- Normal desktop navigation -->
        <nav id="smart-article-toc-desktop" aria-label="%2$s">
            <ul class="smart-toc-list" role="list"></ul>
        </nav>
    </div>',
            esc_attr($atts['container_class']),
            esc_html($atts['title']),
            esc_attr__('Open table of contents', 'smart-section-toc')
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
                'minHeadings'     => apply_filters('smart_section_toc_min_headings', 1),
                'strings' => array(
                    'goToSection' => __('Go to section:', 'smart-section-toc'),
                ),
            )
        );
    }

    /**
     * Add admin menu item under Settings
     */
    public function add_admin_menu(): void
    {
        add_options_page(
            __('Smart Section TOC Settings', 'smart-section-toc'),
            __('Smart Section TOC', 'smart-section-toc'),
            'manage_options',
            'smart-section-toc',
            array($this, 'render_settings_page')
        );
    }

    /**
     * Add action links on the plugin list page
     *
     * Adds helpful links like "Settings" and "Documentation" below the plugin name
     * on the WordPress plugins page.
     *
     * @param array $links Existing action links.
     * @return array Modified action links.
     */
    public function add_action_links(array $links): array
    {
        $plugin_links = array(
            '<a href="' . esc_url(admin_url('options-general.php?page=smart-section-toc')) . '">' .
                esc_html__('Settings', 'smart-section-toc') . '</a>',
            // '<a href="https://www.webfronten.dk" target="_blank" rel="noopener noreferrer">' .
            //     esc_html__('Documentation', 'smart-section-toc') . '</a>',
        );

        return array_merge($plugin_links, $links);
    }

    /**
     * Render the plugin's settings/instructions page
     */
    public function render_settings_page(): void
    {
?>
        <div class="wrap">
            <h1><?php _e('Smart Section TOC Instructions', 'smart-section-toc'); ?></h1>
            <p><?php _e('This plugin automatically generates a table of contents based on the H2 headings inside a selected content area.', 'smart-section-toc'); ?></p>

            <h2><?php _e('Shortcode', 'smart-section-toc'); ?></h2>
            <p><code>[smart_section_toc]</code></p>

            <h2><?php _e('Content container class', 'smart-section-toc'); ?></h2>
            <p>
                <code><?php echo esc_html(apply_filters('smart_section_toc_content_selector', '.site-content')); ?></code><br>
                <?php _e('This CSS selector determines which part of your content is scanned for headings.', 'smart-section-toc'); ?><br>
                <?php _e('You can change it using the following filter:', 'smart-section-toc'); ?>
            </p>
            <pre><code>add_filter( 'smart_section_toc_content_selector', function() {
    return '.your-custom-class';
});</code></pre>

            <h2><?php _e('Heading levels', 'smart-section-toc'); ?></h2>
            <p>
                <code><?php echo esc_html(apply_filters('smart_section_toc_heading_selector', 'h2')); ?></code><br>
                <?php _e('Defines which heading tags are included. Default is H2.', 'smart-section-toc'); ?><br>
                <?php _e('To include H3 as well, use this filter:', 'smart-section-toc'); ?>
            </p>
            <pre><code>add_filter( 'smart_section_toc_heading_selector', function() {
    return 'h2, h3';
});</code></pre>

            <h2><?php _e('Need help?', 'smart-section-toc'); ?></h2>
            <p>
                <?php printf(
                    __('Visit the <a href="%s" target="_blank" rel="noopener noreferrer">plugin website</a> for more information.', 'smart-section-toc'),
                    esc_url('https://www.webfronten.dk')
                ); ?>
            </p>
        </div>
<?php
    }
}

/**
 * Smart Section TOC - Force vis altid når shortcode er til stede
 */
function smart_section_toc_intelligent_loading()
{
    if (is_admin()) return;

    global $post;
    if (!$post) return;

    $content = $post->post_content;
    $h2_count = substr_count($content, '<h2');
    $has_shortcode = (
        has_shortcode($content, 'smart_section_toc') ||
        strpos($content, '[smart_section_toc]') !== false ||
        strpos($content, 'smart-section-toc') !== false
    );

    // Load assets if shortcode is present OR 1 or more H2 headings
    if ($has_shortcode || $h2_count >= 1) {
        wp_enqueue_style(
            'smart-section-toc-css',
            plugins_url('assets/css/smart-section-toc.css', __FILE__),
            array(),
            '1.0.20'
        );

        wp_enqueue_script(
            'smart-section-toc-js',
            plugins_url('assets/js/smart-section-toc.js', __FILE__),
            array(),
            '1.0.20',
            true
        );

        // Settings object - FORCE vis hvis shortcode er til stede
        wp_add_inline_script(
            'smart-section-toc-js',
            'var smartSectionTOC = {
                "contentSelector": "' . apply_filters('smart_section_toc_content_selector', '.site-content') . '",
                "headingSelector": "' . apply_filters('smart_section_toc_heading_selector', 'h2') . '",
                "scrollOffset": "' . apply_filters('smart_section_toc_scroll_offset', '80') . '",
                "minHeadings": 1,
                "forceShow": true,
                "hasShortcode": ' . ($has_shortcode ? 'true' : 'false') . ',
                "strings": {"goToSection": "Gå til sektion:", "noHeadings": "Ingen overskrifter fundet"}
            };',
            'before'
        );

        // KRITISK: Force JavaScript override
        if ($has_shortcode) {
            wp_add_inline_script(
                'smart-section-toc-js',
                '
                // Override TOC generation efter DOM load
                document.addEventListener("DOMContentLoaded", function() {
                    setTimeout(function() {
                        var tocContainer = document.querySelector(".smart-section-toc");
                        if (tocContainer && (!tocContainer.innerHTML || tocContainer.innerHTML.trim() === "")) {
                            console.log("Smart TOC: Forcing TOC generation for shortcode");

                            // Find headings
                            var siteContent = document.querySelector(".site-content") || document.body;
                            var headings = siteContent.querySelectorAll("h2");

                            console.log("Smart TOC: Found " + headings.length + " headings");

                            if (headings.length >= 1) {
                                // Generate TOC selv med få headings
                                var tocHTML = "<nav class=\"smart-toc-nav\" aria-label=\"Table of Contents\">";
                                tocHTML += "<h3 class=\"smart-toc-title\">Table of Contents</h3>";
                                tocHTML += "<ul class=\"smart-toc-list\">";

                                headings.forEach(function(heading, index) {
                                    if (!heading.id) {
                                        heading.id = "heading-" + index;
                                    }
                                    tocHTML += "<li class=\"smart-toc-item\">";
                                    tocHTML += "<a href=\"#" + heading.id + "\" class=\"smart-toc-link\">" + heading.textContent + "</a>";
                                    tocHTML += "</li>";
                                });

                                tocHTML += "</ul></nav>";
                                tocContainer.innerHTML = tocHTML;

                                console.log("Smart TOC: Generated TOC with " + headings.length + " items");
                            } else {
                                tocContainer.innerHTML = "<p>Ingen H2 overskrifter fundet</p>";
                                console.log("Smart TOC: No headings found, showing message");
                            }
                        }
                    }, 200);
                });
                ',
                'after'
            );
        }

        // Auto-add TOC container for content-rich pages without shortcode
        if (!$has_shortcode && $h2_count >= 1) {
            add_filter('the_content', function ($content) {
                return '<div class="smart-section-toc"></div>' . $content;
            }, 1);
        }
    }
}
add_action('wp_enqueue_scripts', 'smart_section_toc_intelligent_loading', 999);

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
