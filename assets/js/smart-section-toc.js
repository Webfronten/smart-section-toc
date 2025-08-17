/**
 * Smart Section TOC - JavaScript
 *
 * Main JavaScript file for the Smart Section TOC plugin.
 * Handles dynamic TOC generation, smooth scrolling, and active section highlighting.
 *
 * @package SmartSectionTOC
 * @version 1.0.0
 */

(function () {
    "use strict";

    /**
     * Main initialization function
     *
     * Sets up the table of contents when DOM is ready.
     * Uses vanilla JavaScript for better performance and no dependencies.
     */
    function initSmartSectionTOC() {
        console.log("Smart Section TOC: Initializing...");

        // Get settings from localized script data
        const settings = window.smartSectionTOC || {
            contentSelector: ".site-content",
            headingSelector: "h2",
            scrollOffset: 80,
            strings: {
                goToSection: "Go to section:",
            },
        };

        console.log("Smart Section TOC: Settings:", settings);

        // Check if TOC container exists
        const tocList = document.querySelector(".smart-toc-list");
        if (!tocList) {
            console.error(
                "Smart Section TOC: TOC list container (.smart-toc-list) not found!",
            );
            return;
        }

        console.log("Smart Section TOC: TOC container found");

        // Find all headings within the content area (including nested ones)
        const contentArea = document.querySelector(settings.contentSelector);
        if (!contentArea) {
            console.warn(
                "Smart Section TOC: Content area not found:",
                settings.contentSelector,
            );
            return;
        }

        const headings = contentArea.querySelectorAll(settings.headingSelector);

        // Respect configured minimum (defaults to 1). Only bail if strictly below it.
        const min = Number(settings.minHeadings || 1);
        if (!headings || headings.length < min) {
            console.warn(
                "Smart Section TOC: Not enough headings found.",
                "Found:",
                headings ? headings.length : 0,
                "| Min required:",
                min,
            );
            return;
        }

        // If we’re here, we have >= 1 headings. Ensure the TOC container is visible.
        const tocContainer = document.querySelector(".smart-toc-navigation");
        if (tocContainer) {
            // Remove any accidental hiding from theme CSS or prior logic.
            tocContainer.style.display = "";
            tocContainer.removeAttribute("hidden");
            tocContainer.classList.remove("is-hidden");
        }

        // Also try a global search to see what's available
        const allH2s = document.querySelectorAll("h2");
        console.log("Smart Section TOC: Total H2s in document:", allH2s.length);
        allH2s.forEach((h2, index) => {
            console.log(
                `  H2 #${index}: "${h2.textContent.trim()}" - Parent: ${
                    h2.parentElement.className
                }`,
            );
        });

        // Exit if no headings found
        if (!headings || headings.length === 0) {
            console.warn(
                "Smart Section TOC: No headings found within",
                settings.contentSelector,
            );
            return;
        }

        console.log(
            "Smart Section TOC: Processing",
            headings.length,
            "headings...",
        );

        // Object to track slug counts for handling duplicates
        const slugCounts = {};

        /**
         * Generate a unique slug from heading text
         *
         * Handles duplicate headings by appending numbers.
         * This prevents ID conflicts in the document.
         *
         * @param {string} text - The heading text to convert to a slug
         * @return {string} A unique slug suitable for use as an ID
         */
        function generateSlug(text) {
            // Replace Danish letters with equivalents
            const normalized = text
                .toLowerCase()
                .replace(/æ/g, "ae")
                .replace(/ø/g, "oe")
                .replace(/å/g, "aa")
                .replace(/ä/g, "ae")
                .replace(/ö/g, "oe")
                .replace(/ü/g, "ue")
                .replace(/[^\w\s-]/g, "") // Remove special characters
                .replace(/\s+/g, "-") // Replace spaces with hyphens
                .trim();

            // Handle duplicate slugs
            const base = normalized;
            slugCounts[base] = (slugCounts[base] || 0) + 1;
            return slugCounts[base] > 1 ? `${base}-${slugCounts[base]}` : base;
        }

        /**
         * Calculate dynamic scroll offset
         *
         * Looks for common sticky header selectors and calculates
         * appropriate offset to prevent content being hidden behind header.
         *
         * @return {number} The calculated offset in pixels
         */
        function getScrollOffset() {
            // Common WordPress theme header selectors
            const stickySelectors = [
                ".site-header",
                ".header-sticky",
                'header[data-sticky="true"]',
                ".sticky-header",
                "#masthead.sticky",
                "header.fixed",
            ];

            // Find first matching sticky header
            for (const selector of stickySelectors) {
                const header = document.querySelector(selector);
                if (header) {
                    // Check if element is actually sticky/fixed
                    const style = window.getComputedStyle(header);
                    if (
                        style.position === "fixed" ||
                        style.position === "sticky"
                    ) {
                        return header.offsetHeight + 20; // Add some padding
                    }
                }
            }

            // Fall back to default offset from settings
            return parseInt(settings.scrollOffset) || 80;
        }

        /**
         * Build the table of contents
         *
         * Iterates through all headings, generates IDs if needed,
         * and creates corresponding navigation links.
         */
        headings.forEach((heading, index) => {
            // Generate unique ID if heading doesn't have one
            if (!heading.id) {
                heading.id = `heading-${generateSlug(heading.textContent)}`;
            }

            // Create list item and link elements
            const li = document.createElement("li");
            const a = document.createElement("a");

            // Set link attributes
            a.href = "#" + heading.id;
            a.textContent = heading.textContent;
            a.className = "smart-toc-link";

            // Add accessibility label
            const ariaLabel = `${settings.strings.goToSection} ${heading.textContent}`;
            a.setAttribute("aria-label", ariaLabel);

            // Append to DOM
            li.appendChild(a);
            tocList.appendChild(li);
        });

        /**
         * Update active link state
         *
         * Removes active state from all links and applies it to the specified link.
         * Also manages ARIA attributes for accessibility.
         *
         * @param {HTMLElement|null} targetLink - The link to mark as active
         */
        function setActiveLink(targetLink) {
            // Remove active state from all links
            document.querySelectorAll(".smart-toc-link").forEach((link) => {
                link.classList.remove("active");
                link.removeAttribute("aria-current");
            });

            // Add active state to target link
            if (targetLink) {
                targetLink.classList.add("active");
                targetLink.setAttribute("aria-current", "true");
            }
        }

        /**
         * Smooth scroll to target element
         *
         * Handles the smooth scrolling animation when clicking TOC links.
         * Uses native smooth scroll with fallback for older browsers.
         *
         * @param {HTMLElement} targetElement - The element to scroll to
         * @param {HTMLElement} clickedLink - The link that was clicked
         */
        function smoothScrollTo(targetElement, clickedLink) {
            const offset = getScrollOffset();
            const elementPosition =
                targetElement.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - offset;

            // Try native smooth scroll first
            try {
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth",
                });
            } catch (e) {
                // Fallback for browsers that don't support smooth scroll
                window.scrollTo(0, offsetPosition);
            }

            // Update active state immediately on click
            setActiveLink(clickedLink);
        }

        // Add click handlers to all TOC links
        document.querySelectorAll(".smart-toc-link").forEach((link) => {
            link.addEventListener("click", function (e) {
                e.preventDefault();

                const targetId = this.getAttribute("href").substring(1);
                const targetElement = document.getElementById(targetId);

                if (targetElement) {
                    smoothScrollTo(targetElement, this);

                    // Flyt fokus til målet for skærmlæser og tastaturbrugere
                    targetElement.setAttribute("tabindex", "-1");
                    targetElement.focus({ preventScroll: true });

                    // Fjern tabindex igen, så det ikke forstyrrer navigationen
                    setTimeout(() => {
                        targetElement.removeAttribute("tabindex");
                    }, 1000);
                }
            });
        });

        /**
         * Set up Intersection Observer for scroll-based highlighting
         *
         * Uses the modern Intersection Observer API for performant
         * scroll tracking. Falls back to scroll events for very long pages.
         */

        // Performance optimization: Check if page has many headings
        const useScrollFallback = headings.length > 100;

        if (!useScrollFallback && "IntersectionObserver" in window) {
            // Use Intersection Observer for optimal performance

            // Configure observer to trigger when heading is in upper portion of viewport
            const observerOptions = {
                rootMargin: "-20% 0px -70% 0px",
                threshold: 0,
            };

            // Track active heading with debouncing for performance
            let activeHeading = null;
            let observerTimeout;

            const observer = new IntersectionObserver((entries) => {
                clearTimeout(observerTimeout);

                // Debounce to prevent too many updates
                observerTimeout = setTimeout(() => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            activeHeading = entry.target;
                        }
                    });

                    if (activeHeading) {
                        const tocLink = document.querySelector(
                            `.smart-toc-link[href="#${activeHeading.id}"]`,
                        );
                        setActiveLink(tocLink);
                    }
                }, 10);
            }, observerOptions);

            // Start observing all headings
            headings.forEach((heading) => {
                observer.observe(heading);
            });
        } else {
            // Fallback: Use scroll event for very long pages or no IO support

            /**
             * Highlight active section based on scroll position
             *
             * Fallback method that uses scroll events. Less performant
             * but works reliably on all browsers and very long pages.
             */
            function highlightActiveSection() {
                const scrollPosition = window.scrollY + getScrollOffset() + 50;
                let currentActiveHeading = null;

                // Find the current active heading by checking positions
                for (let i = headings.length - 1; i >= 0; i--) {
                    if (headings[i].offsetTop <= scrollPosition) {
                        currentActiveHeading = headings[i];
                        break;
                    }
                }

                if (currentActiveHeading) {
                    const tocLink = document.querySelector(
                        `.smart-toc-link[href="#${currentActiveHeading.id}"]`,
                    );
                    setActiveLink(tocLink);
                }
            }

            // Throttle scroll event using requestAnimationFrame
            let scrollTimeout;
            window.addEventListener(
                "scroll",
                function () {
                    if (scrollTimeout) {
                        window.cancelAnimationFrame(scrollTimeout);
                    }
                    scrollTimeout = window.requestAnimationFrame(function () {
                        highlightActiveSection();
                    });
                },
                { passive: true },
            ); // Passive listener for better scroll performance

            // Set initial active state
            highlightActiveSection();
        }

        /**
         * Handle window resize events
         *
         * Recalculates positions when window is resized,
         * as this can affect sticky header heights.
         */
        let resizeTimeout;
        window.addEventListener(
            "resize",
            function () {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    // Only recalculate if using scroll-based method
                    if (
                        useScrollFallback ||
                        !("IntersectionObserver" in window)
                    ) {
                        const scrollLink = document.querySelector(
                            ".smart-toc-link.active",
                        );
                        if (scrollLink) {
                            const targetId = scrollLink
                                .getAttribute("href")
                                .substring(1);
                            const targetElement =
                                document.getElementById(targetId);
                            if (targetElement) {
                                // Recheck active section after resize
                                highlightActiveSection();
                            }
                        }
                    }
                }, 250);
            },
            { passive: true },
        );

        /**
         * Keyboard navigation enhancement
         *
         * Allows users to navigate TOC with arrow keys when focused.
         * Improves accessibility for keyboard-only users.
         */
        tocList.addEventListener("keydown", function (e) {
            const focusedLink = document.activeElement;

            if (
                !focusedLink ||
                !focusedLink.classList.contains("smart-toc-link")
            ) {
                return;
            }

            const allLinks = Array.from(
                document.querySelectorAll(".smart-toc-link"),
            );
            const currentIndex = allLinks.indexOf(focusedLink);

            switch (e.key) {
                case "ArrowDown":
                case "ArrowRight":
                    e.preventDefault();
                    if (currentIndex < allLinks.length - 1) {
                        allLinks[currentIndex + 1].focus();
                    }
                    break;

                case "ArrowUp":
                case "ArrowLeft":
                    e.preventDefault();
                    if (currentIndex > 0) {
                        allLinks[currentIndex - 1].focus();
                    }
                    break;

                case "Home":
                    e.preventDefault();
                    allLinks[0].focus();
                    break;

                case "End":
                    e.preventDefault();
                    allLinks[allLinks.length - 1].focus();
                    break;
            }
        });

        /**
         * Focus management for better accessibility
         *
         * Ensures focus returns to TOC after navigation for
         * screen reader users.
         */
        if (window.location.hash) {
            // If page loaded with hash, update active state
            const hashId = window.location.hash.substring(1);
            const targetLink = document.querySelector(
                `.smart-toc-link[href="#${hashId}"]`,
            );
            if (targetLink) {
                setActiveLink(targetLink);
            }
        }
    }

    /**
     * Initialize when DOM is ready
     *
     * Uses DOMContentLoaded to ensure all elements are available.
     * Falls back to load event if DOM is already loaded.
     */
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initSmartSectionTOC);
    } else {
        // DOM already loaded, initialize immediately
        initSmartSectionTOC();
    }
})();
