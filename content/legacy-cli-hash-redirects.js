// Wrap everything in an IIFE to avoid leaking variables into the global scope
(function () {
  // Define the overview landing path we expect after the legacy redirect
  const LEGACY_LANDING_PATH = '/cli-reference/overview';

  // Define the query parameter key/value used to mark legacy redirects
  const LEGACY_QUERY_KEY = 'from';
  const LEGACY_QUERY_VALUE = 'legacy-cli';

  // Read the current URL components once and reuse them
  const currentPath = window.location.pathname;
  const currentHash = window.location.hash;
  const currentSearch = window.location.search;

  // Exit early if we are not on the expected legacy landing path
  if (currentPath !== LEGACY_LANDING_PATH) return;

  // Parse query parameters and verify we truly arrived from the legacy redirect
  const searchParams = new URLSearchParams(currentSearch);
  const isLegacyRedirect = searchParams.get(LEGACY_QUERY_KEY) === LEGACY_QUERY_VALUE;

  // Exit early if this is a normal installation visit (prevents breaking real installation anchors)
  if (!isLegacyRedirect) return;

  // Exit early if there is no hash (or it's just "#")
  if (!currentHash || currentHash.length < 2) return;

  // Strip the leading "#" to get the legacy anchor key (e.g., "agent-get", "account", "port-forward")
  const legacyKey = currentHash.slice(1);

  // Define top-level CLI command slugs you actually have pages for
  // This prevents accidental redirects for installation headings like "#verify-checksum"
  const COMMAND_SLUGS = new Set([
    'account',
    'agent',
    'apply',
    'auditctx',
    'cloudaccount',
    'convert',
    'cp',
    'delete',
    'domain',
    'group',
    'gvc',
    'helm',
    'identity',
    'image',
    'location',
    'login',
    'logs',
    'misc',
    'mk8s',
    'operator',
    'org',
    'policy',
    'port-forward',
    'profile',
    'quota',
    'rest',
    'secret',
    'serviceaccount',
    'stack',
    'task',
    'user',
    'volumeset',
    'workload',
  ]);

  // Define command names that contain hyphens (so split('-')[0] would be wrong)
  const HYPHENATED_COMMANDS = ['port-forward'];

  // Prepare a variable to hold the resolved top-level command (e.g., "agent", "workload", "port-forward")
  let command = null;

  // First, match known hyphenated command names
  for (const c of HYPHENATED_COMMANDS) {
    if (legacyKey === c || legacyKey.startsWith(c + '-')) {
      command = c;
      break;
    }
  }

  // Otherwise, parse the command as the prefix before the first "-"
  if (!command) {
    command = legacyKey.split('-')[0];
  }

  // Exit early if the parsed command is not one of your known CLI command pages
  if (!COMMAND_SLUGS.has(command)) return;

  // Build the destination using your new URL convention
  const destinationPath = `/cli-reference/commands/${command}`;
  const destinationHash = `#${legacyKey}`;
  const destination = destinationPath + destinationHash;

  // Build the current full location (path + hash) to prevent redirect loops
  const currentFull = currentPath + currentHash;

  // Exit early if we're already at the destination
  if (currentFull === destination) return;

  // Perform a replace (not push) so the back button does not bounce through the legacy URL
  window.location.replace(destination);
})();
