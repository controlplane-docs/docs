/**
 * Synced Tabs - syncs tabs with matching titles across the page
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'cpln-docs-synced-tabs';

  /**
   * Extract text from a tab element, excluding icons
   */
  function getTabText(tab) {
    const clone = tab.cloneNode(true);
    clone.querySelectorAll('svg, img').forEach(node => node.remove());
    return clone.textContent.trim();
  }

  /**
   * Check if tab is currently active
   */
  function isActive(tab) {
    return tab.getAttribute('aria-selected') === 'true';
  }

  /**
   * Activate a tab without scrolling
   */
  function activateTab(tab) {
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function () {};

    tab.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
      })
    );

    setTimeout(() => {
      Element.prototype.scrollIntoView = originalScrollIntoView;
    }, 50);
  }

  /**
   * Build a map of title -> tabs grouped by tablist
   */
  function buildTabIndex() {
    const tabs = document.querySelectorAll('[role="tab"]');
    const titleToTabs = new Map();

    tabs.forEach(tab => {
      const title = getTabText(tab);
      const tabList = tab.closest('[role="tablist"]');

      if (!titleToTabs.has(title)) {
        titleToTabs.set(title, []);
      }

      titleToTabs.get(title).push({ tab, tabList });
    });

    return titleToTabs;
  }

  /**
   * Check if a title has tabs in multiple tablists (syncable)
   */
  function isSyncable(tabsWithTitle) {
    if (!tabsWithTitle || tabsWithTitle.length < 2) {
      return false;
    }

    const uniqueTabLists = new Set(tabsWithTitle.map(t => t.tabList));
    return uniqueTabLists.size > 1;
  }

  /**
   * Sync all tabs with the given title, excluding the source tablist
   */
  function syncTabs(title, sourceTabList, tabIndex) {
    const index = tabIndex || buildTabIndex();
    const tabsWithTitle = index.get(title);

    if (!isSyncable(tabsWithTitle)) {
      return;
    }

    tabsWithTitle.forEach(({ tab, tabList }) => {
      if (tabList === sourceTabList) {
        return;
      }

      if (isActive(tab)) {
        return;
      }

      activateTab(tab);
    });

    try {
      localStorage.setItem(STORAGE_KEY, title);
    } catch (e) {}
  }

  /**
   * Handle tab click events
   */
  function handleTabClick(e) {
    const tab = e.target.closest('[role="tab"]');

    if (!tab) {
      return;
    }

    const title = getTabText(tab);
    const tabList = tab.closest('[role="tablist"]');
    const tabIndex = buildTabIndex();
    const tabsWithTitle = tabIndex.get(title);

    if (!isSyncable(tabsWithTitle)) {
      return;
    }

    // Delay sync to let the click complete first
    setTimeout(() => {
      // Rebuild index after click completes (DOM may have changed)
      syncTabs(title, tabList);
    }, 10);
  }

  /**
   * Restore saved tab selection on page load
   */
  function restoreSavedTabs() {
    const savedTitle = localStorage.getItem(STORAGE_KEY);

    if (!savedTitle) {
      return;
    }

    const tabIndex = buildTabIndex();
    const tabsWithTitle = tabIndex.get(savedTitle);

    if (!isSyncable(tabsWithTitle)) {
      return;
    }

    const hasInactiveTab = tabsWithTitle.some(({ tab }) => !isActive(tab));

    if (hasInactiveTab) {
      syncTabs(savedTitle, null, tabIndex);
    }
  }

  // Listen for tab clicks
  document.addEventListener('click', handleTabClick, true);

  // Restore saved tabs on page load
  if (document.readyState === 'complete') {
    setTimeout(restoreSavedTabs, 300);
  } else {
    window.addEventListener('load', () => setTimeout(restoreSavedTabs, 300));
  }

  // Handle SPA navigation
  let currentPath = location.pathname;
  const observer = new MutationObserver(() => {
    if (location.pathname !== currentPath) {
      currentPath = location.pathname;
      setTimeout(restoreSavedTabs, 300);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
