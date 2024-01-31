/**
 * This function is used to navigate to url.
 * @param {string} url - The url to navigate to.
 * @param {boolean} newTap - Whether to open the url in a new tab.
 */
export function gotoUrl(url, newTap) {
  // This is temporary function to navigate to url.
  // We should implement other method sometime.
  window.open(url, newTap ? '_blank' : '_self')
}
