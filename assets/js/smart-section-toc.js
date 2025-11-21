/**
 * Smart Section TOC - JavaScript
 *
 * Handles dynamic TOC generation, smooth scrolling, active section highlighting,
 * and mobile toggle behavior for popup + desktop navigation.
 *
 * @package SmartSectionTOC
 * @version 1.1.1
 */

(function () {
    "use strict";

    function initSmartSectionTOC() {
        // Settings fra PHP → JS
        const settings = window.smartSectionTOC || {
            contentSelector: ".site-content",
            headingSelector: "h2",
            scrollOffset: 80,
            minHeadings: 1,
            strings: { goToSection: "Go to section:" },
        };

        const popupCloseMap = new WeakMap();

        // Find ALLE lister (.smart-toc-list) – én til desktop, én til popup
        const tocLists = document.querySelectorAll(".smart-toc-list");
        if (!tocLists.length) return;

        const contentArea = document.querySelector(settings.contentSelector);
        if (!contentArea) return;

        // Saml alle H2 (eller valgt headingSelector)
        const headings = contentArea.querySelectorAll(settings.headingSelector);

        // Stop hvis vi har færre headings end minimum
        const min = Number(settings.minHeadings || 1);
        if (!headings || headings.length < min) {
            const tocContainer = document.querySelector(
                ".smart-toc-navigation",
            );
            if (tocContainer) {
                tocContainer.dataset.tocCount = String(
                    headings ? headings.length : 0,
                );
            }
            return;
        }

        // Markér containeren som aktiv
        const tocContainer = document.querySelector(".smart-toc-navigation");
        if (tocContainer) {
            tocContainer.dataset.tocCount = String(headings.length);
            tocContainer.style.removeProperty("display");
            tocContainer.removeAttribute("hidden");
            tocContainer.classList.remove("is-hidden");
        }

        // Hjælpefunktion til slug
        const slugCounts = {};
        function generateSlug(text) {
            const normalized = text
                .toLowerCase()
                .replace(/æ/g, "ae")
                .replace(/ø/g, "oe")
                .replace(/å/g, "aa")
                .replace(/ä/g, "ae")
                .replace(/ö/g, "oe")
                .replace(/ü/g, "ue")
                .replace(/[^\w\s-]/g, "")
                .replace(/\s+/g, "-")
                .trim();
            const base = normalized;
            slugCounts[base] = (slugCounts[base] || 0) + 1;
            return slugCounts[base] > 1 ? `${base}-${slugCounts[base]}` : base;
        }

        // Scroll offset (sticky header højde + ekstra padding)
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
                        return header.offsetHeight + 20;
                    }
                }
            }
            return parseInt(settings.scrollOffset, 10) || 80;
        }

        // Byg TOC-links i ALLE ul.smart-toc-list
        headings.forEach((heading) => {
            if (!heading.id) {
                heading.id = `heading-${generateSlug(heading.textContent)}`;
            }
            const li = document.createElement("li");
            const a = document.createElement("a");
            a.href = `#${heading.id}`;
            a.textContent = heading.textContent;
            a.className = "smart-toc-link";
            a.setAttribute(
                "aria-label",
                `${settings.strings.goToSection} ${heading.textContent}`,
            );
            li.appendChild(a);

            tocLists.forEach((list) => list.appendChild(li.cloneNode(true)));
        });

        // NY HELPER: Aktivér alle matchende links (desktop + popup)
        function setActiveLinksById(headingId) {
            document.querySelectorAll(".smart-toc-link").forEach((link) => {
                link.classList.remove("active");
                link.removeAttribute("aria-current");
            });
            const toActivate = document.querySelectorAll(
                `.smart-toc-link[href="#${headingId}"]`,
            );
            toActivate.forEach((link) => {
                link.classList.add("active");
                link.setAttribute("aria-current", "true");
            });
        }

        // Smooth scroll
        function smoothScrollTo(targetElement, clickedLink) {
            const offset = getScrollOffset();
            const elementPosition =
                targetElement.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - offset;
            try {
                window.scrollTo({ top: offsetPosition, behavior: "smooth" });
            } catch (_) {
                window.scrollTo(0, offsetPosition);
            }
            setActiveLinksById(targetElement.id);
            targetElement.setAttribute("tabindex", "-1");
            targetElement.focus({ preventScroll: true });
            setTimeout(() => targetElement.removeAttribute("tabindex"), 1000);
        }

        // Klik på links
        document.querySelectorAll(".smart-toc-link").forEach((link) => {
            link.addEventListener("click", function (e) {
                e.preventDefault();
                const targetId = this.getAttribute("href").substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    ignoreObserver = true;
                    if (observerUnlockTimeout)
                        clearTimeout(observerUnlockTimeout);
                    observerUnlockTimeout = setTimeout(() => {
                        ignoreObserver = false;
                    }, 1000); // 1000ms = long enough for scroll to settle

                    smoothScrollTo(targetElement, this);
                    setActiveLinksById(targetId);
                }

                // Luk popup hvis linket blev klikket inde i popup'en
                const popup = this.closest(".smart-toc-popup");
                if (popup && popup.classList.contains("is-visible")) {
                    const closePopup = popupCloseMap.get(popup);
                    if (typeof closePopup === "function") {
                        closePopup();
                    } else {
                        popup.classList.remove("is-visible");
                        document.body.classList.remove("smart-toc-open");
                        const toggleBtn =
                            popup.closest(".smart-toc-navigation")?.querySelector(".smart-toc-toggle") ||
                            popup.closest(".smart-toc-inline")?.querySelector(".smart-toc-inline-toggle");
                        if (toggleBtn) {
                            toggleBtn.setAttribute("aria-expanded", "false");
                        }
                    }
                }
            });
        });

        // Scroll-aktiv link (IntersectionObserver hvis muligt)
        let ignoreObserver = false;
        let observerUnlockTimeout = null;
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
                    if (!ignoreObserver && activeHeading) {
                        setActiveLinksById(activeHeading.id);
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
                    setActiveLinksById(currentActiveHeading.id);
                }
            }
            window.addEventListener(
                "scroll",
                () => requestAnimationFrame(highlightActiveSection),
                { passive: true },
            );
            highlightActiveSection();
        }

        // Keyboard navigation i ALLE lister
        tocLists.forEach((list) => {
            list.addEventListener("keydown", function (e) {
                const focusedLink = document.activeElement;
                if (
                    !focusedLink ||
                    !focusedLink.classList.contains("smart-toc-link")
                )
                    return;
                const allLinks = Array.from(
                    list.querySelectorAll(".smart-toc-link"),
                );
                const currentIndex = allLinks.indexOf(focusedLink);
                switch (e.key) {
                    case "ArrowDown":
                    case "ArrowRight":
                        e.preventDefault();
                        if (currentIndex < allLinks.length - 1)
                            allLinks[currentIndex + 1].focus();
                        break;
                    case "ArrowUp":
                    case "ArrowLeft":
                        e.preventDefault();
                        if (currentIndex > 0)
                            allLinks[currentIndex - 1].focus();
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
        });

        // Hvis URL har hash → aktivér link
        if (window.location.hash) {
            const hashId = window.location.hash.substring(1);
            if (hashId) setActiveLinksById(hashId);
        }

        // Popup toggle (mobil + inline)
        function initPopupToggles() {
            const toggles = document.querySelectorAll(
                ".smart-toc-toggle, .smart-toc-inline-toggle",
            );

            toggles.forEach((toggleBtn) => {
                const popup =
                    toggleBtn
                        .closest(".smart-toc-inline")
                        ?.querySelector(".smart-toc-popup") ||
                    toggleBtn
                        .closest(".smart-toc-navigation")
                        ?.querySelector(".smart-toc-popup");
                if (!toggleBtn || !popup) return;

                const nav = popup.querySelector("nav[id]");
                if (nav && nav.id) {
                    toggleBtn.setAttribute("aria-controls", nav.id);
                }

                toggleBtn.setAttribute("aria-expanded", "false");

                const handleOutsideClick = (e) => {
                    if (
                        !popup.contains(e.target) &&
                        !toggleBtn.contains(e.target)
                    ) {
                        closePopup();
                    }
                };

                const handleEscKey = (e) => {
                    if (e.key === "Escape") closePopup();
                };

                const openPopup = () => {
                    popup.classList.add("is-visible");
                    toggleBtn.setAttribute("aria-expanded", "true");
                    document.body.classList.add("smart-toc-open");
                    document.addEventListener("click", handleOutsideClick);
                    document.addEventListener("keydown", handleEscKey);
                };

                const closePopup = () => {
                    popup.classList.remove("is-visible");
                    toggleBtn.setAttribute("aria-expanded", "false");
                    document.body.classList.remove("smart-toc-open");
                    document.removeEventListener("click", handleOutsideClick);
                    document.removeEventListener("keydown", handleEscKey);
                };

                popupCloseMap.set(popup, closePopup);

                toggleBtn.addEventListener("click", function (e) {
                    e.preventDefault();
                    popup.classList.contains("is-visible")
                        ? closePopup()
                        : openPopup();
                });
            });
        }

        initPopupToggles();
    }

    function init() {
        initSmartSectionTOC();
        document
            .querySelectorAll(".smart-toc-toggle, .smart-toc-inline-toggle")
            .forEach((button) =>
                button.setAttribute("aria-expanded", "false"),
            );
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
