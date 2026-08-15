/*
 * ============================================================
 * GAME LIST
 * ============================================================
 *
 * Each game's `url` should contain ONLY the path.
 *
 * Example:
 *
 * <li url="/games/ampler-launcher/mc/1.12.2">
 *     Minecraft 1.12.2
 * </li>
 *
 * This automatically works on:
 *
 * GitHub:
 * https://yourusername.github.io/games/ampler-launcher/mc/1.12.2
 *
 * Render:
 * https://monkegg2.onrender.com/games/ampler-launcher/mc/1.12.2
 *
 * or any other domain.
 */

$(document).on('click', '#gamesList li', function (event) {

    // Ignore clicks caused by dragging
    if (window.hold) {
        window.hold = false;
        return;
    }

    const gamePath = this.getAttribute('url');

    if (!gamePath) {
        console.error('No game URL found for:', this);
        return;
    }

    /*
     * Build the URL using the CURRENT website domain.
     *
     * This is the important part.
     */
    const gameUrl = new URL(
        gamePath,
        window.location.origin
    ).href;

    console.log('Opening game:', gameUrl);

    /*
     * Open the game in a new tab.
     */
    window.open(
        gameUrl,
        '_blank'
    );
});
