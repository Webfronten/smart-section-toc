/**
 * Smart Section TOC - JavaScript
 *
 * Main JavaScript file for the Smart Section TOC plugin.
 * Handles dynamic TOC generation, smooth scrolling, active section highlighting,
 * and mobile toggle behavior.
 *
 * @package SmartSectionTOC
 * @version 1.0.10
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
        // Get settings from localized script data
        const settings = window.smartSectionTOC || {
            contentSelector: ".site-content",
            headingSelector: "h2",
            scrollOffset: 80,
            minHeadings: 1,
            strings: {
                goToSection: "Go to section:",
            },
        };

        // Elements
        const tocList = document.querySelector(".smart-toc-list");
        if (!tocList) {
            // No list container, nothing to do
            return;
        }

        const contentArea = document.querySelector(settings.contentSelector);
        if (!contentArea) {
            // Content area not found
            return;
        }

        // Collect headings inside content area only
        const headings = contentArea.querySelectorAll(settings.headingSelector);

        // Only bail out when we have fewer than minHeadings (default: 1)
        const min = Number(settings.minHeadings || 1);
        if (!headings || headings.length < min) {
            // Mark zero/low state for debug/styling (optional)
            const tocContainerZero = document.querySelector(
                ".smart-toc-navigation",
            );
            if (tocContainerZero) {
                tocContainerZero.dataset.tocCount = String(
                    headings ? headings.length : 0,
                );
                // We do not forcibly hide; site can decide to hide zero state via CSS if desired
            }
            return;
        }

        // We have enough headings (>= 1). Ensure the container is visible and annotated.
        const tocContainer = document.querySelector(".smart-toc-navigation");
        if (tocContainer) {
            tocContainer.dataset.tocCount = String(headings.length);
            tocContainer.style.removeProperty("display");
            tocContainer.removeAttribute("hidden");
            tocContainer.classList.remove("is-hidden");
        }

        // Track slug counts for duplicates
        const slugCounts = {};

        /**
         * Generate a unique slug from heading text
         * - Lowercase
         * - Convert Danish/Scandinavian letters
         * - Remove special characters
         * - Replace spaces with hyphens
         * - Ensure uniqueness with numeric suffixes
         *
         * @param {string} text
         * @returns {string}
         */
        function generateSlug(text) {
            const normalized = text
                .toLowerCase()
                // Danish/Scandinavian conversions
                .replace(/æ/g, "ae")
                .replace(/ø/g, "oe")
                .replace(/å/g, "aa")
                .replace(/ä/g, "ae")
                .replace(/ö/g, "oe")
                .replace(/ü/g, "ue")
                // Remove anything not word/space/hyphen
                .replace(/[^\w\s-]/g, "")
                // Collapse spaces to hyphens
                .replace(/\s+/g, "-")
                .trim();

            const base = normalized;
            slugCounts[base] = (slugCounts[base] || 0) + 1;
            return slugCounts[base] > 1 ? `${base}-${slugCounts[base]}` : base;
        }

        /**
         * Calculate dynamic scroll offset considering sticky headers
         * @returns {number}
         */
        function getScrollOffset() {
            const stickySelectors = [
                ".site-header",
                ".header-sticky",
                'header[data-sticky="true"]',
                ".sticky-header",
                "#masthead.sticky",
                "header.fixed",
            ];

            for (const selector of stickySelectors) {
                const header = document.querySelector(selector);
                if (header) {
                    const style = window.getComputedStyle(header);
                    if (
                        style.position === "fixed" ||
                        style.position === "sticky"
                    ) {
                        return header.offsetHeight + 20; // padding
                    }
                }
            }
            return parseInt(settings.scrollOffset, 10) || 80;
        }

        /**
         * Build the TOC links
         */
        headings.forEach((heading) => {
            // Ensure each heading has an id
            if (!heading.id) {
                heading.id = `heading-${generateSlug(heading.textContent)}`;
            }

            // Create list item and link
            const li = document.createElement("li");
            const a = document.createElement("a");
            a.href = `#${heading.id}`;
            a.textContent = heading.textContent;
            a.className = "smart-toc-link";

            // A11y label
            a.setAttribute(
                "aria-label",
                `${settings.strings.goToSection} ${heading.textContent}`,
            );

            li.appendChild(a);
            tocList.appendChild(li);
        });

        /**
         * Update active link state
         * @param {HTMLElement|null} targetLink
         */
        function setActiveLink(targetLink) {
            document.querySelectorAll(".smart-toc-link").forEach((link) => {
                link.classList.remove("active");
                link.removeAttribute("aria-current");
            });
            if (targetLink) {
                targetLink.classList.add("active");
                targetLink.setAttribute("aria-current", "true");
            }
        }

        /**
         * Smooth scroll to a target element and update active state
         * @param {HTMLElement} targetElement
         * @param {HTMLElement} clickedLink
         */
        function smoothScrollTo(targetElement, clickedLink) {
            const offset = getScrollOffset();
            const elementPosition =
                targetElement.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - offset;

            try {
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth",
                });
            } catch (_) {
                window.scrollTo(0, offsetPosition);
            }

            setActiveLink(clickedLink);

            // Accessibility: move focus to the target heading
            targetElement.setAttribute("tabindex", "-1");
            targetElement.focus({ preventScroll: true });
            setTimeout(() => {
                targetElement.removeAttribute("tabindex");
            }, 1000);
        }

        // Click handlers
        document.querySelectorAll(".smart-toc-link").forEach((link) => {
            link.addEventListener("click", function (e) {
                e.preventDefault();
                const targetId = this.getAttribute("href").substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    smoothScrollTo(targetElement, this);
                }
            });
        });

        /**
         * Active-section highlighting on scroll
         */
        const useScrollFallback = headings.length > 100;

        if (!useScrollFallback && "IntersectionObserver" in window) {
            const observerOptions = {
                rootMargin: "-20% 0px -70% 0px",
                threshold: 0,
            };

            let activeHeading = null;
            let observerTimeout;

            const observer = new IntersectionObserver((entries) => {
                clearTimeout(observerTimeout);
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

            headings.forEach((h) => observer.observe(h));
        } else {
            function highlightActiveSection() {
                const scrollPosition = window.scrollY + getScrollOffset() + 50;
                let currentActiveHeading = null;

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
            );

            // Initial state
            highlightActiveSection();
        }

        // Resize handling (positions / sticky headers may change)
        let resizeTimeout;
        window.addEventListener(
            "resize",
            function () {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    // If using scroll fallback, re-evaluate
                    // (IO updates automatically)
                    if (
                        useScrollFallback ||
                        !("IntersectionObserver" in window)
                    ) {
                        const active = document.querySelector(
                            ".smart-toc-link.active",
                        );
                        if (active) {
                            // Trigger recalculation by calling the highlight function indirectly
                            const evt = new Event("scroll");
                            window.dispatchEvent(evt);
                        }
                    }
                }, 250);
            },
            { passive: true },
        );

        // Keyboard navigation support within the TOC
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

        // If the page loaded with a hash, sync TOC state
        if (window.location.hash) {
            const hashId = window.location.hash.substring(1);
            const targetLink = document.querySelector(
                `.smart-toc-link[href="#${hashId}"]`,
            );
            if (targetLink) {
                setActiveLink(targetLink);
            }
        }

        /**
         * Mobile toggle: show/hide TOC as popup on small screens
         */
        (function initTOCToggle() {
            const wrapper = document.querySelector(".smart-toc-navigation");
            const toggleBtn = document.querySelector(".smart-toc-toggle");
            const popup = document.querySelector(".smart-toc-popup");
            if (!wrapper || !toggleBtn || !popup) return;

            // Initial ARIA state
            toggleBtn.setAttribute("aria-expanded", "false");
            toggleBtn.setAttribute("aria-controls", "smart-article-toc");

            function openPopup() {
                popup.classList.add("is-visible");
                toggleBtn.setAttribute("aria-expanded", "true");
                document.body.classList.add("smart-toc-open");

                // Luk på klik udenfor
                document.addEventListener("click", handleOutsideClick);
                // Luk på ESC
                document.addEventListener("keydown", handleEscKey);
            }

            function closePopup() {
                popup.classList.remove("is-visible");
                toggleBtn.setAttribute("aria-expanded", "false");
                document.body.classList.remove("smart-toc-open");

                document.removeEventListener("click", handleOutsideClick);
                document.removeEventListener("keydown", handleEscKey);
            }

            function handleOutsideClick(e) {
                if (
                    !popup.contains(e.target) &&
                    !toggleBtn.contains(e.target)
                ) {
                    closePopup();
                }
            }

            function handleEscKey(e) {
                if (e.key === "Escape") {
                    closePopup();
                }
            }

            toggleBtn.addEventListener("click", function (e) {
                e.preventDefault();
                if (popup.classList.contains("is-visible")) {
                    closePopup();
                } else {
                    openPopup();
                }
            });
        })();
    }

    /**
     * Initialize when DOM is ready
     *
     * Uses DOMContentLoaded to ensure all elements are available.
     * Falls back to load event if DOM is already loaded.
     */
    function init() {
        initSmartSectionTOC();

        // Ensure toggle button has a sensible ARIA state even if TOC is not visible on load
        const toggleButton = document.querySelector(".smart-toc-toggle");
        if (
            toggleButton &&
            !document.querySelector(".smart-toc-navigation-wrapper.toc-visible")
        ) {
            toggleButton.setAttribute("aria-expanded", "false");
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
